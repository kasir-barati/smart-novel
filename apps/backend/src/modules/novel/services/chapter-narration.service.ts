import type { ConfigType } from '@nestjs/config';

import { ChecksumAlgorithm, S3Client } from '@aws-sdk/client-s3';
import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Chapter, NarrationStatus } from '@prisma/client';
import axios from 'axios';
import { PubSubEngine } from 'graphql-subscriptions';
import {
  CorrelationIdService,
  CustomLoggerService,
  isNil,
  urlBuilder,
} from 'nestjs-backend-common';
import { Readable } from 'node:stream';

import { appConfigs } from '../../../app/configs/app.config';
import {
  createChecksum,
  UploaderService,
} from '../../object-storage';
import { PrismaService } from '../../prisma';
import {
  type INovelRepository,
  NOVEL_REPOSITORY,
} from '../interfaces';
import { PUBSUB_TOKEN } from '../providers';
import { ChapterNarrationResponse } from '../types';
import { chapterNarrationUpdateSubscriptionKey } from '../utils';
import { MarkdownToSpeechTextService } from './markdown-to-speech-text.service';
import { NarrationLockService } from './narration-lock.service';

@Injectable()
export class ChapterNarrationService {
  private readonly bucketName =
    process.env.OBJECT_STORAGE_BUCKET ?? 'smart-novel';
  private readonly publicBase =
    process.env.OBJECT_STORAGE_PUBLIC_URL ?? 'http://localhost:9000';

  constructor(
    private readonly s3Client: S3Client,
    private readonly logger: CustomLoggerService,
    private readonly correlationIdService: CorrelationIdService,
    private readonly narrationLockService: NarrationLockService,
    private readonly prisma: PrismaService,
    @Inject(PUBSUB_TOKEN)
    private readonly pubSub: PubSubEngine,
    @Inject(NOVEL_REPOSITORY)
    private readonly novelRepository: INovelRepository,
    @Inject(appConfigs.KEY)
    private readonly appConfig: ConfigType<typeof appConfigs>,
    private readonly markdownToSpeechTextService: MarkdownToSpeechTextService,
  ) {}

  /**
   * Entry point: Try to start generation, return current status
   */
  async startGeneration(
    chapterId: string,
    forceRegenerate = false,
  ): Promise<ChapterNarrationResponse> {
    const correlationId = this.correlationIdService.correlationId;

    return this.prisma.$transaction(async (tx) => {
      this.logger.debug(
        `Attempting to start narration generation for chapter ID (force generate: ${forceRegenerate}): ${chapterId}`,
        {
          context: ChapterNarrationService.name,
          correlationId,
        },
      );

      const chapter = await tx.chapter.findUnique({
        where: { id: chapterId },
      });

      if (!chapter) {
        throw new BadRequestException('Chapter not found');
      }

      if (!forceRegenerate && this.doesNarrationExist(chapter)) {
        this.logger.debug(
          `Narration already exists for chapter ID: ${chapterId}`,
          {
            context: ChapterNarrationService.name,
            correlationId,
          },
        );

        return {
          status: NarrationStatus.READY,
          narrationUrl: chapter.narrationUrl,
        };
      }

      const oneHour = 60 * 60 * 1000;
      const lockKey = this.narrationLockService.getLockKey(chapterId);

      // README: client should at least wait until the lock is released.
      if (
        forceRegenerate &&
        (await this.narrationLockService.exists(lockKey))
      ) {
        return { status: NarrationStatus.PROCESSING };
      }

      const token = await this.narrationLockService.tryAcquire(
        lockKey,
        oneHour,
        forceRegenerate,
      );

      if (isNil(token)) {
        // Another process is already working on it
        return { status: NarrationStatus.PROCESSING };
      }

      // Double-check after lock (race condition prevention)
      const recheck = await tx.chapter.findUnique({
        where: { id: chapterId },
      });

      if (!forceRegenerate && recheck?.narrationUrl) {
        await this.narrationLockService.release(lockKey, token);
        return {
          status: NarrationStatus.READY,
          narrationUrl: recheck.narrationUrl,
        };
      }

      // If already processing (status check), don't start again (unless forcing)
      if (
        !forceRegenerate &&
        recheck?.narrationStatus === 'PROCESSING'
      ) {
        await this.narrationLockService.release(lockKey, token);
        return { status: NarrationStatus.PROCESSING };
      }

      const ttsFriendlyContent =
        await this.markdownToSpeechTextService.toSpeechText(
          chapter.content,
        );

      // Mark as processing atomically
      await tx.chapter.update({
        where: { id: chapterId },
        data: { narrationStatus: 'PROCESSING' },
      });

      // Publish initial event
      await this.pubSub.publish(
        chapterNarrationUpdateSubscriptionKey(chapterId),
        {
          chapterNarrationUpdated: {
            chapterId,
            status: NarrationStatus.PROCESSING,
          },
        },
      );

      // Start background processing
      this.processInBackground(
        chapterId,
        ttsFriendlyContent,
        lockKey,
        token,
        correlationId,
      );

      return { status: NarrationStatus.PROCESSING };
    });
  }

  subscribeToChapterNarration(chapterId: string) {
    // Type assertion needed because PubSub types don't match exactly
    return this.pubSub.asyncIterableIterator(
      chapterNarrationUpdateSubscriptionKey(chapterId),
    );
  }

