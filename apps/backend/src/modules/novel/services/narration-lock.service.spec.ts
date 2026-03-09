import { RedisService } from '../../redis/services';
import { NarrationLockService } from './narration-lock.service';

describe(NarrationLockService.name, () => {
  let uut: NarrationLockService;
  let redisService: RedisService;

  beforeEach(() => {
    redisService = {
      set: vi.fn(),
      evaluate: vi.fn(),
    } as any;

    uut = new NarrationLockService(redisService);
  });

  it('should return lock key for narration', () => {
    const chapterId = '7a724ea4-e0f9-4ada-828f-f26f0b8b94c6';

    const key = uut.getLockKey(chapterId);

    expect(key).toBe(`chapter_tts:${chapterId}`);
  });

  it('should try to store the lock with NX & TTL', async () => {
    const key = 'chapter_tts:a33ac257-ff1d-4c20-ac4f-e9b4365439ca';
    const ttlMs = 5000;
    vi.mocked(redisService.set).mockResolvedValue(true);

    const token = await uut.tryAcquire(key, ttlMs);

    expect(redisService.set).toHaveBeenCalledWith(
      key,
      expect.any(String),
      {
        ttlMs,
        nx: true,
      },
    );
    expect(token).toBeTruthy();
  });

  it('should return null if lock is not acquired', async () => {
    const key = 'chapter_tts:a33ac257-ff1d-4c20-ac4f-e9b4365439ca';
    const ttlMs = 5000;
    vi.mocked(redisService.set).mockResolvedValue(false);

    const token = await uut.tryAcquire(key, ttlMs);

    expect(token).toBeNull();
  });

  it('should release the lock', async () => {
    const key = 'chapter_tts:a33ac257-ff1d-4c20-ac4f-e9b4365439ca';
    const token = 'random token';

    await uut.release(key, token);

    expect(redisService.evaluate).toHaveBeenCalledWith(
      `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("DEL", KEYS[1])
      else
        return 0
      end`,
      1,
      key,
      token,
    );
  });

  it('should not release the lock if token is null', async () => {
    const key = 'chapter_tts:a33ac257-ff1d-4c20-ac4f-e9b4365439ca';

    await uut.release(key, null);

    expect(redisService.evaluate).not.toHaveBeenCalled();
  });
});
