import type { Request } from 'express';

import { Context, Query, Resolver } from '@nestjs/graphql';
import { CustomLoggerService } from 'nestjs-backend-common';

import type { IAuthUser } from './interfaces';

import { CurrentUser, Public } from './decorators';
import { AuthService } from './services';
import { AuthUrls, WhoAmI } from './types';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly logger: CustomLoggerService,
    private readonly authService: AuthService,
  ) {}

  /**
   * @returns the Auth.js route URLs the frontend should use for sign-in (OIDC Authorization Code + PKCE), sign-out, and session checks.
   *
   * This replaces the old `login` mutation which tried to use the unsupported ROPC grant against ZITADEL.
   */
  @Public()
  @Query(() => AuthUrls, {
    description:
      'Auth.js route URLs for OIDC sign-in, sign-out, session, and callback',
  })
  authUrls(@Context() context: { req: Request }): AuthUrls {
    const req = context.req;
    const protocol = req.protocol;
    const host = req.get('host') ?? 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    return this.authService.getAuthUrls(baseUrl);
  }

  @Query(() => WhoAmI, {
    description:
      "Return the authenticated user's profile from the session",
  })
  whoAmI(@CurrentUser() user: IAuthUser): WhoAmI {
    return {
      sub: user.sub,
      email: user.email,
      emailVerified: user.emailVerified,
      orgId: user.orgId,
      roles: user.roles,
    };
  }
}
