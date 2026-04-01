import { useAuth as useOidcAuth } from 'react-oidc-context';

/**
 * Thin wrapper around `react-oidc-context` so the rest of the app
 * keeps the same `useAuth()` API surface it had before.
 *
 * The OIDC provider is configured in `main.tsx`.
 */
export function useAuth() {
  const auth = useOidcAuth();
  const user = auth.user?.profile
    ? {
        sub: auth.user.profile.sub,
        name: auth.user.profile.name ?? '',
        preferredUsername: auth.user.profile.preferred_username ?? '',
        email: auth.user.profile.email ?? '',
        emailVerified: !!auth.user.profile.email_verified,
        orgId: auth.user.profile['urn:zitadel:iam:org:id'] as
          | string
          | undefined,
        roles: Object.keys(
          auth.user.profile['urn:zitadel:iam:org:project:roles'] ??
            {},
        ),
      }
    : null;

  return {
    /** @description Decoded user profile from the ID token */
    user,
    /** @description Raw OIDC access token (Bearer) to send to the backend */
    accessToken: auth.user?.access_token ?? null,
    /** @description True while the silent-renew / redirect check is in progress */
    loading: auth.isLoading,
    /** @description User has a valid session */
    isAuthenticated: auth.isAuthenticated,
    /** @description Kick off the Authorization Code + PKCE redirect */
    login: () => auth.signinRedirect(),
    /** @description End session at the IdP and clear local state */
    logout: () =>
      auth.signoutRedirect({
        post_logout_redirect_uri: window.location.origin,
      }),
    /** @description Re-check the session (useful after callback) */
    checkSession: () => auth.signinSilent(),
  };
}
