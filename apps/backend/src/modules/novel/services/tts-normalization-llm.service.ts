import type { ConfigType } from '@nestjs/config';

import { Inject, Injectable } from '@nestjs/common';
import axios from 'axios';
import { isNotEmpty, isObject, isString } from 'class-validator';
import ms from 'ms';
import {
  CorrelationIdService,
  CustomLoggerService,
  isNil,
  retry,
  retryAsync,
  urlBuilder,
} from 'nestjs-backend-common';

import { appConfigs } from '../../../app/configs/app.config';

/**
 * @description Response shape returned by the LLM for TTS normalization.
 */
export interface TtsNormalizationResponse {
  normalizedText: string;
}

/**
 * @description Maximum allowed length deviation (as a ratio) between the LLM output and the original input. If the output is shorter or longer than this threshold the result is rejected and the caller falls back to the regex-only pipeline.
 */
const MAX_LENGTH_DEVIATION = 0.3;

/**
 * @summary Calls the Ollama LLM to perform semantic TTS text normalization.
 *
 * @description
 * Interjection canonicalization, stutter expansion, silent-dialogue interpretation, and repeated-phrase collapsing. This service is deliberately thin: one shot, no retries, no cache. On any failure the caller ({@link TtsTextService}) falls back to the deterministic regex pipeline.
 */
@Injectable()
export class TtsNormalizationLlmService {
  constructor(
    @Inject(appConfigs.KEY)
    private readonly appConfig: ConfigType<typeof appConfigs>,
    private readonly logger: CustomLoggerService,
    private readonly correlationIdService: CorrelationIdService,
  ) {}

  /**
   * @description Sends the text to Ollama for semantic TTS normalization and validates the response.
   *
   * @returns The normalized text, or `null` when the LLM call fails or the output does not pass safety checks.
   */
  async normalize(text: string): Promise<string | null> {
    const [error, raw] = await retryAsync(
      () => this.callOllama(text),
      {
        retry: 0, // no retries — if it fails we want to fall back to regex immediately
      },
    );

    if (isNil(raw) || isNotEmpty(error)) {
      this.logger.warn(
        `LLM TTS normalization failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
        {
          error,
          context: TtsNormalizationLlmService.name,
          correlationId: this.correlationIdService.correlationId,
        },
      );

      return null;
    }

    const parsed = this.parseResponse(raw);

    if (isNil(parsed)) {
      this.logger.warn(
        'LLM returned unparseable JSON for TTS normalization',
        {
          rawResponse: raw.slice(0, 500),
          context: TtsNormalizationLlmService.name,
          correlationId: this.correlationIdService.correlationId,
        },
      );

      return null;
    }

    if (!this.validateOutput(text, parsed.normalizedText)) {
      this.logger.warn(
        'LLM TTS normalization failed safety validation',
        {
          inputLength: text.length,
          context: TtsNormalizationLlmService.name,
          correlationId: this.correlationIdService.correlationId,
          outputLength: parsed.normalizedText.length,
        },
      );

      return null;
    }

    return parsed.normalizedText;
  }

  private async callOllama(text: string): Promise<string | null> {
    const url = urlBuilder(
      this.appConfig.OLLAMA_BASE_URL,
      'api',
      'generate',
    );
    const prompt = this.buildPrompt(text);
    const timeoutMs = ms(this.appConfig.OLLAMA_TIMEOUT);
    const { data } = await axios.post(
      url,
      {
        model: this.appConfig.OLLAMA_MODEL,
        format: 'json',
        prompt,
        stream: false,
        options: {
          temperature: 0.1,
        },
      },
      {
        timeout: timeoutMs,
      },
    );

    const generatedText: string | undefined = data?.response;
    if (isNil(generatedText)) {
      this.logger.warn(
        'Ollama returned empty response for TTS normalization',
        {
          context: TtsNormalizationLlmService.name,
          correlationId: this.correlationIdService.correlationId,
        },
      );

      return null;
    }

    return generatedText;
  }

  private buildPrompt(text: string): string {
    return `Normalize the following English text for Text-to-Speech (TTS).

Rules:
- Preserve ALL narrative meaning exactly — do NOT paraphrase, summarize, or add content.
- Normalize interjections to canonical spellings (e.g. "uhhh" → "uh", "hmmm" → "hmm").
- Add minimal phonetic guidance for unclear interjections (e.g. "tch" → "tsk").
- Normalize stutters: "W-What" → "wh... what", but leave compound words like "well-known" unchanged.
- Convert silent dialogue: "......" → "...", "...?" → "hmm?"
- Collapse excessive repetition of words/phrases (4+ repetitions → max 3, separated by commas).
- Collapse excessive repeated letters (3+ identical consecutive letters → max 2, e.g. "ahhhh" → "ahh").
- Lowercase ALL-CAPS words (2+ letters) so TTS reads them naturally (e.g. "BOOM" → "boom").
- Replace bracket skill markers [Skill] or 【Skill】 with ", Skill,".
- Strip elongation tildes after words (e.g. "ahhh~" → "ahh").
- If uncertain about any change, leave the text unchanged.

Return ONLY valid JSON with this exact shape: { "normalizedText": "<result>" }

Input:
"""
${text}
"""
`;
  }

  /**
   * @description Attempts to parse the LLM response as JSON and extract
   * the `normalizedText` field.
   */
  private parseResponse(
    raw: string,
  ): TtsNormalizationResponse | null {
    const tryParse = (
      value: string,
    ): TtsNormalizationResponse | null => {
      const [error, obj] = retry<TtsNormalizationResponse>(
        () => JSON.parse(value),
        { retry: 0 },
      );

      if (isNotEmpty(error) || !isObject(obj)) {
        return null;
      }

      if (isString(obj.normalizedText)) {
        return obj;
      }

      return null;
    };

    // 1) Direct parse
    const direct = tryParse(raw.trim());

    if (direct) {
      return direct;
    }

    // 2) Extract first JSON object
    const jsonStart = raw.indexOf('{');

    if (jsonStart === -1) {
      return null;
    }

    const sliced = raw.slice(jsonStart).trim();
    const extracted = tryParse(sliced);

    if (extracted) {
      return extracted;
    }

    // 3) Recover missing closing braces
    const openBraces = (sliced.match(/\{/g) || []).length;
    const closeBraces = (sliced.match(/\}/g) || []).length;
    const missingClosures = openBraces - closeBraces;

    if (missingClosures > 0) {
      const repaired = `${sliced}${'}'.repeat(missingClosures)}`;

      return tryParse(repaired);
    }

    return null;
  }

  /**
   * @description Safety check: the LLM output must not deviate too much in length from the input (guards against hallucination / deletion).
   */
  private validateOutput(input: string, output: string): boolean {
    if (!output || output.trim().length === 0) {
      return false;
    }

    const inputLen = input.length;
    const outputLen = output.length;

    // Allow empty input → empty output
    if (inputLen === 0 && outputLen === 0) {
      return true;
    }

    if (inputLen === 0) {
      return false;
    }

    const deviation = Math.abs(outputLen - inputLen) / inputLen;

    return deviation <= MAX_LENGTH_DEVIATION;
  }
}
