import { Field, InputType, PartialType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

import { CreateChapterInput } from './create-chapter.input';

@InputType()
export class UpdateChapterInput extends PartialType(
  CreateChapterInput,
) {
  @Field({
    description:
      'Content of the chapter which is easier for TTS (Text to Speech) operation.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  ttsFriendlyContent?: string;
}
