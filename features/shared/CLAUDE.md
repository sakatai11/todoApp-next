# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**必ず日本語で回答してください**

## 全体情報参照

**重要**: プロジェクト全体の方針は [`@CLAUDE.md`](../../CLAUDE.md)（プロジェクトルート）を参照してください。
このファイルはShared機能固有の技術的詳細に特化しています。

## Shared機能の役割

詳細なプロジェクト構造については、[@todoApp-submodule/docs/PRODUCTS.md](../../todoApp-submodule/docs/PRODUCTS.md#プロジェクト構造)を参照してください。

### 主要構成

- **components/elements/**: 機能横断の汎用UIコンポーネント
- **templates/**: 共通テンプレートとクライアントラッパー

## 開発原則

### コンポーネント設計

- **再利用性重視**: 複数機能で使用可能な汎用コンポーネント
- **MUI + Tailwind**: Material-UIベース + Tailwindでスタイリング調整
- **TypeScript必須**: 厳密な型定義でプロパティ仕様を明確化
- **React.memo**: パフォーマンス最適化のためメモ化

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

### 環境依存処理パターン

```typescript
// 開発環境判定
if (process.env.NODE_ENV !== 'development' || 
    process.env.NEXT_PUBLIC_API_MOCKING !== 'enabled') {
  return null;
}

// クライアントサイド動的インポート
const Component = dynamic(() => import('./Component'), { ssr: false });
```

### スタイリング規約

- **MUI sx prop**: コンポーネント固有のスタイリング
- **Tailwind classes**: ユーティリティクラスでの補完
- **レスポンシブ**: モバイル対応（@media max-width: 767px）
- **z-index管理**: モーダル・ドロップダウンの重なり順制御

## テスト要件

- **コンポーネントテスト**: 全Shared要素の動作検証
- **環境分岐テスト**: NODE_ENV別の表示制御確認
- **プロパティテスト**: 型安全性と必須/任意プロパティ検証
- **統合テスト**: 他機能との連携動作確認
