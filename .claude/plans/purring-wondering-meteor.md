# NextAuth.js v5 認証実装修正プラン

## コンテキスト

NextAuth.js v5の認証実装において、以下の問題が発見されました：

1. **セッションに`customToken`が含まれていない** - `auth.config.ts`のsessionコールバックで`customToken`をセッションに含めていないため、authorizedコールバックでの認証判定が正しく機能しない可能性
2. **型定義の不一致** - `types/next-auth.d.ts`の`Session`型に`customToken`プロパティがなく、TypeScriptの型安全性が損なわれている
3. **エラーハンドリングが推奨パターンに非準拠** - セキュリティルール（`.claude/rules/security.md`）で推奨される`CredentialsSignin`クラスの使用と構造化ログが実装されていない
4. **認証ミドルウェアの重複** - `middleware.ts`と`auth.config.ts`のauthorizedコールバックで同様の認証チェックが重複実装されている

これらの問題を解決し、NextAuth.js v5のベストプラクティスに準拠した認証実装を実現します。

## 発見された問題（優先度順）

### 🔴 高優先度-1: セッションcustomToken不足

**問題箇所**: `auth.config.ts:127-135`（sessionコールバック）

**現在のコード**:
```typescript
async session({ session, token }) {
  session.user = {
    id: token.sub,
    email: token.email,
    role: token.role,
    // ❌ customToken がない
  };
  return session;
}
```

**問題**:
- `auth.config.ts:38`のauthorizedコールバックで`auth?.user?.customToken`をチェックしているが、sessionコールバックで`customToken`をセッションに含めていない
- 認証判定が常に`undefined`となり、正しく機能しない可能性

**影響範囲**:
- `/todo`, `/admin` 全ての保護ルートへのアクセス
- `TodoWrapper.tsx:218` セッション認証チェック

---

### 🔴 高優先度-2: 型定義の不一致

**問題箇所**: `types/next-auth.d.ts:5-11`（Session型定義）

**現在の型定義**:
```typescript
interface Session extends DefaultSession {
  user?: {
    id?: string;
    email?: string;
    role?: string;
    // ❌ customToken がない
  } & DefaultSession['user'];
}
```

**問題**:
- `User`型と`JWT`型には`customToken`が定義されているが、`Session`型にはない
- TypeScriptの型安全性が損なわれ、実行時エラーが発生する可能性

---

### 🟡 中優先度: エラーハンドリングが推奨パターンに非準拠

**問題箇所**: `auth.ts` 6箇所（line 23, 30, 35, 46, 56, 71）

**問題**:
- 単純な`Error`クラスを使用しており、NextAuth.js v5推奨の`CredentialsSignin`を使用していない
- 構造化ログ（`[auth][cause]`, `[auth][details]`）が未実装
- セキュリティルール（`.claude/rules/security.md`）に準拠していない

---

### 🟢 低優先度: 認証ミドルウェアの重複（オプション）

**問題箇所**: `middleware.ts:14-33` と `auth.config.ts:17-52`

**問題**:
- 同様の認証チェックロジックが重複実装されている
- NextAuth.js v5のベストプラクティスでは`authorized`コールバックで統一管理を推奨

---

## 実装プラン

### Phase 1: 型定義の修正（最優先）

**修正ファイル**: `types/next-auth.d.ts`

**修正内容**:
```typescript
// types/next-auth.d.ts:5-11（修正後）
interface Session extends DefaultSession {
  user?: {
    id?: string;
    email?: string;
    role?: string;
    customToken?: string; // ✅ 追加
  } & DefaultSession['user'];
}
```

**理由**: TypeScriptの型チェックが全ての後続修正の基盤となるため、最優先で修正

**検証手順**:
```bash
npm run build
```

**期待される結果**: TypeScriptビルドエラーが発生しないこと

---

### Phase 2: sessionコールバックの修正

**修正ファイル**: `auth.config.ts`

**修正内容**:
```typescript
// auth.config.ts:127-135（修正後）
async session({ session, token }) {
  console.log('session', session, token);
  session.user = {
    id: token.sub,
    email: token.email,
    role: token.role,
    customToken: token.customToken, // ✅ 追加
  };
  return session;
}
```

**理由**: 認証フローの中核機能であり、即座に修正が必要

