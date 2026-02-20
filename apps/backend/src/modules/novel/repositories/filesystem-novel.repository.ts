import { Injectable } from '@nestjs/common';
import { readdir, readFile, stat } from 'fs/promises';
import matter from 'gray-matter';
import { join } from 'path';

import { Chapter } from '../types/chapter.type';
import { Novel, NovelState } from '../types/novel.type';
import { INovelRepository } from './novel.repository.interface';

interface NovelDetails {
  author: string;
  category: string[];
  id: string;
  name: string;
  state: NovelState;
}

@Injectable()
export class FileSystemNovelRepository implements INovelRepository {
  private readonly dataPath = join(__dirname, '../../../data');

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
      console.error('Error reading novels:', error);
      return [];
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
        category: parsed.data.category || null,
        content: parsed.content,
        createdAt: stats.birthtime,
        id: chapterId,
        title: parsed.data.title || null,
        updatedAt: stats.mtime,
      };
    } catch (error) {
      console.error(`Error reading chapter ${chapterId}:`, error);
      return null;
    }
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

      const chapters = await this.getChapterList(novelId);

      return {
        author: details.author,
        category: details.category,
        chapters,
        id: details.id,
        name: details.name,
        state: details.state,
      };
    } catch (error) {
      console.error(`Error loading novel ${novelId}:`, error);
      return null;
    }
  }

  private async getChapterList(novelId: string): Promise<string[]> {
    try {
      const novelPath = join(this.dataPath, novelId);
      const files = await readdir(novelPath);

      return files
        .filter((file) => file.endsWith('.md'))
        .sort((a, b) => a.localeCompare(b));
    } catch (error) {
      console.error(
        `Error reading chapter list for ${novelId}:`,
        error,
      );
      return [];
    }
  }
}
