import { Module } from '@nestjs/common';

import { ChapterContentDataLoader } from './dataloaders';
import {
  CHAPTER_CONTENT_REPOSITORY,
  CHAPTER_REPOSITORY,
  NOVEL_REPOSITORY,
} from './interfaces';
import { PubSubProvider } from './providers';
import {
  PrismaChapterContentRepository,
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
    PrismaChapterContentRepository,
    ChapterContentDataLoader,
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
    {
      provide: CHAPTER_CONTENT_REPOSITORY,
      useClass: PrismaChapterContentRepository,
    },
  ],
})
export class NovelModule {}
