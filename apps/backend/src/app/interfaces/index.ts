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
  /** @description follows https://www.npmjs.com/package/ms */
  OLLAMA_TIMEOUT: StringValue;
  /** @description follows https://www.npmjs.com/package/ms */
  OLLAMA_CACHE_TTL: StringValue;
  OLLAMA_RETRY_COUNT: number;
  /** @description follows https://www.npmjs.com/package/ms */
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
   * @description OIDC issuer URL
   * @example `http://localhost:8085` for ZITADEL
   */
  ZITADEL_ISSUER_URL: string;
  /**
   * @description Internal URL for OIDC discovery/JWKS fetching inside Docker.
   * Falls back to ZITADEL_ISSUER_URL when not set.
   * @example `http://zitadel:8080`
   */
  ZITADEL_INTERNAL_URL?: string;
  /**
   * @description Cerbos HTTP decision endpoint
   * @example `http://cerbos:3592`
   */
  CERBOS_URL: string;
}
