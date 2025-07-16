import { describe, it, expect } from 'vitest';
import { getTime, jstFormattedDate } from '@/features/utils/dateUtils';

describe('dateUtils', () => {
  describe('getTime', () => {
    it('number型の値をそのまま返す', () => {
      const timestamp = 1234567890;
      const result = getTime(timestamp);
      expect(result).toBe(1234567890);
    });

    it('toMillis()メソッドを持つオブジェクトを正常に処理する', () => {
      const timestamp = { toMillis: () => 1234567890 };
      const result = getTime(timestamp);
      expect(result).toBe(1234567890);
    });

    it('Firebase Timestampの_secondsプロパティを正常に処理する', () => {
      const timestamp = { _seconds: 1234567, _nanoseconds: 890000000 };
      const result = getTime(timestamp);
      expect(result).toBe(1234567890);
    });

    it('_nanosecondsがない場合でも正常に処理する', () => {
      const timestamp = { _seconds: 1234567 };
      const result = getTime(timestamp);
      expect(result).toBe(1234567000);
    });

    it('toMillisプロパティがfunctionでない場合に正常にフォールバックする', () => {
      const timestamp = { toMillis: 'not-a-function' };
      const result = getTime(timestamp);
      expect(result).toBe(0);
    });

    it('文字列の数値を正常に処理する', () => {
      const timestamp = '1234567890';
      const result = getTime(timestamp);
      expect(result).toBe(1234567890);
    });

    it('parseIntがNaNの場合に正常に0を返す', () => {
      const timestamp = 'not-a-number';
      const result = getTime(timestamp);
      expect(result).toBe(0);
    });

    it('null値の場合に正常に0を返す', () => {
      const timestamp = null;
      const result = getTime(timestamp);
      expect(result).toBe(0);
    });

    it('undefined値の場合に正常に0を返す', () => {
      const timestamp = undefined;
      const result = getTime(timestamp);
      expect(result).toBe(0);
    });

    it('空文字列の場合に正常に0を返す', () => {
      const timestamp = '';
      const result = getTime(timestamp);
      expect(result).toBe(0);
    });
  });

  describe('jstFormattedDate', () => {
    it('タイムスタンプを正常に日本語形式でフォーマットする', () => {
      const timestamp = 1609459200000; // 2021-01-01 00:00:00 UTC
      const result = jstFormattedDate(timestamp);
      expect(result).toBe('2021年01月01日');
    });

    it('異なるタイムスタンプを正常にフォーマットする', () => {
      const timestamp = 1640995200000; // 2022-01-01 00:00:00 UTC
      const result = jstFormattedDate(timestamp);
      expect(result).toBe('2022年01月01日');
    });

    it('月と日が1桁の場合に正常に0埋めされる', () => {
      const timestamp = 1633046400000; // 2021-10-01 00:00:00 UTC
      const result = jstFormattedDate(timestamp);
      expect(result).toBe('2021年10月01日');
    });

    it('年末の日付を正常にフォーマットする', () => {
      const timestamp = 1640908800000; // 2021-12-31 00:00:00 UTC
      const result = jstFormattedDate(timestamp);
      expect(result).toBe('2021年12月31日');
    });
  });
});
