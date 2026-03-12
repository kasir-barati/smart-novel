import { Injectable } from '@nestjs/common';
import {
  NarrationStatus,
  Chapter as PrismaChapter,
} from '@prisma/client';
import {
  CorrelationIdService,
  CustomLoggerService,
  isNil,
} from 'nestjs-backend-common';

import { PrismaService } from '../../prisma';
import { IChapterRepository } from '../interfaces';
import { Chapter } from '../types';

@Injectable()
export class PrismaChapterRepository implements IChapterRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: CustomLoggerService,
    private readonly correlationIdService: CorrelationIdService,
  ) {}

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

      return this.toChapter(chapter);
    } catch (error) {
      this.logger.error(
        `Error reading chapter ${chapterId}: ${error}`,
        { correlationId: this.correlationIdService.correlationId },
      );
      return null;
    }
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

  async updateChapterTtsFriendlyContent(
    id: string,
    ttsFriendlyContent: string,
  ) {
    const chapter = await this.prisma.chapter.update({
      where: { id },
      data: { ttsFriendlyContent },
    });

    if (isNil(chapter)) {
      return null;
    }

    return this.toChapter(chapter);
  }

  private toChapter(chapter: PrismaChapter): Chapter {
    return {
      id: chapter.id,
      novelId: chapter.novelId,
      title: chapter.title,
      content: chapter.content,
      createdAt: chapter.createdAt.toISOString(),
      updatedAt: chapter.updatedAt.toISOString(),
      narrationStatus: chapter.narrationStatus as
        | NarrationStatus
        | undefined,
      narrationUrl: chapter.narrationUrl ?? undefined,
    };
  }
}
