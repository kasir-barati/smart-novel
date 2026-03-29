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
  @Field(() => String, { description: 'Chapter title' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  title: string;

  @Field(() => String)
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  content: string;

  @Field(() => Int)
  @IsInt()
  @IsPositive()
  chapterNumber: number;
}
