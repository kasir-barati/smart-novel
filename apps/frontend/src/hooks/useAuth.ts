import { useAuth as useOidcAuth } from 'react-oidc-context';

/**
 * Thin wrapper around `react-oidc-context` so the rest of the app
 * keeps the same `useAuth()` API surface it had before.
 *
 * The OIDC provider is configured in `main.tsx`.
 */
export function useAuth() {
  const auth = useOidcAuth();

  return {
    /** Decoded user profile from the ID token */
    user: auth.user?.profile
      ? {
          sub: auth.user.profile.sub,
          email: (auth.user.profile.email as string) ?? '',
          emailVerified: !!auth.user.profile.email_verified,
          orgId: auth.user.profile['urn:zitadel:iam:org:id'] as
            | string
            | undefined,
          roles: Object.keys(
            (auth.user.profile[
              'urn:zitadel:iam:org:project:roles'
            ] as Record<string, unknown>) ?? {},
          ),
        }
      : null,
    /** Raw OIDC access token (Bearer) to send to the backend */
    accessToken: auth.user?.access_token ?? null,
    /** True while the silent-renew / redirect check is in progress */
    loading: auth.isLoading,
    /** User has a valid session */
    isAuthenticated: auth.isAuthenticated,
    /** Kick off the Authorization Code + PKCE redirect */
    login: () => auth.signinRedirect(),
    /** End session at the IdP and clear local state */
    logout: () =>
      auth.signoutRedirect({
        post_logout_redirect_uri: window.location.origin,
      }),
    /** Re-check the session (useful after callback) */
    checkSession: () => auth.signinSilent(),
  };
}
