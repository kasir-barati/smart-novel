import { InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

import { AppConfig } from '../../app';
import { CacheService } from '../redis';
import { LlmService } from './llm.service';

describe(LlmService.name, () => {
  let uut: LlmService;
  let appConfigs: AppConfig;
  let logger: any;
  let correlationIdService: any;
  let cacheService: CacheService;

  beforeEach(() => {
    appConfigs = {
      OLLAMA_BASE_URL: 'http://ollama',
      OLLAMA_TIMEOUT: '5s',
      OLLAMA_RETRY_COUNT: 3,
      OLLAMA_RETRY_DELAY: '100ms',
      OLLAMA_CACHE_TTL: '1h',
    } as any;
    logger = {
      error: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
    };
    correlationIdService = {
      correlationId: 'fd2914ad-4789-4ac2-a7a5-d97c7806294f',
    };
    cacheService = {
      getOrCompute: jest.fn(
        (_cacheKey: string, compute: () => Promise<any>) => compute(),
      ),
    } as any;
    uut = new LlmService(
      appConfigs,
      logger,
      correlationIdService,
      cacheService,
    );
  });

  it('should throw an error when it cannot parse the response', async () => {
    const word = 'scrutinize';
    const context = 'I need to scrutinize the data carefully.';
    axios.post = jest.fn().mockResolvedValue({
      data: {
        response: 'This is not a valid JSON',
      },
    });

    const result = uut.explainWord(word, context);

    await expect(result).rejects.toThrow(
      new InternalServerErrorException(
        '6639cf09-2b91-481e-824a-9f8f6d22d362',
      ),
    );
  });

  it('should retry 3 times', async () => {
    const word = 'scrutinize';
    const context = 'I need to scrutinize the data carefully.';
    axios.post = jest.fn().mockResolvedValue({
      data: {
        response: 'This is not a valid JSON',
      },
    });

    try {
      await uut.explainWord(word, context).catch();
    } catch {
      // ignore
    }

    expect(axios.post).toHaveBeenCalledTimes(4); // initial try + 3 retries
  });

  it('should throw an error if the API request fails', async () => {
    const word = 'scrutinize';
    const context = 'I need to scrutinize the data carefully.';
    axios.post = jest
      .fn()
      .mockRejectedValue(new Error('API request failed'));

    const result = uut.explainWord(word, context);

    await expect(result).rejects.toThrow(
      new InternalServerErrorException(
        'd1c8b2e5-9f3a-4c5e-8a1b-7f4e5d6c8a9b',
      ),
    );
  });
});
