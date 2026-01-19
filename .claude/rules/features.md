---
paths:
  - "features/**/*.{ts,tsx}"
---

# Features機能開発ルール

このファイルはfeatures/ディレクトリ固有の技術的詳細を定義します（Shared機能とTodo機能の両方を含む）。

## 仕様書参照

### プロジェクト構造
- @todoApp-submodule/docs/PRODUCTS.md#プロジェクト構造 - プロジェクト全体構造

### Todo機能仕様
- @todoApp-submodule/docs/features/todo/contexts/TodoContext.md - Context仕様
- @todoApp-submodule/docs/features/todo/hooks/useTodos.md - useTodosフック仕様
- @todoApp-submodule/docs/features/todo/hooks/useLists.md - useListsフック仕様
- @todoApp-submodule/docs/features/todo/hooks/useDeleteList.md - useDeleteListフック仕様
- @todoApp-submodule/docs/features/todo/hooks/useUpdateStatusAndCategory.md - useUpdateStatusAndCategoryフック仕様
- @todoApp-submodule/docs/features/todo/components/components-spec.md - 全コンポーネント仕様
- @todoApp-submodule/docs/features/todo/templates/TodoWrapper.md - TodoWrapperテンプレート仕様

## 機能構造

### Shared機能

主要構成:
- **components/elements/**: 機能横断の汎用UIコンポーネント
- **templates/**: 共通テンプレートとクライアントラッパー

役割:
- **再利用性重視**: 複数機能で使用可能な汎用コンポーネント
- **共通UI**: Navigation、MockIndicator等
- **テンプレート**: ClientWrapper等の共通テンプレート

### Todo機能

主要構成:
- **contexts/**: TodoContext（状態管理）
- **hooks/**: 4つのカスタムフック
- **components/**: UIコンポーネント（MainContainer, PushContainer, elements）
- **dnd/**: ドラッグ&ドロップ機能
- **templates/**: TodoWrapperテンプレート

## 共通開発原則

### コンポーネント設計

- **MUI + Tailwind**: Material-UIベース + Tailwindでスタイリング調整
- **TypeScript必須**: 厳密な型定義でプロパティ仕様を明確化
- **React.memo**: パフォーマンス最適化のためメモ化
- **レスポンシブ**: モバイル対応（@media max-width: 767px）

### スタイリング規約

- **MUI sx prop**: コンポーネント固有のスタイリング
- **Tailwind classes**: ユーティリティクラスでの補完
- **z-index管理**: モーダル・ドロップダウンの重なり順制御

### 環境依存処理パターン

```typescript
// 開発環境判定
if (
  process.env.NODE_ENV !== 'development' ||
  process.env.NEXT_PUBLIC_API_MOCKING !== 'enabled'
) {
  return null;
}

// クライアントサイド動的インポート
const Component = dynamic(() => import('./Component'), { ssr: false });
```

## Shared機能固有パターン

### 主要コンポーネント

#### Navigation/NavigationContents

- **役割**: ユーザーメニューとサインアウト機能
- **認証統合**: Server Actions（authSignOut）との連携
- **状態管理**: モーダル開閉状態のローカル管理
- **スタイリング**: MUI Boxベースのドロップダウンナビ

#### Mock/MockIndicator

- **環境制御**: 開発環境 + MOCK_MODE有効時のみ表示
- **デバッグ支援**: テスト用認証情報の画面表示
- **条件表示**: `NODE_ENV !== 'development'`で本番非表示

#### templates/ClientWrapper

- **動的インポート**: `dynamic()`でSSR無効化
- **ヘッダー統合**: HeaderWrapperコンポーネントのクライアント実行
- **型安全**: LinkSection/UserDataの厳密な型定義

## Todo機能固有パターン

### 状態管理

- **TodoContext必須**: 全てのTodo関連操作はTodoContextを使用
- **useSWR**: 初期データ取得（TodoWrapperでのみ使用）
- **楽観的更新**: UX向上のため即座にUI更新、API呼び出しは非同期
- **エラーハンドリング**: 各機能別にエラー状態を分離管理

### カスタムフック使用

```typescript
const { todoHooks, listHooks, deleteListHooks } = useTodoContext();
```

### エラー状態

- `listPushArea`: Todo追加エラー
- `listModalArea`: Todo編集エラー
- `addListNull`: リスト名空エラー
- `addListSame`: リスト名重複エラー

### ドラッグ&ドロップ

- `@dnd-kit/core`使用
- `arrayMove`で配列並び替え
- サーバー同期必須

### API連携

- **エンドポイント**: @app/api/(general)/todos/ と @app/api/(general)/lists/
- **初期データ**: useSWRで初期データ取得（TodoWrapper）
- **バリデーション**: Zodスキーマで全リクエスト/レスポンス検証
- **認証**:
  - **本番環境**: NextAuth.jsトークンで認証
  - **開発・テスト環境**: `X-User-ID`ヘッダーでユーザー識別
  - **環境判定**: `NEXT_PUBLIC_EMULATOR_MODE=true`で環境別認証を切り替え

### 実際のデータ更新パターン

詳細な実装パターンについては、@todoApp-submodule/docs/features/todo/hooks/useTodos.md#9-実際のデータ更新パターン を参照してください。

- **Todo追加パターン**: サーバーサイドタイムスタンプ生成とローカル状態更新
- **Todo編集パターン**: サーバーサイドupdateTime生成と楽観的更新
- **Todo削除パターン**: 楽観的更新とエラー時のロールバック処理

### useSWR使用箇所

詳細なuseSWRの使用パターンについては、@todoApp-submodule/docs/features/todo/templates/TodoWrapper.md#51-useswr使用パターン を参照してください。

- **使用箇所**: TodoWrapperコンポーネントでの初期データ取得のみ
- **役割**: サーバーからのTodo・リストデータ取得とContext初期化
- **制約**: 初期データ取得後は、useSWRではなくuseStateベースの状態管理を使用

### 環境別認証設定

**環境変数設定**:

- **開発環境**: `NEXT_PUBLIC_TEST_USER_UID=dev-user-1`
- **テスト環境**: `NEXT_PUBLIC_TEST_USER_UID=test-user-1`
- **本番環境**: 環境変数なし（NextAuth.js認証）

**withAuth.ts**での認証処理:

- テスト・開発・Emulator環境: `X-User-ID`ヘッダーから認証
- 本番環境: NextAuth.jsセッションから認証

## テスト要件

### Shared機能

- **コンポーネントテスト**: 全Shared要素の動作検証
- **環境分岐テスト**: NODE_ENV別の表示制御確認
- **プロパティテスト**: 型安全性と必須/任意プロパティ検証
- **統合テスト**: 他機能との連携動作確認

### Todo機能

- **100%カバレッジ**: 全フック・コンポーネント（444テスト成功）
- **MSW**: ユニットテストでのAPIモッキング統一
- **環境設定**: テスト実行時に`NEXT_PUBLIC_EMULATOR_MODE=true`を設定
- **テストパターン**: 楽観的更新、エラーハンドリング、ドラッグ&ドロップ
- **統合テスト**: Docker環境でFirebase Emulator使用
