// @ts-check

import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

/** @type {import('eslint').Linter.Config[]} */
// @ts-expect-error VSCode for some reason ain't happy with the type. But it works fine & I do not wanna loss the intellisense I am getting now.
export default [
  ...baseConfig,
  ...nx.configs['flat/react'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['vitest.setup.ts', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-empty-function': 'off',
    },
  },
];
