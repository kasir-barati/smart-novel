import { ChapterContent as PrismaChapterContent } from '@prisma/client';
import { createHash } from 'crypto';

import { PrismaService } from '../../prisma';
import { PrismaChapterContentRepository } from './prisma-chapter-content.repository';

describe(PrismaChapterContentRepository.name, () => {
  let uut: PrismaChapterContentRepository;
  let prismaService: PrismaService;

  beforeEach(() => {
    prismaService = {
      chapterContent: {
        findMany: vi.fn(),
      },
      chapter: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    } as any;

    uut = new PrismaChapterContentRepository(prismaService);
  });

  describe('findByIds', () => {
    it('should return a map of content records keyed by id', async () => {
      const records = [
        {
          id: '3f0288ed-4042-429f-a89a-37dbd9874efa',
          content: 'Hello',
          ttsFriendlyContent: null,
          contentHash: 'hash-a',
          ttsHash: null,
          wordCount: null,
          charCount: null,
          language: null,
          format: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'fd3c3ffe-945e-4d41-9129-e3c85e8ade6d',
          content: 'World',
          ttsFriendlyContent: 'World tts',
          contentHash: 'hash-b',
          ttsHash: 'tts-hash-b',
          wordCount: null,
          charCount: null,
          language: null,
          format: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as PrismaChapterContent[];
      vi.mocked(
        prismaService.chapterContent.findMany,
      ).mockResolvedValue(records);

      const result = await uut.findByIds([
        '3f0288ed-4042-429f-a89a-37dbd9874efa',
        'fd3c3ffe-945e-4d41-9129-e3c85e8ade6d',
      ]);

      expect(result.size).toBe(2);
      expect(
        result.get('3f0288ed-4042-429f-a89a-37dbd9874efa'),
      ).toStrictEqual({
        id: '3f0288ed-4042-429f-a89a-37dbd9874efa',
        content: 'Hello',
        ttsFriendlyContent: undefined,
        contentHash: 'hash-a',
        ttsHash: undefined,
      });
      expect(
        result.get('fd3c3ffe-945e-4d41-9129-e3c85e8ade6d'),
      ).toStrictEqual({
        id: 'fd3c3ffe-945e-4d41-9129-e3c85e8ade6d',
        content: 'World',
        ttsFriendlyContent: 'World tts',
        contentHash: 'hash-b',
        ttsHash: 'tts-hash-b',
      });
    });

    it('should return empty map when no records found', async () => {
      vi.mocked(
        prismaService.chapterContent.findMany,
      ).mockResolvedValue([]);

      const result = await uut.findByIds(['non-existent-uuid']);

      expect(result.size).toBe(0);
    });
  });

  describe('findByChapterId', () => {
    it('should return content for a chapter', async () => {
      vi.mocked(prismaService.chapter.findUnique).mockResolvedValue({
        content: {
          id: 'eb82843d-d041-4dd2-94db-aadad59df0a6',
          content: '# Chapter text',
          ttsFriendlyContent: null,
          contentHash: 'hash-c',
          ttsHash: null,
        },
      } as any);

      const result = await uut.findByChapterId(
        '0ba68b7c-ca4e-4829-84f2-253c45c746dc',
      );

      expect(result).toEqual({
        id: 'eb82843d-d041-4dd2-94db-aadad59df0a6',
        content: '# Chapter text',
        ttsFriendlyContent: undefined,
        contentHash: 'hash-c',
        ttsHash: undefined,
      });
      expect(prismaService.chapter.findUnique).toHaveBeenCalledWith({
        where: { id: '0ba68b7c-ca4e-4829-84f2-253c45c746dc' },
        select: { content: true },
      });
    });

    it.each<any>([{ content: null }, null, undefined])(
      'should throw an error when chapter has no content',
      async (mockValue) => {
        vi.mocked(prismaService.chapter.findUnique).mockResolvedValue(
          mockValue,
        );

        const result = uut.findByChapterId(
          '0ba68b7c-ca4e-4829-84f2-253c45c746dc',
        );

        await expect(result).rejects.toThrow(
          'Chapter content not found',
        );
      },
    );
  });

  describe('upsertByChapterId', () => {
    it('should upsert content and return the result', async () => {
      const contentText = '# Chapter 1\n\nSome content';
      const ttsFriendlyContent = 'Chapter 1 Some content';
      const expectedHash = createHash('sha256')
        .update(contentText)
        .digest('hex');
      vi.mocked(prismaService.chapter.update).mockResolvedValue({
        content: {
          id: 'ddd',
          content: contentText,
          ttsFriendlyContent,
          contentHash: expectedHash,
          ttsHash: null,
        },
      } as any);

      const result = await uut.upsertByChapterId(
        '0ba68b7c-ca4e-4829-84f2-253c45c746dc',
        contentText,
        ttsFriendlyContent,
      );

      expect(result).toEqual({
        id: 'ddd',
        content: contentText,
        ttsFriendlyContent,
        contentHash: expectedHash,
        ttsHash: undefined,
      });
      expect(prismaService.chapter.update).toHaveBeenCalledWith({
        where: { id: '0ba68b7c-ca4e-4829-84f2-253c45c746dc' },
        data: {
          content: {
            upsert: {
              create: {
                content: contentText,
                ttsFriendlyContent,
                contentHash: expectedHash,
              },
              update: {
                content: contentText,
                ttsFriendlyContent,
                contentHash: expectedHash,
              },
            },
          },
        },
        include: { content: true },
      });
    });

    it('should use provided transaction client', async () => {
      const txClient = {
        chapter: {
          update: vi.fn().mockResolvedValue({
            content: {
              id: 'eee',
              content: 'tx content',
              ttsFriendlyContent: null,
              contentHash: 'tx-hash',
              ttsHash: null,
            },
          }),
        },
      } as any;

      const result = await uut.upsertByChapterId(
        '0ba68b7c-ca4e-4829-84f2-253c45c746dc',
        'tx content',
        'tx tts',
        txClient,
      );

      expect(result.id).toBe('eee');
      expect(txClient.chapter.update).toHaveBeenCalled();
      expect(prismaService.chapter.update).not.toHaveBeenCalled();
    });
  });
});
