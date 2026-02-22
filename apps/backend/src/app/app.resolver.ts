import { Query, Resolver } from '@nestjs/graphql';
import {
  CorrelationIdService,
  CustomLoggerService,
} from 'nestjs-backend-common';

@Resolver()
export class AppResolver {
  constructor(
    private readonly logger: CustomLoggerService,
    private readonly correlationIdService: CorrelationIdService,
  ) {}

  @Query(() => String, { description: 'Health check endpoint' })
  health(): string {
    this.logger.verbose('Health check requested', {
      correlationId: this.correlationIdService.correlationId,
    });

    return 'OK';
  }
}
