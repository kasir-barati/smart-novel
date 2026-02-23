import { BadRequestException } from '@nestjs/common';
import { isEmpty, isString } from 'class-validator';

type ExplainArgs = [
  word: string,
  context: string,
  ...rest: unknown[],
];

export function ValidateExplainInput(): MethodDecorator {
  return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value as (
      ...args: ExplainArgs
    ) => unknown;

    descriptor.value = function (...args: ExplainArgs) {
      const [word, context] = args;

      if (
        !isString(word) ||
        !isString(context) ||
        isEmpty(word) ||
        isEmpty(context)
      ) {
        throw new BadRequestException(
          'Word and context must be provided',
        );
      }

      if (context.includes(word) === false) {
        throw new BadRequestException(
          'Context must include the word to be explained',
        );
      }

      if (word.length > 64) {
        throw new BadRequestException(
          'Word is too long (max 64 characters, 1-3 words (compound/hyphenated terms))',
        );
      }

      if (context.length > 2000) {
        throw new BadRequestException(
          'Context is too long (max 2000 characters, ~300-400 words)',
        );
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
