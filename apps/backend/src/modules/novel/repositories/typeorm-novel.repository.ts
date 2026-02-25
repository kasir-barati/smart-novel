import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CorrelationIdService,
  CustomLoggerService,
} from 'nestjs-backend-common';
import { Repository } from 'typeorm';

import {
  CategoryEntity,
  ChapterEntity,
  NovelEntity,
} from '../entities';
import { Chapter, Novel } from '../types';
import { INovelRepository } from './novel.repository.interface';

@Injectable()
export class TypeormNovelRepository implements INovelRepository {
  constructor(
    @InjectRepository(NovelEntity)
    private readonly novelRepository: Repository<NovelEntity>,
    @InjectRepository(ChapterEntity)
    private readonly chapterRepository: Repository<ChapterEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    private readonly logger: CustomLoggerService,
    private readonly correlationIdService: CorrelationIdService,
  ) {}

  async findAll(): Promise<Novel[]> {
    try {
      const novels = await this.novelRepository.find({
        relations: ['categories', 'chapters'],
        order: { name: 'ASC' },
      });

      return novels.map((novel) => this.mapNovelEntityToNovel(novel));
    } catch (error) {
      this.logger.error(`Error reading novels: ${error}`, {
        correlationId: this.correlationIdService.correlationId,
      });
      throw new Error('Failed to read novels');
    }
  }

  async findById(id: string): Promise<Novel | null> {
    try {
      const novel = await this.novelRepository.findOne({
        where: { id },
        relations: ['categories', 'chapters'],
      });

      return novel ? this.mapNovelEntityToNovel(novel) : null;
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
      const chapter = await this.chapterRepository.findOne({
        where: { id: chapterId, novelId },
      });

      return chapter ? this.mapChapterEntityToChapter(chapter) : null;
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
      const chapters = await this.chapterRepository.find({
        where: { novelId },
        select: ['filename'],
        order: { filename: 'ASC' },
      });

      return chapters.map((chapter) => chapter.filename);
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
      const categories = await this.categoryRepository.find({
        select: ['name'],
        order: { name: 'ASC' },
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

  private mapNovelEntityToNovel(entity: NovelEntity): Novel {
    return {
      id: entity.id,
      name: entity.name,
      author: entity.author,
      description: entity.description,
      state: entity.state,
      coverUrl: entity.coverUrl,
      category: entity.categories
        ? entity.categories.map((cat) => cat.name.toLowerCase())
        : [],
      chapters: entity.chapters
        ? entity.chapters.map((ch) => ch.id)
        : [],
    };
  }

  private mapChapterEntityToChapter(entity: ChapterEntity): Chapter {
    return {
      id: entity.id,
      novelId: entity.novelId,
      title: entity.title,
      content: entity.content,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
