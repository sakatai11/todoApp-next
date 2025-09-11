# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 必ず日本語で回答してください

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

# テスト
npm run test            # テスト（watch mode）
npm run test:run        # テスト一回実行
npm run test:coverage   # カバレッジ付きテスト実行
npm run test:ui         # Vitest UIモードでテスト実行
npm run test:e2e        # Playwright E2Eテスト
npm run test:e2e:ui     # Playwright UIモードでE2Eテスト

# Docker統合テスト
npm run docker:test     # Firebase Emulator環境起動
npm run docker:test:run # 統合テスト実行（Firebase Emulator + tsx）
npm run docker:test:down # Docker環境停止
npm run docker:e2e:run  # E2Eテスト実行

# Firebase Emulator
npm run emulator:start  # 開発用Firebase Emulator起動
npm run emulator:test   # テスト用Firebase Emulator起動

# モック
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

### アーキテクチャ概要

- **ディレクトリ構造**: フィーチャーベース設計（`features/`内で機能自己完結）
- **ルーティング**: Next.js App Router + ルートグループ`()`による整理
- **API構造**: 管理者用`(admin)/`、一般用`(general)/`、認証用`auth/`に分離
- **詳細構造**: [@todoApp-submodule/docs/PRODUCTS.md](todoApp-submodule/docs/PRODUCTS.md#プロジェクト構造)参照

### 重要なプロジェクト注意事項

- 本番環境ではTypeScriptビルドエラーを無視（`ignoreBuildErrors: true`）
- 開発時のAPIモック用MSWを使用
- キャッシュ制御ヘッダー付きのVercelデプロイ設定

## 開発パターン

### フィーチャーベース開発

- 新しい機能は`features/`内で自己完結させる
- 共通コンポーネントは`features/shared/`に配置
- テストファイルは対応する機能構造と同じ階層に配置

### 認証フロー

1. NextAuth.jsカスタムプロバイダーでログイン
2. `/api/auth/server-login`でFirebase Custom Token取得
3. Firebase Admin SDKでサーバーサイド検証
4. Role-based access control (admin/user)

### 状態管理

- **Local State**: React Context（TodoContext）- Todo・リスト操作のメイン状態管理
- **Server State**: SWR 2.3.3（初期データフェッチング・認証連携）- TodoWrapperでの初期データ取得のみ
- **データフロー**: SWR→初期データ取得→TodoContext→useState/useReducerベース状態管理

### API開発

- **Admin API**: `app/api/(admin)/` - 管理者用操作
- **General API**: `app/api/(general)/` - 一般ユーザー用操作
- **Auth API**: `app/api/auth/` - 認証関連操作
- **バリデーション**: 全てのAPIでZod必須

### コンポーネント開発

- **UI**: Material-UI（MUI）+ Tailwind CSS
- **ドラッグ＆ドロップ**: @dnd-kit/core
- **フォーム**: Zodスキーマでバリデーション

### テスト環境

- **単体テスト**: Vitest 2.1.8 + React Testing Library 14.3.1 + MSW 2.8.7
- **統合テスト**: `npm run docker:test:run`（Vitest + Firebase Emulator + Docker + tsx）
- **E2E**: Playwright 1.54.1 MCP（自然言語テスト仕様）

## テストガイドライン

- **フレームワーク**: Vitest + React Testing Library + MSW + Playwright
- **UTカバレッジ**: 100%達成済み（413テスト成功）
- **統合テスト**: Docker + Firebase Emulator（ポート3002/4000/8080/9099）
- **品質基準**: ESLint準拠、表記統一ルール、サブモジュールデータ統一
- **詳細ガイド**: [@tests/CLAUDE.md](tests/CLAUDE.md)参照

## 開発時の重要なルール

### ディレクトリ構造

- App Routerルートグループ`()`で機能別整理
- 管理者: `app/(admin)/admin`、認証: `app/(auth)`、ダッシュボード: `app/(dashboards)`

### コード品質

- 既存パターンの踏襲（MUI + Tailwind、NextAuth.js v5、Firebase Admin SDK）
- エラーハンドリングパターンの統一
- Zodバリデーションの徹底
