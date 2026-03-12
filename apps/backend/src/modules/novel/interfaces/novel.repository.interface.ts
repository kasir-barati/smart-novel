import { INovel } from './novel-details.interface';

export interface INovelRepository {
  findAll(): Promise<INovel[]>;
  findById(id: string): Promise<INovel | null>;
  getChapterList(novelId: string): Promise<string[]>;
  getCategories(): Promise<string[]>;
}

export const NOVEL_REPOSITORY = Symbol('NOVEL_REPOSITORY');
