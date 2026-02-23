import { BadRequestException } from '@nestjs/common';

import { ValidateExplainInput } from './validate-explain-input.decorator';

class TestResolver {
  @ValidateExplainInput()
  explain(word: string, context: string): string {
    return `${word}::${context}`;
  }
}

describe(ValidateExplainInput.name, () => {
  it.each<{ word: any; context: any }>([
    { word: '', context: 'some context' },
    { word: 'word', context: '' },
    { word: null, context: 'my context' },
    { word: 'some', context: undefined },
    { word: 123, context: 'valid context' },
    { word: 'valid', context: 456 },
  ])(
    'should throw when word ($word) or context ($context) is invalid',
    ({ word, context }) => {
      const uut = new TestResolver();

      expect(() => uut.explain(word, context)).toThrow(
        new BadRequestException('Word and context must be provided'),
      );
    },
  );

  it('should throw when context does not include word', () => {
    const uut = new TestResolver();

    expect(() =>
      uut.explain('melee', 'I need to analyze the data carefully.'),
    ).toThrow(
      new BadRequestException(
        'Context must include the word to be explained',
      ),
    );
  });

  it('should throw when word is longer than 64 characters', () => {
    const uut = new TestResolver();
    const word = 'a'.repeat(65);
    const context = `This context includes ${word}.`;

    expect(() => uut.explain(word, context)).toThrow(
      new BadRequestException(
        'Word is too long (max 64 characters, 1-3 words (compound/hyphenated terms))',
      ),
    );
  });

  it('should throw when context is longer than 2000 characters', () => {
    const uut = new TestResolver();
    const word = 'analyze';
    const context =
      `This is a very long context that includes the word ${word}. ` +
      'a'.repeat(2000);

    expect(() => uut.explain(word, context)).toThrow(
      new BadRequestException(
        'Context is too long (max 2000 characters, ~300-400 words)',
      ),
    );
  });

  it('should allow valid input', () => {
    const uut = new TestResolver();

    expect(
      uut.explain(
        'scrutinize',
        'I need to scrutinize the data carefully.',
      ),
    ).toBe('scrutinize::I need to scrutinize the data carefully.');
  });
});
