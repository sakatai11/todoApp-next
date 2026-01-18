# セキュリティ原則

このファイルはプロジェクト全体のセキュリティ基準を定義します。

## 認証とアクセス制御

### 認証フロー

プロジェクトはNextAuth.js v5とFirebase Admin SDKを使用した二段階認証を実装しています。

**基本フロー**:
1. NextAuth.jsカスタムプロバイダーでログイン
2. `/api/auth/server-login`でFirebase Custom Token取得
3. Firebase Admin SDKでサーバーサイド検証
4. Role-based access control (admin/user)

```typescript
// 認証ミドルウェアの使用例
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

### 環境別認証方式

詳細は `@app/api/CLAUDE.md` および `@todoApp-submodule/docs/app/libs/withAuth.md` を参照してください。

| 環境 | 認証方式 | 条件 |
|------|---------|------|
| **本番環境** | NextAuth.js セッション | `NODE_ENV=production` |
| **Docker開発環境** | NextAuth.js セッション | `NODE_ENV=development` + `FIRESTORE_EMULATOR_HOST` |
| **Docker統合テスト環境** | `X-Test-User-ID` ヘッダー | `NODE_ENV=test` + `FIRESTORE_EMULATOR_HOST` |

### Role-Based Access Control (RBAC)

- **管理者API**: `app/api/(admin)/` - 管理者ロール検証必須
- **一般ユーザーAPI**: `app/api/(general)/` - ユーザー認証必須
- **認証API**: `app/api/auth/` - 認証フロー処理

```typescript
// 管理者権限チェック例
const userRecord = await admin.auth().getUser(uid);
const isAdmin = userRecord.customClaims?.role === 'admin';

if (!isAdmin) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

## APIセキュリティ

### バリデーション必須

- **全API**: Zodスキーマで全リクエスト/レスポンスをバリデーション
- **入力検証**: ユーザー入力は信頼しない
- **型安全性**: TypeScriptの型とZodスキーマの両方で保護

```typescript
import { z } from 'zod';

const CreateTodoSchema = z.object({
  text: z.string().min(1).max(500),
  status: z.enum(['todo', 'in-progress', 'done']),
  listId: z.string().uuid(),
});

export async function POST(req: Request) {
  const body = await req.json();

  // バリデーション
  const result = CreateTodoSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: result.error },
      { status: 400 }
    );
  }

  // 安全な処理
  const { text, status, listId } = result.data;
  // ...
}
```

### HTTPステータスコードの適切な使用

- **200 OK**: 成功レスポンス
- **400 Bad Request**: バリデーションエラー
- **401 Unauthorized**: 認証エラー
- **403 Forbidden**: 権限エラー
- **404 Not Found**: リソース未発見
- **500 Internal Server Error**: サーバーエラー

### エラーレスポンス統一形式

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

## Firebase Admin SDKセキュリティ

### サーバーサイド専用

- **クライアント使用禁止**: Firebase Admin SDKはサーバーサイドのみで使用
- **環境変数管理**: サービスアカウント認証情報は環境変数で管理
- **権限最小化**: 必要最小限の権限のみを付与

```typescript
// サーバーサイドのみで使用
import { adminAuth, adminDb } from '@/app/libs/firebaseAdmin';

// ✅ API Route内での使用
export async function GET(req: Request) {
  const user = await adminAuth.getUser(uid);
  const todos = await adminDb.collection('todos').where('userId', '==', uid).get();
  // ...
}

// ❌ クライアントコンポーネントでの使用禁止
'use client'; // このファイル内でFirebase Admin SDKを使用しない
```

### Firestoreセキュリティルール

- **ルール適用**: Firestoreセキュリティルールを適切に設定
- **ユーザー分離**: ユーザーは自分のデータのみアクセス可能
- **管理者権限**: 管理者はカスタムクレームで識別

```javascript
// firestore.rules 例
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/todos/{todoId} {
      allow read, write: if request.auth.uid == userId;
    }

    match /users/{userId} {
      allow read: if request.auth.uid == userId
                  || request.auth.token.role == 'admin';
      allow write: if request.auth.uid == userId;
    }
  }
}
```

## 機密情報管理

### 環境変数の使用

**機密情報は環境変数で管理**:
- Firebase Admin SDK認証情報
- APIキー、トークン
- データベース接続文字列
- 秘密鍵、証明書

```typescript
// ✅ 環境変数から読み込み
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

// ❌ ハードコード禁止
const apiKey = 'sk-1234567890abcdef'; // 絶対に禁止
```

### .gitignore設定

機密ファイルは必ず`.gitignore`に追加：
```
.env
.env.local
.env.*.local
credentials.json
serviceAccountKey.json
*.pem
*.key
```

### ファイルアクセス制御（グローバルCLAUDE.md準拠）

以下のファイルは、いかなる状況でも読み取り、変更、作成を行わない：

- `.env` ファイル
- APIキー、トークン、認証情報を含むファイル
- 秘密鍵や証明書
- データベース接続文字列

## セキュアコーディング

### インジェクション攻撃の防止

- **SQLインジェクション**: Firestoreクエリはパラメータ化
- **コマンドインジェクション**: ユーザー入力をコマンドで使用前に検証
- **XSS**: React の自動エスケープを活用、`dangerouslySetInnerHTML`使用禁止

```typescript
// ✅ 安全なFirestoreクエリ
const todosRef = adminDb.collection('todos');
const query = todosRef.where('userId', '==', sanitizedUserId);

// ❌ 危険な文字列結合
const query = `SELECT * FROM todos WHERE userId = '${userId}'`; // SQL使用時は禁止
```

### CORS設定

- **許可オリジン**: 必要なオリジンのみを許可
- **本番環境**: ワイルドカード`*`の使用禁止
- **開発環境**: localhost のみ許可

```typescript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production'
              ? 'https://yourdomain.com'
              : 'http://localhost:3000',
          },
        ],
      },
    ];
  },
};
```

### レート制限

- **API保護**: 必要に応じてレート制限を実装
- **DoS攻撃防止**: 過度なリクエストを制限
- **Vercel**: Vercel の組み込みレート制限を活用

## セキュリティベストプラクティス

### 1. 最小権限の原則

- ユーザーは必要最小限の権限のみを持つ
- 管理者権限は厳密に管理

### 2. セキュアなエラーハンドリング

```typescript
try {
  // 処理
} catch (error) {
  console.error('Internal error:', error); // サーバーログに詳細記録

  // ユーザーには一般的なエラーメッセージのみ
  return NextResponse.json(
    { error: 'An error occurred' },
    { status: 500 }
  );
}
```

### 3. HTTPS必須

- **本番環境**: HTTPS通信必須
- **開発環境**: HTTP許可（localhost のみ）
- **Cookie**: `secure: true` フラグ設定（本番）

### 4. 定期的なセキュリティ監査

- 依存関係の脆弱性チェック（`npm audit`）
- セキュリティパッチの適用
- 認証フローの定期的なレビュー

```bash
# 依存関係の脆弱性チェック
npm audit

# 自動修正
npm audit fix
```
