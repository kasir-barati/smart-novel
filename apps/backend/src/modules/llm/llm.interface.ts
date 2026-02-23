import { WordExplanation } from './types';

export type ExplainWordPromptResponse = Omit<
  WordExplanation,
  'cacheKey'
>;
