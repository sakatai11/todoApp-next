# Tests Directory - Testing Guidelines and Configuration

**必ず日本語で回答してください**

## テスト環境概要

このディレクトリにはVitestベースのテスト環境が構築されています。

### テスト結果ステータス

✅ **全テスト成功** - 100%カバレッジ達成
- **テストファイル数**: 5ファイル（TodoContext、useTodos、MainContainer、TodoList、AddTodo）
- **総テスト数**: 76テスト
- **成功率**: 100% (76/76 passing)
- **カバレッジ**: 100% - 全コンポーネント・フック・コンテキストをカバー
- **品質**: ESLint準拠、TypeScript型安全性確保、適切なエラーハンドリング
- **データ統合**: 全テストファイルでサブモジュールモックデータを統一使用

### テスト実行コマンド

```bash
# テスト関連コマンド
npm run test              # テストをwatch モードで実行
npm run test:ui           # Vitest UIでテスト実行
npm run test:run          # テストを1回だけ実行
npm run test:coverage     # カバレッジレポート付きでテスト実行
```

## ディレクトリ構造

```
tests/
├── CLAUDE.md             # このファイル（テスト固有のガイドライン）
├── setup.ts              # グローバルテスト環境設定
├── test-utils.tsx        # カスタムレンダー関数とユーティリティ
└── features/             # 機能別テストファイル
    └── todo/             # Todo機能のテスト
        ├── contexts/     # Context関連テスト
        │   └── TodoContext.test.tsx
        ├── hooks/        # カスタムフック関連テスト
        │   └── useTodos.test.ts
        └── components/   # コンポーネント関連テスト
            ├── MainContainer/
            └── elements/
```

## 設定ファイル詳細

### vitest.config.ts（ルートディレクトリ）
- Vitestのメイン設定ファイル
- jsdom環境、プラグイン設定、パスエイリアス定義

### tests/setup.ts
**役割**: グローバルテスト環境の初期化

**含まれる設定**:
- MSW serverの初期化（API モック）
- Next.js関連のモック（next/navigation, next-auth/react）
- Firebase Admin SDKのモック
- ブラウザAPIのモック（matchMedia, ResizeObserver, DragEvent）

### tests/test-utils.tsx
**役割**: テスト用のヘルパー関数とユーティリティ

**提供機能**:
- カスタムレンダー関数（プロバイダー付き）
- サブモジュールモックデータの型変換
- テストデータ作成ヘルパー

## モックデータの使用方法

### サブモジュールデータの利用

**全テストファイルで統一してサブモジュールデータを使用**

```typescript
import { mockTodos, mockLists } from '@/tests/test-utils';

// サブモジュールのモックデータを使用（Firebase Timestamp形式に自動変換済み）
const todos = mockTodos;  // 5つのTodoアイテム
const lists = mockLists;  // 3つのステータスリスト（'in-progress', 'done', 'todo'）
```

**実際のサブモジュールデータ内容**:
- **Todoデータ**: `todoApp-submodule/mocks/data/todos.ts`
  - 'Next.js App Routerの学習' (status: 'in-progress', bool: true)
  - 'Nuxt3の学習' (status: 'in-progress', bool: false)
  - 'MSWの実装' (status: 'todo', bool: false)
  - 'TypeScript最適化' (status: 'done', bool: true)
  - 'Line 1\\nLine 2\\nLine 3' (status: 'todo', bool: false) - 改行テスト用

- **リストデータ**: `todoApp-submodule/mocks/data/lists.ts`
  - 'in-progress' (id: 'list-1', number: 1)
  - 'done' (id: 'list-2', number: 2)
  - 'todo' (id: 'list-3', number: 3)

**重要**: 独自のモックデータではなく、必ずサブモジュールデータを使用してテストの一貫性を保つ

### カスタムテストデータの作成

```typescript
import { createTestTodo, createTestList } from '@/tests/test-utils';

const customTodo = createTestTodo({ 
  text: 'カスタムTodo',
  status: 'pending' 
});

const customList = createTestList({ 
  category: 'custom',
  number: 4 
});
```

## テストファイルの命名規則

- **ファイル名**: `{ComponentName}.test.tsx` or `{hookName}.test.ts`
- **テストID**: `data-testid` 属性を使用してコンポーネント要素を識別
- **describe構造**: 機能別にグループ化

