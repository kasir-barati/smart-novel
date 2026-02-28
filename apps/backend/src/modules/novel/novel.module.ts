import { Module } from '@nestjs/common';

import { NovelService } from './novel.service';
import {
  FileSystemNovelRepository,
  NOVEL_REPOSITORY,
  PrismaNovelRepository,
} from './repositories';
import { ChapterFieldResolver, NovelResolver } from './resolvers';

@Module({
  providers: [
    NovelResolver,
    ChapterFieldResolver,
    NovelService,
    FileSystemNovelRepository,
    PrismaNovelRepository,
    {
      provide: NOVEL_REPOSITORY,
      useClass: FileSystemNovelRepository,
    },
  ],
  exports: [NovelService],
})
export class NovelModule {}
