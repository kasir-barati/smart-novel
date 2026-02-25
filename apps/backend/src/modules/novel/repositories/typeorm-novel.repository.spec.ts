import {
  CorrelationIdService,
  CustomLoggerService,
} from 'nestjs-backend-common';
import { Repository } from 'typeorm';

import {
  CategoryEntity,
  ChapterEntity,
  NovelEntity,
} from '../entities';
import { NovelState } from '../enums';
import { TypeormNovelRepository } from './typeorm-novel.repository';

describe(TypeormNovelRepository.name, () => {
  let uut: TypeormNovelRepository;
  let novelRepository: jest.Mocked<Repository<NovelEntity>>;
  let chapterRepository: jest.Mocked<Repository<ChapterEntity>>;
  let categoryRepository: jest.Mocked<Repository<CategoryEntity>>;
  let logger: jest.Mocked<CustomLoggerService>;
  let correlationIdService: jest.Mocked<CorrelationIdService>;
  const mockCorrelationId = '582ba4f8-a500-4313-b8a1-9e680e55113c';

  beforeEach(() => {
    novelRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
    } as any;
    chapterRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
    } as any;
    categoryRepository = {
      find: jest.fn(),
    } as any;
    logger = {
      error: jest.fn(),
    } as any;
    correlationIdService = {
      correlationId: mockCorrelationId,
    } as any;

    uut = new TypeormNovelRepository(
      novelRepository,
      chapterRepository,
      categoryRepository,
      logger,
      correlationIdService,
    );
  });

  describe('findAll', () => {
    it('should return all novels successfully', async () => {
      // Arrange
      const mockNovels = [
        createMockNovelEntity(),
        createMockNovelEntity({
          id: 'novel-2',
          name: 'Another Novel',
          categories: [
            createMockCategoryEntity({ name: 'Science Fiction' }),
          ],
        }),
      ];
      novelRepository.find.mockResolvedValue(mockNovels);

      // Act
      const result = await uut.findAll();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'a8367566-5d30-4659-b8c5-42fd96492263',
        name: 'Test Novel',
        author: 'Test Author',
        description: 'A test novel description',
        state: NovelState.ONGOING,
        coverUrl: 'http://example.com/cover.jpg',
        category: ['fantasy'],
        chapters: ['77438da5-b825-493d-9cb5-4d4afa870bfa'],
      });
      expect(result[1]).toEqual({
        id: 'novel-2',
        name: 'Another Novel',
        author: 'Test Author',
        description: 'A test novel description',
        state: NovelState.ONGOING,
        coverUrl: 'http://example.com/cover.jpg',
        category: ['science fiction'],
        chapters: ['77438da5-b825-493d-9cb5-4d4afa870bfa'],
      });
      expect(novelRepository.find).toHaveBeenCalledWith({
        relations: ['categories', 'chapters'],
        order: { name: 'ASC' },
      });
    });

    it('should handle novels without categories or chapters', async () => {
      // Arrange
      const mockNovel = createMockNovelEntity({
        categories: [],
        chapters: [],
      });
      novelRepository.find.mockResolvedValue([mockNovel]);

      // Act
      const result = await uut.findAll();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].category).toEqual([]);
      expect(result[0].chapters).toEqual([]);
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      novelRepository.find.mockRejectedValue(error);

      // Act & Assert
      await expect(uut.findAll()).rejects.toThrow(
        'Failed to read novels',
      );
      expect(logger.error).toHaveBeenCalledWith(
        `Error reading novels: ${error}`,
        { correlationId: mockCorrelationId },
      );
    });
  });

  describe('findById', () => {
    const novelId = 'a8367566-5d30-4659-b8c5-42fd96492263';

    it('should return novel when found', async () => {
      // Arrange
      const mockNovel = createMockNovelEntity({ id: novelId });
      novelRepository.findOne.mockResolvedValue(mockNovel);

      // Act
      const result = await uut.findById(novelId);

      // Assert
      expect(result).toEqual({
        id: novelId,
        name: 'Test Novel',
        author: 'Test Author',
        description: 'A test novel description',
        state: NovelState.ONGOING,
        coverUrl: 'http://example.com/cover.jpg',
        category: ['fantasy'],
        chapters: ['77438da5-b825-493d-9cb5-4d4afa870bfa'],
      });

      expect(novelRepository.findOne).toHaveBeenCalledWith({
        where: { id: novelId },
        relations: ['categories', 'chapters'],
      });
    });

    it('should return null when novel not found', async () => {
      // Arrange
      novelRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await uut.findById(novelId);

      // Assert
      expect(result).toBeNull();
      expect(novelRepository.findOne).toHaveBeenCalledWith({
        where: { id: novelId },
        relations: ['categories', 'chapters'],
      });
    });

    it('should return null and log error when repository fails', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      novelRepository.findOne.mockRejectedValue(error);

      // Act
      const result = await uut.findById(novelId);

      // Assert
      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        `Error reading novel ${novelId}: ${error}`,
        { correlationId: mockCorrelationId },
      );
    });
  });

  describe('getChapter', () => {
    const novelId = 'a8367566-5d30-4659-b8c5-42fd96492263';
    const chapterId = '77438da5-b825-493d-9cb5-4d4afa870bfa';

    it('should return chapter when found', async () => {
      // Arrange
      const mockChapter = createMockChapterEntity({
        id: chapterId,
        novelId,
      });
      chapterRepository.findOne.mockResolvedValue(mockChapter);

      // Act
      const result = await uut.getChapter(novelId, chapterId);

      // Assert
      expect(result).toEqual({
        id: '77438da5-b825-493d-9cb5-4d4afa870bfa',
        novelId,
        title: 'Chapter 1',
        content: '# Chapter 1\nTest content',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });

      expect(chapterRepository.findOne).toHaveBeenCalledWith({
        where: { id: chapterId, novelId },
      });
    });

    it('should return null when chapter not found', async () => {
      // Arrange
      chapterRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await uut.getChapter(novelId, chapterId);

      // Assert
      expect(result).toBeNull();
      expect(chapterRepository.findOne).toHaveBeenCalledWith({
        where: { id: chapterId, novelId },
      });
    });

    it('should return null and log error when repository fails', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      chapterRepository.findOne.mockRejectedValue(error);

      // Act
      const result = await uut.getChapter(novelId, chapterId);

      // Assert
      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        `Error reading chapter ${chapterId}: ${error}`,
        { correlationId: mockCorrelationId },
      );
    });
  });

  describe('getChapterList', () => {
    const novelId = 'a8367566-5d30-4659-b8c5-42fd96492263';

    it('should return list of chapter filenames', async () => {
      // Arrange
      const mockChapters = [
        createMockChapterEntity({ filename: 'chapter1.md' }),
        createMockChapterEntity({ filename: 'chapter2.md' }),
        createMockChapterEntity({ filename: 'chapter3.md' }),
      ];
      chapterRepository.find.mockResolvedValue(mockChapters);

      // Act
      const result = await uut.getChapterList(novelId);

      // Assert
      expect(result).toEqual([
        'chapter1.md',
        'chapter2.md',
        'chapter3.md',
      ]);
      expect(chapterRepository.find).toHaveBeenCalledWith({
        where: { novelId },
        select: ['filename'],
        order: { filename: 'ASC' },
      });
    });

    it('should return empty array when no chapters found', async () => {
      // Arrange
      chapterRepository.find.mockResolvedValue([]);

      // Act
      const result = await uut.getChapterList(novelId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should return empty array and log error when repository fails', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      chapterRepository.find.mockRejectedValue(error);

      // Act
      const result = await uut.getChapterList(novelId);

      // Assert
      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalledWith(
        `Error reading chapter list for ${novelId}: ${error}`,
        { correlationId: mockCorrelationId },
      );
    });
  });

  describe('getCategories', () => {
    it('should return list of category names in lowercase', async () => {
      // Arrange
      const mockCategories = [
        createMockCategoryEntity({ name: 'Fantasy' }),
        createMockCategoryEntity({ name: 'Science Fiction' }),
        createMockCategoryEntity({ name: 'Romance' }),
      ];
      categoryRepository.find.mockResolvedValue(mockCategories);

      // Act
      const result = await uut.getCategories();

      // Assert
      expect(result).toEqual([
        'fantasy',
        'science fiction',
        'romance',
      ]);
      expect(categoryRepository.find).toHaveBeenCalledWith({
        select: ['name'],
        order: { name: 'ASC' },
      });
    });

    it('should return empty array when no categories found', async () => {
      // Arrange
      categoryRepository.find.mockResolvedValue([]);

      // Act
      const result = await uut.getCategories();

      // Assert
      expect(result).toEqual([]);
    });

    it('should return empty array and log error when repository fails', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      categoryRepository.find.mockRejectedValue(error);

      // Act
      const result = await uut.getCategories();

      // Assert
      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalledWith(
        `Error reading categories: ${error}`,
        { correlationId: mockCorrelationId },
      );
    });
  });

  describe('mapNovelEntityToNovel (private method)', () => {
    it('should correctly map novel entity to novel type', async () => {
      // Test this indirectly through findById since it's a private method
      const mockNovel = createMockNovelEntity({
        categories: [
          createMockCategoryEntity({ name: 'Fantasy' }),
          createMockCategoryEntity({ name: 'Adventure' }),
        ],
        chapters: [
          createMockChapterEntity({ filename: 'chapter1.md' }),
          createMockChapterEntity({ filename: 'chapter2.md' }),
        ],
      });

      novelRepository.findOne.mockResolvedValue(mockNovel);

      const result = await uut.findById(
        'a8367566-5d30-4659-b8c5-42fd96492263',
      );

      expect(result?.category).toEqual(['fantasy', 'adventure']);
      expect(result?.chapters).toEqual([
        '77438da5-b825-493d-9cb5-4d4afa870bfa',
        '77438da5-b825-493d-9cb5-4d4afa870bfa',
      ]);
    });
  });

  describe('mapChapterEntityToChapter (private method)', () => {
    it('should correctly map chapter entity to chapter type', async () => {
      // Test this indirectly through getChapter since it's a private method
      const mockChapter = createMockChapterEntity({
        filename: 'chapter1.md',
        title: 'Test Chapter',
        content: 'Test content',
      });

      chapterRepository.findOne.mockResolvedValue(mockChapter);

      const result = await uut.getChapter(
        'a8367566-5d30-4659-b8c5-42fd96492263',
        '77438da5-b825-493d-9cb5-4d4afa870bfa',
      );

      expect(result?.id).toBe('77438da5-b825-493d-9cb5-4d4afa870bfa');
      expect(result?.title).toBe('Test Chapter');
      expect(result?.content).toBe('Test content');
    });
  });
});

