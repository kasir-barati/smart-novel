import { Args, Mutation, Resolver } from '@nestjs/graphql';

import { Public } from '../auth';
import { ValidateExplainInput } from './decorators';
import { LlmService } from './llm.service';
import { WordExplanation } from './types';

@Public()
@Resolver()
export class LlmResolver {
  constructor(private readonly llmService: LlmService) {}

  @Mutation(() => WordExplanation)
  @ValidateExplainInput()
  async explain(
    @Args('word') word: string,
    @Args('context') context: string,
  ): Promise<WordExplanation> {
    return this.llmService.explainWord(word, context);
  }
}
