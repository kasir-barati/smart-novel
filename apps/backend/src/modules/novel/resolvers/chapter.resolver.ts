import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';

import { CheckPolicy, RequireRole, Role } from '../../auth';
import { ChapterService, TtsTextService } from '../services';
import { Chapter } from '../types';

@Resolver(() => Chapter)
export class ChapterResolver {
  constructor(
    private readonly chapterService: ChapterService,
    private readonly ttsTextService: TtsTextService,
  ) {}

  @RequireRole(Role.writer)
  @Mutation(() => String, {
    description:
      'Convert markdown content into TTS-friendly text and return the result for preview',
  })
  async generateTtsFriendlyText(
    @Args('text', {
      type: () => String,
      description:
        'Markdown content to convert into TTS-friendly text',
    })
    text: string,
  ): Promise<string> {
    const speechText = await this.ttsTextService.toSpeechText(text);
    const normalizedText =
      this.ttsTextService.normalizeTtsText(speechText);

    return normalizedText;
  }

  @CheckPolicy('chapter', 'update')
  @Mutation(() => Chapter, {
    description:
      'Update both the content and its TTS-friendly version for a chapter.',
  })
  async updateContent(
    @Args('id', {
      type: () => ID,
      description: 'Chapter ID',
    })
    chapterId: string,
    @Args('content', {
      type: () => String,
      description: 'Chapter content in markdown format',
    })
    content: string,
    @Args('ttsFriendlyContent', {
      type: () => String,
      description: 'Content in a TTS friendly format',
    })
    ttsFriendlyContent: string,
  ) {
    return this.chapterService.updateContent(
      chapterId,
      content,
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
