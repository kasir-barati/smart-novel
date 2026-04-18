import type {
  Blockquote,
  Code,
  Heading,
  List,
  ListItem,
  Paragraph,
  PhrasingContent,
  Root,
  RootContent,
  ThematicBreak,
} from 'mdast';

import { Injectable, Optional } from '@nestjs/common';
import {
  isArray,
  isNotEmpty,
  isNotEmptyObject,
  isObject,
} from 'class-validator';
import { CustomLoggerService, isNil } from 'nestjs-backend-common';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { SKIP, visit } from 'unist-util-visit';

import { TtsNormalizationLlmService } from './tts-normalization-llm.service';

export interface TtsOptions {
  /** @description when true, append the URL after link text, e.g., "(link: https://...)" */
  includeLinkUrls?: boolean;
}

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

/**
 * @description Converts any text into TTS-friendly plain text for Piper (or similar).
 *
 * Provides two main capabilities:
 * 1. {@link toSpeechText} — parses Markdown AST and emits plain text.
 * 2. {@link normalizeTtsText} — applies regex-based normalizations
 *    for manga / web-novel prose (stutters, onomatopoeia, etc.).
 */
@Injectable()
export class TtsTextService {
  constructor(
    @Optional()
    private readonly llmService?: TtsNormalizationLlmService,
    @Optional()
    private readonly logger?: CustomLoggerService,
  ) {}

  async toSpeechText(
    markdown: string,
    options: TtsOptions = {},
  ): Promise<string> {
    const root = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .parse(markdown) as Root;
    const serializer = new TtsSerializer(options);

    return serializer.walk(root).finish();
  }

  /**
   * @description Hybrid normalization pipeline:
   *
   * 1. **Regex safe pass** — applies deterministic, structural transformations that cannot change meaning (tilde stripping, letter collapsing, dot collapsing, ALL-CAPS lowercasing, bracket-skill replacement).
   * 2. **LLM pass** — delegates semantic normalization (interjections, stutters, silent dialogue, repeated words/phrases) to Ollama.
   * 3. **Fallback** — if the LLM is unavailable or returns bad output, the full regex pipeline is used instead.
   */
  async normalizeTtsText(text: string): Promise<string> {
    // Phase 1: deterministic structural cleanup (always runs)
    const safeResult = this.regexSafePass(text);

    // Phase 2: try LLM for semantic normalization
    if (isNotEmpty(this.llmService)) {
      const llmResult = await this.llmService!.normalize(safeResult);

      if (llmResult) {
        this.logger?.log('LLM TTS normalization succeeded', {
          context: TtsTextService.name,
        });

        return llmResult;
      }

      this.logger?.warn(
        'LLM TTS normalization returned null — falling back to regex pipeline',
        { context: TtsTextService.name },
      );
    }

    // Phase 3: full regex fallback (semantic transforms included)
    return this.regexFullNormalize(safeResult);
  }

  /**
   * @description Deterministic, structural-only regex transformations that are always safe to apply (cannot change meaning).
   */
  private regexSafePass(text: string): string {
    let result = text;

    result = this.stripElongationTildes(result);
    result = this.collapseRepeatedLetters(result);
    result = this.collapseExcessiveDots(result);
    result = this.lowercaseAllCapsWords(result);
    result = this.replaceBracketedSkills(result);

    return result;
  }

