import { Field, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';

import { StringListFilterInput } from './string-list-filter.input';

@InputType()
export class CategoryFilterInput extends StringListFilterInput {}

@InputType()
export class NovelFiltersInput {
  @Field(() => CategoryFilterInput, {
    nullable: true,
    description: 'Filter by category',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CategoryFilterInput)
  category?: CategoryFilterInput;
}
