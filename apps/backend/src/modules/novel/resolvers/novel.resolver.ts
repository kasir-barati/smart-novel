import {
  Args,
  ID,
  Int,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';

import { NovelFiltersInput } from '../inputs';
import { NovelService } from '../novel.service';
import { Chapter, Novel, NovelConnection } from '../types';

@Resolver(() => Novel)
export class NovelResolver {
  constructor(private readonly novelService: NovelService) {}

  @Query(() => Novel, { description: 'Find a novel by its ID' })
  async novel(
    @Args('id', {
      type: () => ID,
      description: 'The ID of the novel',
    })
    id: string,
  ): Promise<Novel> {
    const novel = await this.novelService.findOne(id);

    return novel;
  }

  @Query(() => NovelConnection)
  async novels(
    @Args('first', { type: () => Int, nullable: true })
    first?: number,
    @Args('last', { type: () => Int, nullable: true }) last?: number,
    @Args('after', { type: () => String, nullable: true })
    after?: string,
    @Args('before', { type: () => String, nullable: true })
    before?: string,
    @Args('filters', {
      type: () => NovelFiltersInput,
      nullable: true,
    })
    filters?: NovelFiltersInput,
  ): Promise<NovelConnection> {
    return this.novelService.findAll(
      first,
      last,
      after,
      before,
      filters,
    );
  }

  @Query(() => [String], {
    description: 'Get all available novel categories',
  })
  async categories(): Promise<string[]> {
    return this.novelService.getCategories();
  }

  @ResolveField(() => Chapter, {
    nullable: true,
    description: 'Chapter of the novel',
  })
  async chapter(
    @Parent() novel: Novel,
    @Args('id', {
      type: () => ID,
      description: 'The ID of the chapter',
    })
    id: string,
  ): Promise<Chapter | null> {
    return this.novelService.getChapter(novel.id, id);
  }

  @ResolveField(() => String, {
    nullable: true,
    description:
      'ISO date string of when the last chapter was published',
  })
  async lastChapterPublishedAt(
    @Parent() novel: Novel,
  ): Promise<string | null> {
    if (!novel.chapters || novel.chapters.length === 0) {
      return null;
    }

    const lastChapterId = novel.chapters[novel.chapters.length - 1];
    const lastChapter = await this.novelService.getChapter(
      novel.id,
      lastChapterId,
    );

    return lastChapter ? lastChapter.updatedAt.toISOString() : null;
  }

  @ResolveField(() => Chapter, {
    nullable: true,
    description: 'The most recently published chapter',
  })
  async lastPublishedChapter(
    @Parent() novel: Novel,
  ): Promise<Chapter | null> {
    if (!novel.chapters || novel.chapters.length === 0) {
      return null;
    }

    const lastChapterId = novel.chapters[novel.chapters.length - 1];

    return this.novelService.getChapter(novel.id, lastChapterId);
  }

  @ResolveField(() => Chapter, {
    nullable: true,
    description: 'The first chapter of the novel',
  })
  async firstChapter(
    @Parent() novel: Novel,
  ): Promise<Chapter | null> {
    if (!novel.chapters || novel.chapters.length === 0) {
      return null;
    }

    const firstChapterId = novel.chapters[0];

    return this.novelService.getChapter(novel.id, firstChapterId);
  }
}
