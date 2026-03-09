import { NarrationStatus } from '@prisma/client';

import { IChapter } from './chapter.interface';
import { INovel } from './novel-details.interface';

export interface INovelRepository {
  findAll(): Promise<INovel[]>;
  findById(id: string): Promise<INovel | null>;
  getChapter(
    novelId: string,
    chapterId: string,
  ): Promise<IChapter | null>;
  getChapterById(chapterId: string): Promise<IChapter | null>;
  getChapterList(novelId: string): Promise<string[]>;
  getCategories(): Promise<string[]>;
  updateChapterNarrationUrl(
    chapterId: string,
    url: string,
  ): Promise<void>;
  updateNarrationStatus(
    chapterId: string,
    status: NarrationStatus,
  ): Promise<void>;
  updateChapterNarrationComplete(
    chapterId: string,
    url: string,
  ): Promise<number>;
}

export const NOVEL_REPOSITORY = Symbol('NOVEL_REPOSITORY');
