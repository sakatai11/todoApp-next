---
paths:
  - 'tests/**/*.{ts,tsx}'
  - '**/*.{test,spec}.{ts,tsx}'
---

# テスト開発ルール

このファイルはテスト固有の技術的詳細を定義します。

## テスト環境概要

このプロジェクトにはVitestベースのテスト環境が構築されています。

- **単体テスト成功率**: ローカル実行で全テストパス必須
- **カバレッジ目標**: 100%を目標（Firebase通信・外部API等は統合テストで検証）
- **品質**: ESLint準拠、TypeScript型安全性確保、表記統一ルール適用

## テスト実行コマンド

```bash
# ユニットテスト
npm run test              # テストをwatch モードで実行
npm run test:ui           # Vitest UIでテスト実行
npm run test:run          # テストを1回だけ実行
npm run test:coverage     # カバレッジレポート付きでテスト実行

# 統合テスト（Docker環境）
npm run docker:test:run   # Docker + Firebase Emulator環境で統合テスト実行
npm run docker:test       # テスト環境起動（手動確認用）
npm run docker:test:down  # テスト環境停止

# E2Eテスト（Playwright）
npm run test:e2e          # Playwright E2Eテスト
npm run test:e2e:ui       # Playwright UIモードでE2Eテスト
npm run test:e2e:debug    # Playwright デバッグモードでE2Eテスト
npm run test:e2e:headed   # Playwright ヘッドモード（ブラウザを表示）でE2Eテスト
```

## テストファイルの命名規則

- **ファイル名**: `{ComponentName}.test.tsx` or `{hookName}.test.ts` or `api.integration.test.ts`
- **テストID**: `data-testid` 属性を使用してコンポーネント要素を識別
- **describe構造**: UT:機能別にグループ化、IT:APIエンドポイント別・権限・認証別にグループ化

## 設定ファイル

### ユニットテスト設定

- **vitest.config.ts**: Vitestのメイン設定ファイル
- **tests/setup.ts**: グローバルテスト環境の初期化（MSW、Next.js、Firebase Admin SDKのモック）
- **tests/test-utils.tsx**: テスト用のヘルパー関数とユーティリティ

### 統合テスト設定

- **vitest.integration.config.ts**: 統合テスト専用のVitest設定
- **tests/setup-integration.ts**: 統合テスト環境の初期化（Firebase Emulator接続確認）
- **Docker環境**: ポート3002/4000/8090/9100
- **MSW**: 統合テストでは無効化（Firebase Emulator直接通信）

詳細は @todoApp-submodule/docs/tests/ および @todoApp-submodule/docs/DOCKER_TESTING.md を参照してください。

## テスト棲み分け基準

| テストタイプ             | 環境                  | 対象範囲                                           |
| ------------------------ | --------------------- | -------------------------------------------------- |
| **ユニットテスト（UT）** | MSWモック環境         | 個別コンポーネント・フック・コンテキストの動作検証 |
| **統合テスト（IT）**     | Firebase Emulator環境 | 実API通信とデータベース操作の検証                  |
| **E2Eテスト**            | Playwright            | 本番同等認証フローとユーザーシナリオの検証         |

## データ一貫性の維持

### ユニットテスト: サブモジュールデータの統一使用

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

### 統合テスト: ユーザー分離データの使用

```typescript
// export_test_data.ts のユーザー分離データを使用
// test-user-1: 一般ユーザー（3 todos）
// test-admin-1: 管理者ユーザー（3 todos + 管理者データ）

const headers = {
  'X-Test-User-ID': 'test-user-1',
  'Content-Type': 'application/json',
};
```

## テストの構造化

### ユニットテスト（UT）の構造化

```typescript
describe('ComponentName', () => {
  describe('レンダリング', () => {
    it('正常にレンダリングされる', () => {
      // MSWモックデータを使用したレンダリングテスト
    });
  });

  describe('インタラクション', () => {
    it('ボタンクリック時に正常に動作する', () => {
      // ユーザーインタラクションのテスト
    });
  });

  describe('エラーハンドリング', () => {
    it('エラー時に正常に処理される', () => {
      // エラー状態の検証
    });
  });
});
```

### 統合テスト（IT）の構造化

```typescript
describe('Todo API 統合テスト', () => {
  describe('GET /api/todos', () => {
    it('認証されたユーザーのTodoリストを正常に取得する', async () => {
      // Firebase Emulator環境での実API通信テスト
      const authHeaders = { 'X-Test-User-ID': 'test-user-1' };
      // 実際のAPI呼び出しと検証
    });

    it('未認証ユーザーは401エラーを受け取る', async () => {
      // 認証なしでのエラーレスポンス検証
    });
  });

  describe('権限・認証テスト', () => {
    it('管理者権限でユーザーデータにアクセスできる', async () => {
      // 管理者権限での操作テスト
    });

    it('一般ユーザーは他ユーザーのデータにアクセスできない', async () => {
      // 権限制御の検証
    });
  });
});
```

## よく使用するテストパターン

- **Context**: `renderHook`でプロバイダー付きテスト
- **フック**: `act`で非同期処理をテスト
- **コンポーネント**: カスタムレンダー関数でプロバイダー設定

詳細なテストパターンについては @todoApp-submodule/docs/tests/UT_TEST.md, @todoApp-submodule/docs/tests/IT_TEST.md を参照してください。

## よくある問題と解決方法

### ユニットテスト関連

1. **Firebase Timestampエラー**: `test-utils.tsx`の`convertMockTodosToTimestamp`関数を使用
2. **MSW関連エラー**: `npm run msw:init`でMSWを初期化

### 統合テスト関連

3. **Docker環境接続エラー**: `npm run docker:test` で環境起動確認、ポート競合チェック
4. **統合テスト実行エラー**: Docker環境でのみ実行可能 `npm run docker:test:run`
5. **ポート競合エラー**: `lsof -ti:3002,4000,8090,9100` でポート確認

## デバッグテクニック

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

## 型安全性の維持

- `any`型の使用を避ける
- 適切なTypeScript型を使用（`React.ReactNode`, `unknown`など）
- ESLint `@typescript-eslint/no-explicit-any`ルールに準拠
