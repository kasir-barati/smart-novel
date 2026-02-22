import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { appConfigs, AppModule } from './app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const { PORT, CORS_ALLOWED_ORIGINS } = app.get<
    ConfigType<typeof appConfigs>
  >(appConfigs.KEY);

  app.enableCors({
    origin: CORS_ALLOWED_ORIGINS,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(PORT);

  Logger.log(
    `🚀 Application is running on: http://localhost:${PORT}/graphql`,
  );
}

bootstrap();
