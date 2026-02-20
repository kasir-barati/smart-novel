import { Field, ID, ObjectType } from '@nestjs/graphql';

import { NovelState } from '../enums';
import { Chapter } from './chapter.type';

@ObjectType({
  description: 'Represents a novel with its details.',
})
export class Novel {
  @Field(() => ID, { description: 'Unique identifier for the novel' })
  id: string;

  @Field({ description: 'The name of the novel' })
  name: string;

  @Field({ description: 'The author of the novel' })
  author: string;

  @Field(() => [String], {
    description: 'The categories of the novel',
  })
  category: string[];

  @Field(() => [String], {
    description: 'Chapter IDs of the novel',
  })
  chapters: string[];

  @Field(() => NovelState, { description: 'The state of the novel' })
  state: NovelState;

  @Field(() => String, {
    nullable: true,
    description: 'URL to the novel cover image',
  })
  coverUrl?: string;

  @Field(() => Chapter, {
    nullable: true,
    description: 'The current chapter of the novel',
  })
  chapter?: Chapter;
}
