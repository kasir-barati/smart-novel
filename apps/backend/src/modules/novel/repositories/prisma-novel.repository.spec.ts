import { NovelState } from '@prisma/client';

import { PrismaService } from '../../prisma';
import { PrismaNovelRepository } from './prisma-novel.repository';

describe(PrismaNovelRepository.name, () => {
  let uut: PrismaNovelRepository;
  let prismaService: PrismaService;

  beforeEach(async () => {
    // Mock PrismaService with all required methods
    prismaService = {
      novel: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
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

    uut = new PrismaNovelRepository(prismaService);
  });

  describe('findNovelsConnection', () => {
    it('should return novels when no filters or pagination are provided', async () => {
      const { novel } = getMockedData();
      vi.mocked(prismaService.novel.findMany).mockResolvedValue([
        novel,
      ] as any);

      const result = await uut.findNovelsConnection({});

      expect(result).toEqual({
        items: [
          {
            id: '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
            name: 'Test Novel',
            author: 'John Doe',
            description: 'A test novel description',
            state: NovelState.ONGOING,
            ownerId: '230104087265432001',
            coverUrl: 'https://example.com/cover.jpg',
            category: ['fantasy', 'adventure'],
          },
        ],
        hasMore: false,
      });
      expect(prismaService.novel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          orderBy: { name: 'asc' },
        }),
      );
    });

    it('should return empty result when no novels exist', async () => {
      vi.mocked(prismaService.novel.findMany).mockResolvedValue([]);

      const result = await uut.findNovelsConnection({});

      expect(result).toEqual({ items: [], hasMore: false });
    });

    it('should handle novels with null coverUrl', async () => {
      const { novel } = getMockedData();
      const novelWithoutCover = { ...novel, coverUrl: null };
      vi.mocked(prismaService.novel.findMany).mockResolvedValue([
        novelWithoutCover,
      ] as any);

      const result = await uut.findNovelsConnection({});

      expect(result.items[0].coverUrl).toBeUndefined();
    });

    it('should apply categoryIn filter', async () => {
      vi.mocked(prismaService.novel.findMany).mockResolvedValue([]);

      await uut.findNovelsConnection({
        filters: { categoryIn: ['Fantasy'] },
      });

      expect(prismaService.novel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            categories: {
              some: {
                category: {
                  name: { in: ['Fantasy'], mode: 'insensitive' },
                },
              },
            },
          },
        }),
      );
    });

    it('should apply categoryNin filter', async () => {
      vi.mocked(prismaService.novel.findMany).mockResolvedValue(
        [] as any,
      );

      await uut.findNovelsConnection({
        filters: { categoryNin: ['Horror'] },
      });

      expect(prismaService.novel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            NOT: {
              categories: {
                some: {
                  category: {
                    name: { in: ['Horror'], mode: 'insensitive' },
                  },
                },
              },
            },
          },
        }),
      );
    });

    it('should apply forward pagination with first and after', async () => {
      const { novel } = getMockedData();
      vi.mocked(prismaService.novel.findMany).mockResolvedValue([
        novel,
      ] as any);
      const afterCursor = Buffer.from(
        '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
      ).toString('base64');

      await uut.findNovelsConnection({
        pagination: { first: 10, after: afterCursor },
      });

      expect(prismaService.novel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { id: '248c9fee-cad0-43fc-9abb-c2ab8ff002ec' },
          skip: 1,
          take: 11,
        }),
      );
    });

    it('should propagate the error when database fails', async () => {
      vi.mocked(prismaService.novel.findMany).mockRejectedValue(
        new Error('Database connection failed'),
      );

      const result = uut.findNovelsConnection({});

      await expect(result).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('countNovels', () => {
    it('should return count with no filters', async () => {
      vi.mocked(prismaService.novel.count).mockResolvedValue(5);

      const result = await uut.countNovels();

      expect(result).toBe(5);
      expect(prismaService.novel.count).toHaveBeenCalledWith({
        where: {},
      });
    });

    it('should apply categoryIn filter', async () => {
      vi.mocked(prismaService.novel.count).mockResolvedValue(2);

      await uut.countNovels({ categoryIn: ['Fantasy'] });

      expect(prismaService.novel.count).toHaveBeenCalledWith({
        where: {
          categories: {
            some: {
              category: {
                name: { in: ['Fantasy'], mode: 'insensitive' },
              },
            },
          },
        },
      });
    });

    it('should apply categoryNin filter', async () => {
      vi.mocked(prismaService.novel.count).mockResolvedValue(3);

      await uut.countNovels({ categoryNin: ['Horror'] });

      expect(prismaService.novel.count).toHaveBeenCalledWith({
        where: {
          NOT: {
            categories: {
              some: {
                category: {
                  name: { in: ['Horror'], mode: 'insensitive' },
                },
              },
            },
          },
        },
      });
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
        ownerId: '230104087265432001',
        coverUrl: 'https://example.com/cover.jpg',
        category: ['fantasy', 'adventure'],
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

    it('should propagate the error when database fails', async () => {
      vi.mocked(prismaService.novel.findUnique).mockRejectedValue(
        new Error('Database error'),
      );

      const result = uut.findById(
        '248c9fee-cad0-43fc-9abb-c2ab8ff002ec',
      );

      await expect(result).rejects.toThrow('Database error');
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

    it('should propagate the error when database fails', async () => {
      vi.mocked(prismaService.category.findMany).mockRejectedValue(
        new Error('Database error'),
      );

      const result = uut.getCategories();

      await expect(result).rejects.toThrow('Database error');
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
    ownerId: '230104087265432001',
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
