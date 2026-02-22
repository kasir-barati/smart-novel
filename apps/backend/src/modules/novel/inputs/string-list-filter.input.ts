import { Field, InputType } from '@nestjs/graphql';
import { IsArray, IsOptional } from 'class-validator';

@InputType()
export class StringListFilterInput {
  @Field(() => [String], {
    nullable: true,
    description: 'List of strings to include',
  })
  @IsOptional()
  @IsArray()
  in?: string[];

  @Field(() => [String], {
    nullable: true,
    description: 'List of strings to exclude',
  })
  @IsOptional()
  @IsArray()
  nin?: string[];
}
