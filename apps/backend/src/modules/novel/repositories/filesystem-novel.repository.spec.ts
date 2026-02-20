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
});
