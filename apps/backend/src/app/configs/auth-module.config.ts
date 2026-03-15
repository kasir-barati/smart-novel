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
      clientId: this.appConfig.ZITADEL_CLIENT_ID,
      clientIdFile: this.appConfig.ZITADEL_CLIENT_ID_FILE,
      pat: this.appConfig.ZITADEL_PAT,
      patFile: this.appConfig.ZITADEL_PAT_FILE,
      domain: this.appConfig.ZITADEL_DOMAIN,
      clientSecret: this.appConfig.ZITADEL_CLIENT_SECRET,
      callbackUrl: this.appConfig.ZITADEL_CALLBACK_URL,
      postLoginUrl: this.appConfig.ZITADEL_POST_LOGIN_URL ?? '/',
      postLogoutUrl: this.appConfig.ZITADEL_POST_LOGOUT_URL,
      sessionSecret: this.appConfig.SESSION_SECRET,
      sessionDuration: this.appConfig.SESSION_DURATION,
    };
  }
}
