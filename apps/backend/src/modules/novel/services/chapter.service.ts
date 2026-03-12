import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  CHAPTER_REPOSITORY,
  IChapter,
  type IChapterRepository,
} from '../interfaces';

/**
 * @description Maximum number of identical consecutive letters before
 * the excess is trimmed (e.g. "ahhhhhh" → "ahh").
 */
const MAX_CONSECUTIVE_LETTERS = 2;

/**
 * @description When a word or phrase repeats more than this many times
 * in a row, the surplus repetitions are collapsed.
 */
const MAX_REPETITIONS = 3;

@Injectable()
export class ChapterService {
  constructor(
    @Inject(CHAPTER_REPOSITORY)
    private readonly chapterRepository: IChapterRepository,
  ) {}

  // TODO:
  // createChapter(novelId: string, input: CreateChapterInput, makeNecessaryAdjustments: boolean) {
  //   // 1. Check if we have a chapter with that novel:
  //   //    1.1. If it does exists throw an error.
  //   //         - Backend should ignore this if they provide a makeNecessaryAdjustments
  //   //    1.2. If it does not exists check if is the next free number for the novel!
  //   // 2. If makeNecessaryAdjustments is present then make sure the novel's chapter number make sense even after chapter creation.
  // }

  // TODO:
  // updateChapter(chapterId: string, input: UpdateChapterInput, makeNecessaryAdjustments: boolean) {
  //   // 1. Check if we have a chapter with that novel:
  //   //    1.1. If it does exists throw an error.
  //   //         - Backend should ignore this if they provide a makeNecessaryAdjustments
  //   //    1.2. If it does not exists check if is the next free number for the novel!
  //   // 2. If makeNecessaryAdjustments is present then make sure the novel's chapter number make sense even after chapter creation.
  // }

  async updateTtsFriendlyContent(
    chapterId: string,
    ttsFriendlyContent: string,
  ): Promise<IChapter> {
    // TODO: validate the ttsFriendlyContent make sense, just a light weight check!
    const chapter =
      await this.chapterRepository.updateChapterTtsFriendlyContent(
        chapterId,
        ttsFriendlyContent,
      );

    if (!chapter) {
      throw new NotFoundException(
        `Chapter with id ${chapterId} not found`,
      );
    }

    return chapter;
  }

  /**
   * @description Fetches a chapter by ID, converts its markdown content
   * into a TTS-friendly version, and returns the converted text.
   */
  async convertToTtsFriendly(chapterId: string): Promise<string> {
    const chapter = await this.chapterRepository.findById(chapterId);

    if (!chapter) {
      throw new NotFoundException(
        `Chapter with id ${chapterId} not found`,
      );
    }

    return this.normalizeTtsText(chapter.content);
  }

  /**
   * @description Applies a pipeline of regex-based transformations that
   * turn manga / web-novel markdown into text a TTS engine (Piper)
   * can pronounce naturally.
   *
   * The transformations are applied in a deliberate order so that
   * earlier passes simplify patterns for later ones.
   */
  private normalizeTtsText(text: string): string {
    let result = text;

    // TODO: Use pipe operator here!
    result = this.replaceSilentDialogue(result);
    result = this.stripElongationTildes(result);
    result = this.collapseRepeatedLetters(result);
    result = this.collapseExcessiveDots(result);
    result = this.lowercaseAllCapsWords(result);
    result = this.expandStutters(result);
    result = this.replaceBracketedSkills(result);
    result = this.collapseRepeatedWords(result);
    result = this.collapseRepeatedPhrases(result);

    return result;
  }

  /**
   * @description Converts silent / confused dialogue in quotes.
   * `"....."` → `...`  and  `"...?"` → `hmm?`
   */
  private replaceSilentDialogue(text: string): string {
    return text.replace(
      /"(\.{2,})(\?+)?"/g,
      (_match, _dots: string, questions: string | undefined) => {
        return questions ? 'hmm?' : '...';
      },
    );
  }

