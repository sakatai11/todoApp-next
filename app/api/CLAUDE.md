# API開発ガイドライン

## 全体情報参照

**必ず日本語で回答してください**

**重要**: プロジェクト全体の方針は [`@CLAUDE.md`](../../CLAUDE.md)（プロジェクトルート）を参照してください。
このファイルはAPI開発固有の技術的詳細に特化しています。

## 仕様書参照

**詳細仕様**: API実装の詳細仕様は以下のドキュメントを参照してください：

### Admin APIs

- [@usersAPI.md](../../todoApp-submodule/docs/app/api/admin/usersAPI.md) - ユーザー管理API
- [@userListsAPI.md](../../todoApp-submodule/docs/app/api/admin/userListsAPI.md) - ユーザーリスト管理API
- [@userTodosAPI.md](../../todoApp-submodule/docs/app/api/admin/userTodosAPI.md) - ユーザーTodo管理API
- [@userDetailAPI.md](../../todoApp-submodule/docs/app/api/admin/userDetailAPI.md) - ユーザー詳細API

### General APIs

- [@todosAPI.md](../../todoApp-submodule/docs/app/api/general/todosAPI.md) - Todo操作API
- [@listsAPI.md](../../todoApp-submodule/docs/app/api/general/listsAPI.md) - リスト操作API
- [@dashboardsAPI.md](../../todoApp-submodule/docs/app/api/general/dashboardsAPI.md) - ダッシュボードAPI
- [@userAPI.md](../../todoApp-submodule/docs/app/api/general/userAPI.md) - ユーザー情報API

### Auth APIs

- [@server-loginAPI.md](../../todoApp-submodule/docs/app/api/auth/server-loginAPI.md) - サーバーログインAPI
- [@refreshAPI.md](../../todoApp-submodule/docs/app/api/auth/refreshAPI.md) - トークンリフレッシュAPI

### Libs

- [@firebaseAdmin.md](../../todoApp-submodule/docs/app/libs/firebaseAdmin.md) - Firebase Admin SDK
- [@withAuth.md](../../todoApp-submodule/docs/app/libs/withAuth.md) - 認証ミドルウェア
- [@apis.md](../../todoApp-submodule/docs/app/libs/apis.md) - API共通処理

## API構造

詳細なプロジェクト構造については、[../../todoApp-submodule/docs/PRODUCTS.md](../../todoApp-submodule/docs/PRODUCTS.md#プロジェクト構造)を参照してください。

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
{
  error: string;
  message: string;
  statusCode: number;
}
```

### 認証要件

- **JWTトークン検証**: Firebase Admin SDKで検証
- **ロール確認**: 管理者エンドポイントでロールチェック
- **期限切れトークン処理**: 適切な期限切れハンドリング
- **レート制限**: 必要に応じて実装

### withAuth使用例

```typescript
export default withAuth(handler, { requireAdmin: true });
```
