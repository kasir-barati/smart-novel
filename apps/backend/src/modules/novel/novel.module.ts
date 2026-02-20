import { Module } from '@nestjs/common';

import { NovelResolver } from './novel.resolver';
import { NovelService } from './novel.service';
import {
  FileSystemNovelRepository,
  NOVEL_REPOSITORY,
} from './repositories';

@Module({
  providers: [
    NovelResolver,
    NovelService,
    {
      provide: NOVEL_REPOSITORY,
      useClass: FileSystemNovelRepository,
    },
  ],
  exports: [NovelService],
})
export class NovelModule {}
