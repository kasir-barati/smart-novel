import type { ConfigType } from '@nestjs/config';

import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import axios from 'axios';
import { isEmpty } from 'class-validator';
import { isNil, urlBuilder } from 'nestjs-backend-common';

import { appConfigs } from '../../app/configs/app.config'; // To prevent circular dependency issues
import { WordExplanation } from './types';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  private parseJsonObject(
    text: string,
  ): Record<string, unknown> | null {
    const tryParse = (value: string) => {
      try {
        return JSON.parse(value) as Record<string, unknown>;
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

  constructor(
    @Inject(appConfigs.KEY)
    private readonly appConfig: ConfigType<typeof appConfigs>,
  ) {}

  async explainWord(
    word: string,
    context: string,
  ): Promise<WordExplanation> {
    if (isEmpty(word) || isEmpty(context)) {
      throw new BadRequestException(
        'Word and context must be provided',
      );
    }
    if (context.includes(word) === false) {
      throw new BadRequestException(
        'Context must include the word to be explained',
      );
    }

    const url = urlBuilder(
      this.appConfig.OLLAMA_BASE_URL,
      'api',
      'generate',
    );

    try {
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

      const response = await axios.post(
        url,
        {
          model: this.appConfig.OLLAMA_MODEL,
          format: 'json',
          prompt,
          stream: false,
        },
        {
          timeout: 30000,
        },
      );
      const generatedText: string = response.data.response;
      const parsed = this.parseJsonObject(generatedText);

      if (isNil(parsed)) {
        this.logger.error(
          `Failed to parse JSON response: ${generatedText}`,
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
      );

      throw new InternalServerErrorException(
        'd1c8b2e5-9f3a-4c5e-8a1b-7f4e5d6c8a9b',
      );
    }
  }
}
