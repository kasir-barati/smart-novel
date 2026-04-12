import { NotFoundException } from '@nestjs/common';
import { NarrationStatus } from '@prisma/client';
import { isString } from 'class-validator';

import type {
  IChapter,
  IChapterRepository,
  INovelRepository,
} from '../interfaces';

import { OrderDirection } from '../../../shared'; // FIXME: https://github.com/kasir-barati/smart-novel/issues/23
import { ChapterOrderField, NovelState } from '../enums';
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
      findChaptersConnection: vi.fn(),
      getFirstChapter: vi.fn(),
      getLastChapter: vi.fn(),
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
        ownerId: '224691739954204661',
        description: `Lin Jie is the owner of a bookstore in another world. He's kind and warm-hearted, often recommending healing books to customers who are going through a tough time. From time to time, he secretly promotes his own work too. Over time, these customers begin to respect him greatly, some even frequently bringing local specialties to repay his favor. They often seek his professional opinion when it comes to selecting books, and share their experiences with this ordinary bookstore owner to people around them. They respectfully and intimately refer to him using names such as the "Demon God's Lackey", "Propagator of the Flesh and Blood Gospel", "Corpse Devouring Sect's Rites and Customs' Author" and "Shepherd of the Stars".`,
        id: '3da6f099-50ad-4a57-8a03-188b76ed5e3f',
        name: "I'm Really Not The Demon God's Lackey",
        state: NovelState.ONGOING,
      };
      vi.mocked(novelRepository.findById).mockResolvedValue(novel);

      const result = await uut.findOne(
        '3da6f099-50ad-4a57-8a03-188b76ed5e3f',
      );

      expect(result).toEqual(novel);
      expect(novelRepository.findById).toHaveBeenCalledWith(
        '3da6f099-50ad-4a57-8a03-188b76ed5e3f',
      );
    });

    it('should throw NotFoundException when id does not exist', async () => {
      vi.mocked(novelRepository.findById).mockResolvedValue(null);

      await expect(uut.findOne('missing-uuid')).rejects.toThrow(
        new NotFoundException('Novel with id missing-uuid not found'),
      );
    });
  });

  describe('findAll', () => {
    it('should return all novels as edges when no filters or pagination are provided', async () => {
      vi.mocked(novelRepository.findAll).mockResolvedValue([
        {
          author: 'Author 1',
          category: ['action', 'fantasy'],
          ownerId: '224691739954204673',
          id: '15c0aaee-56e3-45cd-b159-b1fa33f52490',
          name: 'Novel One',
          state: NovelState.ONGOING,
          description: 'Description for Novel One',
        },
        {
          author: 'Author 2',
          category: ['romance', 'drama'],
          ownerId: '224691739954204674',
          id: '6c439896-3c3b-5c57-a27e-026ebbf9e34c',
          name: 'Novel Two',
          state: NovelState.FINISHED,
          description: 'Description for Novel Two',
        },
        {
          author: 'Author 3',
          category: ['action', 'mystery'],
          ownerId: '224691739954204675',
          id: '7d5499a7-4d4c-6d68-b38f-037fcc0a45d5',
          name: 'Novel Three',
          state: NovelState.ONGOING,
          description: 'Description for Novel Three',
        },
      ]);

      const result = await uut.findAll();

      expect(result.edges).toHaveLength(3);
      expect(result.edges.map((edge) => edge.node.id)).toStrictEqual([
        '15c0aaee-56e3-45cd-b159-b1fa33f52490',
        '6c439896-3c3b-5c57-a27e-026ebbf9e34c',
        '7d5499a7-4d4c-6d68-b38f-037fcc0a45d5',
      ]);
      expect(result.pageInfo).toStrictEqual({
        endCursor: 'N2Q1NDk5YTctNGQ0Yy02ZDY4LWIzOGYtMDM3ZmNjMGE0NWQ1',
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor:
          'MTVjMGFhZWUtNTZlMy00NWNkLWIxNTktYjFmYTMzZjUyNDkw',
      });
      expect(novelRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should apply category include and exclude filters', async () => {
      vi.mocked(novelRepository.findAll).mockResolvedValue([
        {
          author: 'Author 1',
          category: ['action', 'fantasy'],
          ownerId: '224691739954204677',
          id: '5b329785-2b2a-4b46-916d-015daaf8d23b',
          name: 'Novel One',
          state: NovelState.ONGOING,
          description: 'Description for Novel One',
        },
        {
          author: 'Author 2',
          category: ['romance', 'drama'],
          ownerId: '224691739954204678',
          id: '6c439896-3c3b-5c57-a27e-026ebbf9e34c',
          name: 'Novel Two',
          state: NovelState.FINISHED,
          description: 'Description for Novel Two',
        },
        {
          author: 'Author 3',
          category: ['action', 'mystery'],
          ownerId: '224691739954204679',
          id: '7d5499a7-4d4c-6d68-b38f-037fcc0a45d5',
          name: 'Novel Three',
          state: NovelState.ONGOING,
          description: 'Description for Novel Three',
        },
      ]);

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
      expect(result.edges[0].node.id).toBe(
        '5b329785-2b2a-4b46-916d-015daaf8d23b',
      );
      expect(result.pageInfo).toStrictEqual({
        endCursor: 'NWIzMjk3ODUtMmIyYS00YjQ2LTkxNmQtMDE1ZGFhZjhkMjNi',
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor:
          'NWIzMjk3ODUtMmIyYS00YjQ2LTkxNmQtMDE1ZGFhZjhkMjNi',
      });
    });

    it('should paginate using after and first cursors', async () => {
      vi.mocked(novelRepository.findAll).mockResolvedValue([
        {
          author: 'Author 1',
          category: ['action', 'fantasy'],
          ownerId: '224691739954204680',
          id: 'afbc61b9-1ff7-4792-9e79-fb3ec55939a7',
          name: 'Novel One',
          state: NovelState.ONGOING,
          description: 'Description for Novel One',
        },
        {
          author: 'Author 2',
          category: ['romance', 'drama'],
          ownerId: '224691739954204681',
          id: '9d154762-d77f-42b4-add2-cf1d234d1a21',
          name: 'Novel Two',
          state: NovelState.FINISHED,
          description: 'Description for Novel Two',
        },
        {
          author: 'Author 3',
          category: ['action', 'mystery'],
          ownerId: '224691739954204682',
          id: 'a46a4059-a028-4743-a07a-f78d9e664e5d',
          name: 'Novel Three',
          state: NovelState.ONGOING,
          description: 'Description for Novel Three',
        },
      ]);
      const afterCursor =
        'YWZiYzYxYjktMWZmNy00NzkyLTllNzktZmIzZWM1NTkzOWE3'; // Base64 for 'afbc61b9-1ff7-4792-9e79-fb3ec55939a7'

      const result = await uut.findAll(1, undefined, afterCursor);

      expect(result.edges).toHaveLength(1);
      expect(result.edges[0].node.id).toBe(
        '9d154762-d77f-42b4-add2-cf1d234d1a21',
      );
      expect(result.pageInfo).toStrictEqual({
        endCursor: 'OWQxNTQ3NjItZDc3Zi00MmI0LWFkZDItY2YxZDIzNGQxYTIx', // Base64 for 'novel-2'
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor:
          'OWQxNTQ3NjItZDc3Zi00MmI0LWFkZDItY2YxZDIzNGQxYTIx', // Base64 for 'novel-2'
      });
    });
  });

  describe('getNextChapter', () => {
    it('should return the next chapter when current chapter exists', async () => {
      const novelId = '5b329785-2b2a-4b46-916d-015daaf8d23b';
      const currentChapterId = 'c51a42b3-339c-443f-add6-4f71f09c90fa';
      const nextChapter: IChapter = {
        contentId: 'ebae2145-e14a-4876-99b4-260c68d3b7d3',
        createdAt: new Date('2024-01-03').toISOString(),
        chapterNumber: 2,
        title: 'Chapter 2',
        id: '581f1bfe-3f85-4db5-b469-9f118c2c6bff',
        updatedAt: new Date('2024-01-04').toISOString(),
        novelId,
      };
      vi.mocked(novelRepository.getChapterList).mockResolvedValue([
        currentChapterId,
        nextChapter.id,
      ]);
      vi.mocked(chapterRepository.getChapter).mockResolvedValue(
        nextChapter,
      );

      const result = await uut.getNextChapter(
        novelId,
        currentChapterId,
      );

      expect(result).toStrictEqual(nextChapter);
      expect(novelRepository.getChapterList).toHaveBeenCalledWith(
        novelId,
      );
      expect(chapterRepository.getChapter).toHaveBeenCalledWith(
        novelId,
        nextChapter.id,
      );
    });

    it('should return null when current chapter does not exist', async () => {
      vi.mocked(novelRepository.getChapterList).mockResolvedValue([
        'd82d1cc7-38d6-42a6-bc3a-900f583593e5',
        'e2b4a4de-4e7f-4295-923f-3ebc2e27ef68',
      ]);
      const novelId = '4d3bea7e-bc38-4777-aa5a-058febb86375';

      const result = await uut.getNextChapter(
        novelId,
        'missing-chapter-uuid',
      );

      expect(result).toBeNull();
      expect(novelRepository.getChapterList).toHaveBeenCalledWith(
        novelId,
      );
      expect(chapterRepository.getChapter).not.toHaveBeenCalled();
    });

    it('should return null when current chapter is the last chapter', async () => {
      const novelId = 'e88c966e-96b3-429e-85cf-89cc42ce9203';
      const currentChapterId = 'a3f03411-4c40-4ad7-89bf-59f5f5f297d4';
      vi.mocked(novelRepository.getChapterList).mockResolvedValue([
        'd82d1cc7-38d6-42a6-bc3a-900f583593e5',
        currentChapterId,
      ]);

      const result = await uut.getNextChapter(
        novelId,
        currentChapterId,
      );

      expect(result).toBeNull();
      expect(novelRepository.getChapterList).toHaveBeenCalledWith(
        novelId,
      );
      expect(chapterRepository.getChapter).not.toHaveBeenCalled();
    });
  });

  describe('getPreviousChapter', () => {
    it('should return the previous chapter when current chapter exists', async () => {
      const novelId = '3cf9cacc-7740-470a-9297-124315b3266a';
      const currentChapterId = '6035f4b5-f988-4133-9ad8-e2632fdc53ee';
      const previousChapter: Chapter = {
        contentId: '94fc1772-a27c-4bee-8912-6bd4d8bb5e26',
        chapterNumber: 1,
        createdAt: new Date('2024-01-01').toISOString(),
        title: 'Chapter 1',
        id: '168024ae-d9bc-456d-888c-125588bfc6ed',
        updatedAt: new Date('2024-01-02').toISOString(),
        novelId,
      };
      vi.mocked(novelRepository.getChapterList).mockResolvedValue([
        previousChapter.id,
        currentChapterId,
      ]);
      vi.mocked(chapterRepository.getChapter).mockResolvedValue(
        previousChapter,
      );

      const result = await uut.getPreviousChapter(
        novelId,
        currentChapterId,
      );

      expect(result).toStrictEqual(previousChapter);
      expect(novelRepository.getChapterList).toHaveBeenCalledWith(
        novelId,
      );
      expect(chapterRepository.getChapter).toHaveBeenCalledWith(
        novelId,
        previousChapter.id,
      );
    });

    it('should return null when current chapter does not exist', async () => {
      vi.mocked(novelRepository.getChapterList).mockResolvedValue([
        '94fc1772-a27c-4bee-8912-6bd4d8bb5e26',
        'e2b4a4de-4e7f-4295-923f-3ebc2e27ef68',
      ]);
      const novelId = '138b8596-50fa-437b-87e1-4ad0d30f4de8';

      const result = await uut.getPreviousChapter(
        novelId,
        'missing-chapter-uuid',
      );

      expect(result).toBeNull();
      expect(novelRepository.getChapterList).toHaveBeenCalledWith(
        novelId,
      );
      expect(chapterRepository.getChapter).not.toHaveBeenCalled();
    });

    it('should return null when current chapter is the first chapter', async () => {
      vi.mocked(novelRepository.getChapterList).mockResolvedValue([
        'f313b55b-48ba-445e-ba7e-1416da9cea3d',
        '8a286c66-188a-4369-8a69-7d700b2cfb86',
      ]);
      const novelId = '3d607808-11b9-4885-a57c-962e4900f28e';

      const result = await uut.getPreviousChapter(
        novelId,
        'f313b55b-48ba-445e-ba7e-1416da9cea3d',
      );

      expect(result).toBeNull();
      expect(novelRepository.getChapterList).toHaveBeenCalledWith(
        novelId,
      );
      expect(chapterRepository.getChapter).not.toHaveBeenCalled();
    });
  });

  describe('getChaptersConnection', () => {
    it('should return a connection with edges, pageInfo, and totalCount', async () => {
      const novelId = '8d3ea510-2dee-4af0-b5c4-7709d15c606a';
      vi.mocked(
        chapterRepository.findChaptersConnection,
      ).mockResolvedValue({
        chapters: [
          {
            id: 'bb563ad5-1ac4-46c2-a25f-6f62d245f44c',
            novelId,
            contentId: 'ccc63ad5-1ac4-46c2-a25f-6f62d245f44c',
            title: 'Chapter 1: The Beginning',
            chapterNumber: 1,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-02T00:00:00.000Z',
          },
          {
            id: '904bf826-33be-4172-b63f-665bba9007b9',
            novelId,
            contentId: 'ddd63ad5-1ac4-46c2-a25f-6f62d245f44c',
            title: 'Chapter 2: The Journey',
            chapterNumber: 2,
            createdAt: '2024-01-03T00:00:00.000Z',
            updatedAt: '2024-01-04T00:00:00.000Z',
          },
        ],
        totalCount: 2,
      });

      const result = await uut.getChaptersConnection(novelId, 10);

      expect(result.edges).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.edges[0].node.id).toBe(
        'bb563ad5-1ac4-46c2-a25f-6f62d245f44c',
      );
      expect(result.edges[0].cursor).toBe(
        'YmI1NjNhZDUtMWFjNC00NmMyLWEyNWYtNmY2MmQyNDVmNDRj',
      );
      expect(result.pageInfo.startCursor).toBe(
        result.edges[0].cursor,
      );
      expect(result.pageInfo.endCursor).toBe(result.edges[1].cursor);
    });

    it('should pass orderBy and filters to repository', async () => {
      vi.mocked(
        chapterRepository.findChaptersConnection,
      ).mockResolvedValue({ chapters: [], totalCount: 0 });
      const novelId = 'e9462d56-021f-40ed-85a0-e21f6cb2d66d';

      await uut.getChaptersConnection(
        novelId,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          field: ChapterOrderField.CREATED_AT,
          direction: OrderDirection.DESC,
        },
        { narrationStatus: { eq: NarrationStatus.READY } },
      );

      expect(
        chapterRepository.findChaptersConnection,
      ).toHaveBeenCalledWith({
        novelId,
        pagination: {
          first: undefined,
          last: undefined,
          after: undefined,
          before: undefined,
        },
        orderByField: ChapterOrderField.CREATED_AT,
        orderByDirection: OrderDirection.DESC,
        filters: { narrationStatus: NarrationStatus.READY },
      });
    });

    it('should return empty connection when no chapters exist', async () => {
      vi.mocked(
        chapterRepository.findChaptersConnection,
      ).mockResolvedValue({ chapters: [], totalCount: 0 });
      const novelId = 'ed185f30-05a6-403c-bb35-f80b643e4202';

      const result = await uut.getChaptersConnection(novelId);

      expect(result.edges).toEqual([]);
      expect(result.totalCount).toBe(0);
      expect(result.pageInfo).toStrictEqual({
        startCursor: null,
        endCursor: null,
        hasPreviousPage: false,
        hasNextPage: false,
      });
    });

    it('should default to CHAPTER_NUMBER ASC when no orderBy is provided', async () => {
      vi.mocked(
        chapterRepository.findChaptersConnection,
      ).mockResolvedValue({ chapters: [], totalCount: 0 });
      const novelId = 'cd8bce2c-922b-4b71-86fa-0b234a87e275';

      await uut.getChaptersConnection(novelId);

      expect(
        chapterRepository.findChaptersConnection,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          orderByField: ChapterOrderField.CHAPTER_NUMBER,
          orderByDirection: OrderDirection.ASC,
        }),
      );
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
