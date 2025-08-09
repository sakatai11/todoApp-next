# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 必ず日本語で回答してください

## 全体情報参照

**重要**: プロジェクト全体の方針は [`@CLAUDE.md`](../CLAUDE.md)（プロジェクトルート）を参照してください。
このファイルはapp/ディレクトリ固有の技術的詳細に特化しています。

## 仕様書参照

**詳細仕様**: 以下のドキュメントを参照してください：

- [@app/libs/](../todoApp-submodule/docs/app/libs/) - 共通ライブラリ仕様
- [@auth/](../todoApp-submodule/docs/auth/) - 認証システム仕様
- [@app/api/](../todoApp-submodule/docs/app/api/) - API仕様

## app/固有の重要なパターン

### プライベートディレクトリ（ルーティング対象外）

詳細なapp/ディレクトリ構造については、[../todoApp-submodule/docs/PRODUCTS.md](../todoApp-submodule/docs/PRODUCTS.md#プロジェクト構造)を参照してください。

主要なプライベートディレクトリ:

- **\_signIn/**: サインイン Server Actions
- **\_signOut/**: サインアウト Server Actions
- **\_signUp/**: サインアップ Server Actions

**使用ルール**:

- `_`プレフィックスでルーティング対象外
- Server Actions専用
- 各認証処理を分離配置

### Server Actions配置パターン

```typescript
// _signIn/signIn.ts
'use server';

import { signIn } from 'next-auth/react';

export async function signInAction(formData: FormData) {
  // 認証処理のロジック
}
```

### libs/ vs utils/ 配置基準

#### libs/ に配置すべきもの

```typescript
// 複雑なビジネスロジック
- firebaseAdmin.ts    # Firebase Admin SDK統合
- withAuth.ts         # 認証ミドルウェア
- apis.ts            # API連携処理
- fetchUserForTemplate.ts # テンプレート用データ取得
```

#### utils/ に配置すべきもの

```typescript
// 単純なヘルパー関数
- authUtils.ts       # 認証状態確認
- 単純な変換処理
- バリデーション関数
```

### 特殊ファイルパターン

#### Template制御（条件付きヘッダー）

```typescript
// template.tsx
export default function Template({ children }: { children: React.ReactNode }) {
  const showHeader = useAuthCheck() // 認証状態に基づく制御
  return <Layout showHeader={showHeader}>{children}</Layout>
}
```

#### Loading状態管理

ルートグループ別のloading.tsx配置:

- **(auth)/loading.tsx**: 認証処理中
- **(admin)/loading.tsx**: 管理者確認中
- **(dashboards)/loading.tsx**: データ読み込み中

### プロバイダー構成

#### MSWプロバイダー（環境別制御）

```typescript
// providers/MSWProvider.tsx
'use client'

export default function MSWProvider({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === 'development') {
    // 開発環境でのみMSW有効化
  }
  return <>{children}</>
}
```

## 重要な実装時の注意点

### 1. プライベートディレクトリの命名

- 必ず`_`プレフィックスを使用
- ルーティングに影響しないServer Actions配置

### 2. ファイル配置の判断基準

- **libs/**: Firebase連携、認証処理など複雑なロジック
- **utils/**: 単純な変換・バリデーション関数

### 3. 特殊ファイルの使い分け

- **template.tsx**: 条件付きレイアウト制御
- **loading.tsx**: ルートグループ別ローディング画面
