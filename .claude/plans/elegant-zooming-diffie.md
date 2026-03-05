# Next.js 15.2.8 → 16.x アップグレード計画

## Context

Next.js 16 では Turbopack のデフォルト化、`middleware` → `proxy` への改名、`next lint` コマンド削除など複数の破壊的変更がある。本計画では公式 codemod を軸に自動移行を最大限活用しつつ、codemod が対応しない手動変更を安全に適用する。

## 事前調査サマリー

| 項目                | 現状      | 判定                  |
| ------------------- | --------- | --------------------- |
| Node.js（ローカル） | v24.2.0   | ✅ 20.9+ 要件を満たす |
| Node.js（Docker）   | 20-alpine | ✅ 20.9+ 要件を満たす |
| TypeScript          | ^5.7.3    | ✅ 5.1+ 要件を満たす  |
| React               | 19.0.0    | ✅ 更新不要           |
| git 状態            | clean     | ✅ codemod 実行可能   |
| モノレポ            | なし      | ✅                    |

## フェーズ 1: 作業ブランチ作成

```bash
git checkout -b feature/upgrade-nextjs-16
```

## フェーズ 2: 公式 codemod の実行（自動移行）

```bash
npx @next/codemod@canary upgrade latest
```

プロンプトが表示された場合はすべて **yes** を選択する。

### codemod が自動対応する内容

- `next`, `react`, `react-dom`, `@types/react`, `@types/react-dom` のバージョン更新
- `eslint-config-next` のバージョン更新（15.1.7 → 16.x）
- `middleware.ts` → `proxy.ts` へのリネーム＋関数名変更（`middleware` → `proxy`）
- `package.json` の `"dev": "next dev --turbopack"` → `"dev": "next dev"` への変更
- 以下 3 ファイルの `params` async 化（Route Handler パターン）：
  - `app/api/(admin)/users/[userId]/route.ts`
  - `app/api/(admin)/users/[userId]/todos/route.ts`
  - `app/api/(admin)/users/[userId]/lists/route.ts`

### codemod 実行後の差分確認

```bash
git diff
```

確認ポイント：

1. `middleware.ts` → `proxy.ts` にリネームされているか
2. `proxy.ts` 内の関数名が `proxy` になっているか
3. `package.json` の `--turbopack` フラグが削除されているか
4. 3 つの API ルートで `await params` になっているか

## フェーズ 3: 手動修正

### 3-1. `eslint.config.mjs` の保護（最重要）

codemod が `next-lint-to-eslint-cli` を適用した場合、既存の `eslint.config.mjs` が上書きされる可能性がある。

```bash
git diff eslint.config.mjs
```

既存のセキュリティルール（`@typescript-eslint/no-explicit-any` 等）が失われていれば、`git checkout HEAD -- eslint.config.mjs` で元のファイルを復元する。

### 3-2. `package.json` の `lint` スクリプト修正

Next.js 16 で `next lint` コマンドが削除されるため変更が必要。

**対象ファイル:** `package.json`

```json
// 変更前
"lint": "next lint --fix",

// 変更後
"lint": "eslint . --fix",
```

※ codemod が自動対応している場合はスキップ

### 3-3. codemod が params async 化を未対応だった場合の手動修正

codemod 後も以下パターンが残っていれば、3 ファイルに同様の変更を手動で適用する。

**変更前（同期パターン）:**

```typescript
export async function GET(
  _request: Request,
  { params }: { params: { userId: string } },
) {
  const { userId } = params;
```

**変更後（非同期パターン）:**

```typescript
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
```

### 3-4. next-auth v5 のピア依存関係エラー対応（発生した場合のみ）

`npm install` でピア依存関係エラーが出た場合、`package.json` に以下を追加する：

```json
"overrides": {
  "next-auth": {
    "next": "^16.0.0"
  }
}
```

## フェーズ 4: 依存関係インストール

```bash
npm install --legacy-peer-deps
```

`--legacy-peer-deps` は Dockerfile でも使用中のため維持する。

## フェーズ 5: 検証

### 5-1. TypeScript 型チェック

```bash
npx tsc --noEmit
```

### 5-2. ESLint

```bash
npm run lint
```

### 5-3. ユニットテスト

```bash
npm run test:run
```

### 5-4. ビルド確認

```bash
npm run build
```

### 5-5. 開発サーバー起動確認

```bash
npm run dev
```

確認事項：

- `/signin`, `/todo`, `/admin` へのアクセス制御が正常に機能するか（`proxy.ts` の認証ロジック）
- Turbopack が `--turbopack` フラグなしで起動するか

## 対応不要と確認済みの項目

| 変更点                                         | 理由                                                          |
| ---------------------------------------------- | ------------------------------------------------------------- |
| AMP 削除                                       | 未使用                                                        |
| serverRuntimeConfig / publicRuntimeConfig 削除 | 未使用                                                        |
| experimental.ppr 削除                          | 未使用                                                        |
| experimental.dynamicIO 改名                    | 未使用                                                        |
| unstable_rootParams 削除                       | 未使用                                                        |
| unstable_ViewTransition 改名                   | 未使用                                                        |
| unstable_noStore 削除                          | 未使用                                                        |
| revalidateTag API 変更                         | 未使用                                                        |
| Parallel Routes の default.js                  | `@` フォルダ未使用                                            |
| devIndicators config 削除                      | 未設定                                                        |
| turbopackPersistentCachingForDev 改名          | 未設定                                                        |
| serverComponentsExternalPackages               | 未使用                                                        |
| Docker Node.js バージョン                      | 20-alpine（20.9+ 要件を満たす）                               |
| 画像設定                                       | next.config.ts に明示的設定なし（デフォルト変更の影響は最小） |

## 変更対象ファイル

| ファイル                                        | 変更種別                                                           | 担当                                   |
| ----------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------- |
| `middleware.ts` → `proxy.ts`                    | リネーム＋関数名変更                                               | codemod 自動                           |
| `package.json`                                  | next/react バージョン更新、`--turbopack` 削除、lint スクリプト変更 | codemod 自動 ＋ 手動確認               |
| `app/api/(admin)/users/[userId]/route.ts`       | params async 化                                                    | codemod 自動（手動フォールバックあり） |
| `app/api/(admin)/users/[userId]/todos/route.ts` | params async 化                                                    | codemod 自動（手動フォールバックあり） |
| `app/api/(admin)/users/[userId]/lists/route.ts` | params async 化                                                    | codemod 自動（手動フォールバックあり） |
| `eslint.config.mjs`                             | 上書きリスクのため保護・確認が必要                                 | 手動確認                               |

## ロールバック

作業ブランチを破棄して `develop-v2` に戻る：

```bash
git checkout develop-v2
git branch -D feature/upgrade-nextjs-16
npm install --legacy-peer-deps
```
