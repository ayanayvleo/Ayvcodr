// ESLint configuration for Next.js/TypeScript/React
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import next from 'eslint-config-next';

export default [
  js.config({
    extends: [],
  }),
  ...tseslint.config({
    parserOptions: {
      project: './tsconfig.json',
    },
    rules: {},
  }),
  ...next(),
];
