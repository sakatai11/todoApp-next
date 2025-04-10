# TodoApp-Next

## 概要

TodoApp-Nextは、Next.jsをベースにしたタスク管理アプリケーションです。このアプリは、ユーザー認証、タスクの作成・編集・削除、ドラッグ＆ドロップによるタスクの並び替えなど、効率的なタスク管理をサポートする機能を提供します。

## 主な機能

- **ユーザー認証**: サインイン、サインアップ機能を提供。
- **タスク管理**: タスクの作成、編集、削除、ステータス管理。
- **ドラッグ＆ドロップ**: タスクの並び替えが可能。
- **モーダル機能**: タスク削除や編集用のモーダルを提供。
- **API連携**: Firebaseを使用したデータベースと認証。
- **レスポンシブデザイン**: Tailwind CSSを使用したスタイリング。

## 使用技術

- **フロントエンド**: Next.js, React
- **スタイリング**: Tailwind CSS, Material UI (MUI), PostCSS
- **バックエンド**: Firebase (Authentication, Firestore)
- **認証**: NextAuth.js
- **ドラッグ＆ドロップ**: React DnD
- **型定義**: TypeScript
- **Lint/フォーマット**: ESLint, Prettier
- **デプロイ**: Vercel
- **その他**: Axios (API通信), date-fns (日付操作)

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

## デプロイ

このアプリはVercelを使用してデプロイされています。`vercel.json`に設定が含まれています。