function createMockChapterEntity(
  overrides?: Partial<ChapterEntity>,
): ChapterEntity {
  return {
    id: '77438da5-b825-493d-9cb5-4d4afa870bfa',
    novelId: 'a8367566-5d30-4659-b8c5-42fd96492263',
    title: 'Chapter 1',
    content: '# Chapter 1\nTest content',
    filename: '77438da5-b825-493d-9cb5-4d4afa870bfa',
    novel: null as any,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function createMockCategoryEntity(
  overrides?: Partial<CategoryEntity>,
): CategoryEntity {
  return {
    id: 'cat-1',
    name: 'Fantasy',
    novels: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function createMockNovelEntity(
  overrides?: Partial<NovelEntity>,
): NovelEntity {
  return {
    id: 'a8367566-5d30-4659-b8c5-42fd96492263',
    name: 'Test Novel',
    author: 'Test Author',
    description: 'A test novel description',
    state: NovelState.ONGOING,
    coverUrl: 'http://example.com/cover.jpg',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    categories: [
      {
        id: 'cat-1',
        name: 'Fantasy',
        novels: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ],
    chapters: [
      {
        id: '77438da5-b825-493d-9cb5-4d4afa870bfa',
        novelId: 'a8367566-5d30-4659-b8c5-42fd96492263',
        title: 'Chapter 1',
        content: '# Chapter 1\nTest content',
        filename: '77438da5-b825-493d-9cb5-4d4afa870bfa',
        novel: null as any,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ],
    ...overrides,
  };
}
