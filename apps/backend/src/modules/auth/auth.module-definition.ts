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
   * @description OIDC client ID for the ZITADEL application (used for ROPC login).
   * When omitted, the service reads it from `clientIdFile` at startup.
   */
  clientId?: string;
  /**
   * @description Absolute path to a file containing the OIDC client ID.
   * Used in Docker where `init-zitadel-users` writes the client ID to a shared volume.
   * Ignored when `clientId` is provided directly.
   * @example `/zitadel-pat/client-id`
   */
  clientIdFile?: string;
  /**
   * @description Personal Access Token for the ZITADEL service account (machine user).
   * Used to create sessions on behalf of users during login.
   * When omitted, the service reads it from `patFile` at startup.
   */
  pat?: string;
  /**
   * @description Absolute path to a file containing the service account PAT.
   * Used in Docker where ZITADEL writes the PAT to a shared volume.
   * Ignored when `pat` is provided directly.
   * @example `/zitadel-pat/token`
   */
  patFile?: string;
  /**
   * @description The base domain of your ZITADEL instance (e.g. https://zitadel.example.com)
   */
  domain: string;
  /**
   * @description The client secret for your OIDC application (optional for public clients)
   */
  clientSecret?: string;
  /**
   * @description The full URL where ZITADEL will redirect back after authentication
   */
  callbackUrl: string;
  /**
   * @description The URL to redirect after successful login (defaults to '/')
   */
  postLoginUrl?: string;
  /**
   * @description The URL to redirect after logout
   */
  postLogoutUrl: string;
  /**
   * @description Secret string used to sign the session cookie (min 32 characters)
   */
  sessionSecret: string;
  /**
   * @description Duration of the session in seconds
   */
  sessionDuration: number;
}

export type RegisterAuthModuleOptions = AuthModuleOptions &
  ExtraAuthModuleOptions;

export const MODULE_EXTRAS_TOKEN = 'AUTH_MODULE_EXTRAS_TOKEN';

export const {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
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
