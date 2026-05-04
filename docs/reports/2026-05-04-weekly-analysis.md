# 週次コード分析レポート - 2026-05-04

## サマリー

`develop-v2` ブランチにはテスト基盤（Vitest + MSW + Playwright + Firebase Emulator）と submodule 由来のモックデータ共通化が整い、`.claude/rules/{app,features,testing}.md` で開発規約が明文化されている。一方で、規約上「全リクエスト/レスポンスで Zod バリデーション必須」とされている API ルート群（`/api/(general)/todos|lists`、`/api/(admin)/users/**`）は実際には Zod 未使用、テストは 26 ファイル中ほぼすべてが `features/todo` に集中、`it()` 504 件中「正常に」表記は 19% に留まるなど、規約と実装の乖離が複数領域で観測される。`app/api/(general)/user/route.ts:10` のセッション全文ログ出力は早期に対処すべきポイント。

## アーキテクチャパターン分析

### フィーチャーベース設計の一貫性
- `features/` は `admin/`・`sign/`・`todo/`・`top/`・`shared/`・`libs/`・`utils/` の 7 領域に分かれ、`todo/` のみ `templates/`・`components/`・`hooks/`・`contexts/`・`dnd/` を内包する自己完結構造（`features/todo/templates/TodoWrapper.tsx:9` で `TodoProvider` をラップ）。
- `features/libs/apis.ts` はクライアント用 fetch ラッパー専用、`app/libs/`（`firebaseAdmin.ts`、`withAuth.ts`、`fetchUserForTemplate.ts`）はサーバー専用と明確に分離されている（`.claude/rules/app.md` の libs/utils 配置基準に沿う）。
- `features/shared/components/elements/Mock/MockIndicator.tsx:1` は `'use client'` で開発環境のみ表示するモック認証情報の常時可視化バッジ。`process.env.NODE_ENV !== 'development'` で本番では `null` を返し（`MockIndicator.tsx:5-10`）、安全側に倒している。

### Server / Client Component 境界
- `'use client'` 宣言は 18 ファイルに限定（main 比でも増減なし）。`app/page.tsx`、`app/(dashboards)/todo/page.tsx` 等のルートは Server Component で、データ取得とテンプレート構築のみを担当。
- 開発時 API モック（`app/providers/MSWProvider.tsx`）は `'use client'` + `useEffect` 内 dynamic import (`MSWProvider.tsx:20-23`) で本番ビルドへの混入を避け、初期化完了まで `return null` で children を遅延（`MSWProvider.tsx:34-40`）する Hydration 安全な実装。
- `app/layout.tsx:33-38` は `<SessionProvider> → <MSWProvider> → children → <MockIndicator/>` の三層構成。`.claude/rules/app.md` の「プロバイダー階層構造」と一致しており、ドキュメントが実コードを反映している。

### 状態管理パターン（Context + SWR）
- `TodoWrapper.tsx:206-224` で `useSWR` 2 系統を使い初期データを取得し、`<TodoProvider initialTodos initialLists>` で渡す。以降のミューテーションは `useTodos`/`useLists` の `setTodos`/`setLists` に閉じ、SWR は read のみ。`.claude/rules/features.md` の「useSWR は TodoWrapper でのみ使用」「初期データ取得後は useState ベース」というルールを満たしている。
- `TodoWrapper.tsx:137` の `globalMutate(() => true, undefined, { revalidate: false })` でユーザー切替時に全 SWR キャッシュをクリアする実装（issue #81 由来、`develop-v2` でも維持）。

## コード品質

### TypeScript の型安全性
- `eslint.config.mjs:16-21` で `@typescript-eslint/no-explicit-any: 'error'`、`no-unsafe-assignment/call/member-access/return/argument: 'error'` を強制。`grep -rn ": any"` で features/app/types に 0 件。
- ただし「`as` キャスト」は依然として 5 箇所が残置：
  - `app/api/(general)/todos/route.ts:31` `as TodoListProps`（Firestore `doc.data()` 戻り値）
  - `app/api/(general)/lists/route.ts:30` `as StatusListProps`
  - `features/todo/hooks/useTodos.ts:63`、`209` `as TodoListProps`
  - `features/todo/hooks/useLists.ts:85` `as StatusListProps`
