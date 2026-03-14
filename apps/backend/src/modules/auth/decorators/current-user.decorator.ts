import {
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

import type { IAuthUser } from '../interfaces';

/**
 * @description Extract the authenticated `IAuthUser` from the GraphQL context.
 *
 * The user is placed on the context by `JwtAuthGuard` after token validation.
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

    return request.user as IAuthUser | undefined;
  },
);
