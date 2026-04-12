import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PageInfo } from 'nestjs-backend-common';

import { OrderDirection } from '../../../shared'; // FIXME: https://github.com/kasir-barati/smart-novel/issues/23
import { ChapterOrderField } from '../enums';
import {
  ChapterFiltersInput,
  ChapterOrderByInput,
  NovelFiltersInput,
} from '../inputs';
import {
  CHAPTER_REPOSITORY,
  type IChapterRepository,
  type INovelRepository,
  NOVEL_REPOSITORY,
} from '../interfaces';
import {
  Chapter,
  ChapterConnection,
  ChapterEdge,
  Novel,
  NovelConnection,
  NovelEdge,
} from '../types';

@Injectable()
export class NovelService {
  constructor(
    @Inject(NOVEL_REPOSITORY)
    private readonly novelRepository: INovelRepository,
    @Inject(CHAPTER_REPOSITORY)
    private readonly chapterRepository: IChapterRepository,
  ) {}

  async findOne(id: string): Promise<Novel> {
    const novel = await this.novelRepository.findById(id);

    if (!novel) {
      throw new NotFoundException(`Novel with id ${id} not found`);
    }

    return novel;
  }

  // FIXME: We are as of now only fetching all novels! Implement cursor based pagination + filtering in the repository layer.
  // Move this into the repository layer???
  // Should I also create a helper function for cursor based pagination?
  async findAll(
    first?: number,
    last?: number,
    after?: string,
    before?: string,
    filters?: NovelFiltersInput,
  ): Promise<NovelConnection> {
    let novels = await this.novelRepository.findAll();

    // Apply category filtering
    if (filters?.category) {
      const categoryFilter = filters.category;
      novels = novels.filter((novel) => {
        if (categoryFilter.in && categoryFilter.in.length > 0) {
          const hasIncludedCategory = novel.category.some((cat) =>
            categoryFilter.in!.includes(cat),
          );
          if (!hasIncludedCategory) return false;
        }

        if (categoryFilter.nin && categoryFilter.nin.length > 0) {
          const hasExcludedCategory = novel.category.some((cat) =>
            categoryFilter.nin!.includes(cat),
          );
          if (hasExcludedCategory) return false;
        }

        return true;
      });
    }

    // Create edges with cursors
    const allEdges: NovelEdge[] = novels.map((novel) => ({
      cursor: Buffer.from(novel.id).toString('base64'),
      node: novel,
    }));

    // Handle pagination
    let edges = allEdges;
    let hasNextPage = false;
    let hasPreviousPage = false;

    if (after) {
      const afterIndex = allEdges.findIndex(
        (edge) => edge.cursor === after,
      );
      if (afterIndex >= 0) {
        edges = allEdges.slice(afterIndex + 1);
        hasPreviousPage = afterIndex > 0;
      }
    }

    if (before) {
      const beforeIndex = allEdges.findIndex(
        (edge) => edge.cursor === before,
      );
      if (beforeIndex >= 0) {
        edges = edges.slice(0, beforeIndex);
        hasNextPage = beforeIndex < allEdges.length - 1;
      }
    }

    if (first && first > 0) {
      if (edges.length > first) {
        hasNextPage = true;
        edges = edges.slice(0, first);
      }
    }

    if (last && last > 0) {
      if (edges.length > last) {
        hasPreviousPage = true;
        edges = edges.slice(-last);
      }
    }

    const pageInfo: PageInfo = {
      endCursor:
        edges.length > 0 ? edges[edges.length - 1].cursor : null,
      hasNextPage,
      hasPreviousPage,
      startCursor: edges.length > 0 ? edges[0].cursor : null,
    };

    return {
      edges,
      pageInfo,
    };
  }

  async getChaptersConnection(
    novelId: string,
    first?: number,
    last?: number,
    after?: string,
    before?: string,
    orderBy?: ChapterOrderByInput,
    filters?: ChapterFiltersInput,
  ): Promise<ChapterConnection> {
    const orderByField =
      orderBy?.field ?? ChapterOrderField.CHAPTER_NUMBER;
    const orderByDirection = orderBy?.direction ?? OrderDirection.ASC;
    const { chapters, totalCount } =
      await this.chapterRepository.findChaptersConnection({
        novelId,
        pagination: { first, last, after, before },
        orderByField,
        orderByDirection,
        filters: {
          narrationStatus: filters?.narrationStatus?.eq,
        },
      });

    const edges: ChapterEdge[] = chapters.map((chapter) => ({
      cursor: Buffer.from(chapter.id).toString('base64'),
      node: chapter as Chapter,
    }));

    const take = first ?? last;
    const hasMore = take ? chapters.length >= (take ?? 0) : false;

    const pageInfo: PageInfo = {
      startCursor: edges.length > 0 ? edges[0].cursor : null,
      endCursor:
        edges.length > 0 ? edges[edges.length - 1].cursor : null,
      hasPreviousPage: !!after,
      hasNextPage: hasMore && !!first,
    };

    return {
      edges,
      pageInfo,
      totalCount,
    };
  }

  async getChapter(
    novelId: string,
    chapterId: string,
  ): Promise<Chapter | null> {
    return this.chapterRepository.getChapter(novelId, chapterId);
  }

  async getFirstChapter(novelId: string): Promise<Chapter | null> {
    return this.chapterRepository.getFirstChapter(novelId);
  }

  async getLastChapter(novelId: string): Promise<Chapter | null> {
    return this.chapterRepository.getLastChapter(novelId);
  }

  async getNextChapter(
    novelId: string,
    currentChapterId: string,
  ): Promise<Chapter | null> {
    const chapters =
      await this.novelRepository.getChapterList(novelId);
    const currentIndex = chapters.indexOf(currentChapterId);

    if (
      this.chapterDoesNotExist(chapters, currentChapterId) ||
      this.doesNotHaveNextChapter(chapters, currentChapterId)
    ) {
      return null;
    }

    const nextChapterId = chapters[currentIndex + 1];

    return this.chapterRepository.getChapter(novelId, nextChapterId);
  }

  async getPreviousChapter(
    novelId: string,
    currentChapterId: string,
  ): Promise<Chapter | null> {
    const chapters =
      await this.novelRepository.getChapterList(novelId);
    const currentIndex = chapters.indexOf(currentChapterId);

    if (
      this.chapterDoesNotExist(chapters, currentChapterId) ||
      this.doesNotHavePreviousChapter(chapters, currentChapterId)
    ) {
      return null;
    }

    const previousChapterId = chapters[currentIndex - 1];

    return this.chapterRepository.getChapter(
      novelId,
      previousChapterId,
    );
  }

  async getCategories(): Promise<string[]> {
    return this.novelRepository.getCategories();
  }

  private doesNotHavePreviousChapter(
    chapters: string[],
    chapterId: string,
  ): boolean {
    const currentIndex = chapters.indexOf(chapterId);
    return currentIndex === 0;
  }

  private doesNotHaveNextChapter(
    chapters: string[],
    chapterId: string,
  ): boolean {
    const currentIndex = chapters.indexOf(chapterId);
    return currentIndex === chapters.length - 1;
  }

  private chapterDoesNotExist(
    chapters: string[],
    chapterId: string,
  ): boolean {
    return !chapters.includes(chapterId);
  }
}
