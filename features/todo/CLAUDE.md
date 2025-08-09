# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**必ず日本語で回答してください**

## 全体情報参照

**重要**: プロジェクト全体の方針は [`@CLAUDE.md`](../../CLAUDE.md)（プロジェクトルート）を参照してください。
このファイルはTodo機能固有の技術的詳細に特化しています。

## 仕様書参照

**詳細仕様**: 実装の詳細仕様は以下のドキュメントを参照してください：

- [@todoApp-submodule/docs/features/todo/contexts/TodoContext.md](../../todoApp-submodule/docs/features/todo/contexts/TodoContext.md) - Context仕様
- [@todoApp-submodule/docs/features/todo/hooks/useTodos.md](../../todoApp-submodule/docs/features/todo/hooks/useTodos.md) - useTodosフック仕様
- [@todoApp-submodule/docs/features/todo/hooks/useLists.md](../../todoApp-submodule/docs/features/todo/hooks/useLists.md) - useListsフック仕様
- [@todoApp-submodule/docs/features/todo/hooks/useDeleteList.md](../../todoApp-submodule/docs/features/todo/hooks/useDeleteList.md) - useDeleteListフック仕様
- [@todoApp-submodule/docs/features/todo/hooks/useUpdateStatusAndCategory.md](../../todoApp-submodule/docs/features/todo/hooks/useUpdateStatusAndCategory.md) - useUpdateStatusAndCategoryフック仕様
- [@todoApp-submodule/docs/features/todo/components/components-spec.md](../../todoApp-submodule/docs/features/todo/components/components-spec.md) - 全コンポーネント仕様
- [@todoApp-submodule/docs/features/todo/templates/TodoWrapper.md](../../todoApp-submodule/docs/features/todo/templates/TodoWrapper.md) - TodoWrapperテンプレート仕様

## 機能構造

詳細なプロジェクト構造については、[@todoApp-submodule/docs/PRODUCTS.md](../../todoApp-submodule/docs/PRODUCTS.md#プロジェクト構造)を参照してください。

Todo機能の主要構成:

- **contexts/**: TodoContext（状態管理）
- **hooks/**: 4つのカスタムフック
- **components/**: UIコンポーネント（MainContainer, PushContainer, elements）
- **dnd/**: ドラッグ&ドロップ機能
- **templates/**: TodoWrapperテンプレート

## 開発原則

### 状態管理

- **TodoContext必須**: 全てのTodo関連操作はTodoContextを使用
- **useSWR**: 初期データ取得（TodoWrapperでのみ使用）
- **楽観的更新**: UX向上のため即座にUI更新、API呼び出しは非同期
- **エラーハンドリング**: 各機能別にエラー状態を分離管理

### コンポーネント開発

- **MUI + Tailwind**: MUIをベースにTailwindで調整
- **React.memo**: 不要な再レンダリングを防止
- **レスポンシブ**: モバイル対応（@media max-width: 767px）

### API連携

- **エンドポイント**: [@app/api/(general)/todos/](<../../app/api/(general)/todos/>) と [@app/api/(general)/lists/](<../../app/api/(general)/lists/>)
- **初期データ**: useSWRで初期データ取得（TodoWrapper）
- **バリデーション**: Zodスキーマで全リクエスト/レスポンス検証
- **認証**:
  - **本番環境**: NextAuth.jsトークンで認証
  - **開発・テスト環境**: `X-User-ID`ヘッダーでユーザー識別
  - **環境判定**: `NEXT_PUBLIC_EMULATOR_MODE=true`で環境別認証を切り替え

## 重要な実装パターン

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

### 実際のデータ更新パターン

詳細な実装パターンについては、[@todoApp-submodule/docs/features/todo/hooks/useTodos.md](../../todoApp-submodule/docs/features/todo/hooks/useTodos.md#9-実際のデータ更新パターン)を参照してください。

- **Todo追加パターン**: サーバーサイドタイムスタンプ生成とローカル状態更新
- **Todo編集パターン**: サーバーサイドupdateTime生成と楽観的更新
- **Todo削除パターン**: 楽観的更新とエラー時のロールバック処理

### useSWR使用箇所

詳細なuseSWRの使用パターンについては、[@todoApp-submodule/docs/features/todo/templates/TodoWrapper.md](../../todoApp-submodule/docs/features/todo/templates/TodoWrapper.md#51-useswr使用パターン)を参照してください。

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

- **100%カバレッジ**: 全フック・コンポーネント（444テスト成功）
- **MSW**: ユニットテストでのAPIモッキング統一
- **環境設定**: テスト実行時に`NEXT_PUBLIC_EMULATOR_MODE=true`を設定
- **テストパターン**: 楽観的更新、エラーハンドリング、ドラッグ&ドロップ
- **統合テスト**: Docker環境でFirebase Emulator使用
