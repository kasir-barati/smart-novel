import {
  CorrelationIdService,
  CustomLoggerService,
} from 'nestjs-backend-common';

import { CacheService } from './cache.service';
import { RedisService } from './redis.service';

describe(CacheService.name, () => {
  let uut: CacheService<string>;
  let redisService: jest.Mocked<RedisService>;
  let logger: CustomLoggerService;
  let correlationIdService: CorrelationIdService;

  beforeEach(() => {
    redisService = { get: jest.fn() } as any;
    logger = { log: jest.fn() } as any;
    correlationIdService = {} as CorrelationIdService;

    uut = new CacheService(
      redisService,
      logger,
      correlationIdService,
    );
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

    expect(result).toEqual({
      data: 'cache me',
      cacheHit: true,
      coalesced: false,
    });
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
    expect(result).toEqual({
      data: 'computed value',
      cacheHit: false,
      coalesced: false,
    });
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

  it('should coalesce concurrent requests for the same key', async () => {
    redisService.get = jest.fn().mockResolvedValue(null);
    redisService.set = jest.fn().mockResolvedValue('OK');
    let resolveCompute: (value: string) => void;
    const computePromise = new Promise<string>((resolve) => {
      resolveCompute = resolve;
    });
    const computeFn = jest.fn().mockReturnValue(computePromise);

    // Start two concurrent requests
    const request1 = uut.getOrCompute(
      'my:cache:key',
      computeFn,
      1000,
    );
    const request2 = uut.getOrCompute(
      'my:cache:key',
      computeFn,
      1000,
    );
    // Resolve the compute function
    resolveCompute!('computed value');
    const [result1, result2] = await Promise.all([
      request1,
      request2,
    ]);

    // First request should not be coalesced
    expect(result1).toEqual({
      data: 'computed value',
      cacheHit: false,
      coalesced: false,
    });
    // Second request should be coalesced
    expect(result2).toEqual({
      data: 'computed value',
      cacheHit: false,
      coalesced: true,
    });
    // Compute function should only be called once
    expect(computeFn).toHaveBeenCalledTimes(1);
  });
});
