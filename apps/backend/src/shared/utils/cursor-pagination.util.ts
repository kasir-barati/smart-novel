import { PaginationArgs } from '../interfaces';

export interface CursorPaginationParams {
  /** @description cursor: `{ id: decodedId }` */
  cursor?: { id: string };
  /** @description Skip the cursor record itself */
  skip?: number;
  /** @description How many records to fetch (requested + 1 for hasMore detection) */
  take?: number;
  /** @description Whether we reversed the query direction (for `before`/`last`) and need to reverse results back */
  shouldReverse: boolean;
}

export interface TrimmedResult<T> {
  items: T[];
  hasMore: boolean;
}

/**
 * @summary Translates Relay-style pagination args into Prisma cursor pagination params.
 *
 * @description
 * This function handles:
 * - Base64 cursor decoding (`after`/`before` → UUID)
 * - Computing `take = requested + 1` (for hasMore detection)
 * - Setting `cursor` and `skip: 1` to skip the cursor record
 * - Returning a `shouldReverse` flag for `before`-based queries
 *
 * **NOTE**: the caller is responsible for:
 * - Flipping `orderBy` direction when `shouldReverse` is `true`
 * - Calling {@link trimCursorPaginationResults} to trim the extra record
 */
export function buildCursorPaginationParams(
  pagination?: PaginationArgs,
): CursorPaginationParams {
  const { first, last, after, before } = pagination ?? {};
  const afterId =
    after && Buffer.from(after, 'base64').toString('utf-8');
  const beforeId =
    before && Buffer.from(before, 'base64').toString('utf-8');
  const result: CursorPaginationParams = {
    shouldReverse: false,
  };

  if (afterId) {
    result.cursor = { id: afterId };
    result.skip = 1;
  }

  // For simplicity sake I am skipping the implementation of when client sends both after & before.
  // If we have both after and before, we need a different strategy
  if (beforeId && !afterId) {
    result.cursor = { id: beforeId };
    result.skip = 1;
    result.shouldReverse = true;
  }

  // Take extra to determine hasNextPage/hasPreviousPage
  const take = first ?? last;
  if (take) {
    result.take = take + 1;
  }

  return result;
}

/**
 * @description Trims the extra record fetched for hasMore detection and reverses results when needed (for `before`/`last` queries).
 *
 * @param items The raw results from the database (may contain 1 extra record)
 * @param shouldReverse Whether the query direction was reversed (from {@link buildCursorPaginationParams})
 */
export function trimCursorPaginationResults<T>(
  items: T[],
  pagination?: PaginationArgs,
  shouldReverse = false,
): TrimmedResult<T> {
  const { first, last } = pagination ?? {};
  const take = first ?? last;
  // Make a mutable copy so callers don't need to worry about mutations
  const result = [...items];

  // If we reversed for 'before', reverse back
  if (shouldReverse) {
    result.reverse();
  }

  let hasMore = false;

  // Trim the extra record we fetched
  if (take && result.length > take) {
    hasMore = true;

    if (last && !first) {
      result.shift();
    } else {
      result.pop();
    }
  }

  return { items: result, hasMore };
}
