import { Injectable } from '@nestjs/common';
import { Novel as PrismaNovel } from '@prisma/client';

import { PrismaService } from '../../prisma';
import { type INovelRepository } from '../interfaces';
import { Novel } from '../types';

@Injectable()
export class PrismaNovelRepository implements INovelRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Novel[]> {
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
      },
      orderBy: {
        name: 'asc',
      },
    });

    return novels.map((novel) => this.toNovel(novel));
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
