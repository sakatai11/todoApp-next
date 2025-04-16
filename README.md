# TodoApp-Next

## 概要

TodoApp-Nextは、Next.jsをベースにしたタスク管理アプリケーションです。このアプリは、ユーザー認証、タスクの作成・編集・削除、ドラッグ＆ドロップによるタスクの並び替えなど、効率的なタスク管理をサポートする機能を提供します。

## 主な機能

- **ユーザー認証**: サインイン、サインアップ機能を提供。NextAuth.jsによる安全な認証。
- **タスク管理**: タスクの作成、編集、削除、ステータス管理。
- **ピン留め機能**: 重要なタスクをピン留めして優先度を視覚化。
- **ドラッグ＆ドロップ**: @dnd-kit/coreを使用したタスクの並び替え。
- **モーダル機能**: タスク削除や編集用のモーダルインターフェース。
- **リアルタイムデータ**: Firebaseとの連携によるリアルタイムデータ更新。
- **レスポンシブデザイン**: モバイルからデスクトップまで対応したUI設計。

## アプリケーション構造

- **フィーチャーベース構成**: 機能ごとに分離されたモジュール構造。
- **APIルート**: Next.jsのAPIルートを活用したサーバーサイド処理。
- **コンテキストAPI**: Reactコンテキストを使用した状態管理。
- **SWR対応**: データフェッチングとキャッシュ戦略の最適化。

## 使用技術

- **フロントエンド**: Next.js React
- **スタイリング**: Tailwind CSS, Material UI (MUI)
- **UIコンポーネント**: Material UI (MUI)
- **バックエンド**: Firebase (Authentication, Firestore)
- **認証**: NextAuth.js
- **データフェッチング**: SWR
- **ドラッグ＆ドロップ**: @dnd-kit/core
- **型定義**: TypeScript
- **バリデーション**: Zod
- **Lint/フォーマット**: ESLint, Prettier
- **デプロイ**: Vercel

## セットアップ

1. リポジトリをクローンします。
   ```bash
   git clone https://github.com/sakatai11/todoApp-next.git
   ```
2. 必要な依存関係をインストールします。
   ```bash
   npm install
   ```
3. 開発サーバーを起動します。
   ```bash
   npm run dev
   ```
4. ブラウザで `http://localhost:3000` を開きます。

## プロジェクト構造

```
todoApp-next/
├── app/              # Next.jsのApp Routerベースのルート定義
│   ├── (dashboard)/      # タスク関連のルート（グループ化）
│   ├── api/          # APIルート
│   └── ...
├── features/         # 機能ごとのコンポーネントとロジック
│   ├── todo/         # Todo機能関連
│   ├── top/          # トップページ関連
│   └── ...
├── data/             # 静的データとリンク定義
├── public/           # 静的アセット
└── types/            # TypeScript型定義
```
