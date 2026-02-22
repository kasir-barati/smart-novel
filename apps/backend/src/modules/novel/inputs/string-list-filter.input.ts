import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsArray, IsOptional } from 'class-validator';

@InputType()
export class StringListFilterInput {
  @Field(() => [String], {
    nullable: true,
    description: 'List of strings to include',
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.map((v: string) => v.toLowerCase()))
  in?: string[];

  @Field(() => [String], {
    nullable: true,
    description: 'List of strings to exclude',
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.map((v: string) => v.toLowerCase()))
  nin?: string[];
}
