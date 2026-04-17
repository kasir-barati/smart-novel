import { Field, InputType } from '@nestjs/graphql';
import { Transform, Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';

import { ListFilterInputMixin } from '../../../shared';

@InputType()
export class CategoryFilterInput extends ListFilterInputMixin<string>(
  () => String,
) {
  @Transform(({ value }) => value.map((v: string) => v.toLowerCase()))
  override in?: string[];

  @Transform(({ value }) => value.map((v: string) => v.toLowerCase()))
  override nin?: string[];
}

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
