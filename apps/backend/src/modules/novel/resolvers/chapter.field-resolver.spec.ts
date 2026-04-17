import { BadRequestException } from '@nestjs/common';

import { IAuthUser } from '../../auth';
import {
  ChapterContentDataLoader,
  ChapterNavigationDataLoader,
  ChapterViewerStateDataLoader,
} from '../dataloaders';
import { IChapterContent } from '../interfaces';
import { Chapter } from '../types';
import { ChapterFieldResolver } from './chapter.field-resolver';

describe(ChapterFieldResolver.name, () => {
  let uut: ChapterFieldResolver;
  let chapterContentDataLoader: ChapterContentDataLoader;
  let chapterNavigationDataLoader: ChapterNavigationDataLoader;
  let chapterViewerStateDataLoader: ChapterViewerStateDataLoader;

  beforeEach(() => {
    chapterContentDataLoader = {
      load: vi.fn(),
    } as any;
    chapterNavigationDataLoader = {
      load: vi.fn(),
    } as any;
    chapterViewerStateDataLoader = {
      load: vi.fn(),
      setUserId: vi.fn(),
    } as any;

    uut = new ChapterFieldResolver(
      chapterContentDataLoader,
      chapterNavigationDataLoader,
      chapterViewerStateDataLoader,
    );
  });

  describe('content', () => {
    it('should return the chapter content', async () => {
      const chapter = {
        contentId: '456c3e4a-b353-4938-aa5b-900b685b134f',
      } as Chapter;
      const chapterContent: IChapterContent = {
        id: '456c3e4a-b353-4938-aa5b-900b685b134f',
        content: '# Chapter 1\n\nSome content',
        contentHash: 'hash-1',
      };
      vi.mocked(chapterContentDataLoader.load).mockResolvedValue(
        chapterContent,
      );

      const result = await uut.content(chapter);

      expect(result).toBe('# Chapter 1\n\nSome content');
      expect(chapterContentDataLoader.load).toHaveBeenCalledWith(
        '456c3e4a-b353-4938-aa5b-900b685b134f',
      );
    });

    it('should throw BadRequestException when chapter content is not found', async () => {
      const chapter = { contentId: 'non-existent-uuid' } as Chapter;
      vi.mocked(chapterContentDataLoader.load).mockResolvedValue(
        null,
      );

      await expect(uut.content(chapter)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('next', () => {
    it('should load the next chapter via the navigation dataloader', async () => {
      const chapter = {
        novelId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        chapterNumber: 1,
      } as Chapter;

      await uut.next(chapter);

      expect(chapterNavigationDataLoader.load).toHaveBeenCalledWith({
        novelId: chapter.novelId,
        chapterNumber: chapter.chapterNumber,
        adjacency: 'next',
      });
    });
  });

  describe('previous', () => {
    it('should load the previous chapter via the navigation dataloader', async () => {
      const chapter = {
        novelId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        chapterNumber: 3,
      } as Chapter;

      await uut.previous(chapter);

      expect(chapterNavigationDataLoader.load).toHaveBeenCalledWith({
        novelId: chapter.novelId,
        chapterNumber: chapter.chapterNumber,
        adjacency: 'previous',
      });
    });
  });

  describe('viewerState', () => {
    it('should return false of isRead when user is not logged in', async () => {
      const chapter = {} as Chapter;

      const res = await uut.viewerState(chapter);

      expect(res).toStrictEqual({
        isRead: false,
        readAt: undefined,
      });
    });

    it('should load viewer state from the dataloader', async () => {
      const chapter = {
        id: 'abbc9ff8-fbc9-43d2-a13b-e9493f9d127b',
      } as Chapter;
      const user = { sub: '268103642598401' } as IAuthUser;

      await uut.viewerState(chapter, user);

      expect(
        chapterViewerStateDataLoader.setUserId,
      ).toHaveBeenCalledWith(user.sub);
      expect(chapterViewerStateDataLoader.load).toHaveBeenCalledWith(
        chapter.id,
      );
    });
  });

  describe('ttsFriendlyContent', () => {
    it('should return the TTS-friendly content', async () => {
      const chapter = {
        contentId: '0f96e0ad-00cd-4125-8796-bf668f2b5d91',
      } as Chapter;
      const chapterContent: IChapterContent = {
        id: '0f96e0ad-00cd-4125-8796-bf668f2b5d91',
        content: '# Chapter 1',
        ttsFriendlyContent: 'Chapter 1 spoken version',
        contentHash: 'hash-1',
      };
      vi.mocked(chapterContentDataLoader.load).mockResolvedValue(
        chapterContent,
      );

      const result = await uut.ttsFriendlyContent(chapter);

      expect(result).toBe('Chapter 1 spoken version');
      expect(chapterContentDataLoader.load).toHaveBeenCalledWith(
        '0f96e0ad-00cd-4125-8796-bf668f2b5d91',
      );
    });

    it('should return undefined when TTS-friendly content does not exist', async () => {
      const chapter = {
        contentId: '41668b8d-a539-4202-a2a4-4fc873137646',
      } as Chapter;
      const chapterContent: IChapterContent = {
        id: '41668b8d-a539-4202-a2a4-4fc873137646',
        content: '# Chapter 1',
        contentHash: 'hash-1',
      };
      vi.mocked(chapterContentDataLoader.load).mockResolvedValue(
        chapterContent,
      );

      const result = await uut.ttsFriendlyContent(chapter);

      expect(result).toBeUndefined();
    });

    it('should throw BadRequestException when chapter content record is not found', async () => {
      const chapter = {
        contentId: '456c3e4a-b353-4938-aa5b-900b685b134f',
      } as Chapter;
      vi.mocked(chapterContentDataLoader.load).mockResolvedValue(
        null,
      );

      await expect(uut.ttsFriendlyContent(chapter)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
