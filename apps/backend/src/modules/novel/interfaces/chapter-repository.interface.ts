import { NarrationStatus } from '@prisma/client';

import { IChapter } from './chapter.interface';

export interface IChapterRepository {
  getChapter(
    novelId: string,
    chapterId: string,
  ): Promise<IChapter | null>;
  findById(id: string): Promise<IChapter | null>;
  updateChapterNarrationUrl(id: string, url: string): Promise<void>;
  updateNarrationStatus(
    id: string,
    status: NarrationStatus,
  ): Promise<void>;
  updateChapterNarrationComplete(
    id: string,
    url: string,
  ): Promise<number>;
  updateChapterTtsFriendlyContent(
    id: string,
    ttsFriendlyContent: string,
  ): Promise<IChapter | null>;
}

export const CHAPTER_REPOSITORY = Symbol('CHAPTER_REPOSITORY');
