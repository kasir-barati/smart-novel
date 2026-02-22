import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import {
  CorrelationIdModule,
  LoggerModule,
} from 'nestjs-backend-common';
import { ClsModule } from 'nestjs-cls';

import { LlmModule, NovelModule } from '../modules';
import { AppResolver } from './app.resolver';
import { appConfigs, LoggerModuleConfig } from './configs';

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    CorrelationIdModule.forRoot({
      global: true,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfigs],
    }),
    LoggerModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useClass: LoggerModuleConfig,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // FIXME: It is not storing it in the host, instead it creates it inside the container!
      autoSchemaFile: true,
      // autoSchemaFile: join(
      //   process.cwd(),
      //   'apps',
      //   'backend',
      //   'schema.gql',
      // ),
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      subscriptions: {
        'graphql-ws': true,
      },
    }),
    NovelModule,
    LlmModule,
  ],
  providers: [AppResolver],
})
export class AppModule {}
