# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 必ず日本語で回答してください

## 全体情報参照

**重要**: プロジェクト全体の方針は [`@CLAUDE.md`](../CLAUDE.md)（プロジェクトルート）を参照してください。
このファイルはTest機能固有の技術的詳細に特化しています。

## テスト環境概要

このディレクトリにはVitestベースのテスト環境が構築されています。

### 単体テスト結果ステータス

✅ **全テスト成功** - 高品質テストコードベース達成

- **単体テスト成功率**: 100% (413/413 passing)
- **カバレッジ**: 高カバレッジ - 全主要コンポーネント・フック・コンテキストをカバー
- **品質**: ESLint準拠、TypeScript型安全性確保、表記統一ルール適用

### テスト実行コマンド

```bash
# ユニットテスト関連コマンド
npm run test              # テストをwatch モードで実行
npm run test:ui           # Vitest UIでテスト実行
npm run test:run          # テストを1回だけ実行
npm run test:coverage     # カバレッジレポート付きでテスト実行

# 統合テスト（Docker環境）
npm run docker:test:run   # Docker + Firebase Emulator環境で統合テスト実行
npm run docker:test       # テスト環境起動（手動確認用）
npm run docker:test:down  # テスト環境停止

# E2Eテスト（Playwright MCP）
# Claude Code内でplaywright-e2e-testerサブエージェントを使用
```

## ディレクトリ構造

