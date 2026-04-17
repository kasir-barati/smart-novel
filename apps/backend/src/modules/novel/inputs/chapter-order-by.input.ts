import { Field, InputType } from '@nestjs/graphql';
import { IsEnum } from 'class-validator';

import { OrderDirection } from '../../../shared';
import { ChapterOrderField } from '../enums';

@InputType({
  description: 'Ordering options for chapters',
})
export class ChapterOrderByInput {
  @Field(() => ChapterOrderField, {
    defaultValue: ChapterOrderField.CHAPTER_NUMBER,
    description: 'The field to order chapters by',
  })
  @IsEnum(ChapterOrderField)
  field: ChapterOrderField;

  @Field(() => OrderDirection, {
    defaultValue: OrderDirection.ASC,
    description: 'The direction to order chapters',
  })
  @IsEnum(OrderDirection)
  direction: OrderDirection;
}
