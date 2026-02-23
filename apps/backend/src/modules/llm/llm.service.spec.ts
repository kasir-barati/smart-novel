import { InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

import { AppConfig } from '../../app';
import { LlmService } from './llm.service';

describe(LlmService.name, () => {
  let uut: LlmService;
  let appConfigs: AppConfig;
  let logger: any;
  let correlationIdService: any;

  beforeEach(() => {
    appConfigs = {
      OLLAMA_BASE_URL: 'http://ollama',
    } as AppConfig;
    logger = {
      error: jest.fn(),
    };
    correlationIdService = {
      correlationId: 'fd2914ad-4789-4ac2-a7a5-d97c7806294f',
    };
    uut = new LlmService(appConfigs, logger, correlationIdService);
  });

  it.each<{ word: any; context: any }>([
    { word: '', context: 'some context' },
    { word: 'word', context: '' },
    { word: null, context: 'my context' },
    { word: 'some', context: undefined },
  ])(
    'should throw an error if word ($word) or context ($context) is empty',
    async ({ word, context }) => {
      await expect(uut.explainWord(word, context)).rejects.toThrow(
        'Word and context must be provided',
      );
    },
  );

  it('should throw an error if context does not include the word', async () => {
    const word = 'melee';
    const context = 'I need to analyze the data carefully.';

    await expect(uut.explainWord(word, context)).rejects.toThrow(
      'Context must include the word to be explained',
    );
  });

  it('should throw an error when word is longer than 64 characters', async () => {
    const word = 'a'.repeat(65);
    const context = `This is a context that includes the word ${word}.`;

    await expect(uut.explainWord(word, context)).rejects.toThrow(
      'Word is too long (max 64 characters, 1-3 words (compound/hyphenated terms))',
    );
  });

  it('should throw an error when context is longer than 2000 characters', async () => {
    const word = 'analyze';
    const context =
      `This is a very long context that includes the word ${word}. ` +
      'a'.repeat(2000);

    await expect(uut.explainWord(word, context)).rejects.toThrow(
      'Context is too long (max 2000 characters, ~300-400 words)',
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
