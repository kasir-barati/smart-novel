export interface CacheMetadata {
  instanceId: string;
  /**
   * @description The timestamp when the value was cached, in ISO 8601 format.
   * @example "2024-07-01T12:34:56.789Z"
   */
  cachedAt: string;
}
export interface CachedValue<T> {
  data: T;
  metadata: CacheMetadata;
}
export interface CacheResult<T> {
  data: T;
  cacheHit: boolean;
  /**
   * @description Indicates whether this result was reused from another request that was already in progress.
   */
  coalesced: boolean;
}
