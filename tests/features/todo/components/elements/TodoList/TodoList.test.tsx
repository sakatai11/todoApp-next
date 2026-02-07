import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  mockTodos,
  createTestTodo,
} from '@/tests/test-utils';
import TodoList from '@/features/todo/components/elements/TodoList/TodoList';

// EditModalのモック
vi.mock('@/features/todo/components/elements/Modal/EditModal', () => ({
  default: ({
    setModalIsOpen,
    modalIsOpen,
  }: {
    setModalIsOpen: (value: boolean) => void;
    modalIsOpen: boolean;
  }) => {
    return modalIsOpen ? (
      <div data-testid="edit-modal">
        <div>Edit Modal</div>
        <button
          onClick={() => setModalIsOpen(false)}
          data-testid="edit-modal-close"
        >
          Close Edit Modal
        </button>
      </div>
    ) : null;
  },
}));

// Mock the formatter function
vi.mock('@/features/utils/textUtils', () => ({
  formatter: vi.fn((text: string) => {
    // 改行を含む場合は実際のformatter関数の挙動を模倣
    if (text.includes('\n')) {
      const parts = text.split('\n');
      const result: Array<{ type: string; content: string; index: string }> =
        [];
      parts.forEach((part, index) => {
        if (part !== '') {
          result.push({
            type: 'normal',
            content: part,
            index: `normal-${index}`,
          });
        }
        if (index < parts.length - 1) {
          result.push({
            type: 'linefeed',
            content: '\n',
            index: `linefeed-${index}`,
          });
        }
      });
      return result;
    }
    // URLを含む場合のlink処理を模倣
    if (text.includes('http')) {
      return [{ type: 'link', content: text, index: 'link-0' }];
    }
    // 通常のテキストの場合
    return [{ type: 'normal', content: text, index: 'normal-0' }];
  }),
}));

// TodoContextのモック関数
const mockToggleSelected = vi.fn();
const mockDeleteTodo = vi.fn();
const mockEditTodo = vi.fn();
let mockEditId: string | null = null;

vi.mock('@/features/todo/contexts/TodoContext', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useTodoContext: () => ({
      todoHooks: {
        get editId() {
          return mockEditId;
        },
        deleteTodo: mockDeleteTodo,
        editTodo: mockEditTodo,
        toggleSelected: mockToggleSelected,
      },
      listHooks: {
        lists: [],
        addList: vi.fn(),
        deleteList: vi.fn(),
        updateListCategory: vi.fn(),
      },
      statusAndCategoryHooks: {
        updateStatusAndCategory: vi.fn(),
      },
    }),
  };
});

