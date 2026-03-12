import { Module } from '@nestjs/common';

import { CHAPTER_REPOSITORY, NOVEL_REPOSITORY } from './interfaces';
import { PubSubProvider } from './providers';
import {
  PrismaChapterRepository,
  PrismaNovelRepository,
} from './repositories';
import {
  ChapterFieldResolver,
  ChapterNarrationResolver,
  ChapterResolver,
  NovelResolver,
} from './resolvers';
import {
  ChapterNarrationService,
  ChapterService,
  MarkdownToSpeechTextService,
  NarrationLockService,
  NovelService,
} from './services';

@Module({
  providers: [
    NovelResolver,
    ChapterFieldResolver,
    ChapterNarrationResolver,
    ChapterResolver,
    NovelService,
    ChapterService,
    ChapterNarrationService,
    NarrationLockService,
    PrismaNovelRepository,
    PubSubProvider,
    MarkdownToSpeechTextService,
    {
      provide: NOVEL_REPOSITORY,
      useClass: PrismaNovelRepository,
    },
    {
      provide: CHAPTER_REPOSITORY,
      useClass: PrismaChapterRepository,
    },
  ],
})
export class NovelModule {}
