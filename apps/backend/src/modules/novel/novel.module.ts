import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  CategoryEntity,
  ChapterEntity,
  NovelEntity,
} from './entities';
import { NovelService } from './novel.service';
import {
  FileSystemNovelRepository,
  NOVEL_REPOSITORY,
  TypeormNovelRepository,
} from './repositories';
import { ChapterFieldResolver, NovelResolver } from './resolvers';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NovelEntity,
      ChapterEntity,
      CategoryEntity,
    ]),
  ],
  providers: [
    NovelResolver,
    ChapterFieldResolver,
    NovelService,
    FileSystemNovelRepository,
    TypeormNovelRepository,
    {
      provide: NOVEL_REPOSITORY,
      useClass: FileSystemNovelRepository,
    },
  ],
  exports: [NovelService],
})
export class NovelModule {}
