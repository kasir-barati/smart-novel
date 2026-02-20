import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class AppResolver {
  @Query(() => String, { description: 'Health check endpoint' })
  health(): string {
    return 'OK';
  }
}
