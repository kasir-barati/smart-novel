import { Parent, ResolveField, Resolver } from '@nestjs/graphql';

import { Public } from '../../auth';
import { NovelService } from '../services';
import { Chapter } from '../types';

@Public()
@Resolver(() => Chapter)
export class ChapterFieldResolver {
  constructor(private readonly novelService: NovelService) {}

  @ResolveField(() => Chapter, {
    nullable: true,
    description: 'The next chapter',
  })
  async next(@Parent() chapter: Chapter): Promise<Chapter | null> {
    return this.novelService.getNextChapter(
      chapter.novelId,
      chapter.id,
    );
  }

  @ResolveField(() => Chapter, {
    nullable: true,
    description: 'The previous chapter',
  })
  async previous(
    @Parent() chapter: Chapter,
  ): Promise<Chapter | null> {
    return this.novelService.getPreviousChapter(
      chapter.novelId,
      chapter.id,
    );
  }
}
