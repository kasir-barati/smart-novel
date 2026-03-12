import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { CustomLoggerService } from 'nestjs-backend-common';

import {
  CHECK_POLICY_KEY,
  CheckPolicyMetadata,
  IS_PUBLIC_KEY,
} from '../decorators';
import {
  AUTHORIZATION_PROVIDER,
  type IAuthorizationProvider,
  type IAuthUser,
} from '../interfaces';

/**
 * @description GraphQL-aware ABAC policies guard.
 * Reads @CheckPolicy() metadata and calls the injected
 * IAuthorizationProvider to make attribute-based access decisions.
 *
 * Expects the JwtAuthGuard to have already run and attached
 * the IAuthUser to the request.
 *
 * Resource attributes are resolved from GQL args:
 * - `id` → resourceId
 * - Any other args are passed as resourceAttributes
 */
@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    @Inject(AUTHORIZATION_PROVIDER)
    private readonly authzProvider: IAuthorizationProvider,
    private readonly reflector: Reflector,
    private readonly logger: CustomLoggerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    // Skip if no @CheckPolicy() decorator is present
    const policyMeta =
      this.reflector.getAllAndOverride<CheckPolicyMetadata>(
        CHECK_POLICY_KEY,
        [context.getHandler(), context.getClass()],
      );

    if (!policyMeta) {
      return true;
    }

    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    const user = request.user as IAuthUser | undefined;

    if (!user) {
      throw new ForbiddenException(
        'No authenticated user found for policy check',
      );
    }

    const args = ctx.getArgs() as Record<string, unknown>;
    const resourceId = (args.id as string) ?? 'unknown';

    // Collect any extra args as resource attributes for ABAC
    const resourceAttributes: Record<string, string> = {};

    for (const [key, value] of Object.entries(args)) {
      if (key !== 'id' && typeof value === 'string') {
        resourceAttributes[key] = value;
      }
    }

    const allowed = await this.authzProvider.isAllowed({
      principal: user,
      resource: policyMeta.resource,
      resourceId,
      action: policyMeta.action,
      resourceAttributes,
    });

    if (!allowed) {
      this.logger.warn(
        `Access denied: user=${user.sub} action=${policyMeta.action} resource=${policyMeta.resource}/${resourceId}`,
      );
      throw new ForbiddenException(
        `You do not have permission to ${policyMeta.action} this ${policyMeta.resource}`,
      );
    }

    return true;
  }
}
