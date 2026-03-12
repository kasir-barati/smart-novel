import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { ConfigurableModuleClass } from './auth.module-definition';
import { JwtAuthGuard, PoliciesGuard } from './guards';
import { AUTH_PROVIDER, AUTHORIZATION_PROVIDER } from './interfaces';
import {
  CerbosAuthorizationProvider,
  ZitadelAuthProvider,
} from './providers';

@Module({
  providers: [
    ZitadelAuthProvider,
    CerbosAuthorizationProvider,
    JwtAuthGuard,
    PoliciesGuard,
    {
      provide: AUTH_PROVIDER,
      useClass: ZitadelAuthProvider,
    },
    {
      provide: AUTHORIZATION_PROVIDER,
      useClass: CerbosAuthorizationProvider,
    },
    // Guards are registered globally, use @Public() to opt out.
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PoliciesGuard,
    },
  ],
  exports: [
    AUTH_PROVIDER,
    AUTHORIZATION_PROVIDER,
    JwtAuthGuard,
    PoliciesGuard,
  ],
})
export class AuthModule extends ConfigurableModuleClass {}
