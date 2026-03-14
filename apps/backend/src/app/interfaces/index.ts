import { StringValue } from 'ms';
import { LogLevel, LogMode } from 'nestjs-backend-common';

export interface AppConfig {
  PORT: number;
  CORS_ALLOWED_ORIGINS: string[];
  NODE_ENV: 'development' | 'production' | 'test';
  LOG_MODE: LogMode;
  LOG_LEVEL: LogLevel;
  OLLAMA_BASE_URL: string;
  OLLAMA_MODEL: string;
  /**
   * @description follows https://www.npmjs.com/package/ms
   */
  OLLAMA_TIMEOUT: StringValue;
  /**
   * @description follows https://www.npmjs.com/package/ms
   */
  OLLAMA_CACHE_TTL: StringValue;
  OLLAMA_RETRY_COUNT: number;
  /**
   * @description follows https://www.npmjs.com/package/ms
   */
  OLLAMA_RETRY_DELAY: StringValue;
  REDIS_URL: string;
  REDIS_PASSWORD?: string;
  DATABASE_URL: string;
  OBJECT_STORAGE_REGION: string;
  OBJECT_STORAGE_ENDPOINT?: string;
  OBJECT_STORAGE_ACCESS_KEY?: string;
  OBJECT_STORAGE_SECRET_KEY?: string;
  TTS_ENDPOINT: string;
  /**
   * @description OIDC (OpenID Connect) issuer URL
   * @example `http://localhost:8080`
   */
  ZITADEL_ISSUER_URL: string;
  /**
   * @description Internal URL for OIDC (OpenID Connect) discovery/JWKS fetching inside Docker. We should always fall back to `ZITADEL_ISSUER_URL` when not set.
   * @example `http://zitadel:8080`
   */
  ZITADEL_INTERNAL_URL?: string;
  /**
   * @description OIDC client ID for the ZITADEL application (used for ROPC login).
   * Optional — when running in Docker the backend reads the client ID from
   * the shared volume file `/zitadel-pat/client-id` instead.
   * @example `123456789012345678@smart-novel`
   */
  ZITADEL_CLIENT_ID?: string;
  /**
   * @description Absolute path to a file containing the OIDC client ID.
   * Used in Docker where `init-zitadel-users` writes the auto-generated client ID to a shared volume.
   * @default `/zitadel-pat/client-id`
   */
  ZITADEL_CLIENT_ID_FILE?: string;
  /**
   * @description Personal Access Token for the ZITADEL service account (machine user).
   * Used to create sessions on behalf of users during login.
   * Optional — when running in Docker the backend reads the PAT from
   * the shared volume file `/zitadel-pat/token` instead.
   */
  ZITADEL_PAT?: string;
  /**
   * @description Absolute path to a file containing the service account PAT.
   * Used in Docker where ZITADEL writes the PAT to a shared volume.
   * @default `/zitadel-pat/token`
   */
  ZITADEL_PAT_FILE?: string;
  /**
   * @description Cerbos HTTP decision endpoint
   * @example `http://cerbos:3592`
   */
  CERBOS_URL: string;
}
