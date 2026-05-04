# 週次コード分析レポート - 2026-05-04

## サマリー

フィーチャーベース構成と Server/Client 境界は一貫しており、ESLint で `no-explicit-any: error` を強制した結果 `features/`・`app/`・`types/` 配下に `any` 型は存在しない。一方で API ルート本体での Zod バリデーションは `auth/server-login` のレスポンス検証のみに留まっており、Firestore からの取得値や受信ペイロードを `as TodoListProps` 等の型アサーションで通している箇所が残る。テストファイルは現時点でリポジトリ内に存在しない（Vitest/MSW は設定済み）ため、まずは pure utility と hooks のテストから着手するのが効率的。

## アーキテクチャパターン分析

### フィーチャーベース設計の一貫性
- `features/` 配下は `admin/`・`sign/`・`todo/`・`top/`・`shared/`・`libs/`・`utils/` の 7 領域に分割され、`todo/` のような中核機能は `templates/`・`components/`・`hooks/`・`contexts/`・`dnd/` を内包し自己完結している（`features/todo/templates/TodoWrapper.tsx:9` で `TodoProvider` をラップし、依存は内部の `hooks/`・`contexts/` のみ）。
- `features/libs/apis.ts:1-49` はクライアント用 fetch ラッパーで `features/` 内のみから呼ばれ、`app/libs/` のサーバー専用ライブラリ（`firebaseAdmin.ts`、`withAuth.ts`）と明確に分離されている。

### Server / Client Component 境界
- ルート（`app/page.tsx:6`、`app/(dashboards)/todo/page.tsx:6`）は Server Component で、`async` 関数として markdown 取得や `<Template>` 構築のみを行いクライアント描画を `*Wrapper.tsx` に委譲。
- `'use client'` は 18 ファイルに限定され、対象は (1) コンテキスト（`features/todo/contexts/TodoContext.tsx:1`、`ErrorContext.tsx:1`）、(2) インタラクションを持つ component（`AddTodo.tsx:1`、`TodoList.tsx:1` 等）、(3) SWR を持つ template（`TodoWrapper.tsx:1`） — 役割と一致しており境界は適切。
- `features/utils/*`（4 ファイル）は `'use client'` を付けず純粋関数として保持されており、サーバー/クライアント双方から再利用可能。

### 状態管理パターン（Context + SWR）
- `TodoWrapper.tsx:206-224` で `useSWR` 2 つを並列実行し、初期データを `<TodoProvider>` の `initialTodos`/`initialLists` に渡し、以降の楽観的更新は `useTodos`/`useLists` の `setTodos`/`setLists` で行う（`features/todo/hooks/useTodos.ts:62-67` 等）。SWR はリードのみ、ミューテーションはローカル state という分担が一貫。
- `useSWRConfig().mutate(() => true, undefined, { revalidate: false })`（`TodoWrapper.tsx:137`）でユーザー切替時にキャッシュを全クリアする実装は issue #81 の修正コミット `e81b789` 由来で、SWR のグローバル契約を活用した模範的な対処。

## コード品質

### TypeScript の型安全性
- ESLint で `@typescript-eslint/no-explicit-any: 'error'`、`no-unsafe-assignment/call/member-access/return/argument: 'error'` を有効化（`eslint.config.mjs:16-21`）。`grep -rn ": any" features app types` で検出ゼロ。
- ただし `as` キャストは残存：
  - `app/api/(general)/todos/route.ts:31` `as TodoListProps`（Firestore `doc.data()` の戻り値）
  - `app/api/(general)/lists/route.ts:30` `as StatusListProps`
  - `features/todo/hooks/useTodos.ts:63`、`209` で API レスポンスを `as TodoListProps`
  - `features/todo/hooks/useLists.ts:85` で `as StatusListProps`
  - `features/todo/templates/TodoWrapper.tsx:99-103`、`121`、`152` でレスポンス/セッションを構造化キャスト（型ガード `isFetchError` と組合せ）。
- `TodoWrapper.tsx:114` に `// eslint-disable-next-line @typescript-eslint/no-unsafe-return` が 1 箇所だけ存在（fetcher の `response.json()` 直返し）。

### Zod バリデーションの適用状況
- Zod 利用箇所は `data/validatedData.ts` 1 ファイルのみ（`AuthDecodedTokenSchema`、`AuthResponseSchema`、`CredentialsSchema`）。
- 使用先：
  - `auth.ts:36` `CredentialsSchema.safeParse(credentials)` — 認証情報の入力検証で `safeParse` パターン採用。
  - `app/api/auth/server-login/route.ts:83` `AuthResponseSchema.parse(response)` — 自前構築の応答を検証。
- 一方で `app/api/(general)/todos/route.ts`、`app/api/(general)/lists/route.ts`、`app/api/(general)/user/route.ts`、`app/api/(admin)/users/**/route.ts` の本体は **Zod を使わず** ジェネリクス `withAuthenticatedUser<T, R>` で TS 型を当てているのみ（実行時検証なし）。`withAuth.ts:43` の `body = await clonedReq.json()` は型 `T` にそのままアサインしている。

### React.memo / useCallback / useMemo の最適化
- `React.memo` / `memo` 適用は 6 コンポーネント：
  - `features/shared/components/elements/Icon/IconContents.tsx:16`
  - `features/shared/components/elements/heading/atoms/HeadingContents.tsx:28`
  - `features/shared/components/elements/Navigation/NavigationContents.tsx:74`
  - `features/todo/components/elements/Status/StatusTitle.tsx:12`
  - `features/todo/components/elements/Modal/EditModal.tsx:11`
  - `features/todo/components/elements/TodoList/TodoList.tsx:16`
