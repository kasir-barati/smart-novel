import { S3Client } from '@aws-sdk/client-s3';
import { BadRequestException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { NarrationStatus } from '@prisma/client';
import { PubSubEngine } from 'graphql-subscriptions';
import {
  CorrelationIdService,
  CustomLoggerService,
} from 'nestjs-backend-common';

import { appConfigs } from '../../../app';
import { PrismaService } from '../../prisma';
import { INovelRepository } from '../interfaces';
import { chapterNarrationUpdateSubscriptionKey } from '../utils';
import { ChapterNarrationService } from './chapter-narration.service';
import { MarkdownToSpeechTextService } from './markdown-to-speech-text.service';
import { NarrationLockService } from './narration-lock.service';

vi.mock('axios');
vi.mock('../../object-storage', async () => {
  const actual = await vi.importActual('../../object-storage');

  return {
    ...actual,
    UploaderService: vi.fn().mockImplementation(() => ({
      upload: vi.fn(),
      abortUpload: vi.fn(),
    })),
    createChecksum: vi.fn().mockReturnValue({
      update: vi.fn(),
      digestBase64: vi.fn().mockReturnValue('mock-checksum'),
    }),
  };
});

describe(ChapterNarrationService.name, () => {
  let service: ChapterNarrationService;
  let s3Client: S3Client;
  let logger: CustomLoggerService;
  let correlationIdService: CorrelationIdService;
  let narrationLockService: NarrationLockService;
  let prisma: PrismaService;
  let pubSub: PubSubEngine;
  let novelRepository: INovelRepository;
  let appConfig: ConfigType<typeof appConfigs>;
  let markdownToSpeechTextService: MarkdownToSpeechTextService;
  const mockChapterId = 'e8cec22d-a2c2-4f68-ac1c-6a3cdbbfef33';
  const mockCorrelationId = 'dfd61433-2558-47f5-8fbb-95bb8164d303';
  const mockNarrationUrl =
    'http://localhost:9000/smart-novel/narrations/chapter-e8cec22d-a2c2-4f68-ac1c-6a3cdbbfef33.mp3';

  beforeEach(() => {
    s3Client = {} as any;
    logger = {
      debug: vi.fn(),
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as any;
    correlationIdService = {
      correlationId: mockCorrelationId,
    } as any;
    narrationLockService = {
      tryAcquire: vi.fn(),
      release: vi.fn(),
      getLockKey: vi.fn().mockReturnValue(''),
      exists: vi.fn(),
    } as any;
    prisma = {
      $transaction: vi.fn(),
      chapter: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    } as any;
    pubSub = {
      publish: vi.fn(),
      asyncIterableIterator: vi.fn(),
    } as any;
    novelRepository = {
      updateChapterNarrationComplete: vi.fn(),
      updateNarrationStatus: vi.fn(),
    } as any;
    appConfig = {
      TTS_ENDPOINT: 'http://tts-service/api/tts',
    } as any;
    markdownToSpeechTextService = {
      toSpeechText: vi.fn(),
    } as any;

    service = new ChapterNarrationService(
      s3Client,
      logger,
      correlationIdService,
      narrationLockService,
      prisma,
      pubSub,
      novelRepository,
      appConfig,
      markdownToSpeechTextService,
    );

    vi.clearAllMocks();
  });

  describe('startGeneration', () => {
    it('should return READY status if narration already exists', async () => {
      // Arrange
      vi.mocked(prisma.$transaction).mockImplementation(
        async (callback: any) => {
          return callback({
            chapter: {
              findUnique: vi.fn().mockResolvedValue({
                id: mockChapterId,
                content: 'Chapter content',
                narrationUrl: mockNarrationUrl,
                narrationStatus: 'READY',
              }),
            },
          });
        },
      );

      // Act
      const result = await service.startGeneration(mockChapterId);

      // Assert
      expect(result).toEqual({
        status: NarrationStatus.READY,
        narrationUrl: mockNarrationUrl,
      });
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Narration already exists'),
        expect.any(Object),
      );
      expect(narrationLockService.tryAcquire).not.toHaveBeenCalled();
    });

    it('should force its way to start generating a new narration if forceRegenerate is true', async () => {
      // Arrange
      vi.mocked(prisma.$transaction).mockImplementation(
        async (callback: any) => {
          return callback({
            chapter: {
              findUnique: vi.fn().mockResolvedValue({
                id: mockChapterId,
                content: 'Chapter content',
                narrationUrl: mockNarrationUrl,
                narrationStatus: 'READY',
              }),
              update: vi.fn().mockResolvedValue({
                id: mockChapterId,
                content: 'Chapter content',
                narrationUrl: null,
                narrationStatus: 'PENDING',
              }),
            },
          });
        },
      );
      vi.mocked(narrationLockService.tryAcquire).mockResolvedValue(
        '',
      );

      // Act
      const result = await service.startGeneration(
        mockChapterId,
        true,
      );

      // Assert
      expect(result).toEqual({ status: NarrationStatus.PROCESSING });
      expect(narrationLockService.tryAcquire).toHaveBeenCalled();
    });

    it('should wait for the lock to be released before you can reprocess with forceRegenerate', async () => {
      // Arrange
      vi.mocked(prisma.$transaction).mockImplementation(
        async (callback: any) => {
          return callback({
            chapter: {
              findUnique: vi.fn().mockResolvedValue({
                id: mockChapterId,
                content: 'Chapter content',
                narrationUrl: mockNarrationUrl,
                narrationStatus: 'READY',
              }),
            },
          });
        },
      );
      vi.mocked(narrationLockService.tryAcquire).mockResolvedValue(
        null,
      );

      // Act
      const result = await service.startGeneration(
        mockChapterId,
        true,
      );

      // Assert
      expect(result).toEqual({ status: NarrationStatus.PROCESSING });
      expect(narrationLockService.tryAcquire).toHaveBeenCalled();
    });

    it('should throw BadRequestException if chapter not found', async () => {
      // Arrange
      vi.mocked(prisma.$transaction).mockImplementation(
        async (callback: any) => {
          return callback({
            chapter: {
              findUnique: vi.fn().mockResolvedValue(null),
            },
          });
        },
      );

      // Act
      const res = service.startGeneration(mockChapterId);

      // Assert
      await expect(res).rejects.toThrow(
        new BadRequestException('Chapter not found'),
      );
    });

    it("should return PROCESSING status if lock can NOT be acquired (we're already processing it)", async () => {
      // Arrange
      vi.mocked(prisma.$transaction).mockImplementation(
        async (callback: any) => {
          return callback({
            chapter: {
              findUnique: vi.fn().mockResolvedValue({
                id: mockChapterId,
                content: 'Chapter content',
                narrationUrl: null,
                narrationStatus: 'PENDING',
              }),
            },
          });
        },
      );
      vi.mocked(narrationLockService.tryAcquire).mockResolvedValue(
        null,
      );

      // Act
      const result = await service.startGeneration(mockChapterId);

      // Assert
      expect(result).toEqual({
        status: NarrationStatus.PROCESSING,
      });
      expect(narrationLockService.getLockKey).toHaveBeenCalledWith(
        mockChapterId,
      );
      expect(narrationLockService.tryAcquire).toHaveBeenCalledWith(
        expect.any(String),
        3600000, // 1 hour in ms
        false,
      );
    });

    it('should return READY if narration was created after lock acquisition (race condition)', async () => {
      // Arrange
      const initialChapter = {
        id: mockChapterId,
        content: 'Chapter content',
        narrationUrl: null,
        narrationStatus: 'PENDING',
      };
      const recheckChapter = {
        ...initialChapter,
        narrationUrl: mockNarrationUrl,
        narrationStatus: 'READY',
      };
      let callCount = 0;
      vi.mocked(prisma.$transaction).mockImplementation(
        async (callback: any) => {
          return callback({
            chapter: {
              findUnique: vi.fn().mockImplementation(() => {
                callCount++;
                return callCount === 1
                  ? initialChapter
                  : recheckChapter;
              }),
            },
          });
        },
      );
      vi.mocked(narrationLockService.tryAcquire).mockResolvedValue(
        '',
      );

      // Act
      const result = await service.startGeneration(mockChapterId);

      // Assert
      expect(result).toEqual({
        status: NarrationStatus.READY,
        narrationUrl: mockNarrationUrl,
      });
      expect(narrationLockService.release).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
      );
    });

    it('should return PROCESSING if chapter is already being processed after lock acquisition', async () => {
      // Arrange
      const initialChapter = {
        id: mockChapterId,
        content: 'Chapter content',
        narrationUrl: null,
        narrationStatus: 'PENDING',
      };
      const recheckChapter = {
        ...initialChapter,
        narrationStatus: 'PROCESSING',
      };
      let callCount = 0;
      vi.mocked(prisma.$transaction).mockImplementation(
        async (callback: any) => {
          return callback({
            chapter: {
              findUnique: vi.fn().mockImplementation(() => {
                callCount++;
                return callCount === 1
                  ? initialChapter
                  : recheckChapter;
              }),
            },
          });
        },
      );
      vi.mocked(narrationLockService.tryAcquire).mockResolvedValue(
        '',
      );

      // Act
      const result = await service.startGeneration(mockChapterId);

      // Assert
      expect(result).toEqual({
        status: NarrationStatus.PROCESSING,
      });
      expect(narrationLockService.release).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
      );
    });

    it('should start background processing and return PROCESSING status', async () => {
      // Arrange
      const chapter = {
        id: mockChapterId,
        content: '# Chapter Title\n\nChapter content',
        narrationUrl: null,
        narrationStatus: 'PENDING',
      };
      const updatedChapter = {
        ...chapter,
        narrationStatus: 'PROCESSING',
      };
      const mockTtsFriendlyText = 'Chapter Title: Chapter content';
      vi.mocked(prisma.$transaction).mockImplementation(
        async (callback: any) => {
          return callback({
            chapter: {
              findUnique: vi.fn().mockResolvedValue(chapter),
              update: vi.fn().mockResolvedValue(updatedChapter),
            },
          });
        },
      );
      vi.mocked(narrationLockService.tryAcquire).mockResolvedValue(
        '',
      );
      vi.mocked(
        markdownToSpeechTextService.toSpeechText,
      ).mockResolvedValue(mockTtsFriendlyText);

      // Act
      const result = await service.startGeneration(mockChapterId);

      // Assert
      expect(result).toEqual({
        status: NarrationStatus.PROCESSING,
      });
      expect(
        markdownToSpeechTextService.toSpeechText,
      ).toHaveBeenCalledWith(chapter.content);
      expect(pubSub.publish).toHaveBeenCalledWith(
        chapterNarrationUpdateSubscriptionKey(mockChapterId),
        {
          chapterNarrationUpdated: {
            chapterId: mockChapterId,
            status: NarrationStatus.PROCESSING,
          },
        },
      );
    });
  });

  describe('subscribeToChapterNarration', () => {
    it('should return async iterator for chapter narration updates', () => {
      // Act
      const result =
        service.subscribeToChapterNarration(mockChapterId);

      // Assert
      expect(pubSub.asyncIterableIterator).toHaveBeenCalledWith(
        chapterNarrationUpdateSubscriptionKey(mockChapterId),
      );
    });
  });
});
