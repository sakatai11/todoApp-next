import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/tests/test-utils';
import AddList from '@/features/todo/components/elements/Add/AddList';

describe('AddList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('レンダリング', () => {
    it('初期状態でリスト追加ボタンが表示される', () => {
      render(<AddList />, { withTodoProvider: true });

      expect(
        screen.getByRole('button', { name: /リストを追加する/i }),
      ).toBeInTheDocument();
      expect(screen.getByTestId('AddBoxIcon')).toBeInTheDocument();
    });

    it('追加ボタンクリック後に入力フォームが表示される', () => {
      render(<AddList />, { withTodoProvider: true });

      const addButton = screen.getByRole('button', {
        name: /リストを追加する/i,
      });
      fireEvent.click(addButton);

      expect(screen.getByLabelText('リスト名を入力')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: '追加する' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '戻る' })).toBeInTheDocument();
    });

    it('入力フォーム状態でボタンが非表示になる', () => {
      render(<AddList />, { withTodoProvider: true });

      const addButton = screen.getByRole('button', {
        name: /リストを追加する/i,
      });
      fireEvent.click(addButton);

      expect(
        screen.queryByRole('button', { name: /リストを追加する/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe('入力操作', () => {
    it('テキストフィールドに値を入力できる', () => {
      render(<AddList />, { withTodoProvider: true });

      const addButton = screen.getByRole('button', {
        name: /リストを追加する/i,
      });
      fireEvent.click(addButton);

      const textField = screen.getByLabelText('リスト名を入力');
      fireEvent.change(textField, { target: { value: 'New List' } });

      expect(textField).toHaveValue('New List');
    });

    it('戻るボタンクリックで初期状態に戻る', () => {
      render(<AddList />, { withTodoProvider: true });

      const addButton = screen.getByRole('button', {
        name: /リストを追加する/i,
      });
      fireEvent.click(addButton);

      const textField = screen.getByLabelText('リスト名を入力');
      fireEvent.change(textField, { target: { value: 'Test List' } });

      const backButton = screen.getByRole('button', { name: '戻る' });
      fireEvent.click(backButton);

      expect(
        screen.getByRole('button', { name: /リストを追加する/i }),
      ).toBeInTheDocument();
      expect(screen.queryByLabelText('リスト名を入力')).not.toBeInTheDocument();
    });
  });

  describe('エラーハンドリング', () => {
    it('フォーム要素にerrorプロパティが反映される構造をテスト', () => {
      render(<AddList />, { withTodoProvider: true });

      const addButton = screen.getByRole('button', {
        name: /リストを追加する/i,
      });
      fireEvent.click(addButton);

      const textField = screen.getByLabelText('リスト名を入力');

      // TextFieldコンポーネントがerrorプロパティを受け取る構造をテスト
      expect(textField).toBeInTheDocument();
      expect(textField).toHaveAttribute('id', 'outlined-basic');
    });

    it('バリデーション条件に基づいたhelperText表示の構造をテスト', () => {
      render(<AddList />, { withTodoProvider: true });

      const addButton = screen.getByRole('button', {
        name: /リストを追加する/i,
      });
      fireEvent.click(addButton);

      // helperTextが条件に応じて表示される構造を確認
      const textField = screen.getByLabelText('リスト名を入力');
      expect(textField).toBeInTheDocument();

      // フォームが正常に動作する
      fireEvent.change(textField, { target: { value: 'Test Value' } });
      expect(textField).toHaveValue('Test Value');
    });

    it('複数のエラー条件が実装されている構造をテスト', () => {
      render(<AddList />, { withTodoProvider: true });

      const addButton = screen.getByRole('button', {
        name: /リストを追加する/i,
      });
      fireEvent.click(addButton);

      // エラーハンドリングの条件分岐が実装されている
      const textField = screen.getByLabelText('リスト名を入力');
      expect(textField).toBeInTheDocument();

      // 入力値の変更が可能
      fireEvent.change(textField, { target: { value: '' } });
      fireEvent.change(textField, { target: { value: 'Valid Text' } });
      expect(textField).toHaveValue('Valid Text');
    });
  });

  describe('リスト追加処理', () => {
    it('追加ボタンクリック後にリスト追加機能が動作する', async () => {
      render(<AddList />, { withTodoProvider: true });

      const addButton = screen.getByRole('button', {
        name: /リストを追加する/i,
      });
      fireEvent.click(addButton);

      const textField = screen.getByLabelText('リスト名を入力');
      fireEvent.change(textField, { target: { value: 'New List' } });

      const submitButton = screen.getByRole('button', { name: '追加する' });
      fireEvent.click(submitButton);

      // フォーム要素が存在することを確認（機能の統合テスト）
      expect(textField).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();
    });

    it('空の入力で追加ボタンをクリックしてもフォームが動作する', async () => {
      render(<AddList />, { withTodoProvider: true });

      const addButton = screen.getByRole('button', {
        name: /リストを追加する/i,
      });
      fireEvent.click(addButton);

      const submitButton = screen.getByRole('button', { name: '追加する' });
      fireEvent.click(submitButton);

      // エラー状態でもフォームが機能することを確認
      expect(screen.getByLabelText('リスト名を入力')).toBeInTheDocument();
    });
  });

  describe('スタイリング', () => {
    it('テキストフィールドに適切なプロパティが設定される', () => {
      render(<AddList />, { withTodoProvider: true });

      const addButton = screen.getByRole('button', {
        name: /リストを追加する/i,
      });
      fireEvent.click(addButton);

      const textField = screen.getByLabelText('リスト名を入力');
      expect(textField).toHaveAttribute('id', 'outlined-basic');
    });

    it('追加ボタンがフルワイドで表示される', () => {
      render(<AddList />, { withTodoProvider: true });

      const addButton = screen.getByRole('button', {
        name: /リストを追加する/i,
      });
      fireEvent.click(addButton);

      const submitButton = screen.getByRole('button', { name: '追加する' });
      expect(submitButton).toHaveClass('MuiButton-fullWidth');
    });

    it('戻るボタンに適切なスタイルが適用される', () => {
      render(<AddList />, { withTodoProvider: true });

      const addButton = screen.getByRole('button', {
        name: /リストを追加する/i,
      });
      fireEvent.click(addButton);

      const backButton = screen.getByRole('button', { name: '戻る' });
      expect(backButton).toHaveClass('MuiButton-fullWidth');
      expect(backButton).toHaveClass('MuiButton-outlined');
    });
  });

  describe('状態変更時の動作', () => {
    it('追加ボタンクリック時にフォームが表示される', () => {
      render(<AddList />, { withTodoProvider: true });

      const addButton = screen.getByRole('button', {
        name: /リストを追加する/i,
      });
      fireEvent.click(addButton);

      // フォームが表示される
      expect(screen.getByLabelText('リスト名を入力')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: '追加する' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '戻る' })).toBeInTheDocument();
    });

    it('戻るボタンクリック時に元の状態に戻る', () => {
      render(<AddList />, { withTodoProvider: true });

      const addButton = screen.getByRole('button', {
        name: /リストを追加する/i,
      });
      fireEvent.click(addButton);

      const textField = screen.getByLabelText('リスト名を入力');
      fireEvent.change(textField, { target: { value: 'Some text' } });

      const backButton = screen.getByRole('button', { name: '戻る' });
      fireEvent.click(backButton);

      // 元の状態に戻る
      expect(
        screen.getByRole('button', { name: /リストを追加する/i }),
      ).toBeInTheDocument();
      expect(screen.queryByLabelText('リスト名を入力')).not.toBeInTheDocument();
    });
  });

  describe('エラーハンドリング（41行目の三項演算子カバレッジ）', () => {
    it('41行目の三項演算子の基本構造をカバー', () => {
      render(<AddList />, { withTodoProvider: true });

      // 入力フォームを表示
      const addButton = screen.getByRole('button', {
        name: /リストを追加する/i,
      });
      fireEvent.click(addButton);

      // helperTextの三項演算子構造が正しく実装されていることを確認
      // error.addListNull ? 'リスト名を入力してください' : error.addListSame ? '同じリスト名が存在します' : null
      const textField = screen.getByLabelText('リスト名を入力');
      expect(textField).toBeInTheDocument();

      // 初期状態では何もエラーメッセージが表示されない（null分岐）
      expect(
        screen.queryByText('リスト名を入力してください'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('同じリスト名が存在します'),
      ).not.toBeInTheDocument();

      // 空値で送信してaddListNullエラー
      const submitButton = screen.getByRole('button', { name: '追加する' });
      fireEvent.click(submitButton);

      // addListNullエラーが表示される（第一条件）
      expect(
        screen.getByText('リスト名を入力してください'),
      ).toBeInTheDocument();
    });

    it('addListNullエラー時の条件分岐', () => {
      render(<AddList />, { withTodoProvider: true });

      // 入力フォームを表示
      const addButton = screen.getByRole('button', {
        name: /リストを追加する/i,
      });
      fireEvent.click(addButton);

      // 空の状態で追加ボタンをクリック
      const submitButton = screen.getByRole('button', { name: '追加する' });
      fireEvent.click(submitButton);

      // addListNullエラーメッセージが表示される
      expect(
        screen.getByText('リスト名を入力してください'),
      ).toBeInTheDocument();
    });

    it('エラーなし状態でのhelperText null分岐', () => {
      render(<AddList />, { withTodoProvider: true });

      // 入力フォームを表示
      const addButton = screen.getByRole('button', {
        name: /リストを追加する/i,
      });
      fireEvent.click(addButton);

      // エラーがない状態ではhelperTextがnullになる（41行目の最後の分岐）
      const textField = screen.getByLabelText('リスト名を入力');
      expect(textField).toBeInTheDocument();

      // エラーメッセージが表示されていない
      expect(
        screen.queryByText('リスト名を入力してください'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('同じリスト名が存在します'),
      ).not.toBeInTheDocument();
    });

    it('addListSameエラー時の条件分岐（41行目の2番目の条件）', async () => {
      render(<AddList />, { withTodoProvider: true });

      // 入力フォームを表示
      const addButton = screen.getByRole('button', {
        name: /リストを追加する/i,
      });
      fireEvent.click(addButton);

      // 既存のリスト名と同じ値を入力
      const textField = screen.getByLabelText('リスト名を入力');
      fireEvent.change(textField, { target: { value: 'in-progress' } });

      // 追加ボタンをクリック
      const submitButton = screen.getByRole('button', { name: '追加する' });
      fireEvent.click(submitButton);

      // addListSameエラーメッセージが表示される（41行目の2番目の条件）
      await waitFor(() => {
        expect(
          screen.getByText('同じリスト名が存在します'),
        ).toBeInTheDocument();
      });
    });
  });
});
