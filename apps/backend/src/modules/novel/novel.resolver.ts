import { NotFoundException } from '@nestjs/common';
import {
  Args,
  ID,
  Int,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';

import { NovelFiltersInput } from './dto';
import { NovelService } from './novel.service';
import { Chapter, Novel, NovelConnection } from './types';

@Resolver(() => Novel)
export class NovelResolver {
  constructor(private readonly novelService: NovelService) {}

  @Query(() => Novel)
  async novel(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Novel> {
    const novel = await this.novelService.findOne(id);
    if (!novel) {
      throw new NotFoundException(`Novel with id ${id} not found`);
    }
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

  @ResolveField(() => Chapter, { nullable: true })
  async chapter(
    @Parent() novel: Novel,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Chapter | null> {
    return this.novelService.getChapter(novel.id, id);
  }
}
