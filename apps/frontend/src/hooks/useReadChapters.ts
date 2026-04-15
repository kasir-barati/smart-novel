import { useCallback, useState } from 'react';

import { useMarkChaptersReadMutation } from '../generated/graphql';
import {
  readChaptersStorage,
  ReadChaptersStorage,
} from '../services/read-chapters-storage.service';
import { logger } from '../utils/logger';
import { useAuth } from './useAuth';
import { useSyncReadChapters } from './useSyncReadChapters';

interface UseReadChaptersOptions {
  storage?: ReadChaptersStorage;
}

/**
 * @summary Hook to manage read chapters state.
 * @description Supports both authenticated (backend) and unauthenticated (localStorage) users.
 */
export function useReadChapters(
  options: UseReadChaptersOptions = {},
) {
  const storage = options.storage ?? readChaptersStorage;
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [readChapters, setReadChapters] = useState<Set<string>>(() =>
    storage.getReadChapters(),
  );
  const { mutateAsync: markChaptersReadMutation } =
    useMarkChaptersReadMutation();

  // Sync localStorage chapters to backend when user logs in
  useSyncReadChapters({ storage });

  const markAsRead = useCallback(
    (chapterId: string) => {
      setReadChapters((prev) => {
        const newSet = new Set(prev);
        newSet.add(chapterId);

        if (isAuthenticated && !authLoading) {
          // User is authenticated, call backend mutation
          markChaptersReadMutation({ chapterIds: [chapterId] }).catch(
            (error) => {
              logger.error(
                'Failed to mark chapter as read on backend:',
                error,
              );
              // Fallback to localStorage on error
              storage.saveReadChapters(newSet);
            },
          );
        } else {
          // User is not authenticated, store in localStorage
          storage.saveReadChapters(newSet);
        }

        return newSet;
      });
    },
    [isAuthenticated, authLoading, markChaptersReadMutation, storage],
  );

  const isRead = useCallback(
    (chapterId: string) => {
      return readChapters.has(chapterId);
    },
    [readChapters],
  );

  return { markAsRead, isRead };
}
