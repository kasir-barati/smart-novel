import { StringValue } from 'ms';
import { LogLevel, LogMode } from 'nestjs-backend-common';

export interface AppConfig {
  EXPLAIN_CONTEXT_CHAR_SIZE: number;
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
  OBJECT_STORAGE_BUCKET: string;
  OBJECT_STORAGE_PUBLIC_URL: string;
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
   * @description Absolute path to a file containing the OIDC client ID. Used only in dev env.
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
   * @description The base domain of your ZITADEL instance
   * @example `https://zitadel.example.com`
   */
  ZITADEL_DOMAIN: string;
  /**
   * @description The client secret for your OIDC application (optional for public clients)
   */
  ZITADEL_CLIENT_SECRET?: string;
  /**
   * @description The full URL where ZITADEL will redirect back after authentication
   * @example `http://localhost:3000/api/auth/callback/zitadel`
   */
  ZITADEL_CALLBACK_URL: string;
  /**
   * @description The URL to redirect after successful login
   * @default `/`
   */
  ZITADEL_POST_LOGIN_URL?: string;
  /**
   * @description The URL to redirect after logout
   * @example `http://localhost:3000`
   */
  ZITADEL_POST_LOGOUT_URL: string;
  /**
   * @description Secret string used to sign the session cookie (min 32 characters)
   */
  SESSION_SECRET: string;
  /**
   * @description Duration of the session in seconds
   * @default 3600
   */
  SESSION_DURATION: number;
}
