# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 必ず日本語で回答してください

## 横断的ルール（自動読み込み）

以下の`.claude/rules/`配下のルールが全て自動的に適用されます：

- **コード品質**: @.claude/rules/code-quality.md
- **セキュリティ**: @.claude/rules/security.md
- **開発フロー**: @.claude/rules/development.md

## 階層別の詳細指示（path-specificルール）

作業ディレクトリに応じて、以下のpath-specificルールが自動的に適用されます：

| ルールファイル             | 適用パス                                           | 主な内容                                                      |
| -------------------------- | -------------------------------------------------- | ------------------------------------------------------------- |
| @.claude/rules/app.md      | `app/**/*.{ts,tsx}`                                | App Router開発、API開発、認証ミドルウェア、エラーハンドリング |
| @.claude/rules/features.md | `features/**/*.{ts,tsx}`                           | Shared機能、Todo機能、状態管理、カスタムフック                |
| @.claude/rules/testing.md  | `tests/**/*.{ts,tsx}`, `**/*.{test,spec}.{ts,tsx}` | テスト戦略、環境設定、データ一貫性                            |

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

- **フレームワーク**: Next.js 16（App Router + Turbopack）
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
- **詳細構造**: [@todoApp-submodule/docs/PRODUCTS.md](../todoApp-submodule/docs/PRODUCTS.md#プロジェクト構造)参照

### 重要なプロジェクト注意事項

- **本番環境ではTypeScriptビルドエラーを無視（`ignoreBuildErrors: true`）**
  - **理由**: 開発時にエディタのリアルタイム型チェックと`tsconfig.json`の厳密な設定で型安全性を確保済み。本番ビルド時の型チェックをスキップすることでビルド速度を向上させるため。
- **開発時のAPIモック用MSWを使用**
  - **理由**: ユニットテスト時にFirebase Emulatorを起動せずに高速なテスト実行を実現するため。
- **キャッシュ制御ヘッダー付きのVercelデプロイ設定**
  - **理由**: 静的アセットの効率的なキャッシュ配信と、動的コンテンツの適切な更新を両立するため。

## 開発パターン

- 新しい機能は`features/`内で自己完結させる（共通は`features/shared/`）
- **Admin API**: `app/api/(admin)/`、**General API**: `app/api/(general)/`、**Auth API**: `app/api/auth/`
- 全APIでZodバリデーション必須
- 詳細: [@.claude/rules/app.md](rules/app.md) / [@.claude/rules/features.md](rules/features.md)

## テストガイドライン

- **UTカバレッジ**: 100%達成済み（493テスト）
- **統合テスト**: Docker + Firebase Emulator（ポート3002/4000/8080/9099）
- **詳細ガイド**: [@.claude/rules/testing.md](rules/testing.md)参照

## Codex 実行ポリシー

- `/codex:review` は常にバックグラウンドで実行する（`--background` フラグを自動付与）
- `/codex:rescue` はタスクの複雑さに応じて自動判断する（フラグ省略で自動選択）