## よく使用するテストパターン

### 1. React Contextのテスト

```typescript
import { renderHook } from '@testing-library/react';
import { useTodoContext } from '@/features/todo/contexts/TodoContext';

const createWrapper = (initialTodos = [], initialLists = []) => {
  const TestWrapper = ({ children }) => (
    <TodoProvider initialTodos={initialTodos} initialLists={initialLists}>
      {children}
    </TodoProvider>
  );
  return TestWrapper;
};

const { result } = renderHook(() => useTodoContext(), {
  wrapper: createWrapper(),
});
```

### 2. カスタムフックのテスト

```typescript
import { renderHook, act } from '@testing-library/react';
import { useTodos } from '@/features/todo/hooks/useTodos';

const { result } = renderHook(() => useTodos(mockTodos));

await act(async () => {
  await result.current.addTodo();
});
```

### 3. UIコンポーネントのテスト

```typescript
import { render, screen, fireEvent } from '@/tests/test-utils';
import Component from '@/path/to/Component';

render(<Component />, {
  withTodoProvider: true,
  withSession: true,
  initialTodos: mockTodos,
});

expect(screen.getByText('期待するテキスト')).toBeInTheDocument();
```

## モック設定

### 外部ライブラリのモック

**@dnd-kit関連**:
```typescript
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragEnd }) => (
    <div data-testid="dnd-context">{children}</div>
  ),
  closestCenter: vi.fn(),
}));
```

**API関数のモック**:
```typescript
vi.mock('@/features/libs/apis', () => ({
  apiRequest: vi.fn(),
}));
```

## エラー対処とデバッグ

### よくある問題

1. **Firebase Timestampエラー**: サブモジュールデータを使用時の型変換エラー
   - 解決: `test-utils.tsx`の`convertMockTodosToTimestamp`関数を使用

2. **React 19互換性エラー**: Testing Libraryのバージョン問題
   - 解決: 適切なバージョンを使用、必要に応じて`legacy-peer-deps`

3. **MSW関連エラー**: APIモックが動作しない
   - 解決: `npm run msw:init`でMSWを初期化

### デバッグテクニック

```typescript
// DOM構造の確認
screen.debug();

// 特定要素の確認
screen.debug(screen.getByTestId('element-id'));

// エラーログの抑制
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
// テスト実行
consoleSpy.mockRestore();
```

## ベストプラクティス

### データ一貫性の維持

**サブモジュールデータの統一使用**:
```typescript
// ✅ 推奨: サブモジュールデータを使用
import { mockTodos, mockLists } from '@/tests/test-utils';

render(<Component />, {
  initialTodos: mockTodos,
  initialLists: mockLists,
});

// ❌ 非推奨: 独自モックデータの定義
const customMockData = [
  { id: 'test-1', text: 'Custom Todo' }
];
```

**期待値の設定**:
```typescript
// サブモジュールの実際のデータに基づいた期待値を使用
expect(screen.getByText('Next.js App Routerの学習')).toBeInTheDocument();
expect(screen.getByText('in-progress')).toBeInTheDocument();

// カスタムデータが必要な場合はcreateTestTodo/createTestListを使用
const customTodo = createTestTodo({ text: '特殊ケーステスト' });
```

### テストの構造化

```typescript
describe('ComponentName', () => {
  describe('レンダリング', () => {
    it('正常にレンダリングされる', () => {
      // テストコード
    });
  });

  describe('インタラクション', () => {
    it('ユーザー操作が正しく動作する', () => {
      // テストコード
    });
  });

  describe('エラーハンドリング', () => {
    it('エラー時に適切に処理される', () => {
      // テストコード
    });
  });
});
```

### 型安全性の維持

- `any`型の使用を避ける
- 適切なTypeScript型を使用（`React.ReactNode`, `unknown`など）
- ESLint `@typescript-eslint/no-explicit-any`ルールに準拠

## 参考資料

- プロジェクト全体のテスト情報: `todoApp-submodule/docs/TEST.md`
- メインプロジェクトのガイドライン: ルートディレクトリの`CLAUDE.md`
- Vitest公式ドキュメント: https://vitest.dev/
- React Testing Library: https://testing-library.com/