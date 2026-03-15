import { Inject, Injectable } from '@nestjs/common';
import {
  CustomLoggerService,
  urlBuilder,
} from 'nestjs-backend-common';

import type { AuthUrls } from '../types';

import {
  type AuthModuleOptions,
  MODULE_OPTIONS_TOKEN,
} from '../auth.module-definition';

/**
 * @description
 * Provides authentication URL helpers for the Auth.js-powered OIDC flow.
 *
 * ZITADEL does **not** support the Resource Owner Password Credentials (ROPC / `grant_type=password`) grant.  All authentication MUST go through the browser-based Authorization Code + PKCE flow that is already wired up via `ZitadelController → ZitadelMiddleware → @auth/core`.
 *
 * This service simply exposes the well-known Auth.js route URLs so the frontend (or any GraphQL client) can discover them without hard-coding paths.  Token refresh is handled transparently by the Auth.js JWT callback configured in `lib/auth-config.ts`.
 */
@Injectable()
export class AuthService {
  constructor(
    @Inject(MODULE_OPTIONS_TOKEN)
    private readonly options: AuthModuleOptions,
    private readonly logger: CustomLoggerService,
  ) {}

  /**
   * @description
   * Returns the set of Auth.js route URLs that the frontend should use
   * for sign-in, sign-out, session checks, and the OIDC callback.
   *
   * The `signIn` URL triggers the full Authorization Code + PKCE flow
   * with ZITADEL as the identity provider.
   */
  getAuthUrls(baseUrl: string): AuthUrls {
    return {
      signIn: urlBuilder(baseUrl, 'auth', 'signin'),
      signOut: urlBuilder(baseUrl, 'auth', 'signout'),
      session: urlBuilder(baseUrl, 'auth', 'session'),
      callback: urlBuilder(baseUrl, 'auth', 'callback', 'zitadel'),
    };
  }
}