- `app/api/(general)/user/route.ts:27-32` `data['email'] as string`、`data['role'] as 'ADMIN' | 'USER'`、`data['createdAt'] as { toMillis: () => number }` のように Firestore の `DocumentData` を素のキャストで救っており、`AdminUser` 型の保証はランタイムにない。`app/api/(admin)/users/[userId]/route.ts:30-44` も同様。

### Zod バリデーションの適用状況
- Zod 利用は `data/validatedData.ts` の 3 スキーマ（`AuthDecodedTokenSchema`、`AuthResponseSchema`、`CredentialsSchema`）に限定。
- 使用先（実装側）：
  - `auth.ts:36` `CredentialsSchema.safeParse(credentials)`
  - `app/api/auth/server-login/route.ts:124` `AuthResponseSchema.parse(response)`
  - `app/api/auth/refresh/route.ts:17` `AuthDecodedTokenSchema.safeParse(response)`
- 一方、`.claude/rules/app.md` の API 開発原則は **「Zodスキーマ: 全リクエスト/レスポンスでバリデーション必須」** と明記しているが、実装側は以下が未対応：
  - `app/api/(general)/todos/route.ts:50,109,215`（POST/PUT/DELETE）
  - `app/api/(general)/lists/route.ts:44,92,186`
  - `app/api/(general)/user/route.ts:7`
  - `app/api/(admin)/users/route.ts`、`app/api/(admin)/users/[userId]/route.ts`、`app/api/(admin)/users/[userId]/{lists,todos}/route.ts`
- `features/libs/apis.ts:39-58` は `develop-v2` で `content-type` 判定とフォールバックメッセージ抽出が追加されており、エラーレスポンスのパースは堅牢化されているが、レスポンス型は `response.json() as Promise<TResponse>`（同 61 行）という最終キャストで閉じている。

### React.memo / useCallback / useMemo の最適化
- `React.memo` / `memo` は 6 コンポーネント（main と同数）。
  - `features/shared/components/elements/Icon/IconContents.tsx:16`
  - `features/shared/components/elements/heading/atoms/HeadingContents.tsx:28`
  - `features/shared/components/elements/Navigation/NavigationContents.tsx:74`
  - `features/todo/components/elements/Status/StatusTitle.tsx:12`
  - `features/todo/components/elements/Modal/EditModal.tsx:11`
  - `features/todo/components/elements/TodoList/TodoList.tsx:16`
- `useCallback`/`useMemo` は 32 箇所。`useTodos.ts:38-79`（addTodo）、`useTodos.ts:82-107`（deleteTodo）等で context 配布される全アクションを memoize しており、Provider 経由再レンダー抑制が一貫。
- `TodoWrapper.tsx:183-204` の `swrOptions` は `useMemo` 化済み。`TodoList.tsx:49` の `formattedText` も `useMemo`。

## テストパターン

### テストファイルの配置と命名
- 配置は `tests/` 配下のミラー構造：`tests/features/todo/...`、`tests/features/utils/...`、`tests/features/libs/...`、`tests/features/shared/...`。`vitest.config.ts:11` の `include: ['**/*.{test,spec}.{js,ts,jsx,tsx}']` で拾い、`integration` を含むファイルと `tests/e2e/**` は exclude。
- `vitest.config.ts` と `vitest.integration.config.ts` の 2 系統に分離（`.claude/rules/testing.md` の棲み分け基準どおり）。
- E2E は `tests/e2e/` に Playwright（`playwright.config.ts:9` `testDir: './tests/e2e'`、`globalTeardown` 設定済）。
- 命名規約は `.claude/rules/testing.md` の「{ComponentName}.test.tsx」「api.integration.test.ts」と一致。