  /**
   * @description Applies the remaining semantic regex transformations on top of the safe pass. Used as fallback when LLM is unavailable.
   */
  private regexFullNormalize(safePassResult: string): string {
    let result = safePassResult;

    result = this.replaceSilentDialogue(result);
    result = this.expandStutters(result);
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

/** @internal helper that holds the emission state and pure formatting rules. */
class TtsSerializer {
  private readonly includeLinkUrls: boolean;
  private readonly out: string[] = [];

  constructor({ includeLinkUrls = false }: TtsOptions = {}) {
    this.includeLinkUrls = includeLinkUrls;
  }

  /** @description entrypoint for walking the AST. */
  walk(root: Root): this {
    visit(root, (node) => {
      switch (node.type) {
        case 'heading':
          this.emitHeading(node as Heading);
          return SKIP;

        case 'paragraph':
          this.emitParagraph(node as Paragraph);
          return SKIP;

        case 'list':
          this.emitList(node as List);
          return SKIP;

        case 'blockquote':
          this.emitBlockquote(node as Blockquote);
          return SKIP;

        case 'code':
          this.emitCode(node as Code);
          return SKIP;

        case 'thematicBreak':
          this.emitThematicBreak(node as ThematicBreak);
          return SKIP;

        default:
          // Let unhandled nodes bubble down normally
          return;
      }
    });

    return this;
  }

  /** @description applies the final normalizations and returns the output. */
  finish(): string {
    const s = this.out
      .join('')
      // collapse >2 blank lines to exactly 2
      .replace(/\n{3,}/g, '\n\n')
      // strip trailing whitespace before newline
      .replace(/[ \t]+\n/g, '\n')
      .trim();

    return s + '\n';
  }

  private emitHeading(node: Heading): void {
    const text = this.inlineToString(node.children);
    if (text) {
      this.out.push(text);
      this.out.push(':');
      this.newline(2); // stronger pause
    }
  }

  private emitParagraph(node: Paragraph): void {
    this.emitInlineNodes(node.children);
    this.newline(2);
  }

  private emitList(node: List): void {
    let index = 1;

    for (const item of node.children as ListItem[]) {
      const bullet = node.ordered ? `${index++}. ` : '• ';

      this.out.push(bullet);

      // Each list item can contain paragraphs or nested lists
      for (const child of item.children) {
        if (child.type === 'paragraph') {
          this.emitInlineNodes(child.children);
          continue;
        }

        if (child.type === 'list') {
          // Make nested lists audible with a small break before rendering
          this.newline();
          this.emitList(child as List);
          continue;
        }

        // Fallback: try to consume any phrasing content inside
        this.emitInlineChildrenIfAny(child as RootContent);
      }

      this.newline(); // short pause between items
    }

    this.newline(); // extra gap after the whole list
  }

  private emitBlockquote(node: Blockquote): void {
    this.out.push('Quote: ');

    for (const child of node.children) {
      if (child.type === 'paragraph') {
        this.emitInlineNodes(child.children);
        continue;
      }

      this.emitInlineChildrenIfAny(child as RootContent);
    }

    this.newline(2);
  }

  private emitCode(node: Code): void {
    this.out.push('Code: ');
    // Trim trailing spaces/tabs per line to avoid awkward TTS pauses
    this.out.push(node.value.replace(/[ \t]+$/gm, ''));
    this.newline(2);
  }

  private emitThematicBreak(_node: ThematicBreak): void {
    this.newline(2);
  }

  private emitInline(
    node: PhrasingContent,
    buffer: string[] = this.out,
  ): void {
    switch (node.type) {
      case 'text': {
        buffer.push(node.value);

        break;
      }

      case 'emphasis':
      case 'strong':
      case 'delete': {
        if (node.children) {
          for (const child of node.children) {
            this.emitInline(child as PhrasingContent, buffer);
          }
        }

        break;
      }

      case 'inlineCode': {
        // Quote inline code for clearer TTS delivery
        buffer.push(`"${node.value}"`);
        break;
      }

      case 'link': {
        if (node.children) {
          for (const child of node.children) {
            this.emitInline(child as PhrasingContent, buffer);
          }
        }

        if (this.includeLinkUrls && node.url) {
          buffer.push(` (link: ${node.url})`);
        }

        break;
      }

      case 'image': {
        buffer.push(node.alt || 'image');

        break;
      }

      default: {
        if (!('children' in node) || !isArray(node.children)) {
          break;
        }

        // If anything else slips in, attempt to traverse children defensively
        // (This keeps behavior resilient across mdast extensions)
        for (const child of node.children) {
          this.emitInline(child as PhrasingContent, buffer);
        }

        break;
      }
    }
  }

  private emitInlineNodes(
    nodes: PhrasingContent[],
    buffer: string[] = this.out,
  ): void {
    for (const node of nodes) {
      this.emitInline(node, buffer);
    }
  }

  private inlineToString(nodes: PhrasingContent[]): string {
    const tmp: string[] = [];

    this.emitInlineNodes(nodes, tmp);

    return tmp.join('');
  }

  /**
   * @description tries to find and emit inline content inside an arbitrary content node.
   */
  private emitInlineChildrenIfAny(node: RootContent): void {
    if (!('children' in node) || !isArray(node.children)) {
      return;
    }

    // Many mdast nodes expose children; when they do, walk them and take phrasing descendants
    for (const child of node.children) {
      if (
        isNil(child) ||
        !isNotEmptyObject(child) ||
        !isObject<any>(child)
      ) {
        continue;
      }

      // Paragraph → phrasing content
      if (child.type === 'paragraph') {
        this.emitInlineNodes((child as Paragraph).children);
        continue;
      }

      // Attempt to recurse into nested children (best-effort)
      this.emitInlineChildrenIfAny(child as RootContent);
    }
  }

  private newline(n = 1): void {
    if (n > 0) {
      this.out.push('\n'.repeat(n));
    }
  }
}
