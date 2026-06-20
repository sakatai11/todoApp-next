import { describe, it, expect } from 'vitest';
import {
  getValidationStatus,
  getErrorMessage,
  trimAllSpaces,
} from '@/features/utils/validationUtils';
import { messageType } from '@/data/form';

describe('validationUtils', () => {
  describe('getValidationStatus', () => {
    describe('パスワードフィールドのテスト', () => {
      it('成功時はfalseを返す（パスワードフィールド）', () => {
        const result = getValidationStatus({
          success: true,
          message: '',
          option: '',
          fieldType: 'password',
        });
        expect(result).toBe(false);
      });

      it('パスワードエラー時はtrueを返す', () => {
        const result = getValidationStatus({
          success: false,
          message: messageType.password,
          option: '',
          fieldType: 'password',
        });
        expect(result).toBe(true);
      });

      it('パスワード形式エラー時はtrueを返す', () => {
        const result = getValidationStatus({
          success: false,
          message: messageType.passwordError,
          option: '',
          fieldType: 'password',
        });
        expect(result).toBe(true);
      });

      it('option=passwordの場合はtrueを返す', () => {
        const result = getValidationStatus({
          success: true,
          message: '',
          option: 'password',
          fieldType: 'password',
        });
        expect(result).toBe(true);
      });

      it('option=defaultの場合はtrueを返す', () => {
        const result = getValidationStatus({
          success: true,
          message: '',
          option: 'default',
          fieldType: 'password',
        });
        expect(result).toBe(true);
      });
    });

    describe('メールフィールドのテスト', () => {
      it('成功時はfalseを返す（メールフィールド）', () => {
        const result = getValidationStatus({
          success: true,
          message: '',
          option: '',
          fieldType: 'email',
        });
        expect(result).toBe(false);
      });

      it('メールエラー時はtrueを返す', () => {
        const result = getValidationStatus({
          success: false,
          message: messageType.mail,
          option: '',
          fieldType: 'email',
        });
        expect(result).toBe(true);
      });

      it('メールアドレスエラー時はtrueを返す', () => {
        const result = getValidationStatus({
          success: false,
          message: messageType.addressError,
          option: '',
          fieldType: 'email',
        });
        expect(result).toBe(true);
      });

      it('メール重複エラー時はtrueを返す', () => {
        const result = getValidationStatus({
          success: false,
          message: messageType.mailError,
          option: '',
          fieldType: 'email',
        });
        expect(result).toBe(true);
      });

      it('option=emailの場合はtrueを返す', () => {
        const result = getValidationStatus({
          success: true,
          message: '',
          option: 'email',
          fieldType: 'email',
        });
        expect(result).toBe(true);
      });

      it('option=defaultの場合はtrueを返す（メールフィールド）', () => {
        const result = getValidationStatus({
          success: true,
          message: '',
          option: 'default',
          fieldType: 'email',
        });
        expect(result).toBe(true);
      });
    });

    describe('共通エラーのテスト（37-39行目の条件分岐）', () => {
      it('メールアドレスまたはパスワードが間違っていますエラー', () => {
        const result = getValidationStatus({
          success: false,
          message: 'メールアドレスまたはパスワードが間違っています',
          option: '',
          fieldType: 'password',
        });
        expect(result).toBe(true);
      });

      it('登録処理中にエラーが発生しましたエラー', () => {
        const result = getValidationStatus({
          success: false,
          message:
            '登録処理中にエラーが発生しました。時間をおいて再度お試しください',
          option: '',
          fieldType: 'email',
        });
        expect(result).toBe(true);
      });

      it('option空文字でメッセージありの場合（37行目の条件）', () => {
        const result = getValidationStatus({
          success: false,
          message: '何らかのエラーメッセージ',
          option: '',
          fieldType: 'password',
        });
        // 37行目の条件でisNoPasswordAndOrMailErrorが返される（falseになる可能性が高い）
        // が、success=falseかつfieldType='password'なので最終的にisPasswordErrorがtrueになる
        expect(result).toBe(true);
      });
    });
  });

  describe('getErrorMessage', () => {
    describe('パスワードフィールドのメッセージ', () => {
      it('パスワード入力エラーメッセージを返す', () => {
        const result = getErrorMessage({
          message: messageType.password,
          option: '',
          fieldType: 'password',
        });
        expect(result).toBe(messageType.password);
      });

      it('パスワード形式エラーメッセージを返す', () => {
        const result = getErrorMessage({
          message: messageType.passwordError,
          option: '',
          fieldType: 'password',
        });
        expect(result).toBe(messageType.passwordError);
      });

      it('option=defaultの場合パスワードメッセージを返す', () => {
        const result = getErrorMessage({
          message: '',
          option: 'default',
          fieldType: 'password',
        });
        expect(result).toBe(messageType.password);
      });

      it('該当しない場合はnullを返す（パスワード）', () => {
        const result = getErrorMessage({
          message: '不明なメッセージ',
          option: '',
          fieldType: 'password',
        });
        expect(result).toBe(null);
      });
    });

    describe('メールフィールドのメッセージ', () => {
      it('メール入力エラーメッセージを返す', () => {
        const result = getErrorMessage({
          message: messageType.mail,
          option: '',
          fieldType: 'email',
        });
        expect(result).toBe(messageType.mail);
      });

      it('メールアドレスエラーメッセージを返す', () => {
        const result = getErrorMessage({
          message: messageType.addressError,
          option: '',
          fieldType: 'email',
        });
        expect(result).toBe(messageType.addressError);
      });

      it('メール重複エラーメッセージを返す', () => {
        const result = getErrorMessage({
          message: messageType.mailError,
          option: '',
          fieldType: 'email',
        });
        expect(result).toBe(messageType.mailError);
      });

      it('option=defaultの場合メールメッセージを返す', () => {
        const result = getErrorMessage({
          message: '',
          option: 'default',
          fieldType: 'email',
        });
        expect(result).toBe(messageType.mail);
      });

      it('該当しない場合はnullを返す（メール）', () => {
        const result = getErrorMessage({
          message: '不明なメッセージ',
          option: '',
          fieldType: 'email',
        });
        expect(result).toBe(null);
      });
    });

    describe('フィールドタイプが未定義の場合', () => {
      it('fieldTypeが未定義の場合はnullを返す', () => {
        const result = getErrorMessage({
          message: messageType.password,
          option: '',
        });
        expect(result).toBe(null);
      });
    });
  });

  describe('エッジケースとカバレッジ', () => {
    it('全パラメータ未定義でもエラーにならない', () => {
      const statusResult = getValidationStatus({});
      const messageResult = getErrorMessage({});

      expect(typeof statusResult).toBe('boolean');
      expect(messageResult).toBe(null);
    });

    it('success=undefinedの場合の動作', () => {
      const result = getValidationStatus({
        success: undefined,
        message: messageType.password,
        option: '',
        fieldType: 'password',
      });
      expect(typeof result).toBe('boolean');
    });

    describe('option空文字の特殊処理（30-39行目）', () => {
      it('option空文字で該当エラーメッセージの場合', () => {
        const result = getValidationStatus({
          success: false,
          message: 'メールアドレスまたはパスワードが間違っています',
          option: '',
          fieldType: 'password',
        });
        expect(result).toBe(true);
      });

      it('option空文字で登録処理エラーの場合', () => {
        const result = getValidationStatus({
          success: false,
          message:
            '登録処理中にエラーが発生しました。時間をおいて再度お試しください',
          option: '',
          fieldType: 'email',
        });
        expect(result).toBe(true);
      });
    });
  });

  describe('trimAllSpaces', () => {
    describe('半角スペースのトリミング', () => {
      it('前後の半角スペースを除去する', () => {
        expect(trimAllSpaces('  test  ')).toBe('test');
      });

      it('前のみの半角スペースを除去する', () => {
        expect(trimAllSpaces('  test')).toBe('test');
      });

      it('後のみの半角スペースを除去する', () => {
        expect(trimAllSpaces('test  ')).toBe('test');
      });

      it('半角スペースのみの場合は空文字を返す', () => {
        expect(trimAllSpaces('   ')).toBe('');
      });
    });

    describe('全角スペースのトリミング', () => {
      it('前後の全角スペース（U+3000）を除去する', () => {
        expect(trimAllSpaces('　test　')).toBe('test');
      });

      it('前のみの全角スペースを除去する', () => {
        expect(trimAllSpaces('　test')).toBe('test');
      });

      it('後のみの全角スペースを除去する', () => {
        expect(trimAllSpaces('test　')).toBe('test');
      });

      it('全角スペースのみの場合は空文字を返す', () => {
        expect(trimAllSpaces('　　　')).toBe('');
      });
    });

    describe('半角・全角混在のトリミング', () => {
      it('半角と全角スペースが混在した前後を除去する', () => {
        expect(trimAllSpaces(' 　test　 ')).toBe('test');
      });

      it('タブと全角スペースの混在を除去する', () => {
        expect(trimAllSpaces('\t　test　\t')).toBe('test');
      });

      it('改行と全角スペースの混在を除去する', () => {
        expect(trimAllSpaces('\n　test　\n')).toBe('test');
      });
    });

    describe('中間のスペースは保持', () => {
      it('文字列中間の半角スペースは保持される', () => {
        expect(trimAllSpaces('  hello world  ')).toBe('hello world');
      });

      it('文字列中間の全角スペースは保持される', () => {
        expect(trimAllSpaces('　hello　world　')).toBe('hello　world');
      });
    });

    describe('エッジケース', () => {
      it('空文字の場合は空文字を返す', () => {
        expect(trimAllSpaces('')).toBe('');
      });

      it('スペースなしの文字列はそのまま返す', () => {
        expect(trimAllSpaces('test')).toBe('test');
      });

      it('複数の連続した半角・全角スペースを除去する', () => {
        expect(trimAllSpaces('   　　test　　   ')).toBe('test');
      });

      it('null値の場合は空文字を返す', () => {
        expect(trimAllSpaces(null as unknown as string)).toBe('');
      });

      it('undefined値の場合は空文字を返す', () => {
        expect(trimAllSpaces(undefined as unknown as string)).toBe('');
      });
    });
  });
});
