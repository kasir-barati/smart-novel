import axios from 'axios';
import { useCallback, useRef } from 'react';

import { WordExplanation } from '../types/graphql.types';
import { TokenBucket } from '../utils/token-bucket';

interface ExplainInput {
  context: string;
  word: string;
}

interface ExplainState {
  data?: WordExplanation;
  error?: string;
  rateLimited?: boolean;
}

const cacheEntryLimit = Number(
  import.meta.env.VITE_EXPLAIN_CACHE_MAX_ENTRIES ?? 12,
);

const tokenBucket = new TokenBucket({
  capacity: Number(import.meta.env.VITE_EXPLAIN_RATE_CAPACITY ?? 6),
  refillPerSecond: Number(
    import.meta.env.VITE_EXPLAIN_RATE_REFILL_PER_SEC ?? 1.5,
  ),
});

const explainMutation = `#graphql
  mutation ExplainWord($word: String!, $context: String!) {
    explain(word: $word, context: $context) {
      cacheKey
      meaning
      antonyms
      synonyms
      simplifiedExplanation
    }
  }
`;

export function useWordExplain() {
  const cacheByKeyRef = useRef<Map<string, WordExplanation>>(
    new Map(),
  );
  const requestToCacheKeyRef = useRef<Map<string, string>>(new Map());
  const inFlightRequestRef = useRef<Promise<ExplainState> | null>(
    null,
  );
  const inFlightSignatureRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const addToCache = useCallback((data: WordExplanation) => {
    const cache = cacheByKeyRef.current;
    cache.set(data.cacheKey, data);

    while (cache.size > cacheEntryLimit) {
      const firstKey = cache.keys().next().value;
      if (firstKey) {
        cache.delete(firstKey);
      }
    }
  }, []);

  const explain = useCallback(
    async (
      apiPost: (
        url: string,
        body: unknown,
        config?: { signal?: AbortSignal },
      ) => Promise<{
        data: { data?: { explain?: WordExplanation } };
      }>,
      input: ExplainInput,
    ): Promise<ExplainState> => {
      const signature = `${input.word.toLowerCase()}::${input.context}`;
      const existingKey = requestToCacheKeyRef.current.get(signature);

      if (existingKey) {
        const cached = cacheByKeyRef.current.get(existingKey);
        if (cached) {
          return { data: cached };
        }
      }

      if (
        inFlightSignatureRef.current === signature &&
        inFlightRequestRef.current
      ) {
        return inFlightRequestRef.current;
      }

      if (!tokenBucket.take(1)) {
        return { rateLimited: true };
      }

      if (abortRef.current) {
        abortRef.current.abort();
      }

      const controller = new AbortController();
      abortRef.current = controller;
      inFlightSignatureRef.current = signature;

      const request = apiPost(
        '/graphql',
        {
          query: explainMutation,
          variables: { word: input.word, context: input.context },
        },
        { signal: controller.signal },
      )
        .then((response) => {
          const explained = response.data?.data?.explain;

          if (!explained) {
            return { error: 'No explanation returned.' };
          }

          requestToCacheKeyRef.current.set(
            signature,
            explained.cacheKey,
          );
          addToCache(explained);
          return { data: explained };
        })
        .catch((error) => {
          if (
            axios.isCancel(error) ||
            error?.code === 'ERR_CANCELED'
          ) {
            return { error: 'Request cancelled.' };
          }

          return { error: 'Failed to fetch explanation.' };
        })
        .finally(() => {
          if (inFlightSignatureRef.current === signature) {
            inFlightSignatureRef.current = null;
            inFlightRequestRef.current = null;
          }

          if (abortRef.current === controller) {
            abortRef.current = null;
          }
        });

      inFlightRequestRef.current = request;
      return request;
    },
    [addToCache],
  );

  return { explain };
}
