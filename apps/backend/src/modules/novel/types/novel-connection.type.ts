import { Field, ObjectType } from '@nestjs/graphql';

import { PageInfo } from '../../../shared';
import { Novel } from './novel.type';

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
