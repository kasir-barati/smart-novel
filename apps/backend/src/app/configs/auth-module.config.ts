import { Inject } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';

import {
  type AuthModuleOptions,
  AuthModuleOptionsFactory,
} from '../../modules/auth/auth.module-definition';
import { appConfigs } from './app.config';

export class AuthModuleConfig implements AuthModuleOptionsFactory {
  constructor(
    @Inject(appConfigs.KEY)
    private readonly appConfig: ConfigType<typeof appConfigs>,
  ) {}

  create(): AuthModuleOptions {
    return {
      issuerUrl: this.appConfig.ZITADEL_ISSUER_URL,
      issuerInternalUrl: this.appConfig.ZITADEL_INTERNAL_URL,
      cerbosUrl: this.appConfig.CERBOS_URL,
    };
  }
}