**検証手順**:
```bash
# 開発サーバー起動
npm run dev

# ブラウザでログイン動作確認
# 1. http://localhost:3000/signin にアクセス
# 2. dev.user@todoapp.com / devpassword123 でログイン
# 3. ブラウザコンソールで session.user.customToken が出力されることを確認
# 4. /todo にリダイレクトされることを確認
```

**期待される結果**:
- セッションコールバックのログに`customToken`が含まれる
- `/todo`への認証アクセスが成功する

---

### Phase 3: MSWモックの修正

**修正ファイル**: `todoApp-submodule/mocks/handlers/auth.ts`

**修正内容**:
```typescript
// todoApp-submodule/mocks/handlers/auth.ts:47-60（修正後）
http.get('/api/auth/session', () => {
  return HttpResponse.json({
    user: {
      id: user[0].id,
      email: user[0].email,
      customToken: `mock-custom-token-${user[0].id}`, // ✅ 空文字列から実際のトークンに変更
      role: user[0].role,
    },
    tokenExpiry: 3600,
    tokenIssuedAt: Math.floor(Date.now() / 1000),
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });
}),
```

**理由**: ユニットテストの整合性を確保するため

**検証手順**:
```bash
npm run test:run
```

**期待される結果**: 全ての既存テスト（413テスト）が通過すること

---

### Phase 4: エラーハンドリングの標準化

**修正ファイル**: `auth.ts`

**修正内容**:

#### 4.1 カスタムエラークラスの定義
```typescript
// auth.ts 冒頭に追加
import { CredentialsSignin } from 'next-auth';

// カスタムエラークラスの定義
class InvalidCredentialsError extends CredentialsSignin {
  code = 'invalid_credentials';
}

class MissingCredentialsError extends CredentialsSignin {
  code = 'missing_credentials';
}

class MissingEnvError extends CredentialsSignin {
  code = 'missing_environment';
}

class AuthenticationFailedError extends CredentialsSignin {
  code = 'authentication_failed';
}
```

#### 4.2 エラースローの変更（6箇所）

**auth.ts:23（修正後）**:
```typescript
const parsedCredentials = CredentialsSchema.safeParse(credentials);
if (!parsedCredentials.success) {
  throw new InvalidCredentialsError('認証情報が不足しているか、形式が間違っています');
}
```

**auth.ts:30（修正後）**:
```typescript
if (!email || !password) {
  throw new MissingCredentialsError('認証情報が不足しています');
}
```

**auth.ts:35（修正後）**:
```typescript
if (!process.env.NEXTAUTH_URL) {
  throw new MissingEnvError('NEXTAUTH_URL is not defined');
}
```

**auth.ts:46（修正後）**:
```typescript
if (!baseUrl) {
  throw new MissingEnvError('Base URL is not configured for authentication');
}
```

**auth.ts:56（修正後）**:
```typescript
if (!res.ok) {
  throw new AuthenticationFailedError('ログインに失敗しました');
}
```

**auth.ts:70-71（修正後）**:
```typescript
} catch (error) {
  if (error instanceof Error && 'cause' in error) {
    const cause = (error as { cause?: { err?: Error } }).cause;
    console.error('[auth][cause]', cause?.err);
    console.error('[auth][details]', error.message);
  } else {
    console.error('[auth][error]', error);
  }
  throw new AuthenticationFailedError('カスタムトークンによるログインに失敗しました');
}
```

**理由**: セキュリティルール（`.claude/rules/security.md`）に準拠し、構造化ログを実装

**検証手順**:
```bash
npm run test:run
npm run test:e2e
```

**期待される結果**: 全てのテストが通過し、エラーログが構造化されて出力されること

---

### Phase 5: ミドルウェア最適化（オプション）

**修正ファイル**: `auth.config.ts`, `middleware.ts`

**修正方針**:
- `auth.config.ts`の`authorized`コールバックを充実化（callbackUrlパラメータの引き継ぎ）
- `middleware.ts`の重複ロジックを削除し、シンプル化

**注意**: この修正は既存のテストに影響を与える可能性があるため、Phase 1-4完了後に慎重に実施

