---
paths:
  - "app/**/*.{ts,tsx}"
---

# App開発ルール

このファイルはapp/ディレクトリ固有の技術的詳細を定義します（App RouterとAPI開発の両方を含む）。

## 仕様書参照

**詳細仕様**: 以下のドキュメントを参照してください：

- @todoApp-submodule/docs/PRODUCTS.md#プロジェクト構造 - プロジェクト全体構造
- @todoApp-submodule/docs/app/libs/withAuth.md - 認証ミドルウェア
- @todoApp-submodule/docs/app/api/ - API仕様（admin/general/auth）

## App Router開発パターン

### プライベートディレクトリ（ルーティング対象外）

- **_signIn/**: サインイン Server Actions
- **_signOut/**: サインアウト Server Actions
- **_signUp/**: サインアップ Server Actions

**使用ルール**:
- `_`プレフィックスでルーティング対象外
- Server Actions専用
- 各認証処理を分離配置

### libs/ vs utils/ 配置基準

#### libs/ に配置すべきもの（複雑なビジネスロジック）

```typescript
- firebaseAdmin.ts    # Firebase Admin SDK統合
- withAuth.ts         # 認証ミドルウェア
- apis.ts            # API連携処理
- fetchUserForTemplate.ts # テンプレート用データ取得
```

#### utils/ に配置すべきもの（単純なヘルパー関数）

```typescript
- authUtils.ts       # 認証状態確認
- 単純な変換処理
- バリデーション関数
```

**判断基準**:
- **複雑さ**: 外部依存、状態管理、複雑なロジック → `libs/`
- **シンプルさ**: 純粋関数、単純な変換 → `utils/`

### 特殊ファイルパターン

- **template.tsx**: 条件付きレイアウト制御
  - **使用理由**: 認証フローなど、ページ遷移ごとに再マウントが必要な場合に使用。layout.tsxとは異なり、毎回新しいインスタンスが生成される。
- **loading.tsx**: ルートグループ別ローディング画面
  - **使用理由**: 非同期データ取得時のローディング状態を表示。React SuspenseとNext.js App Routerが自動的にローディング状態を管理。
  - `(auth)/loading.tsx`: 認証処理中
  - `(admin)/loading.tsx`: 管理者確認中
  - `(dashboards)/loading.tsx`: データ読み込み中

### プロバイダー階層構造

**階層順序の理由**:
- **SessionProvider（最上位）**: 全ての子コンポーネントで認証状態にアクセス可能にするため。MSWProviderやその他のコンポーネントが認証情報を必要とする場合があるため、最上位に配置。
- **MSWProvider（中間層）**: APIモック機能を提供。SessionProviderの下に配置することで、認証済みAPIリクエストのモックが可能になる。開発環境のみで有効化。

```typescript
// app/layout.tsx
<SessionProvider>        // NextAuth.js認証状態管理（最上位）
  <MSWProvider>          // API モック機能（開発環境のみ）
    {children}
    <MockIndicator />    // 開発環境での視覚的フィードバック
  </MSWProvider>
</SessionProvider>
```

## API開発パターン

### API構造

| グループ | 用途 | 認証要件 |
|---------|------|---------|
| **(admin)/** | 管理者専用API | admin ロール必須 |
| **(general)/** | 一般ユーザーAPI | ユーザー認証必須 |
| **auth/** | 認証API | 認証フロー処理 |

### API開発原則

- **Zodスキーマ**: 全リクエスト/レスポンスでバリデーション必須
- **一貫したエラーレスポンス**: 統一されたエラー形式
- **適切なHTTPステータスコード**: REST API規約準拠
- **認証ミドルウェア**: withAuthで認証処理
- **Firebase Admin SDK**: 全操作でAdmin SDK使用
- **トランザクション**: 複雑な操作で使用

### 環境別認証方式

詳細は @todoApp-submodule/docs/app/libs/withAuth.md#3-環境別認証処理 を参照してください。

| 環境 | 認証方式 | 条件 |
|------|---------|------|
| **本番環境** | NextAuth.js セッション | `NODE_ENV=production` |
| **Docker開発環境** | NextAuth.js セッション | `NODE_ENV=development` + `FIRESTORE_EMULATOR_HOST` |
| **Docker統合テスト環境** | `X-Test-User-ID` ヘッダー | `NODE_ENV=test` + `FIRESTORE_EMULATOR_HOST` |

### エラーレスポンス形式

```typescript
// 基本エラーレスポンス
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
      const { text, status } = body;
      // Firebase Firestoreへの保存処理
      return NextResponse.json(result);
    },
  );
}
```

## 実装時の注意点

1. **プライベートディレクトリの命名**: 必ず`_`プレフィックスを使用
2. **ファイル配置の判断基準**: libs/（複雑）vs utils/（単純）
3. **特殊ファイルの使い分け**: template.tsx（レイアウト制御）、loading.tsx（ローディング画面）
4. **API開発の必須要件**: Zodバリデーション、withAuth使用、統一エラーレスポンス
5. **セキュリティ**: Firebase Admin SDKはサーバーサイドのみで使用
