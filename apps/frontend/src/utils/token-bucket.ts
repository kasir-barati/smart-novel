export interface TokenBucketConfig {
  capacity: number;
  refillPerSecond: number;
}

export class TokenBucket {
  private tokens: number;
  private lastRefillMs: number;

  constructor(private readonly config: TokenBucketConfig) {
    this.tokens = config.capacity;
    this.lastRefillMs = Date.now();
  }

  take(count = 1): boolean {
    this.refill();

    if (this.tokens < count) {
      return false;
    }

    this.tokens -= count;
    return true;
  }

  private refill() {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefillMs) / 1000;

    if (elapsedSeconds <= 0) {
      return;
    }

    const refilled = elapsedSeconds * this.config.refillPerSecond;
    this.tokens = Math.min(
      this.config.capacity,
      this.tokens + refilled,
    );
    this.lastRefillMs = now;
  }
}
