import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';

import type { IAuthUser } from '../../auth/interfaces';

import { ParseUuidPipe } from '../../../shared';
import { CurrentUser } from '../../auth';
import { ChapterUserStateService } from '../services';
import { MarkChaptersReadResponse } from '../types';

@Resolver()
export class ChapterUserStateResolver {
  constructor(
    private readonly chapterUserStateService: ChapterUserStateService,
  ) {}

  @Mutation(() => MarkChaptersReadResponse, {
    description:
      'Mark one or more chapters as read for the authenticated user. Maximum 100 chapter IDs per request.',
  })
  async markChaptersRead(
    @CurrentUser() user: IAuthUser,
    @Args('chapterIds', { type: () => [ID] }, ParseUuidPipe)
    chapterIds: string[],
  ): Promise<MarkChaptersReadResponse> {
    const markedCount =
      await this.chapterUserStateService.markChaptersRead(
        user.sub,
        chapterIds,
      );

    return { markedCount };
  }
}
