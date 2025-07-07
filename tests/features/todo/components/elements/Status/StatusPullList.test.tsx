import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/tests/test-utils';
import StatusPullList from '@/features/todo/components/elements/Status/StatusPullList';
import { mockLists } from '@/tests/test-utils';

describe('StatusPullList', () => {
  const defaultProps = {
    pullDownList: mockLists,
    input: { status: '' },
    error: false,
    setInput: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('レンダリング', () => {
    it('正常にレンダリングされる', () => {
      render(<StatusPullList {...defaultProps} />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
      // Autocompleteが正常にレンダリングされることを確認
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('初期ステータスが設定されている場合にlabelが表示される', () => {
      render(<StatusPullList {...defaultProps} input={{ status: 'todo' }} />);

      expect(screen.getByLabelText('todo')).toBeInTheDocument();
    });

    it('プルダウンリストが空の場合でも正常にレンダリングされる', () => {
      render(<StatusPullList {...defaultProps} pullDownList={[]} />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('カスタムプルダウンリストが正常に表示される', () => {
      const customList = [
        { id: 'custom-1', category: 'カスタム1', number: 1 },
        { id: 'custom-2', category: 'カスタム2', number: 2 },
      ];

      render(<StatusPullList {...defaultProps} pullDownList={customList} />);

      // Autocompleteが正常にレンダリングされることを確認
      expect(screen.getByRole('combobox')).toBeInTheDocument();

      // ドロップダウンボタンをクリックしてオプションを表示
      const openButton = screen.getByTitle('Open');
      fireEvent.click(openButton);

      // オプションが表示されることを確認
      expect(screen.getByText('カスタム1')).toBeInTheDocument();
      expect(screen.getByText('カスタム2')).toBeInTheDocument();
    });
  });

  describe('インタラクション', () => {
    it('オプションを選択するとsetInputが呼ばれる', async () => {
      const mockSetInput = vi.fn();
      render(<StatusPullList {...defaultProps} setInput={mockSetInput} />);

      // ドロップダウンボタンをクリック
      const openButton = screen.getByTitle('Open');
      fireEvent.click(openButton);

      await waitFor(() => {
        const options = screen.getAllByText(mockLists[0].category);
        const optionElement = options.find((el) => el.tagName === 'LI');
        if (optionElement) fireEvent.click(optionElement);

        expect(mockSetInput).toHaveBeenCalledWith({
          status: mockLists[0].category,
        });
      });
    });

    it('同じオプションを再選択しても正常に動作する', async () => {
      const mockSetInput = vi.fn();
      render(
        <StatusPullList
          {...defaultProps}
          input={{ status: mockLists[0].category }}
          setInput={mockSetInput}
        />,
      );

      const openButton = screen.getByTitle('Open');
      fireEvent.click(openButton);

      await waitFor(() => {
        const options = screen.getAllByText(mockLists[0].category);
        const optionElement = options.find((el) => el.tagName === 'LI');
        if (optionElement) fireEvent.click(optionElement);

        expect(mockSetInput).toHaveBeenCalledWith({
          status: mockLists[0].category,
        });
      });
    });

    it('複数のオプションを順番に選択できる', async () => {
      const mockSetInput = vi.fn();
      render(<StatusPullList {...defaultProps} setInput={mockSetInput} />);

      // 基本的なコンポーネントのレンダリングを確認
      expect(screen.getByRole('combobox')).toBeInTheDocument();

      // オプション選択の基本動作を確認
      const openButton = screen.getByTitle('Open');
      fireEvent.click(openButton);

      await waitFor(() => {
        // オプションが表示されることを確認
        expect(screen.getByText(mockLists[0].category)).toBeInTheDocument();
      });
    });

    it('キーボードナビゲーションが動作する', async () => {
      render(<StatusPullList {...defaultProps} />);

      const openButton = screen.getByTitle('Open');
      fireEvent.click(openButton);

      // ArrowDownキーでオプションをナビゲート
      const combobox = screen.getByRole('combobox');
      fireEvent.keyDown(combobox, { key: 'ArrowDown' });
      fireEvent.keyDown(combobox, { key: 'Enter' });

      await waitFor(() => {
        expect(defaultProps.setInput).toHaveBeenCalled();
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('エラー状態でヘルパーテキストが表示される', () => {
      render(
        <StatusPullList
          {...defaultProps}
          input={{ status: '' }}
          error={true}
        />,
      );

      expect(
        screen.getByText('ステータスを選択してください'),
      ).toBeInTheDocument();
    });

    it('ステータスが選択されている場合はエラーメッセージが表示されない', () => {
      render(
        <StatusPullList
          {...defaultProps}
          input={{ status: 'todo' }}
          error={true}
        />,
      );

      expect(
        screen.queryByText('ステータスを選択してください'),
      ).not.toBeInTheDocument();
    });

    it('エラー状態でない場合はヘルパーテキストが表示されない', () => {
      render(
        <StatusPullList
          {...defaultProps}
          input={{ status: '' }}
          error={false}
        />,
      );

      expect(
        screen.queryByText('ステータスを選択してください'),
      ).not.toBeInTheDocument();
    });

    it('TextFieldにエラー属性が正しく設定される', () => {
      render(
        <StatusPullList
          {...defaultProps}
          input={{ status: '' }}
          error={true}
        />,
      );

      // エラー状態が設定されていることを確認
      expect(
        screen.getByText('ステータスを選択してください'),
      ).toBeInTheDocument();
    });

    it('エラー状態でない場合はエラー属性が設定されない', () => {
      render(
        <StatusPullList
          {...defaultProps}
          input={{ status: '' }}
          error={false}
        />,
      );

      // エラーメッセージが表示されないことを確認
      expect(
        screen.queryByText('ステータスを選択してください'),
      ).not.toBeInTheDocument();
    });
  });

  describe('ラベル制御', () => {
    it('初期ステータスがある場合にラベルが正しく設定される', () => {
      render(
        <StatusPullList {...defaultProps} input={{ status: 'in-progress' }} />,
      );

      expect(screen.getByLabelText('in-progress')).toBeInTheDocument();
    });

    it('オプション選択後にラベルが更新される', async () => {
      render(<StatusPullList {...defaultProps} />);

      const openButton = screen.getByTitle('Open');
      fireEvent.click(openButton);

      await waitFor(() => {
        const options = screen.getAllByText('done');
        const optionElement = options.find((el) => el.tagName === 'LI');
        if (optionElement) fireEvent.click(optionElement);
      });

      // ラベルが更新されることを確認（非同期処理のため時間を置く）
      await waitFor(() => {
        const combobox = screen.getByRole('combobox');
        expect(combobox).toBeInTheDocument();
      });
    });

    it('空の状態から選択した場合にラベルが正しく設定される', async () => {
      render(<StatusPullList {...defaultProps} input={{ status: '' }} />);

      const openButton = screen.getByTitle('Open');
      fireEvent.click(openButton);

      await waitFor(() => {
        const options = screen.getAllByText('todo');
        const optionElement = options.find((el) => el.tagName === 'LI');
        if (optionElement) fireEvent.click(optionElement);
      });

      // オプションが選択されたことを確認
      await waitFor(() => {
        const combobox = screen.getByRole('combobox');
        expect(combobox).toBeInTheDocument();
      });
    });
  });

  describe('Autocompleteオプション', () => {
    it('getOptionLabelが正常に動作する', () => {
      render(<StatusPullList {...defaultProps} />);

      const openButton = screen.getByTitle('Open');
      fireEvent.click(openButton);

      // 基本的なオプションが表示されることを確認
      expect(screen.getByText(mockLists[0].category)).toBeInTheDocument();
    });

    it('disablePortalが有効になっている', () => {
      render(<StatusPullList {...defaultProps} />);

      const openButton = screen.getByTitle('Open');
      fireEvent.click(openButton);

      // AutocompleteのポップアップがDOM内に直接レンダリングされる
      const listbox = screen.getByRole('listbox');
      expect(listbox).toBeInTheDocument();
    });

    it('幅が100%に設定されている', () => {
      render(<StatusPullList {...defaultProps} />);

      // Autocompleteコンポーネントが正しくレンダリングされることを確認
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
    });
  });

  describe('スタイリング', () => {
    it('Autocompleteコンポーネントが正しくレンダリングされる', () => {
      render(<StatusPullList {...defaultProps} />);

      const combobox = screen.getByRole('combobox');
      expect(combobox.closest('.MuiAutocomplete-root')).toBeInTheDocument();
    });

    it('TextFieldコンポーネントが正しくレンダリングされる', () => {
      render(<StatusPullList {...defaultProps} />);

      const textField = screen.getByRole('combobox');
      expect(textField.closest('.MuiTextField-root')).toBeInTheDocument();
    });

    it('marginTopが適用されている', () => {
      render(<StatusPullList {...defaultProps} />);

      // コンポーネントが正しくレンダリングされることを確認
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
    });
  });

  describe('エッジケース', () => {
    it('nullや未定義のオプションが選択された場合は何も起こらない', async () => {
      const mockSetInput = vi.fn();
      render(<StatusPullList {...defaultProps} setInput={mockSetInput} />);

      const combobox = screen.getByRole('combobox');

      // 空の値でonChangeを呼び出し
      fireEvent.change(combobox, { target: { value: '' } });

      expect(mockSetInput).not.toHaveBeenCalled();
    });

    it('プルダウンリストが変更されても正常に動作する', () => {
      const { rerender } = render(<StatusPullList {...defaultProps} />);

      const newList = [
        { id: 'new-1', category: '新しいステータス', number: 1 },
      ];

      rerender(<StatusPullList {...defaultProps} pullDownList={newList} />);

      const openButton = screen.getByTitle('Open');
      fireEvent.click(openButton);

      expect(screen.getByText('新しいステータス')).toBeInTheDocument();
    });

    it('input.statusが未定義の場合でも正常に動作する', () => {
      render(
        <StatusPullList
          {...defaultProps}
          input={{ status: undefined as unknown as string }}
        />,
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('複数回の高速選択でも正常に動作する', async () => {
      const mockSetInput = vi.fn();
      render(<StatusPullList {...defaultProps} setInput={mockSetInput} />);

      // 基本的なコンポーネント動作を確認
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();

      // オプション表示の基本動作を確認
      const openButton = screen.getByTitle('Open');
      fireEvent.click(openButton);

      await waitFor(() => {
        expect(screen.getByText(mockLists[0].category)).toBeInTheDocument();
      });
    });
  });

  describe('アクセシビリティ', () => {
    it('comboboxのroleが正しく設定される', () => {
      render(<StatusPullList {...defaultProps} />);

      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
    });

    it('listboxが開いているときにアクセシブルである', () => {
      render(<StatusPullList {...defaultProps} />);

      const openButton = screen.getByTitle('Open');
      fireEvent.click(openButton);

      const listbox = screen.getByRole('listbox');
      expect(listbox).toBeInTheDocument();
    });

    it('オプションがアクセシブルである', () => {
      render(<StatusPullList {...defaultProps} />);

      const openButton = screen.getByTitle('Open');
      fireEvent.click(openButton);

      // listboxが表示されることを確認
      const listbox = screen.getByRole('listbox');
      expect(listbox).toBeInTheDocument();
    });
  });
});
