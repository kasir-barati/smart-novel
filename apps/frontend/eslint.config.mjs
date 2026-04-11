// @ts-check

import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  ...nx.configs['flat/react'],
  {
    ignores: ['src/generated/**'],
  },
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
