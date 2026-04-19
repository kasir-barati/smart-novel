import { useEffect, useRef } from 'react';

import { wsClient } from '../lib/graphql-ws-client';
import { logger } from '../utils/logger';

interface UseGraphQLSubscriptionOptions<TData> {
  /** The GraphQL subscription query string */
  query: string;
  /** Variables to pass to the subscription */
  variables: Record<string, unknown>;
  /** Only subscribe when true */
  enabled: boolean;
  /** Called when new data arrives from the subscription */
  onData: (data: TData) => void;
  /** Called when the subscription encounters an error */
  onError?: (error: unknown) => void;
}

/**
 * @summary Generic hook for GraphQL subscriptions via graphql-ws.
 *
 * @description
 * Manages the WebSocket subscription lifecycle (subscribe on mount/when enabled, unsubscribe on unmount/when disabled).
 *
 * @example
 * ```ts
 * useGraphQLSubscription<MySubscription>({
 *   query: MySubscriptionDocument.toString(),
 *   variables: { id: '123' },
 *   enabled: isProcessing,
 *   onData: (data) => {
 *     // Update TanStack Query cache, set state, etc.
 *   },
 * });
 * ```
 */
export function useGraphQLSubscription<TData>({
  query,
  variables,
  enabled,
  onData,
  onError,
}: UseGraphQLSubscriptionOptions<TData>) {
  // Use refs for callbacks to avoid re-subscribing when they change
  const onDataRef = useRef(onData);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onDataRef.current = onData;
    onErrorRef.current = onError;
  }, [onData, onError]);

  // Serialize variables to use as a stable dependency
  const variablesKey = JSON.stringify(variables);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const parsedVariables = JSON.parse(variablesKey);

    const unsubscribe = wsClient.subscribe<TData>(
      {
        query,
        variables: parsedVariables,
      },
      {
        next: (result) => {
          if (result.data) {
            onDataRef.current(result.data);
          }
        },
        error: (err) => {
          if (onErrorRef.current) {
            onErrorRef.current(err);
          } else {
            logger.error('GraphQL subscription error:', err);
          }
        },
        complete: () => {
          // Subscription completed (server-side)
        },
      },
    );

    return () => {
      unsubscribe();
    };
  }, [query, variablesKey, enabled]);
}
