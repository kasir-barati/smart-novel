import { Query, Resolver } from '@nestjs/graphql';
import {
  CorrelationIdService,
  CustomLoggerService,
} from 'nestjs-backend-common';

import { Public } from '../modules/auth';

@Resolver()
export class AppResolver {
  constructor(
    private readonly logger: CustomLoggerService,
    private readonly correlationIdService: CorrelationIdService,
  ) {}

  @Public()
  @Query(() => String, { description: 'Health check endpoint' })
  health(): string {
    this.logger.verbose('Health check requested', {
      correlationId: this.correlationIdService.correlationId,
    });

    return 'OK';
  }
}
