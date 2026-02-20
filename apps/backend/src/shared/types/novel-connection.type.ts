import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PageInfo {
  @Field(() => String, {
    nullable: true,
    description:
      'The opaque cursor representing the end of the current page',
  })
  endCursor: string | null;

  @Field({
    description:
      'Indicates if there are more items after the current page',
  })
  hasNextPage: boolean;

  @Field({
    description:
      'Indicates if there are more items before the current page',
  })
  hasPreviousPage: boolean;

  @Field(() => String, {
    nullable: true,
    description:
      'The opaque cursor representing the start of the current page',
  })
  startCursor: string | null;
}
