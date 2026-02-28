import { Injectable } from '@nestjs/common';
import {
  CorrelationIdService,
  CustomLoggerService,
} from 'nestjs-backend-common';

import { PrismaService } from '../../prisma';
import { NovelState } from '../enums';
import { Chapter, Novel } from '../types';
import { INovelRepository } from './novel.repository.interface';

@Injectable()
export class PrismaNovelRepository implements INovelRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: CustomLoggerService,
    private readonly correlationIdService: CorrelationIdService,
  ) {}

  async findAll(): Promise<Novel[]> {
    try {
      const novels = await this.prisma.novel.findMany({
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
          chapters: {
            select: {
              id: true,
            },
            orderBy: {
              chapterNumber: 'asc',
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      return novels.map((novel) => ({
        id: novel.id,
        name: novel.name,
        author: novel.author,
        description: novel.description,
        state: novel.state as NovelState,
        coverUrl: novel.coverUrl ?? undefined,
        category: novel.categories.map((novelCategory) =>
          novelCategory.category.name.toLowerCase(),
        ),
        chapters: novel.chapters.map((chapter) => chapter.id),
      }));
    } catch (error) {
      this.logger.error(`Error reading novels: ${error}`, {
        correlationId: this.correlationIdService.correlationId,
      });
      throw new Error('Failed to read novels');
    }
  }

  async findById(id: string): Promise<Novel | null> {
    try {
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
          chapters: {
            select: {
              id: true,
            },
            orderBy: {
              chapterNumber: 'asc',
            },
          },
        },
      });

      if (!novel) {
        return null;
      }

      return {
        id: novel.id,
        name: novel.name,
        author: novel.author,
        description: novel.description,
        state: novel.state as NovelState,
        coverUrl: novel.coverUrl ?? undefined,
        category: novel.categories.map((novelCategory) =>
          novelCategory.category.name.toLowerCase(),
        ),
        chapters: novel.chapters.map((chapter) => chapter.id),
      };
    } catch (error) {
      this.logger.error(`Error reading novel ${id}: ${error}`, {
        correlationId: this.correlationIdService.correlationId,
      });
      return null;
    }
  }

  async getChapter(
    novelId: string,
    chapterId: string,
  ): Promise<Chapter | null> {
    try {
      const chapter = await this.prisma.chapter.findFirst({
        where: {
          id: chapterId,
          novelId: novelId,
        },
      });

      if (!chapter) {
        return null;
      }

      return {
        id: chapter.id,
        novelId: chapter.novelId,
        title: chapter.title,
        content: chapter.content,
        createdAt: chapter.createdAt.toISOString(),
        updatedAt: chapter.updatedAt.toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Error reading chapter ${chapterId}: ${error}`,
        { correlationId: this.correlationIdService.correlationId },
      );
      return null;
    }
  }

  async getChapterList(novelId: string): Promise<string[]> {
    try {
      const chapters = await this.prisma.chapter.findMany({
        where: { novelId },
        select: { id: true },
        orderBy: { chapterNumber: 'asc' },
      });

      return chapters.map((chapter) => chapter.id);
    } catch (error) {
      this.logger.error(
        `Error reading chapter list for ${novelId}: ${error}`,
        { correlationId: this.correlationIdService.correlationId },
      );
      return [];
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      const categories = await this.prisma.category.findMany({
        select: { name: true },
        orderBy: { name: 'asc' },
      });

      return categories.map((category) =>
        category.name.toLowerCase(),
      );
    } catch (error) {
      this.logger.error(`Error reading categories: ${error}`, {
        correlationId: this.correlationIdService.correlationId,
      });
      return [];
    }
  }
}
