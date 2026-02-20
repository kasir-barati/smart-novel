import { ObjectType } from '@nestjs/graphql';

import { ConnectionType, EdgeType } from '../../../shared';
import { Novel } from './novel.type';

@ObjectType({
  description: 'An edge in a connection representing a novel',
})
export class NovelEdge extends EdgeType(Novel) {}

@ObjectType({
  description: 'A connection representing a list of novels',
})
export class NovelConnection extends ConnectionType(
  Novel,
  NovelEdge,
) {}
