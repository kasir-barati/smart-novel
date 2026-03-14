import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CustomLoggerService } from 'nestjs-backend-common';

import type { IAuthUser } from './interfaces';

import { CurrentUser, Public } from './decorators';
import { LoginInput } from './inputs';
import { AuthService } from './services';
import { Login, WhoAmI } from './types';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: CustomLoggerService,
  ) {}

  @Public()
  @Mutation(() => Login, {
    description:
      'Authenticate with email and password to receive a JWT access token',
  })
  async login(@Args('input') input: LoginInput): Promise<Login> {
    this.logger.log(`Login attempt for: ${input.email}`);

    return this.authService.login(input.email, input.password);
  }

  @Query(() => WhoAmI, {
    description:
      "Return the authenticated user's profile from the JWT token",
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
