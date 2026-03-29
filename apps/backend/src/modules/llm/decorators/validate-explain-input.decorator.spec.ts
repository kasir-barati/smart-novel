process.env.EXPLAIN_CONTEXT_CHAR_SIZE = 5000;

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
      // Act
      const uut = new TestResolver();

      // Assert
      expect(() => uut.explain(word, context)).toThrow(
        new BadRequestException('Word and context must be provided'),
      );
    },
  );

  it('should throw when context does not include word', () => {
    // Act
    const uut = new TestResolver();

    // Assert
    expect(() =>
      uut.explain('melee', 'I need to analyze the data carefully.'),
    ).toThrow(
      new BadRequestException(
        'Context must include the word to be explained',
      ),
    );
  });

  it('should throw when word is longer than 64 characters', () => {
    // Arrange
    const word = 'a'.repeat(65);
    const context = `This context includes ${word}.`;

    // Act
    const uut = new TestResolver();

    // Assert
    expect(() => uut.explain(word, context)).toThrow(
      new BadRequestException(
        'Word is too long (max 64 characters, 1-3 words (compound/hyphenated terms))',
      ),
    );
  });

  it('should throw when context is longer than EXPLAIN_CONTEXT_CHAR_SIZE characters', () => {
    // Arrange
    const word = 'analyze';
    const maxSize = Number(process.env.EXPLAIN_CONTEXT_CHAR_SIZE);
    const context =
      `This is a very long context that includes the word ${word}. ` +
      'a'.repeat(maxSize);

    // Act
    const uut = new TestResolver();

    // Assert
    expect(() => uut.explain(word, context)).toThrow(
      new BadRequestException(
        `Context is too long (max ${maxSize} characters)`,
      ),
    );
  });

  it('should allow valid input', () => {
    // Act
    const uut = new TestResolver();

    // Assert
    expect(
      uut.explain(
        'scrutinize',
        'I need to scrutinize the data carefully.',
      ),
    ).toBe('scrutinize::I need to scrutinize the data carefully.');
  });
});
