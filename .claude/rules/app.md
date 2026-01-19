---
paths:
  - "app/**/*.{ts,tsx}"
---

# App開発ルール

このファイルはapp/ディレクトリ固有の技術的詳細を定義します（App RouterとAPI開発の両方を含む）。

## 仕様書参照

**詳細仕様**: 以下のドキュメントを参照してください：

### アーキテクチャ・構造
- @todoApp-submodule/docs/PRODUCTS.md#プロジェクト構造 - プロジェクト全体構造

### 共通ライブラリ
- @todoApp-submodule/docs/app/libs/firebaseAdmin.md - Firebase Admin SDK
- @todoApp-submodule/docs/app/libs/withAuth.md - 認証ミドルウェア
- @todoApp-submodule/docs/app/libs/apis.md - API共通処理

### 認証システム
- @todoApp-submodule/docs/auth/ - 認証システム仕様

### Admin APIs
- @todoApp-submodule/docs/app/api/admin/usersAPI.md - ユーザー管理API
- @todoApp-submodule/docs/app/api/admin/userListsAPI.md - ユーザーリスト管理API
- @todoApp-submodule/docs/app/api/admin/userTodosAPI.md - ユーザーTodo管理API
- @todoApp-submodule/docs/app/api/admin/userDetailAPI.md - ユーザー詳細API

### General APIs
- @todoApp-submodule/docs/app/api/general/todosAPI.md - Todo操作API
- @todoApp-submodule/docs/app/api/general/listsAPI.md - リスト操作API
- @todoApp-submodule/docs/app/api/general/dashboardsAPI.md - ダッシュボードAPI
- @todoApp-submodule/docs/app/api/general/userAPI.md - ユーザー情報API

### Auth APIs
- @todoApp-submodule/docs/app/api/auth/server-loginAPI.md - サーバーログインAPI
- @todoApp-submodule/docs/app/api/auth/refreshAPI.md - トークンリフレッシュAPI

## App Router開発パターン

### プライベートディレクトリ（ルーティング対象外）

主要なプライベートディレクトリ:

- **_signIn/**: サインイン Server Actions
- **_signOut/**: サインアウト Server Actions
- **_signUp/**: サインアップ Server Actions

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

**判断基準**:
- **複雑さ**: 外部依存、状態管理、複雑なロジック → `libs/`
- **シンプルさ**: 純粋関数、単純な変換 → `utils/`

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

#### SessionProvider（NextAuth.js認証）

```typescript
// providers/SessionProvider.tsx
'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

export function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider>
      {children}
    </NextAuthSessionProvider>
  );
}
```

**使用目的**:
- NextAuth.js `useSession`フック対応
- 認証状態管理の統一化
- セキュリティ向上（customTokenをセッションから除外）

#### MSWプロバイダー（環境別制御）

```typescript
// providers/MSWProvider.tsx
'use client'

export function MSWProvider({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === 'development') {
    // 開発環境でのみMSW有効化
  }
  return <>{children}</>
}
```

#### プロバイダー階層構造

```typescript
// app/layout.tsx
<SessionProvider>
  <MSWProvider>
    {children}
    <MockIndicator />
  </MSWProvider>
</SessionProvider>
```

**階層の理由**:
- **SessionProvider（最上位）**: 認証状態をアプリ全体で管理
- **MSWProvider**: API モック機能（開発環境のみ）
- **MockIndicator**: 開発環境での視覚的フィードバック

## API開発パターン

### API構造

APIはルートグループで分類されています：

| グループ | 用途 | 認証要件 |
|---------|------|---------|
| **(admin)/** | 管理者専用API | admin ロール必須 |
| **(general)/** | 一般ユーザーAPI | ユーザー認証必須 |
| **auth/** | 認証API | 認証フロー処理 |

### API開発原則

#### リクエスト/レスポンス処理

- **Zodスキーマ**: 全リクエスト/レスポンスでバリデーション必須
- **一貫したエラーレスポンス**: 統一されたエラー形式
- **適切なHTTPステータスコード**: REST API規約準拠
- **認証ミドルウェア**: withAuthで認証処理

#### Firebase統合

- **Firebase Admin SDK**: 全操作でAdmin SDK使用
- **適切なエラーハンドリング**: Firebase例外処理
- **トランザクション**: 複雑な操作で使用
- **Firestoreセキュリティルール**: ルール適用

### 認証要件

#### 環境別認証方式

詳細は @todoApp-submodule/docs/app/libs/withAuth.md#3-環境別認証処理 を参照してください。

| 環境 | 認証方式 | 条件 |
|------|---------|------|
| **本番環境** | NextAuth.js セッション | `NODE_ENV=production` |
| **Docker開発環境** | NextAuth.js セッション | `NODE_ENV=development` + `FIRESTORE_EMULATOR_HOST` |
| **Docker統合テスト環境** | `X-Test-User-ID` ヘッダー | `NODE_ENV=test` + `FIRESTORE_EMULATOR_HOST` |

#### 認証処理の要件

- **JWTトークン検証**: Firebase Admin SDKで検証
- **ロール確認**: 管理者エンドポイントでロールチェック
- **期限切れトークン処理**: 適切な期限切れハンドリング
- **レート制限**: 必要に応じて実装

### エラーレスポンス形式

```typescript
// 基本エラーレスポンス
{
  error: string;
}

// 詳細なエラー情報が必要な場合
{
  error: string;
  details?: unknown;
}
```

**注意**: エラーメッセージに機密情報（内部パス、データベース情報等）を含めない。

### withAuthenticatedUser使用例

```typescript
import { withAuthenticatedUser } from '@/app/libs/withAuth';

export async function POST(req: Request) {
  return withAuthenticatedUser<TodoPayload, TodoResponse>(
    req,
    async (uid, body) => {
      // 認証済みユーザーの処理
      const { text, status } = body;

      // Firebase Firestoreへの保存処理
      // ...

      return NextResponse.json(result);
    },
  );
}
```

### HTTPステータスコードの適切な使用

- **200 OK**: 成功レスポンス
- **400 Bad Request**: バリデーションエラー
- **401 Unauthorized**: 認証エラー
- **403 Forbidden**: 権限エラー
- **404 Not Found**: リソース未発見
- **500 Internal Server Error**: サーバーエラー

## 実装時の注意点

### 1. プライベートディレクトリの命名

- 必ず`_`プレフィックスを使用
- ルーティングに影響しないServer Actions配置

### 2. ファイル配置の判断基準

- **libs/**: Firebase連携、認証処理など複雑なロジック
- **utils/**: 単純な変換・バリデーション関数

### 3. 特殊ファイルの使い分け

- **template.tsx**: 条件付きレイアウト制御
- **loading.tsx**: ルートグループ別ローディング画面

### 4. API開発の必須要件

- **Zodバリデーション**: 全APIで必須
- **withAuth使用**: 認証が必要なAPIで必須
- **エラーハンドリング**: 統一されたエラーレスポンス形式
- **セキュリティ**: Firebase Admin SDKはサーバーサイドのみで使用
