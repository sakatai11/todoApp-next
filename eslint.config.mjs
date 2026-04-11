import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      // セキュリティ関連ルール
      '@typescript-eslint/no-explicit-any': 'error',
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
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message:
            'Use of dangerouslySetInnerHTML should be avoided for security reasons. It can lead to XSS vulnerabilities.',
        },
      ],
      // Next.js特有のセキュリティルール
      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/no-sync-scripts': 'error',
    },
  },
  {
    ignores: [
      'node_modules/',
      '.next/',
      '.vercel/',
      '.claude/worktrees/',
      'coverage/',
      'out/',
      'public/',
      'playwright-report/',
      'test-results/',
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
