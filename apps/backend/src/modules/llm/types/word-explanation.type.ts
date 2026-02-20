import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class WordExplanation {
  @Field(() => [String], {
    description: 'List of antonyms or opposite terms for the word',
  })
  antonyms: string[];

  @Field({ description: 'The meaning of the word' })
  meaning: string;

  @Field({ description: 'A simplified explanation of the word' })
  simplifiedExplanation: string;

  @Field(() => [String], {
    description: 'List of synonyms or similar terms for the word',
  })
  synonyms: string[];
}
