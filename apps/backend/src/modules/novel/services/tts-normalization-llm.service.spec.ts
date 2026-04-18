import type { ConfigType } from '@nestjs/config';
import type {
  CorrelationIdService,
  CustomLoggerService,
} from 'nestjs-backend-common';

import axios from 'axios';

import type { appConfigs } from '../../../app/configs/app.config';

import { TtsNormalizationLlmService } from './tts-normalization-llm.service';

vi.mock('axios');

describe(TtsNormalizationLlmService.name, () => {
  let uut: TtsNormalizationLlmService;
  let appConfig: ConfigType<typeof appConfigs>;
  let logger: CustomLoggerService;
  let correlationIdService: CorrelationIdService;

  beforeEach(() => {
    appConfig = {
      OLLAMA_BASE_URL: 'http://ollama:11434',
      OLLAMA_TIMEOUT: '30s',
      OLLAMA_MODEL: 'llama3.2:3b',
    } as any;
    logger = {
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as any;
    correlationIdService = {
      correlationId: 'test-correlation-id',
    } as any;

    uut = new TtsNormalizationLlmService(
      appConfig,
      logger,
      correlationIdService,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return normalized text on successful LLM response', async () => {
    vi.mocked(axios.post).mockResolvedValue({
      data: {
        response: JSON.stringify({
          normalizedText: 'boom! what was that?',
        }),
      },
    });

    const result = await uut.normalize('BOOM! What was that?');

    expect(result).toBe('boom! what was that?');
  });

  it('should return null when LLM returns empty response', async () => {
    vi.mocked(axios.post).mockResolvedValue({
      data: { response: '' },
    });

    const result = await uut.normalize('BOOM!');

    expect(result).toBeNull();
  });

  it('should return null when LLM returns unparseable JSON', async () => {
    vi.mocked(axios.post).mockResolvedValue({
      data: { response: 'not json at all' },
    });

    const result = await uut.normalize('BOOM!');

    expect(result).toBeNull();
  });

  it('should return null when LLM response is missing normalizedText field', async () => {
    vi.mocked(axios.post).mockResolvedValue({
      data: {
        response: JSON.stringify({ text: 'boom!' }),
      },
    });

    const result = await uut.normalize('BOOM!');

    expect(result).toBeNull();
  });

  it('should return null when output deviates too much in length (hallucination guard)', async () => {
    const input = 'short text';
    vi.mocked(axios.post).mockResolvedValue({
      data: {
        response: JSON.stringify({
          normalizedText:
            'This is a very long hallucinated response that should not pass validation because it is way too longer than input.',
        }),
      },
    });

    const result = await uut.normalize(input);

    expect(result).toBeNull();
  });

  it('should return null when output is empty string', async () => {
    vi.mocked(axios.post).mockResolvedValue({
      data: {
        response: JSON.stringify({ normalizedText: '' }),
      },
    });

    const result = await uut.normalize('BOOM!');

    expect(result).toBeNull();
  });

  it('should return null when axios throws an error', async () => {
    vi.mocked(axios.post).mockRejectedValue(
      new Error('Connection refused'),
    );

    const result = await uut.normalize('BOOM!');

    expect(result).toBeNull();
  });

  it('should handle JSON with missing closing brace (truncation recovery)', async () => {
    vi.mocked(axios.post).mockResolvedValue({
      data: {
        response: '{"normalizedText": "boom!"',
      },
    });

    const result = await uut.normalize('BOOM!');

    expect(result).toBe('boom!');
  });

  it('should extract JSON from response with leading text', async () => {
    vi.mocked(axios.post).mockResolvedValue({
      data: {
        response: 'Here is the result: {"normalizedText": "boom!"}',
      },
    });

    const result = await uut.normalize('BOOM!');

    expect(result).toBe('boom!');
  });
});
