import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'A chapter of a novel' })
export class Chapter {
  @Field(() => ID, {
    description: 'Unique identifier for the chapter',
  })
  id: string;

  @Field({ nullable: true, description: 'The title of the chapter' })
  title?: string;

  @Field({
    description: 'The content of the chapter in markdown format',
  })
  content: string;

  @Field({ description: 'The creation date of the chapter' })
  createdAt: Date;

  @Field({ description: 'The last update date of the chapter' })
  updatedAt: Date;
}
