import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty } from 'class-validator';

@InputType({ description: 'Credentials for user login' })
export class LoginInput {
  @Field(() => String, { description: 'User email address' })
  @IsEmail()
  email: string;

  @Field(() => String, { description: 'User password' })
  @IsNotEmpty()
  password: string;
}
