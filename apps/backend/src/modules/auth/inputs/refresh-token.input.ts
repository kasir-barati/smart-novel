import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType({
  description: 'Input for refreshing an expired access token',
})
export class RefreshTokenInput {
  @Field(() => String, {
    description: 'The refresh token received from a previous login',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
