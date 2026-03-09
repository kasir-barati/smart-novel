import { Module } from '@nestjs/common';

import { NOVEL_REPOSITORY } from './interfaces';
import { PubSubProvider } from './providers';
import { PrismaNovelRepository } from './repositories';
import {
  ChapterFieldResolver,
  ChapterNarrationResolver,
  NovelResolver,
} from './resolvers';
import {
  ChapterNarrationService,
  MarkdownToSpeechTextService,
  NarrationLockService,
  NovelService,
} from './services';

@Module({
  providers: [
    NovelResolver,
    ChapterFieldResolver,
    ChapterNarrationResolver,
    NovelService,
    ChapterNarrationService,
    NarrationLockService,
    PrismaNovelRepository,
    PubSubProvider,
    MarkdownToSpeechTextService,
    {
      provide: NOVEL_REPOSITORY,
      useClass: PrismaNovelRepository,
    },
  ],
  exports: [NovelService, ChapterNarrationService],
})
export class NovelModule {}
