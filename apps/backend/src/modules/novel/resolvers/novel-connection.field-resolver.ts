import { Inject } from '@nestjs/common';
import { Int, Parent, ResolveField, Resolver } from '@nestjs/graphql';

import { Public } from '../../auth';
import {
  type INovelRepository,
  NOVEL_REPOSITORY,
} from '../interfaces';
import { NovelConnection } from '../types';

@Public()
@Resolver(() => NovelConnection)
export class NovelConnectionFieldResolver {
  constructor(
    @Inject(NOVEL_REPOSITORY)
    private readonly novelRepository: INovelRepository,
  ) {}

  @ResolveField(() => Int, {
    description: 'Total number of novels matching the filters',
  })
  async totalCount(
    @Parent() connection: NovelConnection,
  ): Promise<number> {
    return this.novelRepository.countNovels(
      connection._filterContext,
    );
  }
}
