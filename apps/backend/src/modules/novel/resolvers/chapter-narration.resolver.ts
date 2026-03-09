import {
  Args,
  ID,
  Mutation,
  Resolver,
  Subscription,
} from '@nestjs/graphql';

import { ChapterNarrationService } from '../services';
import {
  ChapterNarrationEvent,
  ChapterNarrationResponse,
} from '../types';

@Resolver()
export class ChapterNarrationResolver {
  constructor(
    private readonly narrationService: ChapterNarrationService,
  ) {}

  /**
   * Triggers chapter audio generation and returns immediately with status
   */
  @Mutation(() => ChapterNarrationResponse, {
    name: 'generateChapterAudio',
    description: 'Start generating audio narration for a chapter',
  })
  async generateChapterAudio(
    @Args('chapterId', { type: () => ID }) chapterId: string,
    @Args('forceRegenerate', {
      type: () => Boolean,
      nullable: true,
      defaultValue: false,
      description:
        'Force regeneration even if audio already exists. Use this when TTS voice changes or markdown-to-text conversion is improved.',
    })
    forceRegenerate = false,
  ): Promise<ChapterNarrationResponse> {
    return this.narrationService.startGeneration(
      chapterId,
      forceRegenerate,
    );
  }

  /**
   * Subscribe to real-time updates for chapter narration generation
   */
  @Subscription(() => ChapterNarrationEvent, {
    name: 'chapterNarrationUpdated',
    description:
      'Receive real-time updates when chapter narration status changes',
    filter: (payload, variables) => {
      return (
        payload.chapterNarrationUpdated.chapterId ===
        variables.chapterId
      );
    },
  })
  chapterNarrationUpdated(
    @Args('chapterId', { type: () => ID }) chapterId: string,
  ) {
    return this.narrationService.subscribeToChapterNarration(
      chapterId,
    );
  }
}
