import type { User as CoreUser } from '@auth/core/types';

import { CanActivate, ExecutionContext } from '@nestjs/common';

import { IZitadelModuleOptions } from '../zitadel.module-definition';

export type IAuthGuard = CanActivate & {
  handleRequest<TUser = CoreUser>(
    err: Error | null,
    user: TUser | null,
    info: unknown,
    context: ExecutionContext,
  ): TUser;
  getAuthenticateOptions(
    context: ExecutionContext,
  ): IZitadelModuleOptions | undefined;
  getRequest(context: ExecutionContext): unknown;
};
