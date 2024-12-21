import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    files: ['*.ts', '*.tsx'],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'prettier'],
    parserOptions: {
      project: './tsconfig.json',
    },
    ignores: [
      'node_modules/',
      '.next/',
      'out/',
      'public/',
      'package-lock.json',
      'next.config.mjs',
      'tsconfig.json',
      'next-env.d.ts',
      '*.cjs',
      '*.mjs',
    ],
  },
];

export default eslintConfig;
