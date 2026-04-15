import { useEffect, useRef } from 'react';

import { useMarkChaptersReadMutation } from '../generated/graphql';
import { ReadChaptersStorage } from '../services/read-chapters-storage.service';
import { logger } from '../utils/logger';
import { useAuth } from './useAuth';

interface UseSyncReadChaptersOptions {
  storage: ReadChaptersStorage;
}

/**
 * @summary Hook to sync locally stored read chapters to the backend when user logs in.
 * @description Handles batching of chapters (100 per batch due to API limits).
 */
export function useSyncReadChapters({
  storage,
}: UseSyncReadChaptersOptions) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { mutateAsync: markChaptersReadMutation } =
    useMarkChaptersReadMutation();
  const syncAttemptedRef = useRef(false);

  useEffect(() => {
    if (
      !isAuthenticated ||
      authLoading ||
      storage.getSyncFlag() ||
      syncAttemptedRef.current
    ) {
      return;
    }

    syncAttemptedRef.current = true;
    const storedChapters = [...storage.getReadChapters()];

    if (storedChapters.length === 0) {
      storage.setSyncFlag(true);
      return;
    }

    // Split into batches of 100 (API limit)
    const batches: string[][] = [];
    for (let i = 0; i < storedChapters.length; i += 100) {
      batches.push(storedChapters.slice(i, i + 100));
    }

    // Sync all batches
    Promise.all(
      batches.map((batch) =>
        markChaptersReadMutation({ chapterIds: batch }).catch(
          (error) => {
            logger.error(
              'Failed to sync read chapters to backend:',
              error,
            );
          },
        ),
      ),
    )
      .then(() => {
        // Clear localStorage after successful sync
        storage.clearReadChapters();
        storage.setSyncFlag(true);
        logger.info(
          `Successfully synced ${storedChapters.length} chapters to backend`,
        );
      })
      .catch((error) => {
        logger.error('Failed to sync chapters:', error);
      });
  }, [
    isAuthenticated,
    authLoading,
    markChaptersReadMutation,
    storage,
  ]);
}
