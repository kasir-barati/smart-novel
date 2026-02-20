import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';

import { LlmModule } from '../modules/llm/llm.module';
import { NovelModule } from '../modules/novel/novel.module';
import { AppResolver } from './app.resolver';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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
