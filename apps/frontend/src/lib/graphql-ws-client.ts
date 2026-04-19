import { createClient } from 'graphql-ws';

function getWsUrl(): string {
  const serviceUrl = import.meta.env.VITE_SERVICE_URL;

  if (!serviceUrl) {
    throw new Error(
      'VITE_SERVICE_URL environment variable is not defined',
    );
  }

  // Replace http(s) with ws(s) and append /graphql
  return serviceUrl.replace(/^http/, 'ws') + '/graphql';
}

/**
 * Singleton graphql-ws client for GraphQL subscriptions.
 * Connects to the same backend as the HTTP fetcher, but over WebSocket.
 */
export const wsClient = createClient({
  url: getWsUrl(),
  // Lazy connection: only connects when the first subscription is created
  lazy: true,
  // Auto-reconnect on connection loss
  retryAttempts: 5,
});