- TodoList は子要素として大量にレンダリングされる前提で `React.memo` + `useMemo`（`TodoList.tsx:49` の `formattedText`）を併用 — 想定される最適化対象を押さえている。
- `useCallback` / `useMemo` は 12 ファイルで計 32 箇所。`TodoWrapper.tsx:183-204` の `swrOptions` を `useMemo` 化、`useTodos.ts:38-79` 等で全アクションを `useCallback` 化しているのは Context 経由配布での再レンダー抑制として有効。
- 機会：`features/todo/components/elements/Add/AddTodo.tsx:25-32` の `handleAddTodo` は memo 化されておらず、親 PushContainer/Modal が頻繁に再レンダーするケースでは `useCallback` 化候補。

## テストパターン

- `find . -name "*.test.*" -not -path "./node_modules/*"` で **テストファイル 0 件**（`docker-compose.test.yml` 等の設定ファイルのみ）。
- `package.json:11-15` に `vitest`、`test:ui`、`test:coverage` スクリプトと `package.json` 末尾に `"msw": { "workerDirectory": ["public"] }` の設定があるが、`public/` 直下に MSW worker（`mockServiceWorker.js`）も配置されておらず、`grep -rln "setupServer\|setupWorker\|http\\.get" .` で本体コード側の MSW 利用は確認できない。
- README には「テストフレームワーク: Vitest, React Testing Library」「**バリデーション: Zod**」と記載があるが、実装ステータスとの乖離が大きい。
- 「正常に」「正しく」「問題なく」等の表記統一を測ろうとしたが、テストが存在しないため評価不能。**テスト導入と同時に表記ガイドを定義**するのが望ましい。

## 良いパターン（注目実装）

1. **楽観的更新 + ロールバックの徹底**：`features/todo/hooks/useTodos.ts:84-104`（delete）、`useTodos.ts:130-156`（toggle）、`useLists.ts:109-143`（drag end）、`useLists.ts:156-200`（button move）。いずれも `previousTodos`/`previousLists` を保存→楽観的に setState→ API 失敗時に setState で巻き戻し→`showError(ERROR_MESSAGES.X)` で UI に通知、という揃ったテンプレートになっており保守性が高い。
2. **Firestore のトランザクション利用**：`app/api/(general)/lists/route.ts:139-161`（reorder）と `app/api/(general)/lists/route.ts:205-229`（delete + 番号再採番）で `runTransaction` を使い、複数ドキュメントの整合性を保っている。`POST` の単純追加では使わず使い分けが妥当。
3. **構造化された型ガード**：`features/todo/templates/TodoWrapper.tsx:56-76` の `isFetchError` は `unknown` から段階的に narrow し、`shouldRetryOnError`（同 191-199）で 401/403 のみ即停止する SWR 戦略に活用されている。例外系の安全な扱いとして模範的。
4. **ESLint によるセキュリティ防御層**：`eslint.config.mjs:16-58` で `no-explicit-any`、`no-unsafe-*`、`dangerouslySetInnerHTML` 禁止、`eval`/`window.eval` 禁止、`no-restricted-syntax` を network 段階で強制。Zod の補完が無くても XSS 系・型崩壊系の事故を継続的に抑止できている。
5. **Zod の `safeParse` 採用**：`auth.ts:36` で `CredentialsSchema.safeParse(credentials)` を使い `success/data/error.issues` で分岐しており、throw を多用する `parse` よりも認証ハンドラに適した形になっている。直近の commit `35fb566` での NextAuth v5 / Next.js 16 アップグレードを跨いでも維持されている。

## 改善提案（来週のフォーカス）

1. **API ルートの本体に Zod バリデーションを導入する**
   - 対象: `app/api/(general)/todos/route.ts:50,109,215`、`app/api/(general)/lists/route.ts:44,92,186`、`app/api/(admin)/users/**/route.ts`。
   - 現状 `withAuthenticatedUser<TodoPayload<'POST'>, ...>` のジェネリクスは TS の型情報しか持たず、`withAuth.ts:43` の `await clonedReq.json()` の戻り値はランタイムでは未検証。`data/validatedData.ts` のスキーマを拡張し、`auth.ts:36` 同様の `safeParse` パターンを各ハンドラ冒頭に挿入することで、不正ペイロードによる Firestore 書き込みを根本から塞げる。

2. **Firestore からの取得値の `as` キャストを Zod parse に置換する**
   - 対象: `app/api/(general)/todos/route.ts:31` の `as TodoListProps`、`app/api/(general)/lists/route.ts:30` の `as StatusListProps`、`features/todo/hooks/useTodos.ts:63,209` および `useLists.ts:85` の API レスポンス `as` キャスト。
   - Firestore は schema-less なので `Timestamp` 型や必須フィールドの欠落を `as` ではなく実行時に検証すべき。`Timestamp` は `z.custom()` または `instanceof` で扱い、欠損時は 500 を返す形に揃えると、上記改善 1 と合わせて入出力境界の信頼性が一段上がる。

3. **テスト基盤を実コードに接続する**
   - Vitest と MSW は package.json で設定済みだが、テストファイルもハンドラも 0 件。まずは副作用のない `features/utils/dateUtils.ts`、`features/utils/textUtils.ts`、`features/utils/validationUtils.ts`、`app/utils/validationUtils.ts` の単体テストから着手し、続けて `features/todo/hooks/useTodos.ts` と `useLists.ts` の楽観的更新 / ロールバックパスを React Testing Library + MSW で押さえる。回帰しやすいロジック（`useTodos.ts:64-67` のソート、`useLists.ts:115-118` の `number` 再採番）の保護を最優先とし、テスト命名は将来的な「正常に」表記統一を見越して最初から方針を決めて開始する。
