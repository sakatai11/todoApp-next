# 週次コード分析レポート - 2026-05-11

## サマリー

フィーチャーベース設計・型安全性・Server/Client 境界はいずれも良好に維持されており、`any` 型使用は全コード 0 件、features 間のクロス参照違反も検出されませんでした。一方でテスト基盤（Vitest + MSW + Firebase Emulator）は `package.json` と Docker 設定に整備済みですが、実テストファイルは 0 件であり、API ルートの Zod バリデーションも認証系の 2 ルートに限定されています。直近 2 週間はインフラ整備（Claude Code Action / PR 自動レビュー基盤）中心のコミットが多く、プロダクションコード自体は安定運用フェーズにあると判断します。

## アーキテクチャパターン分析

### フィーチャーベース設計の自己完結性

`features/` 配下の 7 ディレクトリ（admin / sign / todo / top / shared / libs / utils）を全て調査した結果、**クロスフィーチャー違反は 0 件**で、依存方向は以下の通り健全です。

- `features/todo/*` → `features/libs/apis`, `features/utils/{dateUtils,validationUtils,textUtils}` のみに外部依存（許可された共有層）
- `features/admin/templates/AdminWrapper.tsx:11` → `types/` のみ参照（完全に隔離）
- `features/top/templates/TopWrapper.tsx:4` → `types/` のみ参照
- `features/sign/*` → 自フィーチャー内のみで完結

`features/todo/hooks/useTodos.ts:5-8` の import 構成は、フィーチャーベース設計の理想的な参照例として機能しており、`features/admin` / `features/sign` への直接参照は一切ありません。

### Server/Client Component 境界

`'use client'` 指定ファイルは 21 件で、すべてリーフ寄りに配置されています。

- ルートレイアウト（`app/layout.tsx`, `app/template.tsx`, `app/page.tsx`）は Server Component を維持
- 境界は `SessionProvider`（`app/providers/SessionProvider.tsx:1`）、`TodoWrapper`（`features/todo/templates/TodoWrapper.tsx:1`）、`TopWrapper`、`AdminWrapper` 等の "Wrapper" 系テンプレートに集約
- Context（`TodoContext.tsx:1`, `ErrorContext.tsx:1`）、フック（`useTodos.ts:1` ほか 3 件）、状態を持つ UI コンポーネント（`StatusTitle.tsx:1`, `TodoList.tsx:1` ほか）のみが `'use client'` を保持

`app/page.tsx` から `TopWrapper`（Client）、`app/(dashboards)/todo/page.tsx` から `TodoWrapper`（Client）へ受け渡す構造は、Server → Client の "押し下げ" パターンとして適切です。

### 状態管理パターン（Context + SWR）

`features/todo/templates/TodoWrapper.tsx` を起点とした統一パターンが確立されています。

- 取得側: `useSWR` で `urls.todos` / `urls.lists` を購読（`TodoWrapper.tsx:10, 210`）、`useApiUrls` を `useMemo` で固定化（`:26-38`）
- 配布側: `TodoProvider`（`TodoContext.tsx:14`）が `todoHooks / listHooks / updateStatusAndCategoryHooks / deleteListHooks` の 4 系統を一括提供
- 変更側: 各カスタムフック（`useTodos.ts` / `useLists.ts` 等）が `features/libs/apis` の `apiRequest` を呼び出し、エラー通知は `useError()`（`useTodos.ts:15`）で `ErrorContext` に集約

Server-side では `app/template.tsx` の `fetchUserForTemplate()`、Client-side では SWR、いずれも一貫したパターンに従っています。

## コード品質

### TypeScript 型安全性

`features/`, `app/`, `types/` 配下を `: any\b`, `<any>`, `as any`, `@ts-ignore`, `@ts-expect-error` の全パターンで横断検索した結果、**該当 0 件**でした。Generics は `app/api/(general)/todos/route.ts:15-18` の `withAuthenticatedUser<undefined, { todos: TodoListProps[] } | { error: string }>` のように Discriminated Union と組み合わせて活用されており、型の表現力が高いレベルで保たれています。

### Zod バリデーション

Zod スキーマは `data/validatedData.ts` に 3 つ定義（`AuthDecodedTokenSchema`, `AuthResponseSchema`, `CredentialsSchema`）されていますが、利用箇所は以下 3 点に限定されます。

- `auth.ts:36` — NextAuth 認証時の `CredentialsSchema.safeParse(credentials)`
- `app/api/auth/server-login/route.ts:83` — `AuthResponseSchema.parse(response)`（レスポンス側）
- `app/api/auth/refresh/route.ts:11` — `AuthDecodedTokenSchema.safeParse(response)`

一方、データ操作系の API ルートでは Zod が未適用で、手動バリデーションに留まります。

- `app/api/(general)/todos/route.ts:54-66` — `if (!body)` → `trimAllSpaces` → `if (trimmedText && trimmedStatus)` の手書きチェック
- `app/api/(general)/lists/route.ts` — POST/PUT/DELETE すべて手動チェック
- `app/api/(admin)/users/[userId]/route.ts` ほか admin 系は入力検証なし（GET のみのため）

`TodoPayload<'POST'>` のような型は付与されていますが、実行時バリデーションがないため、不正なペイロード（型は合っていても値が想定外）の検知ができていません。

