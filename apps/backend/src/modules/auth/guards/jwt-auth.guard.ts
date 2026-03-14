import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { CustomLoggerService } from 'nestjs-backend-common';

import { IS_PUBLIC_KEY } from '../decorators';
import { AUTH_PROVIDER, type IAuthProvider } from '../interfaces';

/**
 * @description
 * GraphQL-aware JWT authentication guard.
 *
 * Use `@Public()` decorator to skip authentication for specific resolvers.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(AUTH_PROVIDER)
    private readonly authProvider: IAuthProvider,
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

    const context = GqlExecutionContext.create(executionContext);
    const request = context.getContext().req;
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(
        'Missing Bearer token in Authorization header',
      );
    }

    try {
      const user = await this.authProvider.validateToken(token);

      request.user = user;

      return true;
    } catch (error) {
      this.logger.error(`Token validation failed: ${error}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader(
    request: Record<string, unknown>,
  ): string | undefined {
    const headers = request.headers as Record<string, string>;
    const authorization = headers?.authorization;

    if (!authorization) {
      return undefined;
    }

    const [type, token] = authorization.split(' ');

    return type === 'Bearer' ? token : undefined;
  }
}
