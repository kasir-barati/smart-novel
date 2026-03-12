import { Field, InputType, Int } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
} from 'class-validator';

@InputType()
export class CreateChapterInput {
  @Field({ description: 'Chapter title' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  title: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  content: string;

  @Field(() => Int)
  @IsInt()
  @IsPositive()
  chapterNumber: number;
}
