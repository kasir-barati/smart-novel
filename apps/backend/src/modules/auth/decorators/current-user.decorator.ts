import type { Request } from 'express';

import {
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

import type { Session } from '../../zitadel';
import type { IAuthUser } from '../interfaces';

/**
 * @description Extract the authenticated `IAuthUser` from the GraphQL context.
 *
 * The session is placed on the request by the zitadel auth middleware.
 * This decorator transforms the session into the IAuthUser format.
 *
 * @example `@CurrentUser() user: IAuthUser`
 */
export const CurrentUser = createParamDecorator(
  (
    _data: unknown,
    context: ExecutionContext,
  ): IAuthUser | undefined => {
    const ctx = GqlExecutionContext.create(context);
    const request: Request & { session?: Session } =
      ctx.getContext().req;
    const session = request.session;

    if (!session?.user) {
      return undefined;
    }

    // Transform session user to IAuthUser format
    const user = session.user as any;

    // Extract roles from ZITADEL token claims
    const rolesObj = user['urn:zitadel:iam:org:project:roles'] ?? {};
    const roles = Object.keys(rolesObj);

    // Extract metadata
    const rawMetadata = user['urn:zitadel:iam:user:metadata'] ?? {};
    const metadata: Record<string, string> = {};

    for (const [key, value] of Object.entries(rawMetadata)) {
      try {
        // ZITADEL stores metadata as base64-encoded strings
        metadata[key] = Buffer.from(
          value as string,
          'base64',
        ).toString('utf-8');
      } catch {
        metadata[key] = value as string;
      }
    }

    return {
      sub: user.sub ?? '',
      email: user.email ?? '',
      emailVerified: user.email_verified ?? false,
      orgId: user['urn:zitadel:iam:org:id'],
      roles,
      metadata,
    };
  },
);
