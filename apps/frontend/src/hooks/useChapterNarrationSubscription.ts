import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import {
  ChapterNarrationUpdatedDocument,
  ChapterNarrationUpdatedSubscription,
  GetChapterQuery,
  useGetChapterQuery,
} from '../generated/graphql';
import { useGraphQLSubscription } from './useGraphQLSubscription';

interface UseChapterNarrationSubscriptionOptions {
  chapterId: string;
  novelId: string;
  /** Only subscribe when true (e.g. when narration is processing) */
  enabled: boolean;
}

/**
 * @description
 * Subscribes to real-time chapter narration updates via graphql-ws and updates the TanStack Query cache when the narration status changes.
 */
export function useChapterNarrationSubscription({
  chapterId,
  novelId,
  enabled,
}: UseChapterNarrationSubscriptionOptions) {
  const queryClient = useQueryClient();
  const onData = useCallback(
    (data: ChapterNarrationUpdatedSubscription) => {
      const event = data.chapterNarrationUpdated;
      const queryKey = useGetChapterQuery.getKey({
        novelId,
        chapterId,
      });

      queryClient.setQueryData<GetChapterQuery>(queryKey, (old) => {
        if (!old?.novel?.chapter) {
          return old;
        }

        return {
          ...old,
          novel: {
            ...old.novel,
            chapter: {
              ...old.novel.chapter,
              narrationStatus: event.status,
              narrationUrl:
                event.narrationUrl ?? old.novel.chapter.narrationUrl,
            },
          },
        };
      });
    },
    [chapterId, novelId, queryClient],
  );

  useGraphQLSubscription<ChapterNarrationUpdatedSubscription>({
    query: ChapterNarrationUpdatedDocument.toString(),
    variables: { chapterId },
    enabled: enabled && !!chapterId && !!novelId,
    onData,
  });
}
