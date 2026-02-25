import { Inject, Injectable } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import {
  TypeOrmModuleOptions,
  TypeOrmOptionsFactory,
} from '@nestjs/typeorm';

import { appConfigs } from './app.config';

@Injectable()
export class TypeOrmModuleConfig implements TypeOrmOptionsFactory {
  constructor(
    @Inject(appConfigs.KEY)
    private readonly appConfig: ConfigType<typeof appConfigs>,
  ) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.appConfig.POSTGRES_HOST,
      port: this.appConfig.POSTGRES_PORT,
      database: this.appConfig.POSTGRES_DB,
      username: this.appConfig.POSTGRES_USER,
      password: this.appConfig.POSTGRES_PASSWORD,
      entities: [
        __dirname + '/../../modules/**/entities/*.entity{.ts,.js}',
      ],
      migrations: [__dirname + '/../../migrations/*{.ts,.js}'],
      // Enable synchronize only in development
      // ⚠️ IMPORTANT: Always create migration scripts even with synchronize enabled
      synchronize: this.appConfig.NODE_ENV === 'development',
      logging: this.appConfig.NODE_ENV === 'development',
      // Auto-load entities
      autoLoadEntities: true,
    };
  }
}