**検証手順**:
```bash
# callbackUrl機能の確認
# 1. ログアウト状態で http://localhost:3000/admin/user にアクセス
# 2. /signin?callbackUrl=/admin/user にリダイレクトされることを確認
# 3. ログイン後、/admin/user に戻ることを確認

npm run test:e2e
```

---

## Critical Files for Implementation

1. `/Users/sakaitaichi/workspace/todoApp-next/types/next-auth.d.ts` - 型定義の修正
2. `/Users/sakaitaichi/workspace/todoApp-next/auth.config.ts` - sessionコールバックの修正
3. `/Users/sakaitaichi/workspace/todoApp-next/auth.ts` - エラーハンドリングの標準化
4. `/Users/sakaitaichi/workspace/todoApp-next/todoApp-submodule/mocks/handlers/auth.ts` - MSWモックの修正
5. `/Users/sakaitaichi/workspace/todoApp-next/middleware.ts` - ミドルウェア最適化（オプション）

---

## テスト戦略

### ユニットテスト（Vitest + MSW）
- **修正後**: MSWモックの修正により、既存のテスト（413テスト）はそのまま通過する想定
- **実行コマンド**: `npm run test:run`

### 統合テスト（Docker + Firebase Emulator）
- **影響なし**: `X-Test-User-ID`ヘッダーで認証するため、今回の修正の影響を受けない
- **実行コマンド**: `npm run docker:test:run`

### E2Eテスト（Playwright）
- **修正不要**: 既存のE2Eテスト（`tests/e2e/01-authentication.spec.ts`）は修正不要
- **実行コマンド**: `npm run test:e2e`

---

## リスク評価

### Phase 1-3: 低リスク
- **影響範囲**: 型定義、sessionコールバック、MSWモック
- **ロールバック可能性**: 高（各修正は1-2行の変更のみ）
- **段階的リリース戦略**: 開発環境での動作確認 → E2Eテスト → 本番デプロイ

### Phase 4: 低〜中リスク
- **影響範囲**: エラーメッセージ、ログ出力
- **ロールバック可能性**: 高（Errorクラスへの戻しで即座に元に戻せる）
- **リスク軽減策**: 既存のエラーメッセージを維持、クライアント側のエラーハンドリングは変更しない

### Phase 5: 中〜高リスク（オプション）
- **影響範囲**: ルート保護ロジック全体
- **ロールバック可能性**: 中（middleware.tsの元の実装を復元）
- **リスク軽減策**: 既存のmiddleware.tsをバックアップ、E2Eテストで全ての認証フローを検証

---

## 検証手順（エンドツーエンド）

### 1. 開発環境での動作確認
```bash
npm run dev
```

**検証項目**:
- [ ] サインインページ（`/signin`）でログイン可能
- [ ] ログイン後、`/todo`にリダイレクトされる
- [ ] ブラウザコンソールで`session.user.customToken`が出力される
- [ ] 管理者ユーザー（`admin.user@todoapp.com`）で`/admin`にアクセス可能
- [ ] 一般ユーザーで`/admin`にアクセス時、`/signin`にリダイレクトされる

### 2. ユニットテスト
```bash
npm run test:run
```

**期待結果**: 413テスト全て通過

### 3. 統合テスト
```bash
npm run docker:test:run
```

**期待結果**: 全ての統合テストが通過

### 4. E2Eテスト
```bash
npm run test:e2e
```

**期待結果**: 全てのE2Eテストが通過

### 5. ビルド確認
```bash
npm run build
```

**期待結果**: TypeScriptビルドエラーが発生しないこと

---

## 既存機能の維持

以下の既存機能は今回の修正で影響を受けないことを確認：

- [ ] JWT セッション戦略（24時間有効期限）
- [ ] トークンリフレッシュ（45分ごと）
- [ ] Firebase Admin SDK連携
- [ ] 環境別認証（本番/開発/Docker統合テスト）
- [ ] Role-based access control（ADMIN/USER）
- [ ] サインインページのリダイレクト処理

---

## 参考ドキュメント

- **セキュリティルール**: `.claude/rules/security.md` - NextAuthエラーハンドリング推奨パターン
- **Auth.js公式エラーリファレンス**: https://errors.authjs.dev/
- **withAuth仕様書**: `todoApp-submodule/docs/app/libs/withAuth.md` - 環境別認証処理