### React 最適化

`features/todo` 配下では `React.memo` 3 件、`useCallback` 14 件、`useMemo` 3 件が適用されており、特に DnD・モーダル・ステータス変更といった再レンダリング負荷の高い箇所で効果的に配置されています。

- `TodoList.tsx:16` (`React.memo`), `:49`（`useMemo` で `formattedText`）
- `StatusTitle.tsx:12`（`React.memo`）, `:44, :68`（クリック外・blur ハンドラの `useCallback`）
- `useLists.ts:101`（`handleDragEnd` の `useCallback` — DnD の dragEnd 経路）
- `TodoWrapper.tsx:30`（API URL の `useMemo`）, `:183`（`swrOptions` の `useMemo`）
- `ErrorContext.tsx:16, :20`（`showError` / `clearError` の `useCallback`）

`useApiUrls` の `useMemo` 化は、URL を fetcher キーとして使う SWR の再フェッチを抑制する重要な配慮で、`swrOptions` の `useMemo` 化と合わせて SWR の振る舞いを安定させています。

## テストパターン

**重要な観察: テスト基盤は整備されているが、テストファイルは 0 件です。**

- `package.json` に `vitest`（2.1.8）、`msw:init` スクリプト、`docker:test:run` / `docker:e2e:run` などのテスト用 Docker Compose タスクが整備済み
- `docker-compose.test.yml`, `firebase-emulator.test.Dockerfile` も配置済み
- `package.json` に `"msw": { "workerDirectory": ["public"] }` の設定あり
- しかし `find . -name "*.test.*" -o -name "*.spec.*"` の結果は 0 件
- `vitest.config.*` も未配置
- `grep -rn "describe\|it("` でも実テストコードはヒットせず

つまり「テスト説明文の表記統一（『正常に』統一）」「MSW モックの使われ方」「テスト配置の一貫性」は**現時点で評価対象が存在しません**。`npm run test` は実行可能ですが対象ファイルが無いため、CI 上ではグリーンが偽装されている可能性があります。

## 良いパターン（注目実装）

### 1. SWR + Context の責務分離（`TodoWrapper.tsx`）

`useApiUrls` の `useMemo` 化（`TodoWrapper.tsx:26-38`）と `swrOptions` の `useMemo` 化（`:183`）により、SWR の key 安定性とオプション安定性を両立。Server-side では `NEXTAUTH_URL` を fallback として絶対 URL を構築するロジックも明示的で、SSR / CSR 双方で動作する fetcher 設計になっています。

### 2. ErrorContext を介した一元エラー通知

`features/todo/contexts/ErrorContext.tsx` の `showError` / `clearError` を `useCallback` で安定化し、各データフック（`useTodos.ts:15` ほか）が `useError()` を経由してエラーを通知する設計は、Snackbar 表示・Boundary 連携・テスト容易性のすべてに寄与します。`ErrorSnackbar.tsx`, `ErrorDisplay.tsx` と組み合わせた "通知 / 表示 / 境界" の三層分離は再利用性が高い好例です。

### 3. 直近コミットに見られる品質志向

`git log --oneline -20` を確認すると、issue 番号付きの fix（`e81b789 fix: サインアウト後のSWRキャッシュ問題を修正 (issue #81)`）、PR レビュー指摘の取り込み（`4eb92a4 fix: address PR review feedback`）、Next.js 16 / NextAuth v5 へのメジャー追従など、技術負債を放置しない運用が継続されています。インフラ系コミット（`f9c5157`, `3a5fe14`, `4a771a9` 等）も `[skip ci]` を正しく付けており、CI ノイズを抑える配慮が見られます。

## 改善提案（来週のフォーカス）

### 1. データ系 API ルートへの Zod バリデーション導入

`app/api/(general)/todos/route.ts:54-66` および `app/api/(general)/lists/route.ts` の POST/PUT/DELETE ハンドラで、`data/validatedData.ts` と同じパターンの `safeParse` を導入。具体的には `TodoPayloadSchema`（text: `z.string().min(1)`, status: `z.string().min(1)`）を新設し、`trimAllSpaces` + 手動チェックを Zod の `.transform()` に置き換えることで、認証ルートと一貫した防御が可能になります。

### 2. テスト基盤への最初の 1 ファイル投入

Vitest / MSW / Firebase Emulator が揃いつつテストファイルが 0 件という状態は、CI 設定との乖離を生みます。来週は `features/utils/validationUtils.ts` や `features/utils/textUtils.ts` といった依存の少ないユーティリティに対する単体テスト 1 ファイルから着手し、同時に `vitest.config.ts` の配置と "正常に" / "正常時" などのテスト命名規約を `docs/` に明文化することを提案します。

### 3. `useApiUrls` の Server URL 解決ロジックの単一責任化

`TodoWrapper.tsx:26-38` の `useApiUrls` 内で `typeof window === 'undefined'` 判定と `process.env.NEXTAUTH_URL` フォールバックを直接行っていますが、これは他の Client Wrapper（将来追加される `admin` 系 API クライアントなど）でも再利用される可能性が高いロジックです。`features/libs/apis` 配下に `getBaseUrl()` ヘルパとして切り出すと、テスト時のモック差し替えも容易になります。
