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
    rules: {
      // セキュリティ関連ルール
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-return-assign': 'error',
      'no-proto': 'error',
      'no-iterator': 'error',
      'no-restricted-globals': [
        'error',
        {
          name: 'eval',
          message: 'Use of eval() is forbidden for security reasons.',
        },
        {
          name: 'execScript',
          message: 'Use of execScript() is forbidden for security reasons.',
        },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'window',
          property: 'eval',
          message: 'Use of window.eval() is forbidden for security reasons.',
        },
        {
          object: 'global',
          property: 'eval',
          message: 'Use of global.eval() is forbidden for security reasons.',
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.name="dangerouslySetInnerHTML"]',
          message: 'Use of dangerouslySetInnerHTML should be avoided for security reasons.',
        },
      ],
      // Next.js特有のセキュリティルール
      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/no-sync-scripts': 'error',
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
