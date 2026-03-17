import { UnauthorizedException } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { CustomLoggerService } from 'nestjs-backend-common';

import type { IAuthUser } from './interfaces';

import { CurrentUser } from './decorators';
import { WhoAmI } from './types';

@Resolver()
export class AuthResolver {
  constructor(private readonly logger: CustomLoggerService) {}

  @Query(() => WhoAmI, {
    description:
      "Return the authenticated user's profile from the JWT",
  })
  whoAmI(@CurrentUser() user?: IAuthUser): WhoAmI {
    // FIXME: This should be already part of the guard.
    if (!user) {
      throw new UnauthorizedException('Not authenticated');
    }

    return {
      sub: user.sub,
      email: user.email,
      emailVerified: user.emailVerified,
      orgId: user.orgId,
      roles: user.roles,
    };
  }
}
