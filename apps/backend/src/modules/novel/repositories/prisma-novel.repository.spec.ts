import { NarrationStatus } from '@prisma/client';
import {
  CorrelationIdService,
  CustomLoggerService,
} from 'nestjs-backend-common';

import { PrismaService } from '../../prisma';
import { NovelState } from '../enums';
import { PrismaNovelRepository } from './prisma-novel.repository';

describe(PrismaNovelRepository.name, () => {
  let uut: PrismaNovelRepository;
  let prismaService: PrismaService;
  let logger: CustomLoggerService;
  let correlationIdService: CorrelationIdService;
  const mockCorrelationId = '8180f8fc-73f4-47e2-bf79-d637c54e5d67';

  beforeEach(async () => {
    // Mock PrismaService with all required methods
    prismaService = {
      novel: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
      chapter: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      category: {
        findMany: vi.fn(),
      },
    } as any;

    // Mock logger
    logger = {
      error: vi.fn(),
      log: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    } as any;

    // Mock correlation ID service
    correlationIdService = {
      correlationId: mockCorrelationId,
    } as any;

    uut = new PrismaNovelRepository(
      prismaService,
      logger,
      correlationIdService,
    );
  });

  describe('findAll', () => {
    it('should return all novels with transformed data', async () => {
      const { novel } = getMockedData();
      vi.mocked(prismaService.novel.findMany).mockResolvedValue([
        novel,
      ] as any);

      const result = await uut.findAll();

      expect(result).toEqual([
        {
          id: '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
          name: 'Test Novel',
          author: 'John Doe',
          description: 'A test novel description',
          state: NovelState.ONGOING,
          coverUrl: 'https://example.com/cover.jpg',
          category: ['fantasy', 'adventure'],
          chapters: [
            'bb563ad5-1ac4-46c2-a25f-6f62d245f44c',
            '904bf826-33be-4172-b63f-665bba9007b9',
          ],
        },
      ]);
      expect(prismaService.novel.findMany).toHaveBeenCalledWith({
        include: {
          categories: {
            select: {
              category: {
                select: { name: true },
              },
            },
          },
          chapters: {
            select: { id: true },
            orderBy: { chapterNumber: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      });
    });

    it('should return empty array when no novels exist', async () => {
      vi.mocked(prismaService.novel.findMany).mockResolvedValue([]);

      const result = await uut.findAll();

      expect(result).toEqual([]);
    });

    it('should handle novels with null coverUrl', async () => {
      const { novel } = getMockedData();
      const novelWithoutCover = {
        ...novel,
        coverUrl: null,
      };
      vi.mocked(prismaService.novel.findMany).mockResolvedValue([
        novelWithoutCover,
      ] as any);

      const result = await uut.findAll();

      expect(result[0].coverUrl).toBeUndefined();
    });

    it('should log error and throw when database fails', async () => {
      const error = new Error('Database connection failed');
      vi.mocked(prismaService.novel.findMany).mockRejectedValue(
        error,
      );

      const res = uut.findAll();

      await expect(res).rejects.toThrow('Failed to read novels');
      expect(logger.error).toHaveBeenCalledWith(
        `Error reading novels: ${error}`,
        { correlationId: mockCorrelationId },
      );
    });
  });

  describe('findById', () => {
    it('should return novel by id with transformed data', async () => {
      const { novel } = getMockedData();
      vi.mocked(prismaService.novel.findUnique).mockResolvedValue(
        novel as any,
      );

      const result = await uut.findById(
        '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
      );

      expect(result).toEqual({
        id: '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
        name: 'Test Novel',
        author: 'John Doe',
        description: 'A test novel description',
        state: NovelState.ONGOING,
        coverUrl: 'https://example.com/cover.jpg',
        category: ['fantasy', 'adventure'],
        chapters: [
          'bb563ad5-1ac4-46c2-a25f-6f62d245f44c',
          '904bf826-33be-4172-b63f-665bba9007b9',
        ],
      });
      expect(prismaService.novel.findUnique).toHaveBeenCalledWith({
        where: { id: '248c9fee-cad0-43fc-9abb-c2ab8ff002ec' },
        include: {
          categories: {
            select: {
              category: {
                select: { name: true },
              },
            },
          },
          chapters: {
            select: { id: true },
            orderBy: { chapterNumber: 'asc' },
          },
        },
      });
    });

    it('should return null when novel is not found', async () => {
      vi.mocked(prismaService.novel.findUnique).mockResolvedValue(
        null,
      );

      const result = await uut.findById('non-existent');

      expect(result).toBeNull();
    });

    it('should return null and log error when database fails', async () => {
      const error = new Error('Database error');
      vi.mocked(prismaService.novel.findUnique).mockRejectedValue(
        error,
      );

      const result = await uut.findById(
        '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
      );

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        `Error reading novel 248c9fee-cad0-43fc-9abb-c2ab8ff002ec: ${error}`,
        { correlationId: mockCorrelationId },
      );
    });
  });

  describe('getChapter', () => {
    it('should return chapter by novelId and chapterId', async () => {
      const { chapter } = getMockedData();
      vi.mocked(prismaService.chapter.findFirst).mockResolvedValue(
        chapter as any,
      );

      const result = await uut.getChapter(
        '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
        'bb563ad5-1ac4-46c2-a25f-6f62d245f44c',
      );

      expect(result).toEqual({
        id: 'bb563ad5-1ac4-46c2-a25f-6f62d245f44c',
        novelId: '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
        title: 'Chapter 1: The Beginning',
        content: '# Chapter 1\n\nThis is the content.',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
        narrationStatus: NarrationStatus.READY,
        narrationUrl: 'https://example.com/narration.mp3',
      });
      expect(prismaService.chapter.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'bb563ad5-1ac4-46c2-a25f-6f62d245f44c',
          novelId: '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
        },
      });
    });

    it('should return null when chapter is not found', async () => {
      vi.mocked(prismaService.chapter.findFirst).mockResolvedValue(
        null,
      );

      const result = await uut.getChapter(
        '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
        'non-existent-uuid',
      );

      expect(result).toBeNull();
    });

    it('should handle chapter with null narrationUrl and narrationStatus', async () => {
      const { chapter } = getMockedData();
      const chapterWithoutNarration = {
        ...chapter,
        narrationStatus: null,
        narrationUrl: null,
      };
      vi.mocked(prismaService.chapter.findFirst).mockResolvedValue(
        chapterWithoutNarration as any,
      );

      const result = await uut.getChapter(
        '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
        'bb563ad5-1ac4-46c2-a25f-6f62d245f44c',
      );

      expect(result?.narrationStatus).toBeNull();
      expect(result?.narrationUrl).toBeUndefined();
    });

    it('should return null and log error when database fails', async () => {
      const error = new Error('Database error');
      vi.mocked(prismaService.chapter.findFirst).mockRejectedValue(
        error,
      );

      const result = await uut.getChapter(
        '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
        'bb563ad5-1ac4-46c2-a25f-6f62d245f44c',
      );

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        `Error reading chapter bb563ad5-1ac4-46c2-a25f-6f62d245f44c: ${error}`,
        { correlationId: mockCorrelationId },
      );
    });
  });

  describe('getChapterById', () => {
    it('should return chapter by id only', async () => {
      const { chapter } = getMockedData();
      vi.mocked(prismaService.chapter.findFirst).mockResolvedValue(
        chapter as any,
      );

      const result = await uut.getChapterById(
        'bb563ad5-1ac4-46c2-a25f-6f62d245f44c',
      );

      expect(result).toEqual({
        id: 'bb563ad5-1ac4-46c2-a25f-6f62d245f44c',
        novelId: '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
        title: 'Chapter 1: The Beginning',
        content: '# Chapter 1\n\nThis is the content.',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
        narrationStatus: NarrationStatus.READY,
        narrationUrl: 'https://example.com/narration.mp3',
      });
      expect(prismaService.chapter.findFirst).toHaveBeenCalledWith({
        where: { id: 'bb563ad5-1ac4-46c2-a25f-6f62d245f44c' },
      });
    });

    it('should return null when chapter is not found', async () => {
      vi.mocked(prismaService.chapter.findFirst).mockResolvedValue(
        null,
      );

      const result = await uut.getChapterById('non-existent-uuid');

      expect(result).toBeNull();
    });
  });

  describe('getChapterList', () => {
    it('should return array of chapter IDs for a novel', async () => {
      const mockChapters = [
        { id: 'bb563ad5-1ac4-46c2-a25f-6f62d245f44c' },
        { id: '904bf826-33be-4172-b63f-665bba9007b9' },
        { id: '041be636-8bd3-44b4-a22c-29703b2b63e5' },
      ];
      vi.mocked(prismaService.chapter.findMany).mockResolvedValue(
        mockChapters as any,
      );

      const result = await uut.getChapterList(
        '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
      );

      expect(result).toEqual([
        'bb563ad5-1ac4-46c2-a25f-6f62d245f44c',
        '904bf826-33be-4172-b63f-665bba9007b9',
        '041be636-8bd3-44b4-a22c-29703b2b63e5',
      ]);
      expect(prismaService.chapter.findMany).toHaveBeenCalledWith({
        where: { novelId: '248c9fee-cad0-43fc-9abb-c2ab8ff002ec' },
        select: { id: true },
        orderBy: { chapterNumber: 'asc' },
      });
    });

    it('should return empty array when novel has no chapters', async () => {
      vi.mocked(prismaService.chapter.findMany).mockResolvedValue([]);

      const result = await uut.getChapterList(
        '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
      );

      expect(result).toEqual([]);
    });

    it('should return empty array and log error when database fails', async () => {
      const error = new Error('Database error');
      vi.mocked(prismaService.chapter.findMany).mockRejectedValue(
        error,
      );

      const result = await uut.getChapterList(
        '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
      );

      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalledWith(
        `Error reading chapter list for 248c9fee-cad0-43fc-9abb-c2ab8ff002ec: ${error}`,
        { correlationId: mockCorrelationId },
      );
    });
  });

  describe('getCategories', () => {
    it('should return lowercased category names', async () => {
      const mockCategories = [
        { name: 'Fantasy' },
        { name: 'Adventure' },
        { name: 'SCI-FI' },
      ];
      vi.mocked(prismaService.category.findMany).mockResolvedValue(
        mockCategories as any,
      );

      const result = await uut.getCategories();

      expect(result).toEqual(['fantasy', 'adventure', 'sci-fi']);
      expect(prismaService.category.findMany).toHaveBeenCalledWith({
        select: { name: true },
        orderBy: { name: 'asc' },
      });
    });

    it('should return empty array when no categories exist', async () => {
      vi.mocked(prismaService.category.findMany).mockResolvedValue(
        [],
      );

      const result = await uut.getCategories();

      expect(result).toEqual([]);
    });

    it('should return empty array and log error when database fails', async () => {
      const error = new Error('Database error');
      vi.mocked(prismaService.category.findMany).mockRejectedValue(
        error,
      );

      const result = await uut.getCategories();

      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalledWith(
        `Error reading categories: ${error}`,
        { correlationId: mockCorrelationId },
      );
    });
  });

  describe('updateChapterNarrationUrl', () => {
    it('should update chapter narration url', async () => {
      const { chapter } = getMockedData();
      vi.mocked(prismaService.chapter.update).mockResolvedValue({
        ...chapter,
        narrationUrl:
          'http://localhost:9000/smart-novel/narrations/chapter-a3987a2f-eaa5-4a05-8714-34a110511cba.mp3',
      } as any);

      await uut.updateChapterNarrationUrl(
        'bb563ad5-1ac4-46c2-a25f-6f62d245f44c',
        'http://localhost:9000/smart-novel/narrations/chapter-a3987a2f-eaa5-4a05-8714-34a110511cba.mp3',
      );

      expect(prismaService.chapter.update).toHaveBeenCalledWith({
        where: { id: 'bb563ad5-1ac4-46c2-a25f-6f62d245f44c' },
        data: {
          narrationUrl:
            'http://localhost:9000/smart-novel/narrations/chapter-a3987a2f-eaa5-4a05-8714-34a110511cba.mp3',
        },
      });
    });
  });

  describe('updateNarrationStatus', () => {
    it('should update chapter narration status', async () => {
      const { chapter } = getMockedData();
      vi.mocked(prismaService.chapter.update).mockResolvedValue({
        ...chapter,
        narrationStatus: NarrationStatus.PROCESSING,
      } as any);

      await uut.updateNarrationStatus(
        'bb563ad5-1ac4-46c2-a25f-6f62d245f44c',
        NarrationStatus.PROCESSING,
      );

      expect(prismaService.chapter.update).toHaveBeenCalledWith({
        where: { id: 'bb563ad5-1ac4-46c2-a25f-6f62d245f44c' },
        data: { narrationStatus: NarrationStatus.PROCESSING },
      });
    });

    it('should update narration status to FAILED', async () => {
      const { chapter } = getMockedData();
      const mockUpdatedChapter = {
        ...chapter,
        narrationStatus: NarrationStatus.FAILED,
      };
      vi.mocked(prismaService.chapter.update).mockResolvedValue(
        mockUpdatedChapter as any,
      );

      await uut.updateNarrationStatus(
        'bb563ad5-1ac4-46c2-a25f-6f62d245f44c',
        NarrationStatus.FAILED,
      );

      expect(prismaService.chapter.update).toHaveBeenCalledWith({
        where: { id: 'bb563ad5-1ac4-46c2-a25f-6f62d245f44c' },
        data: { narrationStatus: NarrationStatus.FAILED },
      });
    });
  });

  describe('updateChapterNarrationComplete', () => {
    it('should update chapter narration when status is PROCESSING', async () => {
      vi.mocked(prismaService.chapter.updateMany).mockResolvedValue({
        count: 1,
      } as any);

      const result = await uut.updateChapterNarrationComplete(
        'bb563ad5-1ac4-46c2-a25f-6f62d245f44c',
        'http://localhost:9000/smart-novel/narrations/chapter-a3987a2f-eaa5-4a05-8714-34a110511cba.mp3',
      );

      expect(result).toBe(1);
      expect(prismaService.chapter.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'bb563ad5-1ac4-46c2-a25f-6f62d245f44c',
          narrationStatus: NarrationStatus.PROCESSING,
        },
        data: {
          narrationUrl:
            'http://localhost:9000/smart-novel/narrations/chapter-a3987a2f-eaa5-4a05-8714-34a110511cba.mp3',
          narrationStatus: NarrationStatus.READY,
        },
      });
    });

    it('should return 0 when no chapters match the condition', async () => {
      vi.mocked(prismaService.chapter.updateMany).mockResolvedValue({
        count: 0,
      } as any);

      const result = await uut.updateChapterNarrationComplete(
        'bb563ad5-1ac4-46c2-a25f-6f62d245f44c',
        'http://localhost:9000/smart-novel/narrations/chapter-a3987a2f-eaa5-4a05-8714-34a110511cba.mp3',
      );

      expect(result).toBe(0);
    });
  });
});

function getMockedData() {
  const novel = {
    id: '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
    name: 'Test Novel',
    author: 'John Doe',
    description: 'A test novel description',
    state: 'ONGOING',
    coverUrl: 'https://example.com/cover.jpg',
    categories: [
      { category: { name: 'Fantasy' } },
      { category: { name: 'Adventure' } },
    ],
    chapters: [
      { id: 'bb563ad5-1ac4-46c2-a25f-6f62d245f44c' },
      { id: '904bf826-33be-4172-b63f-665bba9007b9' },
    ],
  };
  const chapter = {
    id: 'bb563ad5-1ac4-46c2-a25f-6f62d245f44c',
    novelId: '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
    title: 'Chapter 1: The Beginning',
    content: '# Chapter 1\n\nThis is the content.',
    chapterNumber: 1,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
    narrationStatus: 'READY',
    narrationUrl: 'https://example.com/narration.mp3',
  };

  return { novel, chapter };
}
