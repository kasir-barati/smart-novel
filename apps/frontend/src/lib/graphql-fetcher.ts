/**
 * @description
 * Custom fetcher used by the generated React Query hooks.
 *
 * It reads the OIDC access token from `localStorage` (where `oidc-client-ts` persists it) and sends it as a Bearer token.
 */
function getAccessToken(): string | null {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    /**
     * @description oidc-client-ts stores user objects under a key that starts with "oidc.user:"
     */
    const isOidcUserKey = key?.startsWith('oidc.user:');

    if (!key || !isOidcUserKey) {
      continue;
    }

    try {
      const user = JSON.parse(localStorage.getItem(key) ?? '');
      return user?.access_token ?? null;
    } catch {
      return null;
    }
  }

  return null;
}

export function graphqlFetcher<TResult, TVariables>(
  query: string | { toString(): string },
  variables?: TVariables,
  _options?: RequestInit['headers'],
): () => Promise<TResult> {
  const VITE_SERVICE_URL = import.meta.env.VITE_SERVICE_URL;

  if (!VITE_SERVICE_URL) {
    throw new Error(
      'VITE_SERVICE_URL environment variable is not defined',
    );
  }

  return async () => {
    const accessToken = getAccessToken();
    const response = await fetch(`${VITE_SERVICE_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'correlation-id': crypto.randomUUID(),
        ...(accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : {}),
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });
    const json = await response.json();

    if (json.errors) {
      const message =
        json.errors[0]?.message ?? 'Unknown GraphQL error';
      throw new Error(message);
    }

    return json.data;
  };
}
