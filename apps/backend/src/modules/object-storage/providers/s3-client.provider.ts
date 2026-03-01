import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { Provider } from '@nestjs/common';
import { isNotEmpty } from 'class-validator';

import {
  MODULE_OPTIONS_TOKEN,
  ObjectStorageModuleOptions,
} from '../object-storage.module-definition';

export const S3_CLIENT_PROVIDER: Provider = {
  provide: S3Client,
  useFactory: (options: ObjectStorageModuleOptions) => {
    const config: S3ClientConfig = {
      region: options.region,
    };

    if (options.enableLogger === true) {
      config.logger = console;
    }

    if (
      isNotEmpty(options.accessKeyId) &&
      isNotEmpty(options.secretAccessKey)
    ) {
      config.credentials = {
        accessKeyId: options.accessKeyId!,
        secretAccessKey: options.secretAccessKey!,
      };
    }

    if (isNotEmpty(options.endpoint)) {
      config.endpoint = options.endpoint;
      // Default true for non-AWS endpoints unless explicitly set
      config.forcePathStyle = options.forcePathStyle ?? true;
    } else if (typeof options.forcePathStyle === 'boolean') {
      config.forcePathStyle = options.forcePathStyle;
    }

    return new S3Client(config);
  },
  inject: [MODULE_OPTIONS_TOKEN],
};
