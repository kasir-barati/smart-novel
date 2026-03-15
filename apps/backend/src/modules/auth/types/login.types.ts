import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({
  description: 'Result of a login or token refresh operation',
})
export class Login {
  @Field(() => String, {
    description:
      'Opaque access token for authenticating subsequent requests',
  })
  accessToken: string;

  @Field(() => Int, {
    description: 'Number of seconds until the access token expires',
  })
  expiresIn: number;

  @Field(() => String, {
    description: 'Token type (always "Bearer")',
  })
  tokenType: string;

  @Field(() => String, {
    nullable: true,
    description:
      'Refresh token that can be exchanged for a new access token after expiry',
  })
  refreshToken?: string;
}
