import { Injectable } from '@nestjs/common';
import {
  NarrationStatus,
  Prisma,
  Chapter as PrismaChapter,
} from '@prisma/client';

import { OrderDirection } from '../../../shared'; // FIXME: https://github.com/kasir-barati/smart-novel/issues/23
import { PrismaService } from '../../prisma';
import { ChapterOrderField } from '../enums';
import {
  type ChaptersConnectionResult,
  type FindChaptersConnectionArgs,
  type IChapter,
  type IChapterRepository,
} from '../interfaces';
import { Chapter } from '../types';

const ORDER_FIELD_MAP: Record<string, string> = {
  [ChapterOrderField.CHAPTER_NUMBER]: 'chapterNumber',
  [ChapterOrderField.CREATED_AT]: 'createdAt',
  [ChapterOrderField.UPDATED_AT]: 'updatedAt',
};

@Injectable()
export class PrismaChapterRepository implements IChapterRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findChaptersConnection(
    args: FindChaptersConnectionArgs,
  ): Promise<ChaptersConnectionResult> {
    const {
      novelId,
      pagination,
      orderByField = ChapterOrderField.CHAPTER_NUMBER,
      orderByDirection = OrderDirection.ASC,
      filters,
    } = args;
    const { first, last, after, before } = pagination ?? {};
    const prismaField =
      ORDER_FIELD_MAP[orderByField] ?? 'chapterNumber';
    const direction =
      orderByDirection === OrderDirection.DESC ? 'desc' : 'asc';
    const where: Prisma.ChapterWhereInput = { novelId };

    if (filters?.narrationStatus) {
      where.narrationStatus = filters.narrationStatus;
    }

    const afterId =
      after && Buffer.from(after, 'base64').toString('utf-8');
    const beforeId =
      before && Buffer.from(before, 'base64').toString('utf-8');

    // Build cursor-based pagination args
    const findArgs: Prisma.ChapterFindManyArgs = {
      where,
      orderBy: { [prismaField]: direction },
      select: {
        id: true,
        novelId: true,
        contentId: true,
        title: true,
        chapterNumber: true,
        narrationStatus: true,
        narrationUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    };

    if (afterId) {
      findArgs.cursor = { id: afterId };
      findArgs.skip = 1; // Skip the cursor itself
    }

    // For simplicity sake I am skipping the implementation of when client sends both after & before.
    // If we have both after and before, we need a different strategy
    if (beforeId && !afterId) {
      findArgs.cursor = { id: beforeId };
      findArgs.skip = 1;
      // Reverse the direction to get items before the cursor
      findArgs.orderBy = {
        [prismaField]: direction === 'asc' ? 'desc' : 'asc',
      };
    }

    // Take extra to determine hasNextPage/hasPreviousPage
    const take = first ?? last;
    if (take) {
      findArgs.take = take + 1;
    }

    const [chapters, totalCount] = await Promise.all([
      this.prisma.chapter.findMany(findArgs),
      this.prisma.chapter.count({ where }),
    ]);

    // If we reversed for 'before', reverse back
    if (beforeId && !afterId) {
      chapters.reverse();
    }

    // Trim the extra record we fetched
    if (take && chapters.length > take) {
      if (last && !first) {
        chapters.shift();
      } else {
        chapters.pop();
      }
    }

    const mapped: IChapter[] = chapters.map((ch) =>
      this.toChapter(ch as PrismaChapter),
    );

    return { chapters: mapped, totalCount };
  }

  async getFirstChapter(novelId: string): Promise<IChapter | null> {
    const chapter = await this.prisma.chapter.findFirst({
      where: { novelId },
      orderBy: { chapterNumber: 'asc' },
    });

    if (!chapter) {
      return null;
    }

    return this.toChapter(chapter);
  }

  async getLastChapter(novelId: string): Promise<IChapter | null> {
    const chapter = await this.prisma.chapter.findFirst({
      where: { novelId },
      orderBy: { chapterNumber: 'desc' },
    });

    if (!chapter) {
      return null;
    }

    return this.toChapter(chapter);
  }

  async getChapter(
    novelId: string,
    chapterId: string,
  ): Promise<Chapter | null> {
    const chapter = await this.prisma.chapter.findFirst({
      where: {
        id: chapterId,
        novelId: novelId,
      },
    });

    if (!chapter) {
      return null;
    }

    return this.toChapter(chapter);
  }

  async findById(id: string): Promise<Chapter | null> {
    const chapter = await this.prisma.chapter.findFirst({
      where: { id },
    });

    if (!chapter) {
      return null;
    }

    return this.toChapter(chapter);
  }

  async updateChapterNarrationUrl(
    id: string,
    url: string,
  ): Promise<void> {
    await this.prisma.chapter.update({
      where: { id },
      data: { narrationUrl: url },
    });
  }

  async updateNarrationStatus(
    id: string,
    status: NarrationStatus,
  ): Promise<void> {
    await this.prisma.chapter.update({
      where: { id },
      data: { narrationStatus: status },
    });
  }

  async updateChapterNarrationComplete(
    id: string,
    url: string,
  ): Promise<number> {
    const result = await this.prisma.chapter.updateMany({
      where: {
        id,
        narrationStatus: NarrationStatus.PROCESSING,
      },
      data: {
        narrationUrl: url,
        narrationStatus: NarrationStatus.READY,
      },
    });
    return result.count;
  }

  private toChapter(chapter: PrismaChapter): Chapter {
    return {
      id: chapter.id,
      novelId: chapter.novelId,
      contentId: chapter.contentId ?? undefined,
      title: chapter.title,
      chapterNumber: chapter.chapterNumber,
      createdAt: chapter.createdAt.toISOString(),
      updatedAt: chapter.updatedAt.toISOString(),
      narrationStatus: chapter.narrationStatus as
        | NarrationStatus
        | undefined,
      narrationUrl: chapter.narrationUrl ?? undefined,
    };
  }
}
