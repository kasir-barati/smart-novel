import { DynamicModule, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import {
  ASYNC_OPTIONS_TYPE,
  type AuthModuleOptions,
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
} from './auth.module-definition';
import { AuthResolver } from './auth.resolver';
import { JwtAuthGuard, PoliciesGuard } from './guards';
import { AUTH_PROVIDER, AUTHORIZATION_PROVIDER } from './interfaces';
import {
  RbacAuthorizationProvider,
  ZitadelAuthProvider,
} from './providers';

/**
 * @description
 * Authentication & authorization module.
 *
 * Registers two global guards in order:
 * 1. `JwtAuthGuard` — **Authentication**: validates the Bearer JWT via JWKS and attaches `IAuthUser` to `request.user`.
 * 2. `PoliciesGuard` — **Authorization**: reads `@CheckPolicy()` metadata and delegates to `RbacAuthorizationProvider` for RBAC decisions.
 *
 * Use `@Public()` to bypass both guards on specific resolvers.
 */
@Module({})
export class AuthModule extends ConfigurableModuleClass {
  static override register(
    options: AuthModuleOptions,
  ): DynamicModule {
    return {
      module: AuthModule,
      providers: [
        {
          provide: MODULE_OPTIONS_TOKEN,
          useValue: options,
        },
        ...AuthModule.coreProviders(),
      ],
      exports: [
        AUTHORIZATION_PROVIDER,
        AUTH_PROVIDER,
        PoliciesGuard,
        MODULE_OPTIONS_TOKEN,
      ],
    };
  }

  static override registerAsync(
    options: typeof ASYNC_OPTIONS_TYPE,
  ): DynamicModule {
    const baseModule = super.registerAsync(options);

    return {
      ...baseModule,
      providers: [
        ...(baseModule.providers || []),
        ...AuthModule.coreProviders(),
      ],
      exports: [
        ...((baseModule.exports as any[]) || []),
        AUTHORIZATION_PROVIDER,
        AUTH_PROVIDER,
        PoliciesGuard,
        MODULE_OPTIONS_TOKEN,
      ],
    };
  }

  /**
   * Shared providers used by both `register` and `registerAsync`.
   */
  private static coreProviders() {
    return [
      // Auth provider (JWKS-based JWT validation)
      ZitadelAuthProvider,
      {
        provide: AUTH_PROVIDER,
        useClass: ZitadelAuthProvider,
      },
      // Authorization provider (RBAC)
      RbacAuthorizationProvider,
      {
        provide: AUTHORIZATION_PROVIDER,
        useClass: RbacAuthorizationProvider,
      },
      // Global authentication guard (validates Bearer JWT)
      {
        provide: APP_GUARD,
        useClass: JwtAuthGuard,
      },
      // Global authorization guard (reads @CheckPolicy() metadata)
      PoliciesGuard,
      {
        provide: APP_GUARD,
        useClass: PoliciesGuard,
      },
      // GraphQL resolver
      AuthResolver,
    ];
  }
}
