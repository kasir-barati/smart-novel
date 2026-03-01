import { Module } from '@nestjs/common';

import { ConfigurableModuleClass } from './object-storage.module-definition';
import { S3_CLIENT_PROVIDER } from './providers';

@Module({
  providers: [S3_CLIENT_PROVIDER],
  exports: [S3_CLIENT_PROVIDER],
})
export class ObjectStorageModule extends ConfigurableModuleClass {}
