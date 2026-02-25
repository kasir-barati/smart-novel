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
  POSTGRES_HOST: string;
  POSTGRES_PORT: number;
  POSTGRES_DB: string;
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
}
