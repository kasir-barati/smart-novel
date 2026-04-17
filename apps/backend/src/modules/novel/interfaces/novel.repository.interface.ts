import { PaginationArgs, TrimmedResult } from '../../../shared';
import { INovel } from './novel-details.interface';

export interface NovelConnectionFilters {
  categoryIn?: string[];
  categoryNin?: string[];
}

export interface FindNovelsConnectionArgs {
  pagination?: PaginationArgs;
  filters?: NovelConnectionFilters;
}

export interface INovelRepository {
  findNovelsConnection(
    args: FindNovelsConnectionArgs,
  ): Promise<TrimmedResult<INovel>>;
  countNovels(filters?: NovelConnectionFilters): Promise<number>;
  findById(id: string): Promise<INovel | null>;
  getCategories(): Promise<string[]>;
}

export const NOVEL_REPOSITORY = Symbol('NOVEL_REPOSITORY');
