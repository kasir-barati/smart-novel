import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule } from '../prisma/prisma.module';
import { ConfigurableModuleClass } from './auth.module-definition';
import { AuthResolver } from './auth.resolver';
import { JwtAuthGuard, PoliciesGuard } from './guards';
import { AUTH_PROVIDER, AUTHORIZATION_PROVIDER } from './interfaces';
import {
  RbacAuthorizationProvider,
  ZitadelAuthProvider,
} from './providers';
import { AuthService } from './services';

@Module({
  imports: [PrismaModule],
  providers: [
    AuthService,
    AuthResolver,
    ZitadelAuthProvider,
    RbacAuthorizationProvider,
    JwtAuthGuard,
    PoliciesGuard,
    {
      provide: AUTH_PROVIDER,
      useClass: ZitadelAuthProvider,
    },
    {
      provide: AUTHORIZATION_PROVIDER,
      useClass: RbacAuthorizationProvider,
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
