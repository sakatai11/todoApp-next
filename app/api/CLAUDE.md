# API開発ガイドライン

## 仕様書参照

**重要**: API実装の詳細仕様は以下のドキュメントを参照してください：

### Admin APIs
- `@todoApp-submodule/docs/app/api/admin/usersAPI.md` - ユーザー管理API
- `@todoApp-submodule/docs/app/api/admin/userListsAPI.md` - ユーザーリスト管理API
- `@todoApp-submodule/docs/app/api/admin/userTodosAPI.md` - ユーザーTodo管理API
- `@todoApp-submodule/docs/app/api/admin/userDetailAPI.md` - ユーザー詳細API

### General APIs
- `@todoApp-submodule/docs/app/api/general/todosAPI.md` - Todo操作API
- `@todoApp-submodule/docs/app/api/general/listsAPI.md` - リスト操作API
- `@todoApp-submodule/docs/app/api/general/dashboardsAPI.md` - ダッシュボードAPI
- `@todoApp-submodule/docs/app/api/general/userAPI.md` - ユーザー情報API

### Auth APIs
- `@todoApp-submodule/docs/app/api/auth/server-loginAPI.md` - サーバーログインAPI
- `@todoApp-submodule/docs/app/api/auth/refreshAPI.md` - トークンリフレッシュAPI

### Libs
- `@todoApp-submodule/docs/app/libs/firebaseAdmin.md` - Firebase Admin SDK
- `@todoApp-submodule/docs/app/libs/withAuth.md` - 認証ミドルウェア
- `@todoApp-submodule/docs/app/libs/apis.md` - API共通処理

## API構造

```
api/
├── (admin)/          # 管理者専用API
├── (general)/        # 一般ユーザーAPI
└── auth/            # 認証API
```

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