### MSW の使われ方
- `tests/setup.ts:6` `import { server } from '@/todoApp-submodule/mocks/server'` で submodule 側に MSW server を集約。`tests/setup.ts:60-66` で `server.listen({ onUnhandledRequest: 'error' })` → `resetHandlers()` → `close()` の標準シーケンス。
- 統合テスト (`tests/setup-integration.ts`) では MSW を意図的に使わず `Firebase Emulator` 直接通信（`setup-integration.ts:55-89`）。
- 開発環境の MSW 起動は `app/providers/MSWProvider.tsx:20-23` の dynamic import + `public/mockServiceWorker.js` で実行。submodule に handlers を寄せる構成で UT・dev・docs の三者がモックデータを共有している点はモノレポ的な強みになっている。

### テストカバレッジ範囲（不均衡）
- `find tests/features -name "*.test.*"` で 26 件。すべて `tests/features/todo/**` または `tests/features/utils/**`、`tests/features/libs/apis.test.ts`、`tests/features/shared/components/elements/Navigation/NavigationContents.test.tsx` に集中。
- `features/sign/{templates,components}`（5 ファイル）、`features/admin/templates`（1 ファイル）、`features/top/{templates,components}`（2 ファイル）、`features/shared/components/elements/{Icon,Modal/SignOutModal,heading/HeaderWrapper,heading/atoms/HeadingContents}`（5 ファイル）には対応するテストが 0 件。`.claude/rules/testing.md` の「カバレッジ目標: 100%」と現状は乖離。

### テスト説明文の表記統一
- `it(...)` 件数 504。表記内訳：
  - 「正常」を含む: 96 件（約 19%）— 例 `tests/features/libs/apis.test.ts:30` 「POSTリクエストが正常に実行される」、`tests/features/shared/.../NavigationContents.test.tsx:70` 「正常にレンダリングされる」。
  - 「正しく」を含む: 51 件（約 10%）— 例 `tests/features/utils/updateStatusUtils.test.ts:132` 「リストとTodoの更新が正しく実行される」。
  - 「適切に」を含む: 11 件（約 2%）— 例 `tests/features/shared/.../NavigationContents.test.tsx:95` 「長いメールアドレスも適切に表示される」。
  - 残り約 70% は「〜される」「〜を返す」「〜エラーがスローされる」等、規約に明示されない多様な表現。
- `.claude/rules/testing.md` のサンプルは「正常にレンダリングされる」「正常に動作する」「正常に処理される」を提示しているが、現状は方針が部分的にしか守られていない。`tests/features/utils/textUtils.test.ts:6,11,22` のように一切「正常」表記を使わないファイルもある。

## 良いパターン（注目実装）

1. **submodule によるモックデータの一元化**：`tests/test-utils.tsx:10-12` で `@/todoApp-submodule/mocks/data/{todos,lists,user}` を読み込み、Firestore `Timestamp` への変換を `convertMockTodosToTimestamp`（`test-utils.tsx:49-55`）で統一。`app/api/auth/server-login/route.ts:31-53` の dev モック認証も同じ submodule 由来データを参照しており、UT・統合・dev・docs が同じ正規データセットを共有している。
2. **MSWProvider の Hydration 安全な dynamic import**：`app/providers/MSWProvider.tsx:9-31` で `useEffect` 内の dynamic import + `mockingEnabled` 制御により、本番バンドルから MSW を完全に除外しつつ開発環境では初期化完了まで子要素を遅延描画している。`app/layout.tsx:33-37` の Provider 階層と組み合わせて副作用を最小化。
3. **環境別認証フローの整理**：`auth.ts`（NextAuth Credentials）→ `app/api/auth/server-login/route.ts`（モック分岐 + Firebase Auth REST + Zod 応答検証）→ `app/api/auth/refresh/route.ts`（`AuthDecodedTokenSchema.safeParse`）の 3 段で、本番・Docker emulator・dev モックの三環境を 1 ファイル内 `if` 分岐で吸収。`server-login/route.ts:6-12` の `getFirebaseAdmin()` で `NEXT_PUBLIC_API_MOCKING==='enabled'` 時は Firebase Admin の import 自体をスキップする工夫が良質。
4. **テスト規約の明文化**：`.claude/rules/testing.md` に UT/IT/E2E 棲み分け表、describe テンプレート（「レンダリング」「インタラクション」「エラーハンドリング」）、データ一貫性ルール、よく使うパターンまでセットされており、レビュー基準が暗黙知化していない。
5. **楽観的更新 + ロールバックパターンの定型化**：`features/todo/hooks/useTodos.ts:84-104`（delete）、`useTodos.ts:130-156`（toggle）、`features/todo/hooks/useLists.ts:109-143`（drag end）、`useLists.ts:156-200`（button move）で `previousXxx` 退避→楽観的 setState→ API 失敗時に巻き戻し→`showError(ERROR_MESSAGES.X)` という同一テンプレートが採用されている。
6. **直近コミットの方向性**：`develop-v2` の最新は CI/skill 整備（`8fe8080` react-doctor、`08f88b9` パイプラインスキル、`34ff34c` protobufjs 脆弱性修正）に集中しており、開発支援基盤を継続的に拡充する流れが見える。

