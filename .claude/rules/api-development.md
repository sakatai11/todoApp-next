---
paths:
  - "app/api/**/*.{ts,tsx}"
---

# API開発ルール

このファイルはAPI開発固有の技術的詳細を定義します。

## 仕様書参照

**詳細仕様**: API実装の詳細仕様は以下のドキュメントを参照してください：

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

### Libs

- @todoApp-submodule/docs/app/libs/firebaseAdmin.md - Firebase Admin SDK
- @todoApp-submodule/docs/app/libs/withAuth.md - 認証ミドルウェア
- @todoApp-submodule/docs/app/libs/apis.md - API共通処理

## API構造

詳細なプロジェクト構造については、@todoApp-submodule/docs/PRODUCTS.md#プロジェクト構造 を参照してください。

API の主要構成:

- **(admin)/**: 管理者専用API
- **(general)/**: 一般ユーザーAPI
- **auth/**: 認証API

## 開発原則

### ルート組織

- **Next.jsルートグループ**: `()`でAPI分類
- **管理者API**: admin ロール検証必須
- **一般API**: ユーザー認証必須
- **認証API**: 認証フロー処理

### リクエスト/レスポンス処理

- **Zodスキーマ**: 全リクエスト/レスポンスでバリデーション
- **一貫したエラーレスポンス**: 統一されたエラー形式
- **適切なHTTPステータスコード**: REST API規約準拠
- **認証ミドルウェア**: withAuthで認証処理

### Firebase統合

- **Firebase Admin SDK**: 全操作でAdmin SDK使用
- **適切なエラーハンドリング**: Firebase例外処理
- **トランザクション**: 複雑な操作で使用
- **Firestoreセキュリティルール**: ルール適用

## 重要な実装パターン

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

### 認証要件

- **環境別認証方式**: 本番/テスト/開発環境で異なる認証処理
- **JWTトークン検証**: Firebase Admin SDKで検証
- **ロール確認**: 管理者エンドポイントでロールチェック
- **期限切れトークン処理**: 適切な期限切れハンドリング
- **レート制限**: 必要に応じて実装

#### 環境別認証方式

詳細は @todoApp-submodule/docs/app/libs/withAuth.md#3-環境別認証処理 を参照してください。

| 環境 | 認証方式 | 条件 |
|------|---------|------|
| **本番環境** | NextAuth.js セッション | `NODE_ENV=production` |
| **Docker開発環境** | NextAuth.js セッション | `NODE_ENV=development` + `FIRESTORE_EMULATOR_HOST` |
| **Docker統合テスト環境** | `X-Test-User-ID` ヘッダー | `NODE_ENV=test` + `FIRESTORE_EMULATOR_HOST` |

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
