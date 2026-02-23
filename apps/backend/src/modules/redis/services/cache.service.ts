import { Injectable } from '@nestjs/common';
import {
  CorrelationIdService,
  CustomLoggerService,
} from 'nestjs-backend-common';
import { hostname } from 'os';

import { CachedValue } from '../redis.interface';
import { RedisService } from './redis.service';

// TODO: Refactor this!
@Injectable()
export class CacheService {
  private readonly inFlightRequests = new Map<
    string,
    Promise<unknown>
  >();

  constructor(
    private readonly redisService: RedisService,
    private readonly logger: CustomLoggerService,
    private readonly correlationIdService: CorrelationIdService,
  ) {}

  /**
   * @description
   * Get value from cache or compute it using the provided function.
   * Implements single-flight pattern to prevent duplicate computations.
   */
  async getOrCompute<T>(
    key: string,
    computeFn: () => Promise<T>,
    ttlMs: number,
  ): Promise<T> {
    const startTime = Date.now();

    // 1. Check Redis cache first
    try {
      const cached = await this.redisService.get(key);
      if (cached) {
        const parsedCache = JSON.parse(cached) as CachedValue<T>;
        const latency = Date.now() - startTime;

        this.logger.log(`Cache HIT for key: ${key}`, {
          context: CacheService.name,
          correlationId: this.correlationIdService.correlationId,
          cacheHit: true,
          cacheKey: key,
          latencyMs: latency,
          cachedAt: new Date(
            parsedCache.metadata.cachedAt,
          ).toISOString(),
          originalInstanceId: parsedCache.metadata.instanceId,
          currentInstanceId: hostname(),
          telemetryOf: 'CacheObservability',
        });

        return parsedCache.data;
      }
    } catch (error) {
      this.logger.error(
        `Error reading from cache for key ${key}: ${error}`,
        {
          context: CacheService.name,
          correlationId: this.correlationIdService.correlationId,
          error,
        },
      );
      // Continue to compute if cache read fails
    }

    // 2. Check in-flight requests (single-flight coalescing)
    if (this.inFlightRequests.has(key)) {
      this.logger.log(
        `Request coalesced for key: ${key} - awaiting in-flight computation`,
        {
          context: CacheService.name,
          correlationId: this.correlationIdService.correlationId,
          cacheKey: key,
          coalesced: true,
          telemetryOf: 'CacheObservability',
        },
      );

      return this.inFlightRequests.get(key) as Promise<T>;
    }

    // 3. Execute compute function with single-flight protection
    const latency = Date.now() - startTime;
    this.logger.log(`Cache MISS for key: ${key}`, {
      context: CacheService.name,
      correlationId: this.correlationIdService.correlationId,
      cacheHit: false,
      cacheKey: key,
      latencyMs: latency,
      telemetryOf: 'CacheObservability',
    });

    const promise = computeFn()
      .then(async (result) => {
        // Store in Redis with metadata
        const cacheValue: CachedValue<T> = {
          data: result,
          metadata: {
            instanceId: hostname(),
            cachedAt: new Date().toISOString(),
          },
        };

        try {
          await this.redisService.set(
            key,
            JSON.stringify(cacheValue),
            Math.floor(ttlMs / 1000),
          );

          this.logger.log(`Cached result for key: ${key}`, {
            context: CacheService.name,
            correlationId: this.correlationIdService.correlationId,
            cacheKey: key,
            ttlSeconds: Math.floor(ttlMs / 1000),
            instanceId: hostname(),
            telemetryOf: 'CacheObservability',
          });
        } catch (error) {
          this.logger.error(
            `Error storing to cache for key ${key}: ${error}`,
            {
              context: CacheService.name,
              correlationId: this.correlationIdService.correlationId,
              error,
            },
          );
        }

        // Clean up in-flight request
        this.inFlightRequests.delete(key);
        return result;
      })
      .catch((error) => {
        // Clean up in-flight request on error
        this.inFlightRequests.delete(key);
        throw error;
      });

    // Register in-flight request
    this.inFlightRequests.set(key, promise);

    return promise;
  }

  async invalidate(key: string): Promise<void> {
    await this.redisService.del(key);
    this.inFlightRequests.delete(key);
  }
}
