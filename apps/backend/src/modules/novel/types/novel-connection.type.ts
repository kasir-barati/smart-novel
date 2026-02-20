import { Field, ObjectType } from '@nestjs/graphql';

import { Novel } from './novel.type';

@ObjectType()
export class PageInfo {
  @Field(() => String, { nullable: true })
  endCursor: string | null;

  @Field()
  hasNextPage: boolean;

  @Field()
  hasPreviousPage: boolean;

  @Field(() => String, { nullable: true })
  startCursor: string | null;
}

@ObjectType()
export class NovelEdge {
  @Field(() => String)
  cursor: string;

  @Field(() => Novel)
  node: Novel;
}

@ObjectType()
export class NovelConnection {
  @Field(() => [NovelEdge])
  edges: NovelEdge[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;
}
