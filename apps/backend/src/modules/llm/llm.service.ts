import type { ConfigType } from '@nestjs/config';

import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import axios from 'axios';
import ms from 'ms';
import {
  CorrelationIdService,
  CustomLoggerService,
  isNil,
  retryAsync,
  urlBuilder,
} from 'nestjs-backend-common';
import { hostname } from 'os';

import { appConfigs } from '../../app/configs/app.config'; // To prevent circular dependency issues
import { generateCacheKey } from '../../utils';
import { CacheService } from '../redis';
import { ExplainWordPromptResponse } from './llm.interface';
import { WordExplanation } from './types';

@Injectable()
export class LlmService {
  constructor(
    @Inject(appConfigs.KEY)
    private readonly appConfig: ConfigType<typeof appConfigs>,
    private readonly logger: CustomLoggerService,
    private readonly correlationIdService: CorrelationIdService,
    private readonly cacheService: CacheService<ExplainWordPromptResponse>,
  ) {}

  async explainWord(
    word: string,
    context: string,
  ): Promise<WordExplanation> {
    const startTime = Date.now();
    const cacheKey = generateCacheKey(word, context);
    const cacheTtlMs = ms(this.appConfig.OLLAMA_CACHE_TTL);

    try {
      const result = await this.cacheService.getOrCompute(
        cacheKey,
        () => this.callOllamaWithRetry(word, context),
        cacheTtlMs,
      );

      const totalLatency = Date.now() - startTime;

      // Log LLM observability
      this.logger.log(`LLM call completed for word "${word}"`, {
        context: LlmService.name,
        correlationId: this.correlationIdService.correlationId,
        cacheKey,
        word,
        instanceId: hostname(),
        latencyMs: totalLatency,
        telemetryOf: 'LlmObservability',
      });

      return {
        ...result,
        cacheKey,
      };
    } catch (error) {
      this.logger.error(
        `Failed to explain word "${word}": ${error}`,
        {
          context: LlmService.name,
          correlationId: this.correlationIdService.correlationId,
          cacheKey,
          word,
          error,
        },
      );

      throw error;
    }
  }

  private async callOllamaWithRetry(
    word: string,
    context: string,
  ): Promise<ExplainWordPromptResponse> {
    const retryCount = this.appConfig.OLLAMA_RETRY_COUNT;
    const retryDelayMs = ms(this.appConfig.OLLAMA_RETRY_DELAY);
    const timeoutMs = ms(this.appConfig.OLLAMA_TIMEOUT);

    const [error, result] =
      await retryAsync<ExplainWordPromptResponse>(
        async ({ index }) => {
          this.logger.log(
            `Calling Ollama for word "${word}" (attempt ${index + 1}/${retryCount + 1})`,
            {
              context: LlmService.name,
              correlationId: this.correlationIdService.correlationId,
              attemptIndex: index,
              word,
            },
          );

          return this.callOllama(word, context, timeoutMs);
        },
        {
          retry: retryCount,
          delay: retryDelayMs,
          error: ({ index, error: retryError }) => {
            this.logger.warn(
              `Retry ${index + 1}/${retryCount} failed for word "${word}": ${retryError}`,
              {
                context: LlmService.name,
                correlationId:
                  this.correlationIdService.correlationId,
                attemptIndex: index,
                word,
                error: retryError,
              },
            );
          },
        },
      );

    if (error) {
      this.logger.error(
        `All retry attempts exhausted for word "${word}"`,
        {
          context: LlmService.name,
          correlationId: this.correlationIdService.correlationId,
          word,
          error,
        },
      );
      throw error;
    }

    return result;
  }

  private async callOllama(
    word: string,
    context: string,
    timeoutMs: number,
  ): Promise<ExplainWordPromptResponse> {
    const url = urlBuilder(
      this.appConfig.OLLAMA_BASE_URL,
      'api',
      'generate',
    );

    const prompt = `Analyze the word "${word}" in this context: "${context}".

Return ONLY a valid JSON object (no markdown, no extra text) with EXACTLY these keys:
- "meaning": string (brief definition in this context)
- "synonyms": string[] (3-5 items)
- "antonyms": string[] (3-5 items)
- "simplifiedExplanation": string (simple explanation)

Rules:
- Use double quotes for all keys and string values.
- Do not include trailing commas.
- Ensure the JSON is complete and ends with a closing curly brace.\n`;

    try {
      const { data } = await axios.post(
        url,
        {
          model: this.appConfig.OLLAMA_MODEL,
          format: 'json',
          prompt,
          stream: false,
        },
        {
          timeout: timeoutMs,
        },
      );

      const generatedText: string = data.response;
      const parsed =
        this.parseJsonObject<ExplainWordPromptResponse>(
          generatedText,
        );

      if (isNil(parsed)) {
        this.logger.error(
          `Failed to parse JSON response: ${generatedText}`,
          {
            context: LlmService.name,
            correlationId: this.correlationIdService.correlationId,
          },
        );
        throw new InternalServerErrorException(
          '6639cf09-2b91-481e-824a-9f8f6d22d362',
        );
      }

      const meaning =
        typeof parsed.meaning === 'string'
          ? parsed.meaning
          : 'No meaning available';
      const simplifiedExplanation =
        typeof parsed.simplifiedExplanation === 'string'
          ? parsed.simplifiedExplanation
          : 'No explanation available';

      return {
        antonyms: Array.isArray(parsed.antonyms)
          ? parsed.antonyms
          : [],
        meaning,
        simplifiedExplanation,
        synonyms: Array.isArray(parsed.synonyms)
          ? parsed.synonyms
          : [],
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      this.logger.error(
        `Error calling Ollama: ${JSON.stringify(error)}`,
        { correlationId: this.correlationIdService.correlationId },
      );

      throw new InternalServerErrorException(
        'd1c8b2e5-9f3a-4c5e-8a1b-7f4e5d6c8a9b',
      );
    }
  }

  private parseJsonObject<T>(text: string): T | null {
    const tryParse = (value: string) => {
      try {
        return JSON.parse(value) as T;
      } catch {
        return null;
      }
    };

    // 1) Best case: the model returned raw JSON.
    const direct = tryParse(text.trim());

    if (direct) {
      return direct;
    }

    // 2) Extract first JSON object-like block.
    const jsonStart = text.indexOf('{');

    if (jsonStart === -1) {
      return null;
    }

    const sliced = text.slice(jsonStart).trim();
    const extracted = tryParse(sliced);

    if (extracted) {
      return extracted;
    }

    // 3) Recover common truncation issue: missing one or more closing braces.
    const openBraces = (sliced.match(/\{/g) || []).length;
    const closeBraces = (sliced.match(/\}/g) || []).length;
    const missingClosures = openBraces - closeBraces;

    if (missingClosures > 0) {
      const repaired = `${sliced}${'}'.repeat(missingClosures)}`;

      return tryParse(repaired);
    }

    return null;
  }
}
