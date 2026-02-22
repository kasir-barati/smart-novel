import { NovelState } from '../enums';
import { NovelService } from '../novel.service';
import { Novel } from '../types';
import { NovelResolver } from './novel.resolver';

describe(NovelResolver.name, () => {
  let uut: NovelResolver;
  let novelService: jest.Mocked<NovelService>;

  beforeEach(() => {
    novelService = {
      getChapter: jest.fn(),
    } as any;

    uut = new NovelResolver(novelService);
  });

  describe('lastChapterPublishedAt', () => {
    it('should return the last chapter published date', async () => {
      const novel: Novel = {
        author: 'Author',
        category: ['fantasy'],
        chapters: ['chapter1.md', 'chapter2.md'],
        description: 'A novel description',
        id: 'novel-1',
        name: 'Novel One',
        state: NovelState.ONGOING,
      };
      const updatedAt = new Date('2026-02-20T10:20:30.000Z');

      novelService.getChapter.mockResolvedValue({
        content: '# Chapter 2',
        createdAt: new Date('2026-02-19T00:00:00.000Z'),
        id: 'chapter2.md',
        novelId: 'novel-1',
        updatedAt,
      } as any);

      const result = await uut.lastChapterPublishedAt(novel);

      expect(result).toBe('2026-02-20T10:20:30.000Z');
      expect(novelService.getChapter).toHaveBeenCalledWith(
        'novel-1',
        'chapter2.md',
      );
    });

    it('should return null when there are no chapters', async () => {
      const novel: Novel = {
        author: 'Author',
        category: ['fantasy'],
        chapters: [],
        description: 'A novel description',
        id: 'novel-1',
        name: 'Novel One',
        state: NovelState.ONGOING,
      };

      const result = await uut.lastChapterPublishedAt(novel);

      expect(result).toBeNull();
      expect(novelService.getChapter).not.toHaveBeenCalled();
    });

    it('should return null when the last chapter cannot be found', async () => {
      const novel: Novel = {
        author: 'Author',
        category: ['fantasy'],
        chapters: ['chapter1.md', 'chapter2.md'],
        description: 'A novel description',
        id: 'novel-1',
        name: 'Novel One',
        state: NovelState.ONGOING,
      };

      novelService.getChapter.mockResolvedValue(null);

      const result = await uut.lastChapterPublishedAt(novel);

      expect(result).toBeNull();
      expect(novelService.getChapter).toHaveBeenCalledWith(
        'novel-1',
        'chapter2.md',
      );
    });
  });

  describe('lastPublishedChapter', () => {
    it('should return the last published chapter', async () => {
      const novel: Novel = {
        author: 'Author',
        category: ['fantasy'],
        chapters: ['chapter1.md', 'chapter2.md'],
        description: 'A novel description',
        id: 'novel-1',
        name: 'Novel One',
        state: NovelState.ONGOING,
      };
      const chapter = {
        content: '# Chapter 2',
        createdAt: new Date('2026-02-19T00:00:00.000Z'),
        id: 'chapter2.md',
        novelId: 'novel-1',
        updatedAt: new Date('2026-02-20T10:20:30.000Z'),
      };
      novelService.getChapter.mockResolvedValue(chapter);

      const result = await uut.lastPublishedChapter(novel);

      expect(result).toEqual(chapter);
      expect(novelService.getChapter).toHaveBeenCalledWith(
        'novel-1',
        'chapter2.md',
      );
    });

    it('should return null when there are no chapters', async () => {
      const novel: Novel = {
        author: 'Author',
        category: ['fantasy'],
        chapters: [],
        description: 'A novel description',
        id: 'novel-1',
        name: 'Novel One',
        state: NovelState.ONGOING,
      };

      const result = await uut.lastPublishedChapter(novel);

      expect(result).toBeNull();
      expect(novelService.getChapter).not.toHaveBeenCalled();
    });
  });

  describe('firstChapter', () => {
    it('should return the first chapter', async () => {
      const novel: Novel = {
        author: 'Author',
        category: ['fantasy'],
        chapters: ['chapter1.md', 'chapter2.md'],
        description: 'A novel description',
        id: 'novel-1',
        name: 'Novel One',
        state: NovelState.ONGOING,
      };
      const chapter = {
        content: '# Chapter 1',
        createdAt: new Date('2026-02-18T00:00:00.000Z'),
        id: 'chapter1.md',
        novelId: 'novel-1',
        updatedAt: new Date('2026-02-18T00:00:00.000Z'),
      };
      novelService.getChapter.mockResolvedValue(chapter);

      const result = await uut.firstChapter(novel);

      expect(result).toEqual(chapter);
      expect(novelService.getChapter).toHaveBeenCalledWith(
        'novel-1',
        'chapter1.md',
      );
    });

    it('should return null when there are no chapters', async () => {
      const novel: Novel = {
        author: 'Author',
        category: ['fantasy'],
        chapters: [],
        description: 'A novel description',
        id: 'novel-1',
        name: 'Novel One',
        state: NovelState.ONGOING,
      };

      const result = await uut.firstChapter(novel);

      expect(result).toBeNull();
      expect(novelService.getChapter).not.toHaveBeenCalled();
    });
  });
});
