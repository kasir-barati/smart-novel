import { registerAs } from '@nestjs/config';
import { Transform } from 'class-transformer';
import {
  isEmpty,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { type StringValue } from 'ms';
import {
  type LogLevel,
  type LogMode,
  validateEnvs,
} from 'nestjs-backend-common';

import { AppConfig } from '../interfaces';

declare global {
  namespace NodeJS {
    interface ProcessEnv extends AppConfig {}
  }
}

export const appConfigs = registerAs('appConfigs', (): AppConfig => {
  const validatedEnvs = validateEnvs(
    process.env,
    EnvironmentVariables,
  );

  return validatedEnvs;
});

class EnvironmentVariables implements AppConfig {
  @IsInt()
  PORT: number;

  @Transform(({ value }) =>
    value
      .split(',')
      .map((origin: string) =>
        isEmpty(origin.trim()) ? null : origin.trim(),
      )
      .filter(Boolean),
  )
  @IsNotEmpty({ each: true })
  @IsString({ each: true })
  CORS_ALLOWED_ORIGINS: string[];

  @IsIn(['development', 'production', 'test'])
  NODE_ENV: AppConfig['NODE_ENV'];

  @IsIn(['PLAIN_TEXT', 'JSON'])
  LOG_MODE: LogMode;

  @IsIn([
    'debug',
    'error',
    'http',
    'info',
    'silly',
    'verbose',
    'warn',
  ])
  LOG_LEVEL: LogLevel;

  @IsNotEmpty()
  @IsString()
  OLLAMA_BASE_URL: string;

  @IsNotEmpty()
  @IsString()
  OLLAMA_MODEL: string;

  @IsNotEmpty()
  @IsString()
  OLLAMA_TIMEOUT: StringValue;

  @IsNotEmpty()
  @IsString()
  OLLAMA_CACHE_TTL: StringValue;

  @IsInt()
  OLLAMA_RETRY_COUNT: number;

  @IsNotEmpty()
  @IsString()
  OLLAMA_RETRY_DELAY: StringValue;

  @IsNotEmpty()
  @IsString()
  REDIS_URL: string;

  @IsOptional()
  @IsString()
  REDIS_PASSWORD?: string;
}