  /**
   * @description Removes tildes used as elongation markers after word
   * characters — common in manga / light novels.
   * `"ahhh~"` → `"ahhh"`,  `"oooh~!"` → `"oooh!"`
   */
  private stripElongationTildes(text: string): string {
    return text.replace(/(\w)~(?=\s|[!?.,;:'")\]]|$)/g, '$1');
  }

  /**
   * @description Collapses 3 or more identical consecutive letters
   * down to {@link MAX_CONSECUTIVE_LETTERS}.
   * `"ahhhhhh"` → `"ahh"`,  `"CRAAAACK"` → `"CRAACK"`
   */
  private collapseRepeatedLetters(text: string): string {
    return text.replace(
      /([a-zA-Z])\1{2,}/g,
      (_match, letter: string) => {
        return letter.repeat(MAX_CONSECUTIVE_LETTERS);
      },
    );
  }

  /**
   * @description Collapses 4 or more consecutive dots down to `"..."`.
   * `"......"` → `"..."`
   */
  private collapseExcessiveDots(text: string): string {
    return text.replace(/\.{4,}/g, '...');
  }

  /**
   * @description Converts fully-uppercase words (2+ chars) to
   * lowercase so TTS reads them naturally instead of spelling them.
   * `"CRACK"` → `"crack"`,  single-char `"I"` is left alone.
   */
  private lowercaseAllCapsWords(text: string): string {
    return text.replace(/\b([A-Z]{2,})\b/g, (_match, word: string) =>
      word.toLowerCase(),
    );
  }

  /**
   * @description Converts stutter / hesitation patterns into a
   * natural spoken form. The prefix before the hyphen must be a
   * case-insensitive prefix of the word that follows — this
   * distinguishes stutters from compound words like "well-known".
   * `"W-What"` → `"wh... what"`,  `"well-known"` → unchanged
   */
  private expandStutters(text: string): string {
    return text.replace(
      /\b([A-Za-z]{1,3})-([A-Za-z]{2,})\b/g,
      (_match, prefix: string, word: string) => {
        if (!word.toLowerCase().startsWith(prefix.toLowerCase())) {
          return _match;
        }

        return `${prefix.toLowerCase()}... ${word.toLowerCase()}`;
      },
    );
  }

  /**
   * @description Replaces square-bracket and fullwidth-bracket skill
   * / ability markers with commas so TTS reads them as a spoken pause.
   * `"[Boost]"` → `", Boost,"`,  `"【Fireball】"` → `", Fireball,"`
   */
  private replaceBracketedSkills(text: string): string {
    return text.replace(
      /[[\u3010]([^\]\u3011]+)[\]\u3011]/g,
      ', $1,',
    );
  }

  /**
   * @description Collapses 4 or more consecutive identical single
   * words down to {@link MAX_REPETITIONS} separated by commas.
   * `"run run run run run run"` → `"run, run, run"`
   */
  private collapseRepeatedWords(text: string): string {
    return text.replace(
      /\b(\w+)((?:\s+\1){3,})\b/gi,
      (_match, word: string) => {
        return Array.from({ length: MAX_REPETITIONS })
          .fill(word)
          .join(', ');
      },
    );
  }

  /**
   * @description Collapses 4 or more consecutive identical multi-word
   * phrases (2–8 words) down to {@link MAX_REPETITIONS} separated by commas.
   * Longer phrases are tried first (greedy).
   */
  private collapseRepeatedPhrases(text: string): string {
    let result = text;

    for (let phraseLen = 8; phraseLen >= 2; phraseLen--) {
      const wordGroup = '(\\S+)';
      const phrasePattern = Array.from({ length: phraseLen })
        .fill(wordGroup)
        .join('\\s+');
      const backRefs = Array.from({ length: phraseLen })
        .map((_, i) => `\\${i + 1}`)
        .join('\\s+');
      const repetitionPattern = `(?:\\s+${backRefs}){3,}`;

      const regex = new RegExp(
        `\\b${phrasePattern}${repetitionPattern}\\b`,
        'gi',
      );

      result = result.replace(regex, (...args) => {
        const words = args
          .slice(1, phraseLen + 1)
          .join(' ') as string;

        return Array.from({ length: MAX_REPETITIONS })
          .fill(words)
          .join(', ');
      });
    }

    return result;
  }
}
