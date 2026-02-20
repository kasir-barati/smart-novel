import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { NovelFiltersInput } from './dto';
import {
  type INovelRepository,
  NOVEL_REPOSITORY,
} from './repositories';
import {
  Chapter,
  Novel,
  NovelConnection,
  NovelEdge,
  PageInfo,
} from './types';

@Injectable()
export class NovelService {
  constructor(
    @Inject(NOVEL_REPOSITORY)
    private readonly novelRepository: INovelRepository,
  ) {}

  async findOne(id: string): Promise<Novel> {
    const novel = await this.novelRepository.findById(id);

    if (!novel) {
      throw new NotFoundException(`Novel with id ${id} not found`);
    }

    return novel;
  }

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

  async getChapter(
    novelId: string,
    chapterId: string,
  ): Promise<Chapter | null> {
    return this.novelRepository.getChapter(novelId, chapterId);
  }
}
