import { Injectable } from '@nestjs/common';
import { hostname } from 'os';

import { CachedValue } from '../redis.interface';
import { RedisService } from './redis.service';

// TODO: Refactor this!
@Injectable()
export class CacheService<T> {
  private readonly inFlightRequests = new Map<string, Promise<T>>();

  constructor(private readonly redisService: RedisService) {}

  /**
   * @description
   * Get value from cache or compute it using the provided function.
   * Implements single-flight pattern to prevent duplicate computations.
   */
  async getOrCompute(
    key: string,
    computeFn: () => Promise<T>,
    ttlMs: number,
  ): Promise<T> {
    // 1. Check Redis cache first
    try {
      const cached = await this.redisService.get(key);

      if (cached) {
        const parsedCache = JSON.parse(cached) as CachedValue<T>;

        return parsedCache.data;
      }
    } catch {
      // Continue to compute if cache read fails
    }

    // 2. Check in-flight requests (single-flight coalescing)
    if (this.inFlightRequests.has(key)) {
      return this.inFlightRequests.get(key) as Promise<T>;
    }

    // 3. Execute compute function with single-flight protection
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
        } catch {
          // Ignore storing data in cache
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
