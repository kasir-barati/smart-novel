import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'A chapter of a novel' })
export class Chapter {
  @Field(() => ID, {
    description: 'Unique identifier for the chapter',
  })
  id: string;

  @Field(() => ID, {
    description: 'The ID of the novel this chapter belongs to',
  })
  novelId: string;

  @Field({ nullable: true, description: 'The title of the chapter' })
  title?: string;

  @Field({
    description: 'The content of the chapter in markdown format',
  })
  content: string;

  @Field({ description: 'The creation date of the chapter' })
  createdAt: string;

  @Field({ description: 'The last update date of the chapter' })
  updatedAt: string;

  @Field(() => Chapter, {
    nullable: true,
    description: 'The next chapter',
  })
  next?: Chapter;

  @Field(() => Chapter, {
    nullable: true,
    description: 'The previous chapter',
  })
  previous?: Chapter;
}
