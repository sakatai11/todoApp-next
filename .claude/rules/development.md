# 開発フローとアーキテクチャルール

このファイルはプロジェクト全体の開発フローとアーキテクチャ原則を定義します。

## 開発コマンド

### 日常的な開発コマンド

```bash
# 開発サーバー
npm run dev              # Turbopackで開発サーバーを起動 (localhost:3000)
npm run build           # クリーンビルド（.nextディレクトリ削除＋ビルド）
npm start               # 本番サーバーを起動

# コード品質管理
npm run lint            # ESLint 9.20.0を自動修正で実行
npm run prettier        # Prettier 3.5.0でコードをフォーマット
npm run format          # prettierとlintの両方を実行（推奨）
```

### テストコマンド

```bash
# ユニットテスト（MSW使用）
npm run test            # テスト（watch mode）
npm run test:run        # テスト一回実行
npm run test:coverage   # カバレッジ付きテスト実行（100%達成済み）
npm run test:ui         # Vitest UIモードでテスト実行

# 統合テスト（Docker + Firebase Emulator）
npm run docker:test     # Firebase Emulator環境起動
npm run docker:test:run # 統合テスト実行（Vitest + Firebase Emulator + tsx）
npm run docker:test:down # Docker環境停止

# E2Eテスト（Playwright）
npm run test:e2e        # Playwright E2Eテスト
npm run test:e2e:ui     # Playwright UIモードでE2Eテスト
npm run docker:e2e:run  # Docker環境でE2Eテスト実行
```

### Firebase Emulator

```bash
# 開発用
npm run emulator:start  # 開発用Firebase Emulator起動

# テスト用
npm run emulator:test   # テスト用Firebase Emulator起動
```

### モック管理

```bash
# Mock Service Worker初期化
npm run msw:init        # MSW 2.8.7を初期化（開発・ユニットテスト用）
```

## アーキテクチャ原則

### フィーチャーベース設計

プロジェクトは**フィーチャーベースアーキテクチャ**を採用しています。

**基本原則**:
- 新しい機能は`features/`内で自己完結させる
- 共通コンポーネントは`features/shared/`に配置
- テストファイルは対応する機能構造と同じ階層に配置

```
features/
├── shared/              # 共通コンポーネント（複数機能で使用）
│   ├── components/
│   └── templates/
├── todo/                # Todo機能（自己完結）
│   ├── components/
│   ├── contexts/
│   ├── hooks/
│   └── templates/
└── admin/               # 管理機能（自己完結）
    ├── components/
    └── templates/
```

詳細な構造は `@todoApp-submodule/docs/PRODUCTS.md#プロジェクト構造` および各path-specificルール（`@.claude/rules/app.md`, `@.claude/rules/features.md`）を参照してください。

## 状態管理

### 状態管理戦略

プロジェクトは目的別に状態管理を分離しています：

| 状態タイプ | 技術 | 用途 |
|-----------|------|------|
| **Local State** | React Context | Todo・リスト操作のメイン状態管理 |
| **Server State** | SWR 2.3.3 | 初期データフェッチング・認証連携 |

**データフロー**:
```
SWR → 初期データ取得 → TodoContext → useState/useReducerベース状態管理
```

**重要**: SWRは`TodoWrapper`での初期データ取得のみに使用し、その後はuseStateベースの状態管理を使用します。

### 状態更新戦略

プロジェクトでは操作種別に応じて2つの状態更新戦略を使い分けています：

#### 1. 楽観的更新パターン（削除・移動系操作）

**実装済みの操作**:
- `deleteTodo` - Todo削除
- `toggleSelected` - Todoのピン留めトグル
- `handleDragEnd` - リストのドラッグ&ドロップ並び替え
- `handleButtonMove` - リストのボタン移動

**パターン**:
```typescript
// 楽観的更新の実装例（deleteTodo）
const deleteTodo = async (id: string) => {
  // ① ロールバック用に現在のデータを保存
  const previousTodos = todos;

  try {
    // ② クライアント状態を先に更新（楽観的更新）
    setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));

    // ③ サーバーにリクエスト送信
    await apiRequest('/api/todos', 'DELETE', { id });
  } catch (error) {
    // ④ エラー時はロールバック
    setTodos(previousTodos);
    showError('Failed to delete todo');
  }
};
```

**利点**: 即座のUIフィードバック、優れたUX

#### 2. サーバーレスポンス待ちパターン（作成・編集系操作）

**実装済みの操作**:
- `addTodo` - Todo追加
- `saveTodo` - Todo編集
- `addList` - リスト追加
- `deleteList` - リスト削除（関連Todo一括削除含む）
- `editList` - リスト名編集（関連Todo一括更新含む）

**パターン**:
```typescript
// サーバーレスポンス待ちの実装例（addTodo）
const addTodo = async () => {
  try {
    // ① サーバーにリクエスト送信（先）
    const result = await apiRequest('/api/todos', 'POST', newTodo);

    // ② サーバーレスポンス受信後にクライアント状態を更新
    setTodos((prevTodos) => [...prevTodos, result]);
  } catch (error) {
    showError('Failed to add todo');
  }
};
```

**理由**:
- サーバー生成のタイムスタンプ（createdTime, updateTime）が必要
- データ整合性の確保
- 複雑な一括更新操作の確実性

## 開発時の注意事項

### 過剰設計の回避

- **機能追加の抑制**: 要求された機能のみを実装
- **リファクタリング**: 変更箇所以外の不要なリファクタリングを避ける
- **シンプル設計**: 最小限の複雑さで実装

**NG例**:
- バグ修正時に周辺コードをクリーンアップ
- シンプルな機能に余分な設定可能性を追加
- 仮定の将来要件に対する設計

### スクリプト実行前の確認事項

スクリプトを実行する前に、以下を確認してください：

1. **ディレクトリ構造の確認**
   ```bash
   # scriptsフォルダの存在確認
   ls scripts/
   ```

2. **必要なディレクトリの作成**
   ```bash
   # 存在しない場合は作成
   mkdir -p scripts/
   ```

**理由**: スクリプト実行時のエラーを未然に防ぎ、期待されるディレクトリ構造が整っていることを保証するため。特にプロジェクト初期化や新規環境でのセットアップ時に重要です。

### プロジェクト固有の注意事項

- **本番環境**: TypeScriptビルドエラーを無視（`ignoreBuildErrors: true`）
- **開発時**: APIモック用MSWを使用
- **Vercelデプロイ**: キャッシュ制御ヘッダー付き設定

## Git ワークフロー

### ブランチ戦略

- **main**: 本番環境ブランチ
- **develop**: 開発ブランチ
- **feature/**: 機能開発ブランチ

### コミット前チェックリスト

```bash
# 1. コード品質チェック
npm run format

# 2. テスト実行
npm run test:run

# 3. ビルド確認
npm run build
```

### コミットメッセージ規約

詳細は `@.claude/commands/` のgit関連コマンドを参照してください。

**基本形式**:
```
<type>: <subject>

<body>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**type**:
- `feat`: 新機能
- `fix`: バグ修正
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `docs`: ドキュメント更新
