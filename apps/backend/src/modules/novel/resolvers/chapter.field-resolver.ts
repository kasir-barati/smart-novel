import { BadRequestException } from '@nestjs/common';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';

import { Public } from '../../auth';
import { ChapterContentDataLoader } from '../dataloaders';
import { NovelService } from '../services';
import { Chapter } from '../types';

@Public()
@Resolver(() => Chapter)
export class ChapterFieldResolver {
  constructor(
    private readonly novelService: NovelService,
    private readonly chapterContentDataLoader: ChapterContentDataLoader,
  ) {}

  @ResolveField(() => String, {
    description: 'The content of the chapter in markdown format',
  })
  async content(@Parent() chapter: Chapter): Promise<string> {
    const chapterContent = await this.chapterContentDataLoader.load(
      chapter.contentId,
    );

    if (!chapterContent) {
      throw new BadRequestException('Chapter content not found');
    }

    return chapterContent.content;
  }

  @ResolveField(() => String, {
    nullable: true,
    description: 'TTS-friendly version of the chapter content',
  })
  async ttsFriendlyContent(
    @Parent() chapter: Chapter,
  ): Promise<string | undefined> {
    const chapterContent = await this.chapterContentDataLoader.load(
      chapter.contentId,
    );

    if (!chapterContent) {
      throw new BadRequestException('Chapter content not found');
    }

    return chapterContent?.ttsFriendlyContent;
  }

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
