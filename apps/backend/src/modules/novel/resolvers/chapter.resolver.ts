import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';

import { Public } from '../../auth';
import { ChapterService } from '../services';
import { Chapter } from '../types';

@Public()
@Resolver(() => Chapter)
export class ChapterResolver {
  constructor(private readonly chapterService: ChapterService) {}

  @Mutation(() => String, {
    name: 'generateTtsFriendlyContent',
    description:
      'Convert chapter markdown into TTS-friendly text and return the result for preview',
  })
  async generateTtsFriendlyContent(
    @Args('id', {
      type: () => ID,
      description: 'The ID of the chapter to convert',
    })
    chapterId: string,
  ): Promise<string> {
    return this.chapterService.convertToTtsFriendly(chapterId);
  }

  @Mutation(() => Chapter, {
    name: 'updateTtsFriendlyContent',
    description: 'Update the TTS-friendly content for a chapter',
  })
  async updateTtsFriendlyContent(
    @Args('id', {
      type: () => ID,
      description: 'Chapter ID',
    })
    chapterId: string,
    @Args('ttsFriendlyContent', {
      type: () => String,
      description: 'Content in a TTS friendly format',
    })
    ttsFriendlyContent: string,
  ) {
    return this.chapterService.updateTtsFriendlyContent(
      chapterId,
      ttsFriendlyContent,
    );
  }

  // @Mutation(() => Chapter, { description: 'Internal mutation for writers to add new chapters.' })
  // async createChapter(
  //   @Args('novelId', {
  //     type: () => ID,
  //     description: 'Adds the new chapter to the novel'
  //   })
  //   novelId: string,
  //   @Args('input', {
  //     type: () => CreateChapterInput,
  //     description: 'Create a new chapter for a novel'
  //   })
  //   input: CreateChapterInput,
  //   @Args('makeNecessaryAdjustments', {
  //     type: () => Boolean,
  //     description: 'Backend will make necessary adjustments so the chapter numbers make sense even after inserting a chapter in the middle of existing chapters. The default value for this argument is false.',
  //     defaultValue: false,
  //   })
  //   makeNecessaryAdjustments: boolean = false
  // ) {
  //   return this.chapterService.createChapter(novelId, input, makeNecessaryAdjustments)
  // }

  // @Mutation(() => Chapter, { description: 'Internal mutation for writers to update chapters.' })
  // async updateChapter(
  //   @Args('id', {
  //     type: () => ID,
  //     description: 'The ID of the chapter to update',
  //   })
  //   chapterId: string,
  //   @Args('input', {
  //     type: () => UpdateChapterInput
  //   })
  //   input: UpdateChapterInput,
  //   @Args('makeNecessaryAdjustments', {
  //     type: () => Boolean,
  //     description: 'Backend will make necessary adjustments so the chapter numbers make sense even after inserting a chapter in the middle of existing chapters. The default value for this argument is false.',
  //     defaultValue: false,
  //   })
  //   makeNecessaryAdjustments: boolean = false
  // ) {
  //   return this.chapterService.updateChapter(chapterId, input, makeNecessaryAdjustments)
  // }
}