## 改善提案（来週のフォーカス）

1. **API ルートに Zod バリデーションを導入し `.claude/rules/app.md` の規約と整合させる**
   - 対象: `app/api/(general)/todos/route.ts:50,109,215`、`app/api/(general)/lists/route.ts:44,92,186`、`app/api/(general)/user/route.ts:7`、`app/api/(admin)/users/route.ts`、`app/api/(admin)/users/[userId]/route.ts:6` ほか配下。
   - 現状ハンドラは `withAuthenticatedUser<TodoPayload<'POST'>, TodoResponse<'POST'>>` のジェネリクスのみで、`withAuth.ts` の `await clonedReq.json()` 戻り値はランタイム未検証。`data/validatedData.ts` を `TodoPayloadSchema` 等まで拡張し、`auth.ts:36` 同様 `safeParse` で 400 を返す形に揃える。あわせて `app/api/(general)/user/route.ts:27-32`、`app/api/(admin)/users/[userId]/route.ts:30-44` の `as 'ADMIN' | 'USER'`、`as { toMillis: () => number }` キャストも Zod の `z.enum(['ADMIN','USER'])`、`z.custom()` ベースに置換すると、Firestore データ崩れが API 層で必ず止まる。

2. **`features/todo` 以外の機能にテストを拡張し、`.claude/rules/testing.md` の 100% カバレッジ目標とのギャップを埋める**
   - 未テスト対象: `features/sign/templates/ContactWrapper.tsx`、`features/sign/components/elements/{PasswordField,MailField,SendButton,ValidationCheck}/*.tsx`、`features/admin/templates/AdminWrapper.tsx`、`features/top/templates/TopWrapper.tsx`、`features/shared/components/elements/{Icon/IconContents.tsx,Modal/SignOutModal.tsx,heading/HeaderWrapper.tsx,heading/atoms/HeadingContents.tsx}`。
   - `tests/test-utils.tsx` の `customRender`（`SessionProvider` + `TodoProvider` + `ThemeProvider` を内包）と submodule の `mockUser` データを既に持っているため、追加コストは比較的低い。優先順位は (1) 認証導線に近い `ContactWrapper.tsx`（フォーム/エラー/送信ロジック）、(2) 管理者導線の `AdminWrapper.tsx`、(3) shared モーダル `SignOutModal.tsx`。

3. **本番ログに残るセッション情報の出力を撤去し、テスト記述の表記を `.claude/rules/testing.md` のテンプレートに揃える**
   - `app/api/(general)/user/route.ts:10` の `console.log(\`sessionData:${JSON.stringify(session, null, 2)}\`)` は本番でもユーザー ID・メール・ロール等を毎回標準出力へ流す。デバッグ用として残置するなら `process.env.NODE_ENV === 'development'` でガードするか、削除して NextAuth の標準ログに委譲する。
   - 並行して、`it()` 504 件のうち約 81% が「正常に」テンプレートから外れている件は、まず `tests/features/utils/textUtils.test.ts:6,11,22` 等の utility 系から `'空文字列の場合は空の配列を返す'` → `'空文字列を渡した場合に空配列が正常に返る'` といった形へ揃える PR を起票し、残りはレビューで継続的に統一していく。`describe` のグルーピングも `.claude/rules/testing.md` の「レンダリング / インタラクション / エラーハンドリング」テンプレートに明示的に合わせると、新規テスト追加時の判断負荷が下がる。
