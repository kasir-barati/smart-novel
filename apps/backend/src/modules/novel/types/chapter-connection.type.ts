import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ConnectionType, EdgeType } from 'nestjs-backend-common';

import { Chapter } from './chapter.type';

@ObjectType({
  description: 'An edge in a connection representing a chapter',
})
export class ChapterEdge extends EdgeType(Chapter) {}

@ObjectType({
  description: 'A connection representing a list of chapters',
})
export class ChapterConnection extends ConnectionType(
  Chapter,
  ChapterEdge,
) {
  @Field(() => Int, {
    description: 'Total number of chapters matching the filters',
  })
  totalCount: number;
}
