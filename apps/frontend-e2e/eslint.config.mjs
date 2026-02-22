import baseConfig from '../../eslint.config.mjs';

/** @type {import('eslint').Linter.Config} */
export default [
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@typescript-eslint/no-namespace': 'off',
    },
  },
];