詳細なプロジェクト構造については、[@todoApp-submodule/docs/PRODUCTS.md](../todoApp-submodule/docs/PRODUCTS.md#プロジェクト構造)を参照してください。

主要なテスト構成:

- **tests/**: テスト環境設定とユーティリティ

## テストファイルの命名規則

- **ファイル名**: `{ComponentName}.test.tsx` or `{hookName}.test.ts` or `api.integration.test.ts`
- **テストID**: `data-testid` 属性を使用してコンポーネント要素を識別
- **describe構造**: UT:機能別にグループ化,IT:APIエンドポイント別・権限、認証別にグループ化

## 設定ファイル詳細

### ユニットテスト設定

#### vitest.config.ts（ルートディレクトリ）

- Vitestのメイン設定ファイル
- jsdom環境、プラグイン設定、パスエイリアス定義

#### tests/setup.ts

**役割**: グローバルテスト環境の初期化

**含まれる設定**:

- MSW serverの初期化（API モック）
- Next.js関連のモック（next/navigation, next-auth/react）
- Firebase Admin SDKのモック
- ブラウザAPIのモック（matchMedia, ResizeObserver, DragEvent）

#### tests/test-utils.tsx

**役割**: テスト用のヘルパー関数とユーティリティ

**提供機能**:

- カスタムレンダー関数（プロバイダー付き）
- サブモジュールモックデータの型変換
- テストデータ作成ヘルパー

#### モック設定

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

### 統合テスト設定

#### vitest.integration.config.ts（ルートディレクトリ）

**役割**: 統合テスト専用のVitest設定

**特徴**:

- MSW無効化でFirebase Emulator直接通信
- 環境変数: FIRESTORE_EMULATOR_HOST=localhost:8090
- タイムアウト: 30秒（Firebase Emulator起動考慮）
- Docker環境専用（ポート3002/4000/8090/9100）

#### tests/setup-integration.ts

**役割**: 統合テスト環境の初期化

**含まれる設定**:

- Firebase Emulator接続確認（最大30秒待機）
- Next.js関連のモック（next/navigation, next-auth/react）
- ブラウザAPIのモック
- **重要**: MSWは使用せず、Firebase Emulatorと直接通信

#### Docker環境とユーザー分離データ

- **tsx実行環境**: scripts/init-firebase-data.ts で自動データ初期化
- **ユーザー分離**: test-user-1 / test-admin-1 による独立データ構造
- **テストデータ**: export_test_data.ts による本番同等のデータ構造

### ITケース実行環境固有規則

```bash
# Docker環境専用実行
npm run docker:test:run              # 統合テスト実行
npx vitest run --config vitest.integration.config.ts  # 直接実行

# 環境確認用アクセス
http://localhost:3002               # Next.jsアプリ（テスト用）
http://localhost:4000               # Firebase Emulator UI
```

## よく使用するテストパターン

詳細なテストパターンについては [@todoApp-submodule/docs/tests/UT_TEST.md](../todoApp-submodule/docs/tests/UT_TEST.md),[@todoApp-submodule/docs/tests/IT_TEST.md](../todoApp-submodule/docs/tests/IT_TEST.md)を参照してください。

**基本的な使用例**:

- **Context**: `renderHook`でプロバイダー付きテスト
- **フック**: `act`で非同期処理をテスト
- **コンポーネント**: カスタムレンダー関数でプロバイダー設定

## エラー対処とデバッグ

### よくある問題

#### ユニットテスト関連

1. **Firebase Timestampエラー**: サブモジュールデータを使用時の型変換エラー
   - 解決: `test-utils.tsx`の`convertMockTodosToTimestamp`関数を使用

2. **React 19互換性エラー**: Testing Libraryのバージョン問題
   - 解決: 適切なバージョンを使用、必要に応じて`legacy-peer-deps`

3. **MSW関連エラー**: APIモックが動作しない
   - 解決: `npm run msw:init`でMSWを初期化

#### 統合テスト関連

4. **Docker環境接続エラー**: Firebase Emulatorに接続できない
   - 解決: `npm run docker:test` で環境起動確認、ポート競合チェック

5. **統合テスト実行エラー**: ローカル環境で実行しようとした場合
   - 解決: Docker環境でのみ実行可能 `npm run docker:test:run`

6. **ポート競合エラー**: テスト環境ポートが使用中
   - 解決: `lsof -ti:3002,4000,8090,9100` でポート確認、必要に応じてプロセス終了

7. **tsx実行エラー**: TypeScript実行環境の問題
   - 解決: `npm install -g tsx` でtsxをグローバルインストール

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

## テスト棲み分け基準

詳細な棲み分け基準については以下のドキュメントを参照してください：

- [IT_TEST.md](../todoApp-submodule/docs/tests/IT_TEST.md#🎯-統合テストの目的と意義) - 統合テストの対象範囲
- [E2E_TEST.md](../todoApp-submodule/docs/tests/E2E_TEST.md#📋-テスト環境) - E2Eテストの対象範囲
- [withAuth.md](../todoApp-submodule/docs/app/libs/withAuth.md#3-環境別認証処理) - 環境別認証方式

### 基本方針

- **ユニットテスト（UT）**: MSWモック環境での個別コンポーネント・フック・コンテキストの動作検証
- **統合テスト（IT）**: Firebase Emulator環境での実API通信とデータベース操作の検証
- **E2Eテスト**: Playwright MCPでの本番同等認証フローとユーザーシナリオの検証


## ベストプラクティス

### データ一貫性の維持

#### ユニットテスト: サブモジュールデータの統一使用

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

#### 統合テスト: ユーザー分離データの使用

```typescript
// 統合テストでは export_test_data.ts のユーザー分離データを使用
// test-user-1: 一般ユーザー（3 todos）
// test-admin-1: 管理者ユーザー（3 todos + 管理者データ）

// APIテスト時の認証ヘッダー例
const headers = {
  'X-User-ID': 'test-user-1',
  'Content-Type': 'application/json',
};
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

#### ユニットテスト（UT）の構造化

ユニットテストは個別コンポーネント・フック・コンテキストの動作を検証します。

```typescript
describe('ComponentName', () => {
  describe('レンダリング', () => {
    it('正常にレンダリングされる', () => {
      // MSWモックデータを使用したレンダリングテスト
    });

    it('プロパティが正常に表示される', () => {
      // プロパティ表示の検証
    });
  });

  describe('インタラクション', () => {
    it('ボタンクリック時に正常に動作する', () => {
      // ユーザーインタラクションのテスト
    });

    it('フォーム送信が正常に処理される', () => {
      // フォームインタラクションのテスト
    });
  });

  describe('エラーハンドリング', () => {
    it('エラー時に正常に処理される', () => {
      // エラー状態の検証
    });

    it('ローディング状態が正常に表示される', () => {
      // ローディング状態の検証
    });
  });
});
```

#### 統合テスト（IT）の構造化

統合テストはAPIエンドポイント別・認証権限別にシステム間連携を検証します。

```typescript
describe('Todo API 統合テスト', () => {
  describe('GET /api/todos', () => {
    it('認証されたユーザーのTodoリストを正常に取得する', async () => {
      // Firebase Emulator環境での実API通信テスト
      const authHeaders = {
        'X-User-ID': 'test-user-1',
      };
      // 実際のAPI呼び出しと検証
    });

    it('未認証ユーザーは401エラーを受け取る', async () => {
      // 認証なしでのエラーレスポンス検証
    });
  });

  describe('POST /api/todos', () => {
    it('新しいTodoを正常に作成する', async () => {
      // 作成APIの正常系テスト
    });

    it('無効なデータで400エラーを返す', async () => {
      // バリデーションエラーの検証
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

### カバレッジに関するガイドライン

**重要**: テストカバレッジは品質の結果であり、目標ではありません。

#### ✅ 推奨されるカバレッジアプローチ

- **実用的なテスト**: 実際のユーザーシナリオと機能要件に基づいたテスト作成
- **意味のあるテスト**: 各テストケースが明確な目的と検証内容を持つ
- **エラーハンドリング**: 実際に発生し得るエラー状況のテスト
- **エッジケース**: 実際の使用で想定される境界値・特殊ケースのテスト
- **品質重視**: カバレッジ数値より、テストの実用性と保守性を優先

#### ❌ 禁止されるカバレッジ操作

- **無理やり100%**: カバレッジを上げるためだけの無意味なテストケース
- **ダミーテスト**: 実際の機能と関係ないコードを通すためのテスト
- **空モック**: `mockReturnValue({})`等で機能を削って通すテスト
- **未使用コード用テスト**: 使われていないコードを通すためだけのテスト
- **カバレッジツール操作**: `/* istanbul ignore */`等でのカバレッジ除外操作

#### 適切なカバレッジ目標

- **ユニットテスト**: 通常100%を目標とするが、100%達成できなくても、ITケースで検証すべきケース（Firebase通信、外部API等）であれば、UTから除外してもよい
- **統合テスト**: APIエンドポイントと外部依存関係の実際の動作を検証
- **全体**: 実用性を損なわない範囲でのカバレッジ最大化

## 関連ドキュメント

### テスト詳細ガイド

- [単体テスト詳細](../todoApp-submodule/docs/tests/UT_TEST.md) - 単体テスト実装ガイド
- [統合テスト詳細](../todoApp-submodule/docs/tests/IT_TEST.md) - 統合テスト実装ガイド
- [E2Eテスト詳細](../todoApp-submodule/docs/tests/E2E_TEST.md) - Playwright MCPテストガイド
- [Dockerテスト環境](../todoApp-submodule/docs/DOCKER_TESTING.md) - 環境構築詳細

### 外部参考資料

- Vitest公式ドキュメント: https://vitest.dev/
- React Testing Library: https://testing-library.com/
- MSW Documentation: https://mswjs.io/
