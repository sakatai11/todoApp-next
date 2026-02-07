# セキュリティ原則

このファイルはプロジェクト全体のセキュリティ基準を定義します。

## 認証とアクセス制御

### 認証フロー

プロジェクトはNextAuth.js v5とFirebase Admin SDKを使用した二段階認証を実装しています。

**採用理由**:

- **NextAuth.js v5**: Next.js App Routerとの深い統合、セッション管理の容易さ、OAuth/Email認証の柔軟なサポート
- **Firebase Admin SDK**: Firestoreとの緊密な連携、きめ細かい権限制御（Custom Claims）、サーバーサイドでの安全なトークン検証
- **二段階認証の利点**: NextAuthのセッション管理機能とFirebaseのデータベース権限制御を両立し、セキュアかつ柔軟な認証フローを実現

**基本フロー**:

1. NextAuth.jsカスタムプロバイダーでログイン
2. `/api/auth/server-login`でFirebase Custom Token取得
3. Firebase Admin SDKでサーバーサイド検証
4. Role-based access control (admin/user)

詳細は `@todoApp-submodule/docs/app/libs/withAuth.md` を参照してください。

### NextAuthエラーハンドリング

NextAuth.js v5では、エラーが`CallbackRouteError`でラップされることがあります。適切なエラー処理のため、以下のAuth.js公式推奨パターンを使用してください：

```typescript
import { CredentialsSignin } from 'next-auth';

// カスタムエラークラスの定義（型付きエラー）
class InvalidCredentialsError extends CredentialsSignin {
  code = 'invalid_credentials';
}

// Credentialsプロバイダーでの使用例
Credentials({
  async authorize(credentials) {
    const user = await verifyCredentials(credentials);

    if (!user) {
      // ジェネリックなErrorではなく、CredentialsSigninを使用
      throw new InvalidCredentialsError();
    }

    return user;
  },
});

// エラーハンドリング例（サーバー側）
try {
  // NextAuth処理
} catch (error) {
  // Auth.jsエラーの構造化されたログ出力
  if (error instanceof Error && 'cause' in error) {
    const cause = (error as { cause?: { err?: Error } }).cause;
    console.error('[auth][cause]', cause?.err);
    console.error('[auth][details]', error.message);
  } else {
    console.error('[auth][error]', error);
  }

  // クライアントには安全なエラーコード/メッセージのみを返す
  return { error: 'authentication_failed' };
}
```

**重要な変更点**:
- **`CallbackRouteError`の正確な構造**: `error.cause?.err`でアクセス
- **推奨パターン**: ジェネリックな`Error`ではなく、`CredentialsSignin`またはそのサブクラスを使用
- **構造化ログ**: `[auth][cause]`と`[auth][details]`でデバッグ情報を記録
- **クライアント安全性**: サーバー側でエラーを検査し、クライアントには安全なメッセージのみを返す

**参考**: [Auth.js公式エラーリファレンス](https://errors.authjs.dev/)

### Role-Based Access Control (RBAC)

- **管理者API**: `app/api/(admin)/` - 管理者ロール検証必須
- **一般ユーザーAPI**: `app/api/(general)/` - ユーザー認証必須
- **認証API**: `app/api/auth/` - 認証フロー処理

## APIセキュリティ

### バリデーション必須

- **全API**: Zodスキーマで全リクエスト/レスポンスをバリデーション
- **入力検証**: ユーザー入力は信頼しない
- **型安全性**: TypeScriptの型とZodスキーマの両方で保護

### HTTPステータスコード

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
// ✅ API Route内での使用
export async function GET(req: Request) {
  const user = await adminAuth.getUser(uid);
  const todos = await adminDb
    .collection('todos')
    .where('userId', '==', uid)
    .get();
}

// ❌ クライアントコンポーネントでの使用禁止
// 'use client'; // このファイル内でFirebase Admin SDKを使用しない
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

**理由**: 機密情報のGitリーク防止、GDPR等のコンプライアンス対応、不正アクセスによる情報漏洩リスクの最小化のため。

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

### ファイルアクセス制御

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
const query = `SELECT * FROM todos WHERE userId = '${userId}'`; // 禁止
```

### CORS設定

- **許可オリジン**: 必要なオリジンのみを許可
- **本番環境**: ワイルドカード`*`の使用禁止
- **開発環境**: localhost のみ許可

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
  return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
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
