import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['src/support/logger.ts'],
    rules: {
      'no-console': 'off',
    },
  },
];
