import { InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

import { AppConfig } from '../../app';
import { LlmService } from './llm.service';

describe(LlmService.name, () => {
  let uut: LlmService;
  let appConfigs: AppConfig;

  beforeEach(() => {
    appConfigs = {
      OLLAMA_BASE_URL: 'http://ollama',
    } as AppConfig;
    uut = new LlmService(appConfigs);
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
