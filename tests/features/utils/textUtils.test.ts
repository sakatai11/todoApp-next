import { describe, it, expect } from 'vitest';
import { formatter } from '@/features/utils/textUtils';

describe('textUtils', () => {
  describe('formatter', () => {
    it('空文字列の場合は空の配列を返す', () => {
      const result = formatter('');
      expect(result).toEqual([]);
    });

    it('通常のテキストのみの場合', () => {
      const result = formatter('Hello World');
      expect(result).toEqual([
        {
          type: 'normal',
          content: 'Hello World',
          index: 'normal-0-0',
        },
      ]);
    });

    it('URLを含むテキストの場合（14行目のカバレッジ）', () => {
      const result = formatter('Visit https://example.com for more info');
      expect(result).toEqual([
        {
          type: 'normal',
          content: 'Visit ',
          index: 'normal-0-0',
        },
        {
          type: 'link',
          content: 'https://example.com',
          index: 'link-1',
        },
        {
          type: 'normal',
          content: ' for more info',
          index: 'normal-2-0',
        },
      ]);
    });

    it('複数のURLを含むテキストの場合', () => {
      const result = formatter(
        'First https://example.com then http://test.com',
      );
      expect(result).toEqual([
        {
          type: 'normal',
          content: 'First ',
          index: 'normal-0-0',
        },
        {
          type: 'link',
          content: 'https://example.com',
          index: 'link-1',
        },
        {
          type: 'normal',
          content: ' then ',
          index: 'normal-2-0',
        },
        {
          type: 'link',
          content: 'http://test.com',
          index: 'link-3',
        },
      ]);
    });

    it('改行を含むテキストの場合', () => {
      const result = formatter('Line 1\nLine 2');
      expect(result).toEqual([
        {
          type: 'normal',
          content: 'Line 1',
          index: 'normal-0-0',
        },
        {
          type: 'linefeed',
          content: '\n',
          index: 'space-0-0',
        },
        {
          type: 'normal',
          content: 'Line 2',
          index: 'normal-0-1',
        },
      ]);
    });

    it('URLと改行を含む複合テキストの場合', () => {
      const result = formatter('Check this:\nhttps://example.com\nGreat site!');
      expect(result).toEqual([
        {
          type: 'normal',
          content: 'Check this:',
          index: 'normal-0-0',
        },
        {
          type: 'linefeed',
          content: '\n',
          index: 'space-0-0',
        },
        {
          type: 'link',
          content: 'https://example.com',
          index: 'link-1',
        },
        {
          type: 'linefeed',
          content: '\n',
          index: 'space-2-0',
        },
        {
          type: 'normal',
          content: 'Great site!',
          index: 'normal-2-1',
        },
      ]);
    });

    it('連続する改行の場合', () => {
      const result = formatter('Line 1\n\nLine 3');
      expect(result).toEqual([
        {
          type: 'normal',
          content: 'Line 1',
          index: 'normal-0-0',
        },
        {
          type: 'linefeed',
          content: '\n',
          index: 'space-0-0',
        },
        {
          type: 'linefeed',
          content: '\n',
          index: 'space-0-1',
        },
        {
          type: 'normal',
          content: 'Line 3',
          index: 'normal-0-2',
        },
      ]);
    });

    it('URLのみの場合', () => {
      const result = formatter('https://example.com');
      expect(result).toEqual([
        {
          type: 'link',
          content: 'https://example.com',
          index: 'link-1',
        },
      ]);
    });

    it('改行のみの場合', () => {
      const result = formatter('\n');
      expect(result).toEqual([
        {
          type: 'linefeed',
          content: '\n',
          index: 'space-0-0',
        },
      ]);
    });

    it('末尾が改行の場合', () => {
      const result = formatter('Hello\n');
      expect(result).toEqual([
        {
          type: 'normal',
          content: 'Hello',
          index: 'normal-0-0',
        },
        {
          type: 'linefeed',
          content: '\n',
          index: 'space-0-0',
        },
      ]);
    });

    it('先頭が改行の場合', () => {
      const result = formatter('\nHello');
      expect(result).toEqual([
        {
          type: 'linefeed',
          content: '\n',
          index: 'space-0-0',
        },
        {
          type: 'normal',
          content: 'Hello',
          index: 'normal-0-1',
        },
      ]);
    });
  });
});
