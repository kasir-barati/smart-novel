import { NarrationStatus } from '@prisma/client';

import { PaginationArgs } from '../../../shared/interfaces/index';
import { IChapter } from './chapter.interface';

export interface ChaptersConnectionResult {
  chapters: IChapter[];
  totalCount: number;
}

export interface ChapterConnectionFilters {
  narrationStatus?: NarrationStatus;
}

export interface FindChaptersConnectionArgs {
  novelId: string;
  pagination?: PaginationArgs;
  orderByField?: string;
  orderByDirection?: string;
  filters?: ChapterConnectionFilters;
}

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
  findChaptersConnection(
    args: FindChaptersConnectionArgs,
  ): Promise<ChaptersConnectionResult>;
  getFirstChapter(novelId: string): Promise<IChapter | null>;
  getLastChapter(novelId: string): Promise<IChapter | null>;
}

export const CHAPTER_REPOSITORY = Symbol('CHAPTER_REPOSITORY');