  private doesNarrationExist(chapter: Chapter) {
    return (
      chapter.narrationUrl && chapter.narrationStatus === 'READY'
    );
  }

  /**
   * Background job: Generate TTS, upload to S3, update DB
   * Fire-and-forget (not awaited by mutation)
   */
  private processInBackground(
    chapterId: string,
    content: string,
    lockKey: string,
    token: string,
    correlationId: string,
  ): void {
    // Wrap in async immediately-invoked function
    (async () => {
      try {
        // Step 1: Call TTS service
        this.logger.log(
          `Starting TTS generation for chapter ${chapterId}`,
          { context: ChapterNarrationService.name, correlationId },
        );

        const ttsResponse = await this.callTtsService(
          content,
          chapterId,
          correlationId,
        );
        if (!ttsResponse) {
          throw new Error('Failed to initiate TTS request');
        }

        // Step 2: Stream to S3
        this.logger.log(
          `Uploading narration to S3 for chapter ${chapterId}`,
          { context: ChapterNarrationService.name, correlationId },
        );

        const publicUrl = await this.uploadToObjectStorage(
          ttsResponse,
          chapterId,
        );

        // Step 3: Update DB atomically (with status check)
        const updated =
          await this.novelRepository.updateChapterNarrationComplete(
            chapterId,
            publicUrl,
          );

        if (updated === 0) {
          this.logger.warn(
            `Chapter ${chapterId} was modified during processing, skipping update`,
            { context: ChapterNarrationService.name, correlationId },
          );
          return;
        }

        // Step 4: Publish success event
        await this.pubSub.publish(
          chapterNarrationUpdateSubscriptionKey(chapterId),
          {
            chapterNarrationUpdated: {
              chapterId,
              status: NarrationStatus.READY,
              narrationUrl: publicUrl,
            },
          },
        );

        this.logger.log(
          `Successfully generated narration for chapter ${chapterId}`,
          { context: ChapterNarrationService.name, correlationId },
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Failed to generate narration for chapter ${chapterId}: ${errorMessage}`,
          {
            context: ChapterNarrationService.name,
            error,
            correlationId,
          },
        );

        // Mark as failed in DB
        await this.novelRepository.updateNarrationStatus(
          chapterId,
          NarrationStatus.FAILED,
        );

        // Publish failure event
        await this.pubSub.publish(
          chapterNarrationUpdateSubscriptionKey(chapterId),
          {
            chapterNarrationUpdated: {
              chapterId,
              status: NarrationStatus.FAILED,
              error: 'Failed to generate audio',
            },
          },
        );
      } finally {
        // Always release lock
        await this.narrationLockService.release(lockKey, token);
      }
    })();
  }

  /**
   * Call TTS service and return stream
   * Returns null if initial request fails
   */
  private async callTtsService(
    content: string,
    chapterId: string,
    correlationId: string,
  ): Promise<Readable | null> {
    const twentySeconds = 20000;

    try {
      const response = await axios.post(
        this.appConfig.TTS_ENDPOINT,
        { text: content },
        {
          headers: { 'correlation-id': correlationId },
          responseType: 'stream',
          timeout: twentySeconds, // FIXME: is it that I have to increase this to a number that prevents this request for longer chapters from timing out? I mean we are returning a readable stream and TTS service also starts streaming immediately (it won't wait for the entire audio to be generated). TTS service accepts 10 concurrent requests, so why my tests where failing and ASAP I increased the timeout they passed?
        },
      );

      this.logger.log(
        `TTS request initiated for chapter ${chapterId}`,
        { context: ChapterNarrationService.name, correlationId },
      );

      return response.data as Readable;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to call TTS service for chapter ${chapterId}: ${errorMessage}`,
        {
          context: ChapterNarrationService.name,
          error,
          correlationId,
        },
      );
      return null;
    }
  }

  /**
   * Upload stream to object storage and return public URL
   */
  private async uploadToObjectStorage(
    stream: Readable,
    chapterId: string,
  ): Promise<string> {
    const filename = `chapter-${chapterId}.mp3`;
    const objectKey = `narrations/${filename}`;
    const uploader = new UploaderService(
      this.s3Client,
      filename,
      objectKey,
      this.bucketName,
      this.logger,
      this.correlationIdService,
      ChecksumAlgorithm.CRC32,
    );

    const crc = createChecksum(ChecksumAlgorithm.CRC32);

    await new Promise<void>((resolve, reject) => {
      stream
        .on('data', async (chunk: Buffer) => {
          try {
            crc.update(chunk);
            await uploader.upload(
              new Uint8Array(
                chunk.buffer,
                chunk.byteOffset,
                chunk.length,
              ),
              false,
              '',
            );
          } catch (e) {
            reject(e);
          }
        })
        .on('end', async () => {
          try {
            const checksumBase64 = crc.digestBase64();
            await uploader.upload(
              new Uint8Array(0),
              true,
              checksumBase64,
            );
            resolve();
          } catch (e) {
            reject(e);
          }
        })
        .on('error', async (err) => {
          try {
            await uploader.abortUpload();
          } catch {
            // Ignore abort errors
            // TODO: Retry abortion later.
          }
          reject(err);
        });
    });

    return urlBuilder(this.publicBase, this.bucketName, objectKey);
  }
}
