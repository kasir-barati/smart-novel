import { Field, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';

@InputType()
export class StringListFilterInput {
  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  in?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  nin?: string[];
}

@InputType()
export class NovelFiltersInput {
  @Field(() => StringListFilterInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => StringListFilterInput)
  category?: StringListFilterInput;
}
