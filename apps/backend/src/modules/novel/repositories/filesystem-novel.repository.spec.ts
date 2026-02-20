import { readdir, readFile, stat } from 'fs/promises';
import matter from 'gray-matter';
import { join } from 'path';

import { NovelState } from '../enums';
import { FileSystemNovelRepository } from './filesystem-novel.repository';

jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  readdir: jest.fn(),
  stat: jest.fn(),
}));
jest.mock('gray-matter', () => jest.fn());

describe(FileSystemNovelRepository.name, () => {
  let uut: FileSystemNovelRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    uut = new FileSystemNovelRepository();
  });

  describe('findById', () => {
    it('should return the novel when details.json exists', async () => {
      const novelId = 'novel-1';
      const detailsPath = join('/data', novelId, 'details.json');
      const novelPath = join('/data', novelId);
      (
        readFile as jest.MockedFunction<typeof readFile>
      ).mockResolvedValue(
        JSON.stringify({
          author: 'Author 1',
          category: ['fantasy'],
          id: novelId,
          name: 'Novel One',
          state: NovelState.FINISHED,
          coverUrl:
            'https://cdn.example.com/smart-novel/covers/1cd689e4-59c9-4d87-b0a5-3d7308270587.png',
        }),
      );
      (
        readdir as jest.MockedFunction<typeof readdir>
      ).mockResolvedValue(['chapter2.md', 'chapter1.md'] as any);

      const result = await uut.findById(novelId);

      expect(readFile).toHaveBeenCalledWith(detailsPath, 'utf-8');
      expect(readdir).toHaveBeenCalledWith(novelPath);
      expect(result).toStrictEqual({
        author: 'Author 1',
        category: ['fantasy'],
        chapters: ['chapter1.md', 'chapter2.md'],
        id: novelId,
        name: 'Novel One',
        state: NovelState.FINISHED,
        coverUrl:
          'https://cdn.example.com/smart-novel/covers/1cd689e4-59c9-4d87-b0a5-3d7308270587.png',
      });
    });

    it('should skip any none-chapter files', async () => {
      const novelId = 'novel-1';
      const detailsPath = join('/data', novelId, 'details.json');
      const novelPath = join('/data', novelId);
      (
        readFile as jest.MockedFunction<typeof readFile>
      ).mockResolvedValue(
        JSON.stringify({
          author: 'Author 1',
          category: ['fantasy'],
          id: novelId,
          name: 'Novel One',
          state: NovelState.FINISHED,
        }),
      );
      (
        readdir as jest.MockedFunction<typeof readdir>
      ).mockResolvedValue(['notes.txt', 'chapter1.md'] as any);

      const result = await uut.findById(novelId);

      expect(readFile).toHaveBeenCalledWith(detailsPath, 'utf-8');
      expect(readdir).toHaveBeenCalledWith(novelPath);
      expect(result!.chapters).toIncludeSameMembers(['chapter1.md']);
    });

    it('should return null when details cannot be read', async () => {
      (
        readFile as jest.MockedFunction<typeof readFile>
      ).mockRejectedValue(new Error('ENOENT'));

      const result = await uut.findById('missing-novel');

      expect(result).toBeNull();
    });
  });

  describe('getChapter', () => {
    it('should return chapter data when chapter file exists', async () => {
      const novelId = 'novel-1';
      const chapterId = 'chapter1.md';
      const chapterPath = join('/data', novelId, chapterId);
      const createdAt = new Date('2024-01-01T00:00:00.000Z');
      const updatedAt = new Date('2024-01-02T00:00:00.000Z');

      (
        readFile as jest.MockedFunction<typeof readFile>
      ).mockResolvedValue('---\ntitle: Chapter One\n---\n# Content');
      (matter as jest.MockedFunction<typeof matter>).mockReturnValue({
        content: '# Content',
        data: { title: 'Chapter One' },
        excerpt: '',
        language: 'yaml',
        matter: 'title: Chapter One',
        orig: Buffer.from(''),
        stringify: jest.fn(),
      });
      (stat as jest.MockedFunction<typeof stat>).mockResolvedValue({
        birthtime: createdAt,
        mtime: updatedAt,
      } as any);

      const result = await uut.getChapter(novelId, chapterId);

      expect(readFile).toHaveBeenCalledWith(chapterPath, 'utf-8');
      expect(stat).toHaveBeenCalledWith(chapterPath);
      expect(result).toEqual({
        content: '# Content',
        createdAt,
        id: chapterId,
        title: 'Chapter One',
        updatedAt,
        novelId: 'novel-1',
      });
    });

    it('should return null when chapter read fails', async () => {
      (
        readFile as jest.MockedFunction<typeof readFile>
      ).mockRejectedValue(new Error('ENOENT'));

      const result = await uut.getChapter('novel-1', 'missing.md');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return only directory novels sorted by name', async () => {
      // Arrange
      (
        readdir as jest.MockedFunction<typeof readdir>
      ).mockImplementation((path: any, options?: any) => {
        if (path === '/data' && options?.withFileTypes) {
          return Promise.resolve([
            { isDirectory: () => true, name: 'novel-b' },
            { isDirectory: () => false, name: 'README.md' },
            { isDirectory: () => true, name: 'novel-a' },
          ]);
        }
        if (path === join('/data', 'novel-b')) {
          return Promise.resolve(['chapter2.md', 'chapter1.md']);
        }
        if (path === join('/data', 'novel-a')) {
          return Promise.resolve(['chapter3.md']);
        }
        return Promise.resolve([] as any);
      });
      (
        readFile as jest.MockedFunction<typeof readFile>
      ).mockImplementation((path: any) => {
        if (path === join('/data', 'novel-b', 'details.json')) {
          return Promise.resolve(
            JSON.stringify({
              author: 'Author B',
              category: ['fantasy'],
              id: 'novel-b',
              name: 'Zeta Novel',
              state: NovelState.ONGOING,
            }),
          );
        }
        if (path === join('/data', 'novel-a', 'details.json')) {
          return Promise.resolve(
            JSON.stringify({
              author: 'Author A',
              category: ['action'],
              id: 'novel-a',
              name: 'Alpha Novel',
              state: NovelState.FINISHED,
            }),
          );
        }
        return Promise.reject(new Error('ENOENT'));
      });

      // Act
      const result = await uut.findAll();

      // Assert
      expect(result).toHaveLength(2);
      expect(result.map((novel) => novel.id)).toStrictEqual([
        'novel-a',
        'novel-b',
      ]);
      expect(result[0].chapters).toStrictEqual(['chapter3.md']);
      expect(result[1].chapters).toStrictEqual([
        'chapter1.md',
        'chapter2.md',
      ]);
    });

    it('should skip directories whose novel details cannot be loaded', async () => {
      // Arrange
      (
        readdir as jest.MockedFunction<typeof readdir>
      ).mockImplementation((path: any, options?: any) => {
        if (path === '/data' && options?.withFileTypes) {
          return Promise.resolve([
            { isDirectory: () => true, name: 'novel-ok' },
            { isDirectory: () => true, name: 'novel-missing' },
          ]);
        }
        if (path === join('/data', 'novel-ok')) {
          return Promise.resolve(['chapter1.md']);
        }
        return Promise.resolve([] as any);
      });
      (
        readFile as jest.MockedFunction<typeof readFile>
      ).mockImplementation((path: any) => {
        if (path === join('/data', 'novel-ok', 'details.json')) {
          return Promise.resolve(
            JSON.stringify({
              author: 'Author OK',
              category: ['mystery'],
              id: 'novel-ok',
              name: 'Novel OK',
              state: NovelState.ONGOING,
            }) as any,
          );
        }
        return Promise.reject(new Error('ENOENT'));
      });

      // Act
      const result = await uut.findAll();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('novel-ok');
    });

    it('should throw when the data directory cannot be read', async () => {
      // Arrange
      (
        readdir as jest.MockedFunction<typeof readdir>
      ).mockRejectedValue(new Error('EACCES'));

      // Act & Assert
      await expect(uut.findAll()).rejects.toThrow(
        'Failed to read novels',
      );
    });
  });

  describe('getChapterList', () => {
    it('should return only markdown chapters sorted by file name', async () => {
      const novelId = 'novel-1';
      const novelPath = join('/data', novelId);
      (
        readdir as jest.MockedFunction<typeof readdir>
      ).mockResolvedValue([
        'chapter10.md',
        'notes.txt',
        'chapter2.md',
        'details.json',
        'chapter1.md',
      ] as any);

      const result = await uut.getChapterList(novelId);

      expect(readdir).toHaveBeenCalledWith(novelPath);
      expect(result).toStrictEqual([
        'chapter1.md',
        'chapter2.md',
        'chapter10.md',
      ]);
    });

    it('should return empty list when reading chapter directory fails', async () => {
      (
        readdir as jest.MockedFunction<typeof readdir>
      ).mockRejectedValue(new Error('ENOENT'));

      const result = await uut.getChapterList('missing-novel');

      expect(result).toStrictEqual([]);
    });
  });
});
