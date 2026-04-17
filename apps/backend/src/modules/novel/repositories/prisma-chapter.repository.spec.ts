import { NarrationStatus } from '@prisma/client';

import { OrderDirection } from '../../../shared';
import { PrismaService } from '../../prisma';
import { ChapterOrderField } from '../enums';
import { PrismaChapterRepository } from './prisma-chapter.repository';

describe(PrismaChapterRepository.name, () => {
  let uut: PrismaChapterRepository;
  let prismaService: PrismaService;

  beforeEach(async () => {
    prismaService = {
      novel: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
      chapter: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      category: {
        findMany: vi.fn(),
      },
    } as any;

    uut = new PrismaChapterRepository(prismaService);
  });

  describe('findById', () => {
    it('should return chapter by id with contentId but without content', async () => {
      const { chapter } = getMockedData();
      vi.mocked(prismaService.chapter.findFirst).mockResolvedValue(
        chapter as any,
      );

      const result = await uut.findById(chapter.id);

      expect(result).toEqual({
        id: chapter.id,
        novelId: chapter.novelId,
        contentId: chapter.contentId,
        title: chapter.title,
        chapterNumber: chapter.chapterNumber,
        createdAt: chapter.createdAt.toISOString(),
        updatedAt: chapter.updatedAt.toISOString(),
        narrationStatus: chapter.narrationStatus,
        narrationUrl: chapter.narrationUrl,
      });
      expect(prismaService.chapter.findFirst).toHaveBeenCalledWith({
        where: { id: chapter.id },
      });
    });

    it('should return null when chapter is not found', async () => {
      vi.mocked(prismaService.chapter.findFirst).mockResolvedValue(
        null,
      );

      const result = await uut.findById('non-existent-uuid');

      expect(result).toBeNull();
    });

    it('should throw when database fails', async () => {
      const error = new Error('Database error');
      vi.mocked(prismaService.chapter.findFirst).mockRejectedValue(
        error,
      );

      const result = uut.findById(
        '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
      );

      await expect(result).rejects.toThrowError(error);
    });
  });

  describe('getChapter', () => {
    it('should return chapter by novelId and chapterId', async () => {
      const { chapter } = getMockedData();
      vi.mocked(prismaService.chapter.findFirst).mockResolvedValue(
        chapter as any,
      );
      const novelId = '248c9fee-cad0-43fc-9abb-c2ab8ff002ec';

      const result = await uut.getChapter(novelId, chapter.id);

      expect(result).toEqual({
        id: chapter.id,
        novelId,
        contentId: 'ccc63ad5-1ac4-46c2-a25f-6f62d245f44c',
        title: 'Chapter 1: The Beginning',
        chapterNumber: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
        narrationStatus: NarrationStatus.READY,
        narrationUrl: 'https://example.com/narration.mp3',
      });
      expect(prismaService.chapter.findFirst).toHaveBeenCalledWith({
        where: {
          id: chapter.id,
          novelId,
        },
      });
    });

    it('should return null when chapter is not found', async () => {
      vi.mocked(prismaService.chapter.findFirst).mockResolvedValue(
        null,
      );
      const novelId = '248c9fee-cad0-43fc-9abb-c2ab8ff002ec';
      const chapterId = 'non-existent-uuid';

      const result = await uut.getChapter(novelId, chapterId);

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
      const novelId = '248c9fee-cad0-43fc-9abb-c2ab8ff002ec';

      const result = await uut.getChapter(novelId, chapter.id);

      expect(result?.narrationStatus).toBeNull();
      expect(result?.narrationUrl).toBeUndefined();
    });

    it('should throw when database fails', async () => {
      const error = new Error('Database error');
      vi.mocked(prismaService.chapter.findFirst).mockRejectedValue(
        error,
      );

      const result = uut.getChapter(
        '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
        'bb563ad5-1ac4-46c2-a25f-6f62d245f44c',
      );

      await expect(result).rejects.toThrowError(error);
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
        chapter.id,
        'http://localhost:9000/smart-novel/narrations/chapter-a3987a2f-eaa5-4a05-8714-34a110511cba.mp3',
      );

      expect(prismaService.chapter.update).toHaveBeenCalledWith({
        where: { id: chapter.id },
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
        chapter.id,
        NarrationStatus.PROCESSING,
      );

      expect(prismaService.chapter.update).toHaveBeenCalledWith({
        where: { id: chapter.id },
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
        chapter.id,
        NarrationStatus.FAILED,
      );

      expect(prismaService.chapter.update).toHaveBeenCalledWith({
        where: { id: chapter.id },
        data: { narrationStatus: NarrationStatus.FAILED },
      });
    });
  });

  describe('updateChapterNarrationComplete', () => {
    it('should update chapter narration when status is PROCESSING', async () => {
      const chapterId = 'bb563ad5-1ac4-46c2-a25f-6f62d245f44c';
      vi.mocked(prismaService.chapter.updateMany).mockResolvedValue({
        count: 1,
      } as any);

      const result = await uut.updateChapterNarrationComplete(
        chapterId,
        'http://localhost:9000/smart-novel/narrations/chapter-a3987a2f-eaa5-4a05-8714-34a110511cba.mp3',
      );

      expect(result).toBe(1);
      expect(prismaService.chapter.updateMany).toHaveBeenCalledWith({
        where: {
          id: chapterId,
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
      const chapterId = 'bb563ad5-1ac4-46c2-a25f-6f62d245f44c';
      vi.mocked(prismaService.chapter.updateMany).mockResolvedValue({
        count: 0,
      } as any);

      const result = await uut.updateChapterNarrationComplete(
        chapterId,
        'http://localhost:9000/smart-novel/narrations/chapter-a3987a2f-eaa5-4a05-8714-34a110511cba.mp3',
      );

      expect(result).toBe(0);
    });
  });

  describe('findChaptersConnection', () => {
    it('should return chapters with default ordering by chapterNumber ASC', async () => {
      const { chapter, chapter2 } = getMockedData();
      vi.mocked(prismaService.chapter.findMany).mockResolvedValue([
        chapter,
        chapter2,
      ] as any);

      const result = await uut.findChaptersConnection({
        novelId: chapter.novelId,
      });

      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe(chapter.id);
      expect(result.items[1].id).toBe(chapter2.id);
      expect(prismaService.chapter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            novelId: chapter.novelId,
          },
          orderBy: { chapterNumber: 'asc' },
        }),
      );
    });

    it('should apply narrationStatus filter', async () => {
      vi.mocked(prismaService.chapter.findMany).mockResolvedValue(
        [] as any,
      );

      await uut.findChaptersConnection({
        novelId: '86537331-b426-4081-aa4e-e58daf533a97',
        filters: { narrationStatus: NarrationStatus.READY },
      });

      expect(prismaService.chapter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            novelId: '86537331-b426-4081-aa4e-e58daf533a97',
            narrationStatus: NarrationStatus.READY,
          },
        }),
      );
    });

    it('should order by createdAt DESC when specified', async () => {
      vi.mocked(prismaService.chapter.findMany).mockResolvedValue(
        [] as any,
      );

      await uut.findChaptersConnection({
        novelId: '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
        orderByField: ChapterOrderField.CREATED_AT,
        orderByDirection: OrderDirection.DESC,
      });

      expect(prismaService.chapter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should apply forward pagination with first and after', async () => {
      const { chapter2 } = getMockedData();
      vi.mocked(prismaService.chapter.findMany).mockResolvedValue([
        chapter2,
      ] as any);
      const afterCursor =
        'YmI1NjNhZDUtMWFjNC00NmMyLWEyNWYtNmY2MmQyNDVmNDRj'; // Base64 for 'bb563ad5-1ac4-46c2-a25f-6f62d245f44c'

      const result = await uut.findChaptersConnection({
        novelId: '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
        pagination: { first: 10, after: afterCursor },
      });

      expect(result.items).toHaveLength(1);
      expect(prismaService.chapter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { id: 'bb563ad5-1ac4-46c2-a25f-6f62d245f44c' },
          skip: 1,
          take: 11,
        }),
      );
    });

    it('should trim extra record and signal hasMore when chapters exceed take', async () => {
      const { chapter, chapter2, chapter3 } = getMockedData();
      vi.mocked(prismaService.chapter.findMany).mockResolvedValue([
        chapter,
        chapter2,
        chapter3,
      ] as any);

      const result = await uut.findChaptersConnection({
        novelId: '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
        pagination: { first: 2 },
      });

      expect(result.items).toHaveLength(2);
      expect(result.hasMore).toBe(true);
      expect(result.items[0].id).toBe(chapter.id);
      expect(result.items[1].id).toBe(chapter2.id);
    });

    it('should return empty result when novel has no chapters', async () => {
      vi.mocked(prismaService.chapter.findMany).mockResolvedValue(
        [] as any,
      );

      const result = await uut.findChaptersConnection({
        novelId: '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
      });

      expect(result.items).toHaveLength(0);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('countChapters', () => {
    it('should return count with no filters', async () => {
      vi.mocked(prismaService.chapter.count).mockResolvedValue(5);

      const result = await uut.countChapters(
        '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
      );

      expect(result).toBe(5);
      expect(prismaService.chapter.count).toHaveBeenCalledWith({
        where: { novelId: '248c9fee-cad0-43fc-9abb-c2ab8ff002ec' },
      });
    });

    it('should apply narrationStatus filter', async () => {
      vi.mocked(prismaService.chapter.count).mockResolvedValue(2);

      await uut.countChapters(
        '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
        { narrationStatus: NarrationStatus.READY },
      );

      expect(prismaService.chapter.count).toHaveBeenCalledWith({
        where: {
          novelId: '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
          narrationStatus: NarrationStatus.READY,
        },
      });
    });
  });

  describe('getFirstChapter', () => {
    it('should return the first chapter ordered by chapterNumber ASC', async () => {
      const { chapter } = getMockedData();
      vi.mocked(prismaService.chapter.findFirst).mockResolvedValue(
        chapter as any,
      );

      const result = await uut.getFirstChapter(chapter.novelId);

      expect(result).toEqual({
        id: chapter.id,
        novelId: chapter.novelId,
        contentId: chapter.contentId,
        title: chapter.title,
        chapterNumber: chapter.chapterNumber,
        createdAt: chapter.createdAt.toISOString(),
        updatedAt: chapter.updatedAt.toISOString(),
        narrationStatus: chapter.narrationStatus,
        narrationUrl: 'https://example.com/narration.mp3',
      });
      expect(prismaService.chapter.findFirst).toHaveBeenCalledWith({
        where: {
          novelId: chapter.novelId,
        },
        orderBy: { chapterNumber: 'asc' },
      });
    });

    it('should return null when novel has no chapters', async () => {
      vi.mocked(prismaService.chapter.findFirst).mockResolvedValue(
        null,
      );

      const result = await uut.getFirstChapter(
        'non-existent-novel-id',
      );

      expect(result).toBeNull();
    });

    it('should throw when database fails', async () => {
      const error = new Error('Database error');
      vi.mocked(prismaService.chapter.findFirst).mockRejectedValue(
        error,
      );

      const result = uut.getFirstChapter(
        '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
      );

      await expect(result).rejects.toThrowError(error);
    });
  });

  describe('findManyBy', () => {
    it('should return chapters by IDs', async () => {
      const { chapter, chapter2 } = getMockedData();
      vi.mocked(prismaService.chapter.findMany).mockResolvedValue([
        chapter,
        chapter2,
      ] as any);
      const chapterIds = [chapter.id, chapter2.id];

      const result = await uut.findManyBy(chapterIds);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(chapter.id);
      expect(result[1].id).toBe(chapter2.id);
      expect(prismaService.chapter.findMany).toHaveBeenCalledWith({
        where: { id: { in: chapterIds } },
        select: {
          id: true,
          novelId: true,
          contentId: true,
          title: true,
          chapterNumber: true,
          narrationStatus: true,
          narrationUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should return empty array when no chapters found', async () => {
      vi.mocked(prismaService.chapter.findMany).mockResolvedValue([]);
      const chapterIds = ['non-existent-id'];

      const result = await uut.findManyBy(chapterIds);

      expect(result).toEqual([]);
    });

    it('should throw when database fails', async () => {
      const error = new Error('Database error');
      vi.mocked(prismaService.chapter.findMany).mockRejectedValue(
        error,
      );
      const chapterIds = ['bb563ad5-1ac4-46c2-a25f-6f62d245f44c'];

      const result = uut.findManyBy(chapterIds);

      await expect(result).rejects.toThrowError(error);
    });
  });

  describe('getLastChapter', () => {
    it('should return the last chapter ordered by chapterNumber DESC', async () => {
      const { chapter2 } = getMockedData();
      vi.mocked(prismaService.chapter.findFirst).mockResolvedValue(
        chapter2 as any,
      );

      const result = await uut.getLastChapter(
        '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
      );

      expect(result).toEqual({
        id: '904bf826-33be-4172-b63f-665bba9007b9',
        novelId: '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
        contentId: 'ddd63ad5-1ac4-46c2-a25f-6f62d245f44c',
        title: 'Chapter 2: The Journey',
        chapterNumber: 2,
        createdAt: '2024-01-03T00:00:00.000Z',
        updatedAt: '2024-01-04T00:00:00.000Z',
        narrationStatus: NarrationStatus.PROCESSING,
        narrationUrl: undefined,
      });
      expect(prismaService.chapter.findFirst).toHaveBeenCalledWith({
        where: {
          novelId: '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
        },
        orderBy: { chapterNumber: 'desc' },
      });
    });

    it('should return null when novel has no chapters', async () => {
      vi.mocked(prismaService.chapter.findFirst).mockResolvedValue(
        null,
      );

      const result = await uut.getLastChapter(
        '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
      );

      expect(result).toBeNull();
    });

    it('should throw when database fails', async () => {
      const error = new Error('Database error');
      vi.mocked(prismaService.chapter.findFirst).mockRejectedValue(
        error,
      );

      const result = uut.getLastChapter(
        '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
      );

      await expect(result).rejects.toThrowError(error);
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
    contentId: 'ccc63ad5-1ac4-46c2-a25f-6f62d245f44c',
    chapterNumber: 1,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
    narrationStatus: 'READY',
    narrationUrl: 'https://example.com/narration.mp3',
  };
  const chapter2 = {
    id: '904bf826-33be-4172-b63f-665bba9007b9',
    novelId: '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
    title: 'Chapter 2: The Journey',
    contentId: 'ddd63ad5-1ac4-46c2-a25f-6f62d245f44c',
    chapterNumber: 2,
    createdAt: new Date('2024-01-03T00:00:00Z'),
    updatedAt: new Date('2024-01-04T00:00:00Z'),
    narrationStatus: 'PROCESSING',
    narrationUrl: null,
  };
  const chapter3 = {
    id: '041be636-8bd3-44b4-a22c-29703b2b63e5',
    novelId: '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
    title: 'Chapter 3: The Return',
    contentId: 'eee63ad5-1ac4-46c2-a25f-6f62d245f44c',
    chapterNumber: 3,
    createdAt: new Date('2024-01-05T00:00:00Z'),
    updatedAt: new Date('2024-01-06T00:00:00Z'),
    narrationStatus: null,
    narrationUrl: null,
  };

  return { novel, chapter, chapter2, chapter3 };
}
