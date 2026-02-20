import {
  Field,
  ID,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';

import { Chapter } from './chapter.type';

export enum NovelState {
  FINISHED = 'FINISHED',
  ONGOING = 'ONGOING',
}

registerEnumType(NovelState, {
  name: 'NovelState',
});

@ObjectType()
export class Novel {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  author: string;

  @Field(() => [String])
  category: string[];

  @Field(() => [String])
  chapters: string[];

  @Field(() => NovelState)
  state: NovelState;

  @Field(() => Chapter, { nullable: true })
  chapter?: Chapter;
}
