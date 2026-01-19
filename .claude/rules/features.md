---
paths:
  - "features/**/*.{ts,tsx}"
---

# Features機能開発ルール

このファイルはfeatures/ディレクトリ固有の技術的詳細を定義します（Shared機能とTodo機能の両方を含む）。

## 仕様書参照

- @todoApp-submodule/docs/PRODUCTS.md#プロジェクト構造 - プロジェクト全体構造
- @todoApp-submodule/docs/features/todo/ - Todo機能仕様（contexts/hooks/components/templates）

## 機能構造

### Shared機能

**主要構成**:
- **components/elements/**: 機能横断の汎用UIコンポーネント
- **templates/**: 共通テンプレートとクライアントラッパー

**役割**:
- 再利用性重視の汎用コンポーネント
- 共通UI（Navigation、MockIndicator等）
- 環境別表示制御（開発環境のみのモック表示等）

### Todo機能

**主要構成**:
- **contexts/**: TodoContext（状態管理）
- **hooks/**: 4つのカスタムフック（useTodos, useLists, useDeleteList, useUpdateStatusAndCategory）
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

- **エンドポイント**: `/api/(general)/todos/` と `/api/(general)/lists/`
- **初期データ**: useSWRで初期データ取得（TodoWrapper）
- **バリデーション**: Zodスキーマで全リクエスト/レスポンス検証
- **認証**: 環境別認証方式に従う（詳細は`app.md`参照）

### データ更新パターン

詳細な実装パターンについては、@todoApp-submodule/docs/features/todo/hooks/useTodos.md#9-実際のデータ更新パターン を参照してください。

- **Todo追加パターン**: サーバーサイドタイムスタンプ生成とローカル状態更新
- **Todo編集パターン**: サーバーサイドupdateTime生成と楽観的更新
- **Todo削除パターン**: 楽観的更新とエラー時のロールバック処理

### useSWR使用箇所

- **使用箇所**: TodoWrapperコンポーネントでの初期データ取得のみ
- **役割**: サーバーからのTodo・リストデータ取得とContext初期化
- **制約**: 初期データ取得後は、useSWRではなくuseStateベースの状態管理を使用

## テスト要件

### Shared機能

- コンポーネントテスト、環境分岐テスト、プロパティテスト、統合テスト

### Todo機能

- **100%カバレッジ**: 全フック・コンポーネント（444テスト成功）
- **MSW**: ユニットテストでのAPIモッキング統一
- **環境設定**: `NEXT_PUBLIC_EMULATOR_MODE=true`でテスト実行
- **テストパターン**: 楽観的更新、エラーハンドリング、ドラッグ&ドロップ
- **統合テスト**: Docker環境でFirebase Emulator使用
