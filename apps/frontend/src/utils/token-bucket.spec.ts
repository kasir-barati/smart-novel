import { TokenBucket } from './token-bucket';

describe('TokenBucket', () => {
  it('blocks when depleted then refills over time', () => {
    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValue(0);

    const bucket = new TokenBucket({
      capacity: 2,
      refillPerSecond: 1,
    });

    expect(bucket.take()).toBe(true);
    expect(bucket.take()).toBe(true);
    expect(bucket.take()).toBe(false);

    nowSpy.mockReturnValue(1500);
    expect(bucket.take()).toBe(true);

    nowSpy.mockRestore();
  });
});
