# プロジェクトメモリ - Todo アプリ開発ガイドライン

**必ず日本語で回答してください**

## プロジェクト概要

これは、App Routerとフィーチャーベースアーキテクチャを使用したNext.js 15のtodoアプリケーションです。

### 開発コマンド

```bash
# 開発
npm run dev              # Turbopackで開発サーバーを起動
npm run build           # クリーンビルド（.nextディレクトリ削除＋ビルド）
npm start               # 本番サーバーを起動

# コード品質
npm run lint            # ESLintを自動修正で実行
npm run prettier        # Prettierでコードをフォーマット
npm run format          # prettierとlintの両方を実行

# テスト・モック
npm run msw:init        # Mock Service Workerを初期化
```

### 現在の技術スタック

- **フレームワーク**: Next.js 15（App Router + Turbopack）
- **認証**: NextAuth.js v5（beta）- カスタム認証プロバイダー
- **バックエンド**: Firebase Admin SDK（Firestore + Auth）
- **UI**: Material-UI（MUI）+ Tailwind CSS
- **状態管理**: React Context + データ取得用SWR
- **ドラッグ＆ドロップ**: @dnd-kit/core（タスクの並び替え用）
- **バリデーション**: Zodスキーマ
- **テスト**: Vitest + React Testing Library + MSW
- **モック**: MSW（Mock Service Worker）

### 現在のディレクトリ構造

```
app/                    # Next.js App Router
├── (admin)/           # 管理者ルート（グループ化）
├── (auth)/            # 認証ルート（グループ化）
├── (dashboards)/      # ダッシュボードルート（グループ化）
├── api/               # APIルート
│   ├── (admin)/       # 管理者API（グループ化）
│   ├── (general)/     # 一般API（グループ化）
│   └── auth/          # 認証API
└── libs/              # アプリレベルのユーティリティ

features/              # フィーチャーベースコンポーネント
├── todo/              # Todo機能
│   ├── contexts/      # 状態管理用TodoContext
│   ├── hooks/         # カスタムフック（useTodos、useListsなど）
│   ├── components/    # 機能固有のコンポーネント
│   └── dnd/           # ドラッグ＆ドロップコンポーネント
├── shared/            # 機能間で共有されるコンポーネント
└── utils/             # 機能ユーティリティ

tests/                 # テストファイルと設定
├── setup.ts           # グローバルテスト環境セットアップ
├── test-utils.tsx     # カスタムレンダー関数とユーティリティ
└── features/          # フィーチャーベースのテスト構造
    └── todo/          # Todo機能のテスト
        ├── contexts/  # Contextプロバイダーのテスト
        ├── hooks/     # カスタムフックのテスト
        └── components/ # コンポーネントのテスト

todoApp-submodule/     # モックAPIとドキュメント用のサブモジュール
├── mocks/             # MSWハンドラーとモックデータ
│   ├── data/          # モックデータ定義
│   └── handlers/      # APIハンドラー定義
└── docs/              # プロジェクトドキュメント

types/                 # TypeScript型定義
```

### 認証フロー

- カスタム認証プロバイダーを使用したNextAuth.js
- サーバーサイドトークン検証用のFirebase Admin SDK
- `/api/auth/server-login`経由でのカスタムトークン交換
- ロールベースアクセス制御（admin/userロール）

### データ管理

- Todo状態管理用のReact Context（`TodoContext`）
- サーバー状態管理とキャッシュ用のSWR
- データベースとしてのFirebase Firestore
- より良いUXのための楽観的更新

### API構造

- Next.jsルートグループ`()`を使用したグループ化されたルート
- 管理者用と一般ユーザー用の分離されたAPI
- バックエンド操作用のFirebase Admin SDK
- リクエスト/レスポンスデータのZodバリデーション

### 重要なプロジェクト注意事項

- 本番環境ではTypeScriptビルドエラーを無視（`ignoreBuildErrors: true`）
- 開発時のAPIモック用MSWを使用
- キャッシュ制御ヘッダー付きのVercelデプロイ設定
- 明確な関心の分離を持つフィーチャーベースアーキテクチャ

## プロジェクト固有のガイドライン

### ディレクトリ構造ルール
- **フィーチャーベースアーキテクチャに従う**: 各機能は`features/`ディレクトリ内で自己完結型にする
- **App Routerの規約を使用**: Next.jsルートグループ`()`を使用して関連ルートをグループ化
- **既存パターンを尊重**: 管理者ルートは`(admin)/`、認証は`(auth)/`、ダッシュボードは`(dashboards)/`に配置
- **API組織**: 機能別にAPIをグループ化 -`(admin)/`、`(general)/`、`auth/`

### 認証実装
- **NextAuth.js v5パターンを使用**: 既存のカスタム認証プロバイダー設定に従う
- **Firebase統合**: サーバーサイド操作にFirebase Admin SDKを使用
- **トークン処理**: トークン交換に既存の`/api/auth/server-login`エンドポイントを活用
- **ロールベースアクセス**: admin/userロールの区別を維持

### 状態管理パターン
- **TodoContext**: Todo状態管理に既存のReact Contextを使用
- **SWR統合**: サーバー状態管理とキャッシュにSWRを活用
- **楽観的更新**: より良いユーザー体験のために楽観的UI更新を実装
- **エラーハンドリング**: Contextプロバイダーの既存エラーハンドリングパターンに従う

### コンポーネント開発
- **Material-UI使用**: 既存のMUIコンポーネントパターンとテーマに従う
- **Tailwind統合**: MUIと併用してユーティリティスタイリングにTailwindを使用
- **ドラッグ＆ドロップ**: 既存の実装パターンに従って@dnd-kit/coreを使用
- **フォームバリデーション**: 全てのフォームバリデーションにZodスキーマを使用

### API開発
- **グループ化されたルート**: 組織化にNext.jsルートグループを使用
- **Firebase操作**: 全てのバックエンド操作にFirebase Admin SDKを使用
- **リクエストバリデーション**: 全てのAPIリクエスト/レスポンスにZodバリデーションを実装
- **エラーレスポンス**: 既存のエラーレスポンスパターンに従う

### テストガイドライン

#### クイックリファレンス
- **テスト状況**: ✅ 全テスト成功、100%カバレッジ達成
- **テストフレームワーク**: Vitest + React Testing Library + MSW
- **テストコマンド**: `npm run test`（実行）/ `npm run test:coverage`（カバレッジ）/ `npm run test:ui`（UIモード）
- **詳細ガイド**: `tests/CLAUDE.md`を参照（テスト結果詳細・設定・ガイドライン）