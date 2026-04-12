import { PrismaService } from '../../prisma';
import { NovelState } from '../enums';
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
          ownerId: '230104087265432001',
          coverUrl: 'https://example.com/cover.jpg',
          category: ['fantasy', 'adventure'],
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

    it('should propagate the error when database fails', async () => {
      vi.mocked(prismaService.novel.findMany).mockRejectedValue(
        new Error('Database connection failed'),
      );

      const result = uut.findAll();

      await expect(result).rejects.toThrow(
        'Database connection failed',
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

    it('should propagate the error when database fails', async () => {
      vi.mocked(prismaService.chapter.findMany).mockRejectedValue(
        new Error('Database error'),
      );

      const result = uut.getChapterList(
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
