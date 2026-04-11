import { TtsTextService } from './tts-text.service';

describe(TtsTextService.name, () => {
  let uut: TtsTextService;

  beforeEach(async () => {
    uut = new TtsTextService();
  });

  describe('toSpeechText', () => {
    it.each(['# Some Title', '## Some Title'])(
      'should convert heading (%s) with colon and pause',
      async (markdown) => {
        const result = await uut.toSpeechText(markdown);

        expect(result).toBe('Some Title:\n');
      },
    );

    it('should handle multiple headings with proper spacing', async () => {
      const markdown = '# First\n\n## Second\n\n### Third';

      const result = await uut.toSpeechText(markdown);

      expect(result).toBe('First:\n\nSecond:\n\nThird:\n');
    });

    it('should handle empty heading', async () => {
      const markdown = '#';

      const result = await uut.toSpeechText(markdown);

      expect(result).toBe('\n');
    });

    it.each([
      '**bold** and *italic*',
      '# **bold** and *italic*',
      '~~bold and italic~~',
    ])('should handle inline formatting (%s)', async (markdown) => {
      const result = await uut.toSpeechText(markdown);

      expect(result).toContain('bold and italic');
    });

    it('should convert simple paragraph', async () => {
      const markdown = 'This is a simple paragraph.';

      const result = await uut.toSpeechText(markdown);

      expect(result).toBe('This is a simple paragraph.\n');
    });

    it('should handle multiple paragraphs with proper spacing', async () => {
      const markdown =
        'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.';

      const result = await uut.toSpeechText(markdown);

      expect(result).toBe(
        'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.\n',
      );
    });

    it('should collapse more than 2 blank lines to exactly 2', async () => {
      const markdown = 'First paragraph.\n\n\n\n\nSecond paragraph.';
      const result = await uut.toSpeechText(markdown);

      expect(result).toBe('First paragraph.\n\nSecond paragraph.\n');
    });

    it('should wrap inline code with quotes', async () => {
      const markdown = 'Use `console.log()` to debug.';

      const result = await uut.toSpeechText(markdown);

      expect(result).toBe('Use "console.log()" to debug.\n');
    });

    it('should handle mixed inline formatting', async () => {
      const markdown =
        'This has **bold**, *italic*, ~~strikethrough~~, and `code`.';

      const result = await uut.toSpeechText(markdown);

      expect(result).toBe(
        'This has bold, italic, strikethrough, and "code".\n',
      );
    });

    it.each([
      'Visit [link](https://example.com).',
      'Visit [**link**](https://example.com).',
    ])(
      'should extract link text without its URL (%s)',
      async (markdown) => {
        const result = await uut.toSpeechText(markdown);

        expect(result).toBe('Visit link.\n');
      },
    );

    it('should include URL when includeLinkUrls option is true', async () => {
      const markdown = 'Check out [this link](https://example.com).';

      const result = await uut.toSpeechText(markdown, {
        includeLinkUrls: true,
      });

      expect(result).toBe(
        'Check out this link (link: https://example.com).\n',
      );
    });

    it('should handle multiple links', async () => {
      const markdown =
        '[First](https://first.com) and [Second](https://second.com).';

      const result = await uut.toSpeechText(markdown, {
        includeLinkUrls: true,
      });

      expect(result).toBe(
        'First (link: https://first.com) and Second (link: https://second.com).\n',
      );
    });

    it('should convert image alt text', async () => {
      const markdown =
        '![A beautiful sunset](http://example.com/sunset.jpg)';
      const result = await uut.toSpeechText(markdown);

      expect(result).toBe('A beautiful sunset\n');
    });

    it('should use "image" for images without alt text', async () => {
      const markdown = '![](photo.jpg)';
      const result = await uut.toSpeechText(markdown);

      expect(result).toBe('image\n');
    });

    it('should handle multiple images', async () => {
      const markdown =
        '![First image](first.jpg) ![Second image](second.jpg)';
      const result = await uut.toSpeechText(markdown);

      expect(result).toBe('First image Second image\n');
    });

    it('should convert unordered list with bullet points', async () => {
      const markdown = '- First item\n- Second item\n- Third item';

      const result = await uut.toSpeechText(markdown);

      expect(result).toBe(
        '• First item\n• Second item\n• Third item\n',
      );
    });

    it('should convert ordered list with numbers', async () => {
      const markdown = '1. First item\n2. Second item\n3. Third item';

      const result = await uut.toSpeechText(markdown);

      expect(result).toBe(
        '1. First item\n2. Second item\n3. Third item\n',
      );
    });

    it('should handle nested lists', async () => {
      const markdown =
        '- Item 1\n  - Nested 1.1\n  - Nested 1.2\n- Item 2';

      const result = await uut.toSpeechText(markdown);

      expect(result).toBe(
        '• Item 1\n• Nested 1.1\n• Nested 1.2\n\n• Item 2\n',
      );
    });

    it('should handle ordered list with nested unordered list', async () => {
      const markdown = '1. First\n   - Sub A\n   - Sub B\n2. Second';

      const result = await uut.toSpeechText(markdown);

      expect(result).toBe(
        '1. First\n• Sub A\n• Sub B\n\n2. Second\n',
      );
    });

    it('should handle list items with inline formatting', async () => {
      const markdown =
        '- **Bold** item\n- *Italic* item\n- `Code` item';

      const result = await uut.toSpeechText(markdown);

      expect(result).toBe(
        '• Bold item\n• Italic item\n• "Code" item\n',
      );
    });

    it('should maintain correct numbering in ordered lists', async () => {
      const markdown = '1. First\n1. Second\n1. Third';

      const result = await uut.toSpeechText(markdown);

      expect(result).toBe('1. First\n2. Second\n3. Third\n');
    });

    it('should convert blockquote with Quote prefix', async () => {
      const markdown = '> This is a quote.';

      const result = await uut.toSpeechText(markdown);

      expect(result).toBe('Quote: This is a quote.\n');
    });

    it('should handle multi-line blockquote', async () => {
      const markdown = '> First line.\n> Second line.\n> Third line.';

      const result = await uut.toSpeechText(markdown);

      expect(result).toBe(
        'Quote: First line.\nSecond line.\nThird line.\n',
      );
    });

    it('should handle blockquote with inline formatting', async () => {
      const markdown = '> This is **bold** and *italic*.';

      const result = await uut.toSpeechText(markdown);

      expect(result).toBe('Quote: This is bold and italic.\n');
    });

    it('should handle multiple separate blockquotes', async () => {
      const markdown = '> First quote.\n\n> Second quote.';

      const result = await uut.toSpeechText(markdown);

      expect(result).toBe(
        'Quote: First quote.\n\nQuote: Second quote.\n',
      );
    });

    it.each([
      '```\nconst x = 42;\n```',
      '```javascript\nconst x = 42;\n```',
    ])(
      'should convert code block with Code prefix',
      async (markdown) => {
        const result = await uut.toSpeechText(markdown);

        expect(result).toBe('Code: const x = 42;\n');
      },
    );

    it.each([
      '```\nline 1   \nline 2\t\t\nline 3\n```',
      '```\nline 1\nline 2\nline 3\n```',
    ])('should sanitize breaks in code blocks', async (markdown) => {
      const result = await uut.toSpeechText(markdown);

      expect(result).toBe('Code: line 1\nline 2\nline 3\n');
    });

    it('should handle indented code blocks', async () => {
      const markdown = '    const x = 42;\n    const y = 100;';

      const result = await uut.toSpeechText(markdown);

      expect(result).toBe('Code: const x = 42;\nconst y = 100;\n');
    });

    it.each([
      'Before\n\n***\n\nAfter',
      'Before\n\n---\n\nAfter',
      'Before\n\n___\n\nAfter',
    ])(
      'should handle horizontal rule as pause (%j)',
      async (markdown) => {
        const result = await uut.toSpeechText(markdown);

        expect(result).toBe('Before\n\nAfter\n');
      },
    );

    describe('complex markdown', () => {
      it('should handle document with mixed elements', async () => {
        const markdown = `# Chapter 1

This is the introduction paragraph with **bold** and *italic* text.

## Section 1.1

Here's a list:
- Item 1
- Item 2
- Item 3

> This is an important quote.

And some code:
\`\`\`
const x = 42;
\`\`\`

Visit [our website](https://example.com) for more.`;

        const result = await uut.toSpeechText(markdown);

        expect(result).toContain('Chapter 1:');
        expect(result).toContain(
          'This is the introduction paragraph with bold and italic text.',
        );
        expect(result).toContain('Section 1.1:');
        expect(result).toContain('• Item 1');
        expect(result).toContain(
          'Quote: This is an important quote.',
        );
        expect(result).toContain('Code: const x = 42;');
        expect(result).toContain('Visit our website for more.');
      });

      it('should handle nested complex structures', async () => {
        const markdown = `# Main Title

1. First item with **bold**
   - Nested item A
   - Nested item B with \`code\`
2. Second item with [link](https://example.com)

> Quote with *emphasis* and ~~strikethrough~~.`;

        const result = await uut.toSpeechText(markdown);

        expect(result).toContain('Main Title:');
        expect(result).toContain('1. First item with bold');
        expect(result).toContain('• Nested item A');
        expect(result).toContain('• Nested item B with "code"');
        expect(result).toContain('2. Second item with link');
        expect(result).toContain(
          'Quote: Quote with emphasis and strikethrough.',
        );
      });

      it('should strip trailing whitespace before newlines', async () => {
        const markdown =
          'Line with trailing spaces  \nAnother line  \nThird line';

        const result = await uut.toSpeechText(markdown);

        // Markdown treats double space + newline as hard break, which becomes <br> in HTML
        // The service renders it differently - it's actually a single paragraph with hard breaks
        expect(result).not.toMatch(/[ \t]+\n/);
      });

      it('should always end with single newline', async () => {
        const markdown = 'Simple text';

        const result = await uut.toSpeechText(markdown);

        expect(result).toMatch(/\n$/);
        expect(result).not.toMatch(/\n\n$/);
      });

      it('should handle empty markdown', async () => {
        const markdown = '';

        const result = await uut.toSpeechText(markdown);

        expect(result).toBe('\n');
      });

      it('should handle markdown with only whitespace', async () => {
        const markdown = '   \n\n   \n\n   ';

        const result = await uut.toSpeechText(markdown);

        expect(result).toBe('\n');
      });
    });

    describe('GFM (GitHub Flavored Markdown) features', () => {
      it('should handle tables (basic rendering)', async () => {
        const markdown = `| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |`;

        const result = await uut.toSpeechText(markdown);

        // Tables are not explicitly handled by the service, so they render as empty
        // This is expected behavior - the service focuses on narrative content
        expect(result).toBe('\n');
      });

      it('should handle task lists', async () => {
        const markdown = `- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task`;

        const result = await uut.toSpeechText(markdown);

        expect(result).toContain('• Completed task');
        expect(result).toContain('• Incomplete task');
        expect(result).toContain('• Another completed task');
      });

      it('should handle autolinks', async () => {
        const markdown = 'Visit https://example.com for more info.';
        const result = await uut.toSpeechText(markdown);

        expect(result).toContain('https://example.com');
      });
    });

    describe('edge cases', () => {
      it('should handle deeply nested structures', async () => {
        const markdown = `- Level 1
  - Level 2
    - Level 3
      - Level 4`;

        const result = await uut.toSpeechText(markdown);

        expect(result).toContain('• Level 1');
        expect(result).toContain('• Level 2');
        expect(result).toContain('• Level 3');
        expect(result).toContain('• Level 4');
      });

      it('should handle special characters in text', async () => {
        const markdown =
          'Text with special chars: & < > " \' @ # $ % ^';

        const result = await uut.toSpeechText(markdown);

        expect(result).toBe(
          'Text with special chars: & < > " \' @ # $ % ^\n',
        );
      });

      it('should handle unicode characters', async () => {
        const markdown = 'Text with unicode: 你好 مرحبا 🎉 ñ é ü';

        const result = await uut.toSpeechText(markdown);

        expect(result).toBe(
          'Text with unicode: 你好 مرحبا 🎉 ñ é ü\n',
        );
      });

      it('should handle escaped markdown characters', async () => {
        const markdown = 'Escaped \\*asterisks\\* and \\[brackets\\]';

        const result = await uut.toSpeechText(markdown);

        expect(result).toBe('Escaped *asterisks* and [brackets]\n');
      });

      it('should handle very long paragraphs', async () => {
        const longText = 'Lorem ipsum '.repeat(100).trim();
        const markdown = longText;

        const result = await uut.toSpeechText(markdown);

        expect(result).toContain('Lorem ipsum');
        expect(result.length).toBeGreaterThan(1000);
      });
    });
  });

  describe('normalizeTtsText', () => {
    describe('silent dialogue', () => {
      it('should convert "......" to "..."', () => {
        const result = uut.normalizeTtsText('"......"');

        expect(result).toBe('...');
      });

      it('should convert "..." to "..."', () => {
        const result = uut.normalizeTtsText('"..."');

        expect(result).toBe('...');
      });

      it('should convert "....??" to "hmm?"', () => {
        const result = uut.normalizeTtsText('"....??"');

        expect(result).toBe('hmm?');
      });

      it('should convert "...?" to "hmm?"', () => {
        const result = uut.normalizeTtsText('"...?"');

        expect(result).toBe('hmm?');
      });

      it('should handle name before silent dialogue', () => {
        const result = uut.normalizeTtsText('Alex "......"');

        expect(result).toBe('Alex ...');
      });

      it('should handle name before confused dialogue', () => {
        const result = uut.normalizeTtsText('Alex "....??"');

        expect(result).toBe('Alex hmm?');
      });
    });

    describe('tilde removal', () => {
      it('should remove tilde after elongated word', () => {
        const result = uut.normalizeTtsText('ahhh~');

        expect(result).toBe('ahh');
      });

      it('should remove tilde before punctuation', () => {
        const result = uut.normalizeTtsText('oooh~!');

        expect(result).toBe('ooh!');
      });

      it('should remove tilde before space', () => {
        const result = uut.normalizeTtsText('ahhh~ yes');

        expect(result).toBe('ahh yes');
      });

      it('should not remove tilde in the middle of text like path~name', () => {
        const result = uut.normalizeTtsText('path~name');

        expect(result).toBe('path~name');
      });
    });

    describe('repeated letter collapsing', () => {
      it('should collapse "ahhhhhhhh" to "ahh"', () => {
        const result = uut.normalizeTtsText('ahhhhhhhh');

        expect(result).toBe('ahh');
      });

      it('should collapse "CRAAAACK" to "craack"', () => {
        const result = uut.normalizeTtsText('CRAAAACK');

        expect(result).toBe('craack');
      });

      it('should collapse "WHOOOOOSH!" to "whoosh!"', () => {
        const result = uut.normalizeTtsText('WHOOOOOSH!');

        expect(result).toBe('whoosh!');
      });

      it('should collapse "FWOOOOSH" to "fwoosh"', () => {
        const result = uut.normalizeTtsText('FWOOOOSH');

        expect(result).toBe('fwoosh');
      });

      it('should collapse "BOOOOOOM" to "boom"', () => {
        const result = uut.normalizeTtsText('BOOOOOOM');

        expect(result).toBe('boom');
      });

      it('should collapse "CRAAAACCKKKK" to "craacckk"', () => {
        const result = uut.normalizeTtsText('CRAAAACCKKKK');

        expect(result).toBe('craacckk');
      });

      it('should collapse "SLAAAAAAM" to "slaam"', () => {
        const result = uut.normalizeTtsText('SLAAAAAAM');

        expect(result).toBe('slaam');
      });

      it('should not collapse normal double letters like "book"', () => {
        const result = uut.normalizeTtsText('book');

        expect(result).toBe('book');
      });

      it('should not collapse normal double letters like "feel"', () => {
        const result = uut.normalizeTtsText('feel');

        expect(result).toBe('feel');
      });

      it('should collapse "whattttt" to "whatt"', () => {
        const result = uut.normalizeTtsText('whattttt');

        expect(result).toBe('whatt');
      });
    });

    describe('excessive dots collapsing', () => {
      it('should collapse "ahhh......" to "ahh..."', () => {
        const result = uut.normalizeTtsText('ahhh......');

        expect(result).toBe('ahh...');
      });

      it('should leave "..." as-is', () => {
        const result = uut.normalizeTtsText('wait...');

        expect(result).toBe('wait...');
      });

      it('should collapse "........" to "..."', () => {
        const result = uut.normalizeTtsText('hmm........');

        expect(result).toBe('hmm...');
      });
    });

    describe('ALL CAPS lowercasing', () => {
      it('should lowercase "CRACK" to "crack"', () => {
        const result = uut.normalizeTtsText('CRACK');

        expect(result).toBe('crack');
      });

      it('should lowercase "BOOM" to "boom"', () => {
        const result = uut.normalizeTtsText('BOOM');

        expect(result).toBe('boom');
      });

      it('should lowercase "BOOM!" to "boom!"', () => {
        const result = uut.normalizeTtsText('BOOM!');

        expect(result).toBe('boom!');
      });

      it('should not lowercase single letter "I"', () => {
        const result = uut.normalizeTtsText('I am fine');

        expect(result).toBe('I am fine');
      });

      it('should not lowercase mixed case "Hello"', () => {
        const result = uut.normalizeTtsText('Hello');

        expect(result).toBe('Hello');
      });

      it('should lowercase multiple ALL CAPS words', () => {
        const result = uut.normalizeTtsText('THE BIG BOOM');

        expect(result).toBe('the big boom');
      });

      it('should lowercase ALL CAPS in context', () => {
        const result = uut.normalizeTtsText(
          'He heard a CRACK and ran',
        );

        expect(result).toBe('He heard a crack and ran');
      });
    });

    describe('stutter / hesitation patterns', () => {
      it('should convert "Wh-What" to "wh... what"', () => {
        const result = uut.normalizeTtsText('Wh-What');

        expect(result).toBe('wh... what');
      });

      it('should convert "W-What" to "w... what"', () => {
        const result = uut.normalizeTtsText('W-What');

        expect(result).toBe('w... what');
      });

      it('should convert "N-No" to "n... no"', () => {
        const result = uut.normalizeTtsText('N-No');

        expect(result).toBe('n... no');
      });

      it('should leave "I-I" unchanged (second part is only 1 char)', () => {
        const result = uut.normalizeTtsText('I-I am OK');

        expect(result).toBe('I-I am ok');
      });

      it('should not convert "well-known" (not a stutter)', () => {
        const result = uut.normalizeTtsText('well-known');

        expect(result).toBe('well-known');
      });

      it('should not convert "twenty-one" (not a stutter)', () => {
        const result = uut.normalizeTtsText('twenty-one');

        expect(result).toBe('twenty-one');
      });

      it('should convert "Th-That" to "th... that"', () => {
        const result = uut.normalizeTtsText('Th-That');

        expect(result).toBe('th... that');
      });

      it('should convert "S-Stop it" to "s... stop it"', () => {
        const result = uut.normalizeTtsText('S-Stop it');

        expect(result).toBe('s... stop it');
      });
    });

    describe('square brackets (skill/ability markers)', () => {
      it('should replace "[Boost]" with ", Boost,"', () => {
        const result = uut.normalizeTtsText('She activated [Boost]');

        expect(result).toBe('She activated , Boost,');
      });

      it('should replace "【Fireball】" with ", Fireball,"', () => {
        const result = uut.normalizeTtsText('He cast 【Fireball】');

        expect(result).toBe('He cast , Fireball,');
      });

      it('should replace "[DIVINE SHIELD]" and lowercase the caps', () => {
        const result = uut.normalizeTtsText('[DIVINE SHIELD]');

        expect(result).toBe(', divine shield,');
      });

      it('should handle multiple bracket skills', () => {
        const result = uut.normalizeTtsText(
          'Used [Boost] and [Shield]',
        );

        expect(result).toBe('Used , Boost, and , Shield,');
      });
    });

    describe('repeated single words', () => {
      it('should collapse "run run run run run run" to "run, run, run"', () => {
        const result = uut.normalizeTtsText(
          'run run run run run run',
        );

        expect(result).toBe('run, run, run');
      });

      it('should collapse "no no no no no no" to "no, no, no"', () => {
        const result = uut.normalizeTtsText('no no no no no no');

        expect(result).toBe('no, no, no');
      });

      it('should not collapse "no no" (only 2 repetitions)', () => {
        const result = uut.normalizeTtsText('no no');

        expect(result).toBe('no no');
      });

      it('should not collapse "no no no" (only 3 repetitions)', () => {
        const result = uut.normalizeTtsText('no no no');

        expect(result).toBe('no no no');
      });

      it('should collapse 4 repetitions', () => {
        const result = uut.normalizeTtsText('run run run run');

        expect(result).toBe('run, run, run');
      });

      it('should collapse ALL CAPS repeated words and lowercase them', () => {
        const result = uut.normalizeTtsText('RUN RUN RUN RUN RUN');

        expect(result).toBe('run, run, run');
      });
    });

    describe('repeated multi-word phrases', () => {
      it('should collapse repeated 5-word phrases', () => {
        const result = uut.normalizeTtsText(
          'I do not wanna die I do not wanna die I do not wanna die I do not wanna die I do not wanna die',
        );

        expect(result).toBe(
          'I do not wanna die, I do not wanna die, I do not wanna die',
        );
      });

      it('should collapse repeated 2-word phrases', () => {
        const result = uut.normalizeTtsText(
          'help me help me help me help me help me',
        );

        expect(result).toBe('help me, help me, help me');
      });

      it('should not collapse 3 repetitions of a phrase', () => {
        const result = uut.normalizeTtsText(
          'help me help me help me',
        );

        expect(result).toBe('help me help me help me');
      });
    });

    describe('combined transformations', () => {
      it('should handle tilde + repeated letters', () => {
        const result = uut.normalizeTtsText('ahhh~');

        expect(result).toBe('ahh');
      });

      it('should handle elongated ALL CAPS onomatopoeia with punctuation', () => {
        const result = uut.normalizeTtsText('CRAAAACCKKKK!');

        expect(result).toBe('craacckk!');
      });

      it('should handle multiple transformations in a sentence', () => {
        const result = uut.normalizeTtsText(
          'W-What was that?! BOOM! The [Fireball] exploded!',
        );

        expect(result).toContain('w... what');
        expect(result).toContain('boom!');
        expect(result).toContain(', Fireball,');
      });

      it('should handle complex manga dialogue', () => {
        const result = uut.normalizeTtsText(
          'Alex "...?" N-No way... CRAAAACK!',
        );

        expect(result).toContain('hmm?');
        expect(result).toContain('n... no');
        expect(result).toContain('craack!');
      });

      it('should handle ahhh... pattern', () => {
        const result = uut.normalizeTtsText('ahhh...');

        expect(result).toBe('ahh...');
      });

      it('should not alter normal prose', () => {
        const input = 'Elena walked through the forest carefully.';

        const result = uut.normalizeTtsText(input);

        expect(result).toBe(input);
      });

      it('should preserve normal sentences with standard punctuation', () => {
        const input = 'He said, "I will be back." She nodded.';

        const result = uut.normalizeTtsText(input);

        expect(result).toBe(input);
      });
    });
  });
});
