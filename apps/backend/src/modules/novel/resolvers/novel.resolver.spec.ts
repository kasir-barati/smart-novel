import { type IAuthUser, Role } from '../../auth';
import { NovelAction, NovelState } from '../enums';
import { NovelService } from '../services';
import { Novel } from '../types';
import { NovelResolver } from './novel.resolver';

describe(NovelResolver.name, () => {
  let uut: NovelResolver;
  let novelService: NovelService;

  beforeEach(() => {
    novelService = {
      getChapter: vi.fn(),
    } as any;
    uut = new NovelResolver(novelService);
  });

  describe('lastChapterPublishedAt', () => {
    it('should return the last chapter published date', async () => {
      const novel = {
        author: 'Author',
        category: ['fantasy'],
        chapters: [
          '54f74d6a-a80b-4b20-8a19-339b99da5362',
          'db1be1a7-e3bf-46d3-8899-980219f95d07',
        ],
        description: 'A novel description',
        id: '04b26f6e-58b8-4fb8-b5a9-8ae7002051c4',
        name: 'Novel One',
        state: NovelState.ONGOING,
      } as Novel;
      const updatedAt = new Date(
        '2026-02-20T10:20:30.000Z',
      ).toISOString();
      vi.mocked(novelService.getChapter).mockResolvedValue({
        content: '# Chapter 2',
        createdAt: new Date('2026-02-19T00:00:00.000Z'),
        id: 'db1be1a7-e3bf-46d3-8899-980219f95d07',
        novelId: '04b26f6e-58b8-4fb8-b5a9-8ae7002051c4',
        updatedAt,
      } as any);

      const result = await uut.lastChapterPublishedAt(novel);

      expect(result).toBe('2026-02-20T10:20:30.000Z');
      expect(novelService.getChapter).toHaveBeenCalledWith(
        '04b26f6e-58b8-4fb8-b5a9-8ae7002051c4',
        'db1be1a7-e3bf-46d3-8899-980219f95d07',
      );
    });

    it('should return null when there are no chapters', async () => {
      const novel = {
        author: 'Author',
        category: ['fantasy'],
        chapters: [],
        description: 'A novel description',
        id: '04b26f6e-58b8-4fb8-b5a9-8ae7002051c4',
        name: 'Novel One',
        state: NovelState.ONGOING,
        ownerId: '260311094522198751',
      } as Novel;

      const result = await uut.lastChapterPublishedAt(novel);

      expect(result).toBeNull();
      expect(novelService.getChapter).not.toHaveBeenCalled();
    });

    it('should return null when the last chapter cannot be found', async () => {
      const novel: Novel = {
        author: 'Author',
        category: ['fantasy'],
        chapters: [
          '54f74d6a-a80b-4b20-8a19-339b99da5362',
          'db1be1a7-e3bf-46d3-8899-980219f95d07',
        ],
        description: 'A novel description',
        id: '04b26f6e-58b8-4fb8-b5a9-8ae7002051c4',
        name: 'Novel One',
        state: NovelState.ONGOING,
        ownerId: '260321014522198754',
      } as Novel;

      vi.mocked(novelService.getChapter).mockResolvedValue(null);

      const result = await uut.lastChapterPublishedAt(novel);

      expect(result).toBeNull();
      expect(novelService.getChapter).toHaveBeenCalledWith(
        '04b26f6e-58b8-4fb8-b5a9-8ae7002051c4',
        'db1be1a7-e3bf-46d3-8899-980219f95d07',
      );
    });
  });

  describe('lastPublishedChapter', () => {
    it('should return the last published chapter', async () => {
      const novel = {
        author: 'Author',
        category: ['fantasy'],
        chapters: [
          '54f74d6a-a80b-4b20-8a19-339b99da5362',
          'db1be1a7-e3bf-46d3-8899-980219f95d07',
        ],
        description: 'A novel description',
        id: '04b26f6e-58b8-4fb8-b5a9-8ae7002051c4',
        name: 'Novel One',
        state: NovelState.ONGOING,
      } as Novel;
      const chapter = {
        content: '# Chapter 2',
        createdAt: new Date('2026-02-19T00:00:00.000Z').toISOString(),
        id: 'db1be1a7-e3bf-46d3-8899-980219f95d07',
        novelId: '04b26f6e-58b8-4fb8-b5a9-8ae7002051c4',
        contentId: '99383df4-b8e9-4791-be96-034b31525711',
        title: 'Chapter Two',
        updatedAt: new Date('2026-02-20T10:20:30.000Z').toISOString(),
      };
      vi.mocked(novelService.getChapter).mockResolvedValue(chapter);

      const result = await uut.lastPublishedChapter(novel);

      expect(result).toEqual(chapter);
      expect(novelService.getChapter).toHaveBeenCalledWith(
        '04b26f6e-58b8-4fb8-b5a9-8ae7002051c4',
        'db1be1a7-e3bf-46d3-8899-980219f95d07',
      );
    });

    it('should return null when there are no chapters', async () => {
      const novel = {
        author: 'Author',
        category: ['fantasy'],
        chapters: [],
        description: 'A novel description',
        id: '04b26f6e-58b8-4fb8-b5a9-8ae7002051c4',
        name: 'Novel One',
        state: NovelState.ONGOING,
        ownerId: '260311094522198751',
      } as Novel;

      const result = await uut.lastPublishedChapter(novel);

      expect(result).toBeNull();
      expect(novelService.getChapter).not.toHaveBeenCalled();
    });
  });

  describe('firstChapter', () => {
    it('should return the first chapter', async () => {
      const novel = {
        author: 'Author',
        category: ['fantasy'],
        chapters: [
          '54f74d6a-a80b-4b20-8a19-339b99da5362',
          'db1be1a7-e3bf-46d3-8899-980219f95d07',
        ],
        description: 'A novel description',
        id: '04b26f6e-58b8-4fb8-b5a9-8ae7002051c4',
        name: 'Novel One',
        state: NovelState.ONGOING,
      } as Novel;
      const chapter = {
        content: '# Chapter 1',
        createdAt: new Date('2026-02-18T00:00:00.000Z').toISOString(),
        id: '54f74d6a-a80b-4b20-8a19-339b99da5362',
        novelId: '04b26f6e-58b8-4fb8-b5a9-8ae7002051c4',
        title: 'Chapter One',
        contentId: '9d3139e7-009b-42ad-b488-cfe3cc19f1d2',
        updatedAt: new Date('2026-02-18T00:00:00.000Z').toISOString(),
      };
      vi.mocked(novelService.getChapter).mockResolvedValue(chapter);

      const result = await uut.firstChapter(novel);

      expect(result).toEqual(chapter);
      expect(novelService.getChapter).toHaveBeenCalledWith(
        '04b26f6e-58b8-4fb8-b5a9-8ae7002051c4',
        '54f74d6a-a80b-4b20-8a19-339b99da5362',
      );
    });

    it('should return null when there are no chapters', async () => {
      const novel = {
        author: 'Author',
        category: ['fantasy'],
        chapters: [],
        description: 'A novel description',
        id: '04b26f6e-58b8-4fb8-b5a9-8ae7002051c4',
        name: 'Novel One',
        state: NovelState.ONGOING,
        ownerId: '269311094522198752',
      } as Novel;

      const result = await uut.firstChapter(novel);

      expect(result).toBeNull();
      expect(novelService.getChapter).not.toHaveBeenCalled();
    });
  });

  describe('allowedActions', () => {
    it.each([Role.admin, Role.writer])(
      'should return MANAGE_TTS for a $role user',
      (role) => {
        const user: IAuthUser = {
          sub: '240311094522198754',
          name: 'Owner',
          preferredUsername: 'owner',
          email: 'owner@test.com',
          emailVerified: true,
          roles: [role],
          metadata: {},
        };
        const novel = getNovel({ ownerId: '240311094522198754' });

        const result = uut.allowedActions(novel, user);

        expect(result).toEqual([NovelAction.MANAGE_TTS]);
      },
    );

    it.each<{ roles: string[] }>([
      { roles: [] },
      { roles: ['reader'] },
    ])(
      'should return an empty array when the user is neither the owner nor an admin ($roles)',
      ({ roles }) => {
        const user: IAuthUser = {
          sub: '300311094522198754',
          name: 'Reader',
          preferredUsername: 'reader',
          email: 'reader@test.com',
          emailVerified: true,
          roles,
          metadata: {},
        };
        const novel = getNovel({ ownerId: '230104087265432001' });

        const result = uut.allowedActions(novel, user);

        expect(result).toEqual([]);
      },
    );
  });
});

function getNovel({ ownerId }: { ownerId: string }): Novel {
  return {
    id: '78981754-46c4-4521-9216-b9b27dafeab2',
    name: 'Test Novel',
    author: 'Author',
    category: ['fantasy'],
    chapters: [],
    state: NovelState.ONGOING,
    description: 'A test novel',
    ownerId,
  };
}
