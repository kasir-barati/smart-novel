import { DynamicModule, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { ZitadelModule } from '../zitadel';
import {
  ASYNC_OPTIONS_TYPE,
  type AuthModuleOptions,
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
} from './auth.module-definition';
import { AuthResolver } from './auth.resolver';
import { PoliciesGuard } from './guards';
import { AUTHORIZATION_PROVIDER } from './interfaces';
import { createAuthConfig } from './lib';
import { RbacAuthorizationProvider } from './providers';
import { AuthService } from './services';

@Module({
  imports: [],
  providers: [
    AuthResolver,
    AuthService,
    PoliciesGuard,
    RbacAuthorizationProvider,
    {
      provide: AUTHORIZATION_PROVIDER,
      useClass: RbacAuthorizationProvider,
    },
    // PoliciesGuard is registered globally for RBAC
    {
      provide: APP_GUARD,
      useClass: PoliciesGuard,
    },
  ],
  exports: [AUTHORIZATION_PROVIDER, PoliciesGuard],
})
export class AuthModule extends ConfigurableModuleClass {
  static override register(
    options: AuthModuleOptions,
  ): DynamicModule {
    const authConfig = createAuthConfig(options);

    return {
      module: AuthModule,
      imports: [
        ZitadelModule.register(authConfig, {
          globalGuard: true,
          rolesGuard: false, // We use custom PoliciesGuard instead
        }),
      ],
      providers: [
        {
          provide: MODULE_OPTIONS_TOKEN,
          useValue: options,
        },
        AuthResolver,
        AuthService,
        PoliciesGuard,
        RbacAuthorizationProvider,
        {
          provide: AUTHORIZATION_PROVIDER,
          useClass: RbacAuthorizationProvider,
        },
        {
          provide: APP_GUARD,
          useClass: PoliciesGuard,
        },
      ],
      exports: [AUTHORIZATION_PROVIDER, PoliciesGuard],
    };
  }

  static override registerAsync(
    options: typeof ASYNC_OPTIONS_TYPE,
  ): DynamicModule {
    // Let the parent ConfigurableModuleClass handle useClass/useFactory
    // resolution properly (it calls create() on the factory class)
    const baseModule = super.registerAsync(options);

    return {
      ...baseModule,
      imports: [
        ...(baseModule.imports || []),
        ZitadelModule.registerAsync({
          imports: options.imports || [],
          useFactory: async (...args: unknown[]) => {
            const authOptions = args[0] as AuthModuleOptions;
            return createAuthConfig(authOptions);
          },
          inject: [MODULE_OPTIONS_TOKEN],
        }),
      ],
      providers: [
        ...(baseModule.providers || []),
        AuthResolver,
        AuthService,
        PoliciesGuard,
        RbacAuthorizationProvider,
        {
          provide: AUTHORIZATION_PROVIDER,
          useClass: RbacAuthorizationProvider,
        },
        {
          provide: APP_GUARD,
          useClass: PoliciesGuard,
        },
      ],
      exports: [
        ...((baseModule.exports as any[]) || []),
        AUTHORIZATION_PROVIDER,
        PoliciesGuard,
        MODULE_OPTIONS_TOKEN,
      ],
    };
  }
}
