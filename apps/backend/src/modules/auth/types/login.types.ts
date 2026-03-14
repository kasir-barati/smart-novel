import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Login {
  @Field(() => String, {
    description:
      'JWT access token for authenticating subsequent requests',
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
}
