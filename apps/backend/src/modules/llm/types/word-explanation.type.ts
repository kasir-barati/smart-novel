import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class WordExplanation {
  @Field(() => [String])
  antonyms: string[];

  @Field()
  meaning: string;

  @Field()
  simplifiedExplanation: string;

  @Field(() => [String])
  synonyms: string[];
}