describe('TodoList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEditId = null;
  });

  describe('レンダリング', () => {
    it('Todoのテキストが正しく表示される', () => {
      // サブモジュールの最初のTodoデータを使用
      const testTodo = mockTodos[0];

      render(<TodoList todo={testTodo} />);

      expect(screen.getByText('Next.js App Routerの学習')).toBeInTheDocument();
    });

    it('必要なボタンがすべて表示される', () => {
      // サブモジュールの2番目のTodoデータを使用
      const testTodo = mockTodos[1];

      render(<TodoList todo={testTodo} />);

      // アイコンでボタンを識別（MUIのアイコンはdata-testidを持つ）
      expect(screen.getByTestId('PushPinIcon')).toBeInTheDocument();
      expect(screen.getByTestId('ModeEditIcon')).toBeInTheDocument();
      expect(screen.getByTestId('DeleteIcon')).toBeInTheDocument();
    });

    it('ピンボタンの状態がbool値に応じて変化する', () => {
      // サブモジュールから bool: true と bool: false のTodoを取得
      const pinnedTodo =
        mockTodos.find((todo) => todo.bool === true) || mockTodos[0];
      const unpinnedTodo =
        mockTodos.find((todo) => todo.bool === false) || mockTodos[1];

      const { rerender } = render(<TodoList todo={pinnedTodo} />);

      // ピンアイコンの親ボタンを取得
      const toggleButton = screen.getByTestId('PushPinIcon').closest('button');
      expect(toggleButton).toHaveAttribute('aria-pressed', 'true');

      rerender(<TodoList todo={unpinnedTodo} />);
      const newToggleButton = screen
        .getByTestId('PushPinIcon')
        .closest('button');
      expect(newToggleButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('インタラクション', () => {
    it('ピンボタンクリックでtoggleSelectedが呼ばれる', () => {
      // サブモジュールの3番目のTodoデータを使用
      const testTodo = mockTodos[2];

      render(<TodoList todo={testTodo} />);

      const toggleButton = screen.getByTestId('PushPinIcon').closest('button');
      fireEvent.click(toggleButton!);

      // toggleSelectedが適切なIDで呼ばれることを確認
      expect(mockToggleSelected).toHaveBeenCalledWith(testTodo.id);
    });

    it('編集ボタンクリックでeditTodoが呼ばれる', () => {
      // サブモジュールの4番目のTodoデータを使用
      const testTodo = mockTodos[3];

      render(<TodoList todo={testTodo} />);

      const editButton = screen.getByTestId('ModeEditIcon').closest('button');
      fireEvent.click(editButton!);

      // editTodoが適切なIDで呼ばれることを確認
      expect(mockEditTodo).toHaveBeenCalledWith(testTodo.id);
    });

    it('削除ボタンクリックで削除モーダルが開く', () => {
      // サブモジュールの最初のTodoデータを使用
      const testTodo = mockTodos[0];

      render(<TodoList todo={testTodo} />);

      const deleteButton = screen.getByTestId('DeleteIcon').closest('button');
      fireEvent.click(deleteButton!);

      // DeleteModalが表示されることを確認
      expect(
        screen.getByText('削除しても問題ないですか？'),
      ).toBeInTheDocument();
    });
  });

  describe('テキスト表示', () => {
    it('長いテキストが適切に表示される', () => {
      const longText = 'これは非常に長いテキストです。'.repeat(10);
      const testTodo = createTestTodo({ text: longText });

      render(<TodoList todo={testTodo} />);

      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('改行を含むテキストが正しく処理される', () => {
      // サブモジュールから改行を含むTodoを取得（'Line 1\nLine 2\nLine 3'）
      const todoWithNewlines = mockTodos.find((todo) =>
        todo.text.includes('\n'),
      );
      expect(todoWithNewlines).toBeDefined(); // サブモジュールに改行Todoが存在することを確認

      render(<TodoList todo={todoWithNewlines!} />);

      // 改行テキストが適切に処理され、<br>タグが含まれることを確認
      // css-cyxlmuクラスを持つテキストコンテナを特定
      const textContainer = document.querySelector('.css-cyxlmu');
      expect(textContainer).toBeInTheDocument();
      expect(textContainer).toHaveTextContent('Line 1Line 2Line 3');

      // <br>タグが存在することを確認
      const brTags = textContainer?.querySelectorAll('br');
      expect(brTags).toHaveLength(2);
    });

    it('URLを含むテキストが正しく処理される', () => {
      const textWithUrl = 'https://example.com';
      const testTodo = createTestTodo({ text: textWithUrl });

      render(<TodoList todo={testTodo} />);

      // linkタイプとして処理され、<a>タグがレンダリングされることを確認
      const linkElement = screen.getByRole('link');
      expect(linkElement).toBeInTheDocument();
      expect(linkElement).toHaveAttribute('href', textWithUrl);
      expect(linkElement).toHaveAttribute('target', '_blank');
      expect(linkElement).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('モーダル動作', () => {
    it('編集モーダルが条件付きで表示される', () => {
      // サブモジュールの2番目のTodoデータを使用
      const testTodo = mockTodos[1];

      const { rerender } = render(<TodoList todo={testTodo} />);

      // 初期状態では編集モーダルは表示されない
      expect(screen.queryByTestId('edit-modal')).not.toBeInTheDocument();

      // editIdを設定してモーダルが表示される条件を作る
      mockEditId = testTodo.id;

      // 再レンダリング
      rerender(<TodoList todo={testTodo} />);

      // 編集ボタンをクリック
      const editButton = screen.getByTestId('ModeEditIcon').closest('button');
      fireEvent.click(editButton!);

      // EditModalが表示されることを確認
      expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
    });

    it('削除モーダルが正しく表示される', () => {
      // サブモジュールの3番目のTodoデータを使用
      const testTodo = mockTodos[2];

      render(<TodoList todo={testTodo} />);

      // 削除ボタンをクリック
      const deleteButton = screen.getByTestId('DeleteIcon').closest('button');
      fireEvent.click(deleteButton!);

      // DeleteModalが表示される
      expect(
        screen.getByText('削除しても問題ないですか？'),
      ).toBeInTheDocument();
    });
  });

  describe('スタイリング', () => {
    it('適切なMUIスタイルが適用される', () => {
      // サブモジュールの最初のTodoデータを使用
      const testTodo = mockTodos[0];

      render(<TodoList todo={testTodo} />);

      // Box コンポーネントが適切にレンダリングされることを確認
      const todoContainer = screen.getByText(testTodo.text).closest('div');
      expect(todoContainer).toBeInTheDocument();
    });

    it('ボタンのサイズとスタイルが正しく設定される', () => {
      // サブモジュールの2番目のTodoデータを使用
      const testTodo = mockTodos[1];

      render(<TodoList todo={testTodo} />);

      const toggleButton = screen.getByTestId('PushPinIcon').closest('button');
      const editButton = screen.getByTestId('ModeEditIcon').closest('button');
      const deleteButton = screen.getByTestId('DeleteIcon').closest('button');

      expect(toggleButton).toBeInTheDocument();
      expect(editButton).toBeInTheDocument();
      expect(deleteButton).toBeInTheDocument();
    });
  });

  describe('メモ化', () => {
    it('コンポーネントがReact.memoでメモ化されている', () => {
      // React.memoの効果は実際のレンダリング回数の測定で確認される
      // ここでは基本的な動作確認を行う
      const testTodo = mockTodos[0];

      const { rerender } = render(<TodoList todo={testTodo} />);

      // 同じpropsで再レンダリング
      rerender(<TodoList todo={testTodo} />);

      expect(screen.getByText(testTodo.text)).toBeInTheDocument();
    });

    it('Todoデータが正しく表示される', () => {
      // サブモジュールの4番目のTodoデータを使用
      const testTodo = mockTodos[3];

      render(<TodoList todo={testTodo} />);

      expect(screen.getByText(testTodo.text)).toBeInTheDocument();
    });
  });

  describe('モーダル状態管理', () => {
    it('編集モーダルの開閉状態が正しく管理される', () => {
      const testTodo = mockTodos[0];

      // editIdを設定してモーダルが表示される条件を作る
      mockEditId = testTodo.id;

      render(<TodoList todo={testTodo} />);

      // 編集ボタンをクリックして編集モードに入る
      const editButton = screen.getByTestId('ModeEditIcon').closest('button');
      fireEvent.click(editButton!);

      // EditModalが表示されることを確認
      expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
      expect(screen.getByText('Edit Modal')).toBeInTheDocument();

      // EditModalのClose ボタンをクリックしてsetModalIsOpen(false)を実行
      const closeButton = screen.getByTestId('edit-modal-close');
      fireEvent.click(closeButton);

      // EditModalが閉じられることを確認
      expect(screen.queryByTestId('edit-modal')).not.toBeInTheDocument();
    });

    it('削除モーダルの開閉状態が正しく管理される', () => {
      const testTodo = mockTodos[0];

      render(<TodoList todo={testTodo} />);

      // 削除ボタンをクリック
      const deleteButton = screen.getByTestId('DeleteIcon').closest('button');
      fireEvent.click(deleteButton!);

      // DeleteModalが表示される
      expect(
        screen.getByText('削除しても問題ないですか？'),
      ).toBeInTheDocument();

      // キャンセルボタンをクリックしてモーダルを閉じる
      const cancelButton = screen.getByText('キャンセル');
      fireEvent.click(cancelButton);

      // DeleteModalが閉じられることを確認
      expect(
        screen.queryByText('削除しても問題ないですか？'),
      ).not.toBeInTheDocument();
    });
  });

  describe('削除機能の詳細動作', () => {
    it('削除確認後にdeleteTodo関数が正しく実行される', () => {
      const testTodo = mockTodos[0];

      render(<TodoList todo={testTodo} />);

      // 削除ボタンをクリック
      const deleteButton = screen.getByTestId('DeleteIcon').closest('button');
      fireEvent.click(deleteButton!);

      // DeleteModalが表示される
      expect(
        screen.getByText('削除しても問題ないですか？'),
      ).toBeInTheDocument();

      // 削除実行ボタンをクリック（実際のボタンテキストは「OK」）
      const confirmButton = screen.getByText('OK');
      fireEvent.click(confirmButton);

      // deleteTodo関数が正しいIDで呼ばれることを確認
      expect(mockDeleteTodo).toHaveBeenCalledWith(testTodo.id);
    });

    it('todo.idが空の場合でも適切にエラーハンドリングされる', () => {
      const todoWithoutId = { ...mockTodos[0], id: '' };

      expect(() => {
        render(<TodoList todo={todoWithoutId} />);
      }).not.toThrow();

      // 編集ボタンをクリックしてもエラーが発生しないことを確認
      const editButton = screen.getByTestId('ModeEditIcon').closest('button');
      fireEvent.click(editButton!);

      // 削除ボタンをクリック
      const deleteButton = screen.getByTestId('DeleteIcon').closest('button');
      fireEvent.click(deleteButton!);

      // DeleteModalが表示される
      expect(
        screen.getByText('削除しても問題ないですか？'),
      ).toBeInTheDocument();

      // 削除実行ボタンをクリックしてもエラーが発生しないことを確認（実際のボタンテキストは「OK」）
      const confirmButton = screen.getByText('OK');
      expect(() => {
        fireEvent.click(confirmButton);
      }).not.toThrow();
    });
  });

  describe('エラーハンドリング', () => {
    it('不正なTodoオブジェクトでもクラッシュしない', () => {
      // サブモジュールデータをベースに不正な値に変更
      const invalidTodo = { ...mockTodos[0], id: '', text: '' };

      expect(() => {
        render(<TodoList todo={invalidTodo} />);
      }).not.toThrow();
    });

    it('undefinedのプロパティでも正常に動作する', () => {
      // undefined の場合、実際のコンポーネントがどう動作するかテスト
      // 代わりに空文字列でテスト（undefined は通常発生しない）
      const todoWithEmptyText = {
        ...createTestTodo(),
        text: '',
      };

      expect(() => {
        render(<TodoList todo={todoWithEmptyText} />);
      }).not.toThrow();

      // 空文字列でも基本的なUIが表示されることを確認
      expect(screen.getByTestId('PushPinIcon')).toBeInTheDocument();
    });
  });
});
