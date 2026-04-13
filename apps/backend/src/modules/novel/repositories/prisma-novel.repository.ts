import { Injectable } from '@nestjs/common';
import { Prisma, Novel as PrismaNovel } from '@prisma/client';

import {
  buildCursorPaginationParams,
  trimCursorPaginationResults,
  TrimmedResult,
} from '../../../shared'; // FIXME: https://github.com/kasir-barati/smart-novel/issues/23
import { PrismaService } from '../../prisma';
import {
  type FindNovelsConnectionArgs,
  type INovelRepository,
  type NovelConnectionFilters,
} from '../interfaces';
import { Novel } from '../types';

@Injectable()
export class PrismaNovelRepository implements INovelRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findNovelsConnection({
    pagination,
    filters,
  }: FindNovelsConnectionArgs): Promise<TrimmedResult<Novel>> {
    const where = this.buildNovelWhereClause(filters);
    const { cursor, skip, take, shouldReverse } =
      buildCursorPaginationParams(pagination);

    const findArgs: Prisma.NovelFindManyArgs = {
      where,
      orderBy: { name: shouldReverse ? 'desc' : 'asc' },
      include: {
        categories: {
          select: {
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    };

    if (cursor) {
      findArgs.cursor = cursor;
    }
    if (skip) {
      findArgs.skip = skip;
    }
    if (take) {
      findArgs.take = take;
    }

    const novels = await this.prisma.novel.findMany(findArgs);
    const { items, hasMore } = trimCursorPaginationResults(
      novels,
      pagination,
      shouldReverse,
    );
    const mapped: Novel[] = items.map((novel) =>
      this.toNovel(
        novel as PrismaNovel & {
          categories: { category: { name: string } }[];
        },
      ),
    );

    return { items: mapped, hasMore };
  }

  async countNovels(
    filters?: NovelConnectionFilters,
  ): Promise<number> {
    const where = this.buildNovelWhereClause(filters);

    return this.prisma.novel.count({ where });
  }

  async findById(id: string): Promise<Novel | null> {
    const novel = await this.prisma.novel.findUnique({
      where: { id },
      include: {
        categories: {
          select: {
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!novel) {
      return null;
    }

    return this.toNovel(novel);
  }

  async getChapterList(novelId: string): Promise<string[]> {
    const chapters = await this.prisma.chapter.findMany({
      where: { novelId },
      select: { id: true },
      orderBy: { chapterNumber: 'asc' },
    });

    return chapters.map((chapter) => chapter.id);
  }

  async getCategories(): Promise<string[]> {
    const categories = await this.prisma.category.findMany({
      select: { name: true },
      orderBy: { name: 'asc' },
    });

    return categories.map((category) => category.name.toLowerCase());
  }

  private buildNovelWhereClause(
    filters?: NovelConnectionFilters,
  ): Prisma.NovelWhereInput {
    const where: Prisma.NovelWhereInput = {};

    if (filters?.categoryIn && filters.categoryIn.length > 0) {
      where.categories = {
        some: {
          category: {
            name: { in: filters.categoryIn, mode: 'insensitive' },
          },
        },
      };
    }

    if (filters?.categoryNin && filters.categoryNin.length > 0) {
      where.NOT = {
        categories: {
          some: {
            category: {
              name: { in: filters.categoryNin, mode: 'insensitive' },
            },
          },
        },
      };
    }

    return where;
  }

  private toNovel(
    record: PrismaNovel & {
      categories: { category: { name: string } }[];
    },
  ): Novel {
    return {
      id: record.id,
      name: record.name,
      author: record.author,
      description: record.description,
      state: record.state,
      ownerId: record.ownerId,
      coverUrl: record.coverUrl ?? undefined,
      category: record.categories.map((novelCategory) =>
        novelCategory.category.name.toLowerCase(),
      ),
    };
  }
}
