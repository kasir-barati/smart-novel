import { NotFoundException } from '@nestjs/common';
import { isString } from 'class-validator';

import type {
  IChapterRepository,
  INovelRepository,
} from '../interfaces';

import { NovelState } from '../enums';
import { Chapter, Novel } from '../types';
import { NovelService } from './novel.service';

describe(NovelService.name, () => {
  let uut: NovelService;
  let novelRepository: INovelRepository;
  let chapterRepository: IChapterRepository;

  beforeEach(() => {
    novelRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      getChapterList: vi.fn(),
      getCategories: vi.fn(),
    } as any;
    chapterRepository = {
      getChapter: vi.fn(),
    } as any;

    uut = new NovelService(novelRepository, chapterRepository);
  });

  describe('findOne', () => {
    it('should return a novel when id exists', async () => {
      const novel: Novel = {
        author: `Great Calamity Of Fire`,
        category: [
          'action',
          'comedy',
          'fantasy',
          'horror',
          'mystery',
          'psychological',
          'supernatural',
        ],
        description: `Lin Jie is the owner of a bookstore in another world. He's kind and warm-hearted, often recommending healing books to customers who are going through a tough time. From time to time, he secretly promotes his own work too. Over time, these customers begin to respect him greatly, some even frequently bringing local specialties to repay his favor. They often seek his professional opinion when it comes to selecting books, and share their experiences with this ordinary bookstore owner to people around them. They respectfully and intimately refer to him using names such as the "Demon God's Lackey", "Propagator of the Flesh and Blood Gospel", "Corpse Devouring Sect's Rites and Customs' Author" and "Shepherd of the Stars".`,
        chapters: ['chapter1.md'],
        id: 'i-am-really-not-the-demon-gods-lackey',
        name: "I'm Really Not The Demon God's Lackey",
        state: NovelState.ONGOING,
      };
      vi.mocked(novelRepository.findById).mockResolvedValue(novel);

      const result = await uut.findOne('novel-1');

      expect(result).toEqual(novel);
      expect(novelRepository.findById).toHaveBeenCalledWith(
        'novel-1',
      );
    });

    it('should throw NotFoundException when id does not exist', async () => {
      vi.mocked(novelRepository.findById).mockResolvedValue(null);

      await expect(uut.findOne('missing-id')).rejects.toThrow(
        new NotFoundException('Novel with id missing-id not found'),
      );
    });
  });

  describe('getChapter', () => {
    it('should return chapter from repository', async () => {
      const chapter: Chapter = {
        content: '# Chapter 1',
        createdAt: new Date('2024-01-01').toISOString(),
        title: 'Chapter 1',
        id: 'chapter1.md',
        updatedAt: new Date('2024-01-02').toISOString(),
        novelId: 'novel-1',
      };
      vi.mocked(chapterRepository.getChapter).mockResolvedValue(
        chapter,
      );

      const result = await uut.getChapter('novel-1', 'chapter1.md');

      expect(result).toEqual(chapter);
      expect(chapterRepository.getChapter).toHaveBeenCalledWith(
        'novel-1',
        'chapter1.md',
      );
    });
  });

  describe('findAll', () => {
    it('should return all novels as edges when no filters or pagination are provided', async () => {
      const novels: Novel[] = [
        {
          author: 'Author 1',
          category: ['action', 'fantasy'],
          chapters: ['chapter1.md'],
          id: 'novel-1',
          name: 'Novel One',
          state: NovelState.ONGOING,
          description: 'Description for Novel One',
        },
        {
          author: 'Author 2',
          category: ['romance', 'drama'],
          chapters: ['chapter1.md'],
          id: 'novel-2',
          name: 'Novel Two',
          state: NovelState.FINISHED,
          description: 'Description for Novel Two',
        },
        {
          author: 'Author 3',
          category: ['action', 'mystery'],
          chapters: ['chapter1.md'],
          id: 'novel-3',
          name: 'Novel Three',
          state: NovelState.ONGOING,
          description: 'Description for Novel Three',
        },
      ];
      vi.mocked(novelRepository.findAll).mockResolvedValue(novels);

      const result = await uut.findAll();

      expect(result.edges).toHaveLength(3);
      expect(result.edges.map((edge) => edge.node.id)).toStrictEqual([
        'novel-1',
        'novel-2',
        'novel-3',
      ]);
      expect(result.pageInfo).toStrictEqual({
        endCursor: 'bm92ZWwtMw==',
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: 'bm92ZWwtMQ==',
      });
      expect(novelRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should apply category include and exclude filters', async () => {
      const novels: Novel[] = [
        {
          author: 'Author 1',
          category: ['action', 'fantasy'],
          chapters: ['chapter1.md'],
          id: 'novel-1',
          name: 'Novel One',
          state: NovelState.ONGOING,
          description: 'Description for Novel One',
        },
        {
          author: 'Author 2',
          category: ['romance', 'drama'],
          chapters: ['chapter1.md'],
          id: 'novel-2',
          name: 'Novel Two',
          state: NovelState.FINISHED,
          description: 'Description for Novel Two',
        },
        {
          author: 'Author 3',
          category: ['action', 'mystery'],
          chapters: ['chapter1.md'],
          id: 'novel-3',
          name: 'Novel Three',
          state: NovelState.ONGOING,
          description: 'Description for Novel Three',
        },
      ];
      vi.mocked(novelRepository.findAll).mockResolvedValue(novels);

      const result = await uut.findAll(
        undefined,
        undefined,
        undefined,
        undefined,
        {
          category: {
            in: ['action'],
            nin: ['mystery'],
          },
        },
      );

      expect(result.edges).toHaveLength(1);
      expect(result.edges[0].node.id).toBe('novel-1');
      expect(result.pageInfo).toStrictEqual({
        endCursor: 'bm92ZWwtMQ==',
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: 'bm92ZWwtMQ==',
      });
    });

    it('should paginate using after and first cursors', async () => {
      const novels: Novel[] = [
        {
          author: 'Author 1',
          category: ['action', 'fantasy'],
          chapters: ['chapter1.md'],
          id: 'novel-1',
          name: 'Novel One',
          state: NovelState.ONGOING,
          description: 'Description for Novel One',
        },
        {
          author: 'Author 2',
          category: ['romance', 'drama'],
          chapters: ['chapter1.md'],
          id: 'novel-2',
          name: 'Novel Two',
          state: NovelState.FINISHED,
          description: 'Description for Novel Two',
        },
        {
          author: 'Author 3',
          category: ['action', 'mystery'],
          chapters: ['chapter1.md'],
          id: 'novel-3',
          name: 'Novel Three',
          state: NovelState.ONGOING,
          description: 'Description for Novel Three',
        },
      ];
      vi.mocked(novelRepository.findAll).mockResolvedValue(novels);
      const afterCursor = 'bm92ZWwtMQ=='; // Base64 for 'novel-1'

      const result = await uut.findAll(1, undefined, afterCursor);

      expect(result.edges).toHaveLength(1);
      expect(result.edges[0].node.id).toBe('novel-2');
      expect(result.pageInfo).toStrictEqual({
        endCursor: 'bm92ZWwtMg==', // Base64 for 'novel-2'
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: 'bm92ZWwtMg==', // Base64 for 'novel-2'
      });
    });
  });

  describe('getNextChapter', () => {
    it('should return the next chapter when current chapter exists', async () => {
      const nextChapter: Chapter = {
        content: '# Chapter 2',
        createdAt: new Date('2024-01-03').toISOString(),
        title: 'Chapter 2',
        id: 'chapter2.md',
        updatedAt: new Date('2024-01-04').toISOString(),
        novelId: 'novel-1',
      };
      vi.mocked(novelRepository.getChapterList).mockResolvedValue([
        'chapter1.md',
        'chapter2.md',
      ]);
      vi.mocked(chapterRepository.getChapter).mockResolvedValue(
        nextChapter,
      );

      const result = await uut.getNextChapter(
        'novel-1',
        'chapter1.md',
      );

      expect(result).toStrictEqual(nextChapter);
      expect(novelRepository.getChapterList).toHaveBeenCalledWith(
        'novel-1',
      );
      expect(chapterRepository.getChapter).toHaveBeenCalledWith(
        'novel-1',
        'chapter2.md',
      );
    });

    it('should return null when current chapter does not exist', async () => {
      vi.mocked(novelRepository.getChapterList).mockResolvedValue([
        'chapter1.md',
        'chapter2.md',
      ]);

      const result = await uut.getNextChapter(
        'novel-1',
        'missing-chapter.md',
      );

      expect(result).toBeNull();
      expect(novelRepository.getChapterList).toHaveBeenCalledWith(
        'novel-1',
      );
      expect(chapterRepository.getChapter).not.toHaveBeenCalled();
    });

    it('should return null when current chapter is the last chapter', async () => {
      vi.mocked(novelRepository.getChapterList).mockResolvedValue([
        'chapter1.md',
        'chapter2.md',
      ]);

      const result = await uut.getNextChapter(
        'novel-1',
        'chapter2.md',
      );

      expect(result).toBeNull();
      expect(novelRepository.getChapterList).toHaveBeenCalledWith(
        'novel-1',
      );
      expect(chapterRepository.getChapter).not.toHaveBeenCalled();
    });
  });

  describe('getPreviousChapter', () => {
    it('should return the previous chapter when current chapter exists', async () => {
      const previousChapter: Chapter = {
        content: '# Chapter 1',
        createdAt: new Date('2024-01-01').toISOString(),
        title: 'Chapter 1',
        id: 'chapter1.md',
        updatedAt: new Date('2024-01-02').toISOString(),
        novelId: 'novel-1',
      };
      vi.mocked(novelRepository.getChapterList).mockResolvedValue([
        'chapter1.md',
        'chapter2.md',
      ]);
      vi.mocked(chapterRepository.getChapter).mockResolvedValue(
        previousChapter,
      );

      const result = await uut.getPreviousChapter(
        'novel-1',
        'chapter2.md',
      );

      expect(result).toStrictEqual(previousChapter);
      expect(novelRepository.getChapterList).toHaveBeenCalledWith(
        'novel-1',
      );
      expect(chapterRepository.getChapter).toHaveBeenCalledWith(
        'novel-1',
        'chapter1.md',
      );
    });

    it('should return null when current chapter does not exist', async () => {
      vi.mocked(novelRepository.getChapterList).mockResolvedValue([
        'chapter1.md',
        'chapter2.md',
      ]);

      const result = await uut.getPreviousChapter(
        'novel-1',
        'missing-chapter.md',
      );

      expect(result).toBeNull();
      expect(novelRepository.getChapterList).toHaveBeenCalledWith(
        'novel-1',
      );
      expect(chapterRepository.getChapter).not.toHaveBeenCalled();
    });

    it('should return null when current chapter is the first chapter', async () => {
      vi.mocked(novelRepository.getChapterList).mockResolvedValue([
        'chapter1.md',
        'chapter2.md',
      ]);

      const result = await uut.getPreviousChapter(
        'novel-1',
        'chapter1.md',
      );

      expect(result).toBeNull();
      expect(novelRepository.getChapterList).toHaveBeenCalledWith(
        'novel-1',
      );
      expect(chapterRepository.getChapter).not.toHaveBeenCalled();
    });
  });

  describe('getCategories', () => {
    it('should return categories from repository', async () => {
      const categories = [
        'fantasy',
        'action',
        'adventure',
        'romance',
        'mystery',
      ];
      vi.mocked(novelRepository.getCategories).mockResolvedValue(
        categories,
      );

      const result = await uut.getCategories();

      expect(result).toIncludeSameMembers(categories);
      expect(novelRepository.getCategories).toHaveBeenCalledOnce();
    });

    it('should return an array of strings', async () => {
      const categories = ['fantasy', 'sci-fi', 'horror'];
      vi.mocked(novelRepository.getCategories).mockResolvedValue(
        categories,
      );

      const result = await uut.getCategories();

      expect(result).toBeArray();
      expect(result).toSatisfyAll(isString);
    });
  });
});
