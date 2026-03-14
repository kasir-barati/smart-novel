import {
  ConfigurableModuleBuilder,
  ConfigurableModuleOptionsFactory,
} from '@nestjs/common';
import { CommonModuleOptions } from 'nestjs-backend-common';

export type ExtraAuthModuleOptions = CommonModuleOptions;

export interface AuthModuleOptions {
  /**
   * @description OIDC issuer URL — the external/public URL used for JWT issuer validation (e.g. http://localhost:8085)
   */
  issuerUrl: string;
  /**
   * @description
   * Internal URL used to fetch OIDC discovery & JWKS when running in Docker.
   * Falls back to `issuerUrl` when not provided (e.g. outside of Docker).
   */
  issuerInternalUrl?: string;
  /**
   * @description Cerbos HTTP decision endpoint (e.g. http://cerbos:3592)
   */
  cerbosUrl: string;
}

export type RegisterAuthModuleOptions = AuthModuleOptions &
  ExtraAuthModuleOptions;

export const MODULE_EXTRAS_TOKEN = 'AUTH_MODULE_EXTRAS_TOKEN';

export const {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN: AUTH_MODULE_OPTIONS_TOKEN,
  ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<AuthModuleOptions>()
  .setClassMethodName('register')
  .setExtras<ExtraAuthModuleOptions>(
    { global: false },
    (definition, extras) => ({
      ...definition,
      global: extras.global,
    }),
  )
  .setFactoryMethodName('create')
  .build();

export type AuthModuleOptionsFactory =
  ConfigurableModuleOptionsFactory<AuthModuleOptions, 'create'>;
