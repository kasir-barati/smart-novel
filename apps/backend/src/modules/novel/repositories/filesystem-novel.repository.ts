import { Injectable } from '@nestjs/common';
import { readdir, readFile, stat } from 'fs/promises';
import matter from 'gray-matter';
import {
  CorrelationIdService,
  CustomLoggerService,
} from 'nestjs-backend-common';
import { join } from 'path';

import { NovelDetails } from '../interfaces';
import { Chapter } from '../types/chapter.type';
import { Novel } from '../types/novel.type';
import { INovelRepository } from './novel.repository.interface';

const naturalFilenameCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

@Injectable()
export class FileSystemNovelRepository implements INovelRepository {
  private readonly dataPath = '/data';

  constructor(
    private readonly logger: CustomLoggerService,
    private readonly correlationIdService: CorrelationIdService,
  ) {}

  async findAll(): Promise<Novel[]> {
    try {
      const novelDirs = await readdir(this.dataPath, {
        withFileTypes: true,
      });
      const novels: Novel[] = [];

      for (const dir of novelDirs) {
        if (dir.isDirectory()) {
          const novel = await this.loadNovel(dir.name);
          if (novel) {
            novels.push(novel);
          }
        }
      }

      return novels.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      this.logger.error(`Error reading novels: ${error}`, {
        correlationId: this.correlationIdService.correlationId,
      });
      throw new Error('Failed to read novels');
    }
  }

  async findById(id: string): Promise<Novel | null> {
    return this.loadNovel(id);
  }

  async getChapter(
    novelId: string,
    chapterId: string,
  ): Promise<Chapter | null> {
    try {
      const chapterPath = join(this.dataPath, novelId, chapterId);
      const content = await readFile(chapterPath, 'utf-8');
      const parsed = matter(content);
      const stats = await stat(chapterPath);

      return {
        content: parsed.content,
        createdAt: stats.birthtime,
        id: chapterId,
        novelId,
        title: parsed.data.title || null,
        updatedAt: stats.mtime,
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
    return this.getChapterListInternal(novelId);
  }

  private async loadNovel(novelId: string): Promise<Novel | null> {
    try {
      const detailsPath = join(
        this.dataPath,
        novelId,
        'details.json',
      );
      const detailsContent = await readFile(detailsPath, 'utf-8');
      const details: NovelDetails = JSON.parse(detailsContent);

      const chapters = await this.getChapterListInternal(novelId);

      return {
        author: details.author,
        category: details.category.map((cat) => cat.toLowerCase()),
        chapters,
        description: details.description,
        id: details.id,
        name: details.name,
        state: details.state,
        coverUrl: details.coverUrl,
      };
    } catch (error) {
      this.logger.error(`Error loading novel ${novelId}: ${error}`, {
        correlationId: this.correlationIdService.correlationId,
      });
      return null;
    }
  }

  async getCategories(): Promise<string[]> {
    return [
      'fantasy',
      'action',
      'adventure',
      'romance',
      'mystery',
      'sci-fi',
      'horror',
      'comedy',
    ].map((cat) => cat.toLowerCase());
  }

  private async getChapterListInternal(
    novelId: string,
  ): Promise<string[]> {
    try {
      const novelPath = join(this.dataPath, novelId);
      const files = await readdir(novelPath);

      return files
        .filter((file) => file.endsWith('.md'))
        .sort((a, b) => naturalFilenameCollator.compare(a, b));
    } catch (error) {
      this.logger.error(
        `Error reading chapter list for ${novelId}: ${error}`,
        { correlationId: this.correlationIdService.correlationId },
      );
      return [];
    }
  }
}
