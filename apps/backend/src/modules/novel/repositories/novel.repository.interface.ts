import { Chapter } from '../types/chapter.type';
import { Novel } from '../types/novel.type';

export interface INovelRepository {
  findAll(): Promise<Novel[]>;
  findById(id: string): Promise<Novel | null>;
  getChapter(
    novelId: string,
    chapterId: string,
  ): Promise<Chapter | null>;
}

export const NOVEL_REPOSITORY = Symbol('NOVEL_REPOSITORY');
