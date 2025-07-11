# Tests Directory - Testing Guidelines and Configuration

**必ず日本語で回答してください**

## テスト環境概要

このディレクトリにはVitestベースのテスト環境が構築されています。

### テスト結果ステータス

✅ **全テスト成功** - 高品質テストコードベース達成
- **テストファイル数**: 22ファイル（全機能網羅）
- **総テスト数**: 413テスト
- **成功率**: 100% (413/413 passing)
- **カバレッジ**: 高カバレッジ - 全主要コンポーネント・フック・コンテキストをカバー
- **品質**: ESLint準拠、TypeScript型安全性確保、表記統一ルール適用
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

詳細なディレクトリ構造については、実際のファイル構成を参照してください。
主要な構成:
- **tests/**: テスト環境設定とユーティリティ
- **tests/features/**: 機能別テストファイル（22ファイル）

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

**実際のサブモジュールデータ**:
- **Todoデータ**: `todoApp-submodule/mocks/data/todos.ts` - 5つのTodoアイテム
- **リストデータ**: `todoApp-submodule/mocks/data/lists.ts` - 3つのステータスリスト

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

詳細なテストパターンについては `todoApp-submodule/docs/TEST.md` を参照してください。

**基本的な使用例**:
- **Context**: `renderHook`でプロバイダー付きテスト
- **フック**: `act`で非同期処理をテスト
- **コンポーネント**: カスタムレンダー関数でプロバイダー設定

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
    it('ユーザー操作が正常に動作する', () => {
      // テストコード
    });
  });

  describe('エラーハンドリング', () => {
    it('エラー時に正常に処理される', () => {
      // テストコード
    });
  });
});
```

### テスト説明文の表記統一

**統一ルール**: テスト説明文（it文）で一貫した表記を使用

#### 基本パターン
- **システム動作**: 「正常に動作する」
- **データ処理**: 「正常に処理される」
- **UI表示**: 「正常に表示される」
- **UI描画**: 「正常にレンダリングされる」

#### 使い分けガイドライン
- **「正常に」**: 基本動作・システム処理（推奨）
- **「適切に」**: 期待通りの結果（特別な条件下）
- **「正しく」**: 結果の妥当性確認（非推奨→「正常に」に統一）

#### 統一例
```typescript
// ✅ 推奨パターン
it('コンポーネントが正常にレンダリングされる', () => {});
it('ボタンクリック時に正常に動作する', () => {});
it('入力値が正常に処理される', () => {});
it('エラー状態で正常に表示される', () => {});

// ❌ 非推奨パターン（表記揺れ）
it('コンポーネントが正しく表示される', () => {}); // → 「正常に表示される」
it('ボタンクリック時に適切に動作する', () => {}); // → 「正常に動作する」
```

### 型安全性の維持

- `any`型の使用を避ける
- 適切なTypeScript型を使用（`React.ReactNode`, `unknown`など）
- ESLint `@typescript-eslint/no-explicit-any`ルールに準拠

## 参考資料

- Vitest公式ドキュメント: https://vitest.dev/
- React Testing Library: https://testing-library.com/
- MSW Documentation: https://mswjs.io/