import type { Request } from 'express';

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { isString } from 'class-validator';
import { CustomLoggerService } from 'nestjs-backend-common';

import {
  CHECK_POLICY_KEY,
  CheckPolicyMetadata,
  IS_PUBLIC_KEY,
} from '../decorators';
import {
  AUTHORIZATION_PROVIDER,
  type IAuthorizationProvider,
} from '../interfaces';

/**
 * @description
 * GraphQL-aware ABAC policies guard.
 * Reads `@CheckPolicy()` metadata and calls the injected `IAuthorizationProvider` to make attribute-based access decisions.
 *
 * Expects the `JwtAuthGuard` to have already run and attached the `IAuthUser` to the request.
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

  async canActivate(
    executionContext: ExecutionContext,
  ): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [executionContext.getHandler(), executionContext.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const policyMeta =
      this.reflector.getAllAndOverride<CheckPolicyMetadata>(
        CHECK_POLICY_KEY,
        [executionContext.getHandler(), executionContext.getClass()],
      );

    if (!policyMeta) {
      return true;
    }

    const context = GqlExecutionContext.create(executionContext);
    const request: Request & { session?: any } =
      context.getContext().req;
    const session = request.session;

    if (!session?.user) {
      throw new ForbiddenException(
        'No authenticated user found for policy check',
      );
    }

    // Extract user info from session (using same logic as CurrentUser decorator)
    const sessionUser = session.user as any;
    const rolesObj =
      sessionUser['urn:zitadel:iam:org:project:roles'] ?? {};
    const roles = Object.keys(rolesObj);
    const rawMetadata =
      sessionUser['urn:zitadel:iam:user:metadata'] ?? {};
    const metadata: Record<string, string> = {};

    for (const [key, value] of Object.entries(rawMetadata)) {
      try {
        metadata[key] = Buffer.from(
          value as string,
          'base64',
        ).toString('utf-8');
      } catch {
        metadata[key] = value as string;
      }
    }

    const user = {
      sub: sessionUser.sub ?? '',
      email: sessionUser.email ?? '',
      emailVerified: sessionUser.email_verified ?? false,
      orgId: sessionUser['urn:zitadel:iam:org:id'],
      roles,
      metadata,
    };

    const args = context.getArgs() as RequestArgs;
    const resourceId = args.id ?? 'unknown';
    const resourceAttributes: Record<string, string> = {};

    for (const [key, value] of Object.entries(args)) {
      if (isNotId(key) && isString(value)) {
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

function isNotId(key: string): boolean {
  return key !== 'id';
}

interface RequestArgs {
  id?: string;
  [key: string]: unknown;
}
