import {
  CorrelationIdService,
  CustomLoggerService,
} from 'nestjs-backend-common';

import { CacheService } from './cache.service';
import { RedisService } from './redis.service';

describe(CacheService.name, () => {
  let uut: CacheService;
  let redisService: jest.Mocked<RedisService>;
  let logger: CustomLoggerService;
  let correlationIdService: CorrelationIdService;

  beforeEach(() => {
    redisService = { get: jest.fn() } as any;
    logger = { log: jest.fn() } as any;
    correlationIdService = {} as CorrelationIdService;

    uut = new CacheService(redisService);
  });

  it('should return invalidate the cache key', async () => {
    redisService.del = jest.fn().mockResolvedValue(true);

    await uut.invalidate('my:cache:key');

    expect(redisService.del).toHaveBeenCalledWith('my:cache:key');
  });

  it('should return the cached value', async () => {
    redisService.get = jest.fn().mockResolvedValue(
      JSON.stringify({
        data: 'cache me',
        metadata: {
          cachedAt: Date.now(),
          instanceId: 'instance-1',
        },
      }),
    );

    const result = await uut.getOrCompute(
      'my:cache:key',
      () => Promise.resolve('cache me'),
      1000,
    );

    expect(result).toBe('cache me');
  });

  it('should compute and cache the value if not in cache', async () => {
    redisService.get = jest.fn().mockResolvedValue(null);
    redisService.set = jest.fn().mockResolvedValue('OK');
    const computeFn = jest.fn().mockResolvedValue('computed value');

    const result = await uut.getOrCompute(
      'my:cache:key',
      computeFn,
      1000,
    );

    expect(computeFn).toHaveBeenCalled();
    expect(redisService.set).toHaveBeenCalledTimes(1);
    expect(result).toBe('computed value');
    const [cacheKey, serializedValue, ttlSeconds] =
      redisService.set.mock.calls[0];
    expect(cacheKey).toBe('my:cache:key');
    expect(ttlSeconds).toBe(1);
    expect(JSON.parse(serializedValue)).toEqual({
      data: 'computed value',
      metadata: expect.objectContaining({
        cachedAt: expect.any(String),
        instanceId: expect.any(String),
      }),
    });
  });
});
