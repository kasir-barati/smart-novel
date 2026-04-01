import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

import type { IAuthUser } from '../interfaces';

/**
 * @description
 * Extract the authenticated `IAuthUser` from the GraphQL context.
 *
 * The user is placed on the request by `JwtAuthGuard` after JWT validation via `ZitadelAuthProvider.validateToken()`.
 *
 * @example `@CurrentUser() user: IAuthUser`
 */
export const CurrentUser = createParamDecorator(
  (
    _data: unknown,
    context: ExecutionContext,
  ): IAuthUser | undefined => {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    /**
     * @description
     * JwtAuthGuard sets request.user after successful JWT validation
     */
    const user: IAuthUser | undefined = request.user;

    if (!user) {
      throw new UnauthorizedException('Not authenticated');
    }

    return user;
  },
);
