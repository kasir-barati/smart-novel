import type { JWT } from '@auth/core/jwt';

import { AdapterUser } from '@auth/core/adapters';
import Zitadel from '@auth/core/providers/zitadel';
import { Account, Profile, User } from '@auth/core/types';
import { randomUUID } from 'crypto';
import * as oidc from 'openid-client';

import type { IZitadelModuleOptions, Session } from '../../zitadel';

import { AuthModuleOptions } from '../auth.module-definition';
import { ZITADEL_SCOPES } from './scopes';

/**
 * Automatically refreshes an expired access token using the refresh token.
 *
 * When a user's access token expires (typically after 1 hour), this function
 * seamlessly exchanges the refresh token for a new access token, allowing the
 * user to continue using the application without having to log in again.
 *
 * @param token - The current JWT containing the refresh token and other session data
 * @param options - The auth module options containing ZITADEL configuration
 * @returns Promise resolving to updated JWT with new tokens or error state
 */
async function refreshAccessToken(
  token: JWT,
  options: AuthModuleOptions,
): Promise<JWT> {
  if (!token.refreshToken) {
    // eslint-disable-next-line no-console
    console.error('No refresh token available for refresh');
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }

  try {
    const oidcConfig = await oidc.discovery(
      new URL(options.domain),
      options.clientId || '',
      options.clientSecret,
    );

    const tokenEndpointResponse = await oidc.refreshTokenGrant(
      oidcConfig,
      token.refreshToken as string,
    );

    return {
      ...token,
      accessToken: tokenEndpointResponse.access_token,
      expiresAt: tokenEndpointResponse.expires_in
        ? Date.now() + tokenEndpointResponse.expires_in * 1000
        : Date.now() + 3600 * 1000,
      refreshToken:
        tokenEndpointResponse.refresh_token ?? token.refreshToken,
      error: undefined,
    };
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Token refresh failed:', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

/**
 * Constructs a secure logout URL for ZITADEL with CSRF protection.
 *
 * @param idToken - The user's ID token from their current session
 * @param options - The auth module options containing ZITADEL configuration
 * @returns Promise containing the logout URL to redirect to and state value for validation
 */
export async function buildLogoutUrl(
  idToken: string,
  options: AuthModuleOptions,
): Promise<{ url: string; state: string }> {
  const oidcConfig = await oidc.discovery(
    new URL(options.domain),
    options.clientId || '',
    options.clientSecret,
  );

  const state: string = randomUUID();
  const urlObj = oidc.buildEndSessionUrl(oidcConfig, {
    id_token_hint: idToken,
    post_logout_redirect_uri: options.postLogoutUrl,
    state,
  });

  return { url: urlObj.toString(), state };
}

/**
 * Factory function that creates Auth.js configuration for ZITADEL authentication with token refresh.
 *
 * This configuration implements OAuth 2.0 Authorization Code Flow with PKCE
 * for maximum security, including automatic token refresh.
 *
 * @param options - The auth module options containing ZITADEL configuration
 * @returns Complete Auth.js configuration object
 */
export function createAuthConfig(
  options: AuthModuleOptions,
): IZitadelModuleOptions {
  return {
    providers: [
      Zitadel({
        issuer: options.domain,
        clientId: options.clientId || '',
        clientSecret: options.clientSecret,
        authorization: {
          params: {
            scope: ZITADEL_SCOPES,
          },
        },
      }),
    ],

    trustHost: true,
    session: {
      strategy: 'jwt',
      maxAge: Number(options.sessionDuration) || 3600,
    },

    secret: options.sessionSecret,

    pages: {
      signIn: '/auth/login',
      error: '/auth/error',
    },

    callbacks: {
      /**
       * Controls where users are redirected after successful authentication.
       */
      async redirect(redirectOptions: {
        baseUrl: string;
      }): Promise<string> {
        return `${redirectOptions.baseUrl}${options.postLoginUrl || '/'}`;
      },

      /**
       * Called whenever a JWT is created or updated.
       * Stores tokens and handles refresh logic.
       */
      async jwt(params: {
        token: JWT;
        account?: Account | null;
        user: User | AdapterUser;
        profile?: Profile;
        trigger?: 'signIn' | 'signUp' | 'update';
        isNewUser?: boolean;
        session?: Session;
      }): Promise<JWT> {
        const { token, account, user } = params;

        // Initial sign in - store all tokens
        if (account && user) {
          return {
            ...token,
            idToken: account.id_token,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            expiresAt: account.expires_at
              ? account.expires_at * 1000
              : Date.now() + 3600 * 1000,
            error: undefined,
          };
        }

        // Token still valid - return as-is
        if (Date.now() < (token.expiresAt as number)) {
          return token;
        }

        // Token expired - refresh it
        return refreshAccessToken(token, options);
      },

      /**
       * Shapes the session object that your application receives.
       */
      async session({ session, token }) {
        if (typeof token.idToken === 'string') {
          (session as any).idToken = token.idToken;
        }
        if (typeof token.accessToken === 'string') {
          (session as any).accessToken = token.accessToken;
        }
        if (typeof token.error === 'string') {
          (session as any).error = token.error;
        }
        return session;
      },
    },
  };
}
