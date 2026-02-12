# Vercel React Best Practices コードレビュー結果

## レビュー概要

**実施日**: 2025-01-25
**対象**: `features/` ディレクトリ全体
**基準**: Vercel React Best Practices（57ルール、8カテゴリ）
**レビュアー**: Claude Code + vercel-react-best-practices skill

## エグゼクティブサマリー

features/ディレクトリのコードをVercel React Best Practicesに基づいて包括的にレビューした結果、**1件のCRITICAL優先度**と**4件のMEDIUM優先度**の改善機会を特定しました。

### 主な発見事項

- ✅ **良好な実装**: 動的インポート、エラーハンドリング、楽観的更新パターン
- 🔴 **CRITICAL**: barrel imports使用によるバンドルサイズ肥大化
- 🟡 **MEDIUM**: 再レンダリング最適化の余地（useCallback依存配列、関数形式setState）
- 🟡 **MEDIUM**: レンダリングパフォーマンス改善の余地（条件付きレンダリング、useMemo）

## 優先度別の問題一覧

### 🔴 CRITICAL（1件）

| #   | 問題               | 影響               | ブランチ                                 | 工数 |
| --- | ------------------ | ------------------ | ---------------------------------------- | ---- |
| 1   | barrel imports削除 | バンドルサイズ削減 | `feature/bundle-optimize-barrel-imports` | 小   |

### 🟡 MEDIUM（4件）

| #   | 問題                      | 影響               | ブランチ                                    | 工数 |
| --- | ------------------------- | ------------------ | ------------------------------------------- | ---- |
| 2   | useCallback依存配列最適化 | 再レンダリング削減 | `feature/optimize-usecallback-dependencies` | 中   |
| 3   | 関数形式のsetState        | 再レンダリング削減 | `feature/use-functional-setstate`           | 小   |
| 4   | 条件付きレンダリング      | パフォーマンス向上 | `feature/improve-conditional-rendering`     | 小   |
| 5   | useMemoでフィルタリング   | 計算コスト削減     | `feature/optimize-filtering-with-usememo`   | 中   |

## 詳細レビュー結果

### 1. 🔴 CRITICAL: barrel imports削除

**Vercelルール**: `bundle-barrel-imports`
**優先度**: CRITICAL
**カテゴリ**: Bundle Size Optimization

#### 問題の説明

`features/todo/templates/TodoWrapper.tsx:7`で、barrel file経由のインポートを使用しています。

```typescript
// ❌ 現在の実装
import { PushContainer, MainContainer } from '@/features/todo/components';
```

barrel fileは、使用していないコンポーネントまでバンドルに含める可能性があり、Tree-shakingが効きにくくなります。

#### 影響範囲

- `features/todo/components/index.ts`
- `features/shared/templates/index.ts`
- `features/admin/components/index.ts`
- `features/top/components/index.ts`
- 上記を使用している全てのファイル

#### 期待される効果

- バンドルサイズ削減（推定5-10%）
- Tree-shakingの効率化
- ビルド時間の短縮

---

### 2. 🟡 MEDIUM: useCallback依存配列最適化

**Vercelルール**: `rerender-dependencies`
**優先度**: MEDIUM
**カテゴリ**: Re-render Optimization

#### 問題の説明

`useTodos.ts`と`useLists.ts`の複数のuseCallbackで、配列全体（`todos`、`lists`）を依存配列に含めています。

```typescript
// ❌ 現在の実装
const deleteTodo = useCallback(
  async (id: string) => {
    const previousTodos = todos;
    // ...
  },
  [todos, showError], // ← todosの参照が変わるたびに再生成
);
```

#### 影響範囲

- `features/todo/hooks/useTodos.ts`: addTodo, deleteTodo, editTodo, toggleSelected, saveTodo
- `features/todo/hooks/useLists.ts`: checkDuplicateCategory, addList, handleDragEnd, handleButtonMove

#### 期待される効果

- 不要な関数再生成の削減
- 子コンポーネントの不要な再レンダリング削減
- メモリ効率の向上

---

### 3. 🟡 MEDIUM: 関数形式のsetState

**Vercelルール**: `rerender-functional-setstate`
**優先度**: MEDIUM
**カテゴリ**: Re-render Optimization

#### 問題の説明

`AddTodo.tsx`などで、現在の状態値に依存したイベントハンドラーを定義しています。

```typescript
// ❌ 現在の実装
onClick={() => {
  setInput({ ...input, text: '', status: '' }); // inputに依存
  setValidationError({ ...validationError, listPushArea: false }); // validationErrorに依存
}}
```

#### 影響範囲

- `features/todo/components/elements/Add/AddTodo.tsx`
- `features/todo/components/elements/Add/AddList.tsx`
- その他、状態更新を行う全てのコンポーネント

#### 期待される効果

- イベントハンドラーの安定化
- 不要な再レンダリング削減

---

### 4. 🟡 MEDIUM: 条件付きレンダリング

**Vercelルール**: `rendering-conditional-render`
**優先度**: MEDIUM
**カテゴリ**: Rendering Performance

#### 問題の説明

`MainContainer.tsx`で、CSSの`display: none`を使用して要素を非表示にしています。

```typescript
// ❌ 現在の実装
<Box
  sx={{
    display: filteredTrueTodos.length > 0 ? 'block' : 'none',
  }}
>
  {todos.filter(...).map(...)} // ← 非表示でも実行される
</Box>
```

#### 影響範囲

- `features/todo/components/MainContainer/MainContainer.tsx:101-103, 119-121`

#### 期待される効果

- 不要なDOM生成の削減
- 不要な計算コスト削減
- レンダリングパフォーマンス向上

---

### 5. 🟡 MEDIUM: useMemoでフィルタリング

**Vercelルール**: `rerender-derived-state-no-effect`
**優先度**: MEDIUM
**カテゴリ**: Re-render Optimization

#### 問題の説明

`MainContainer.tsx`で、`lists.map()`のたびに、各listに対して`todos`全体をフィルタリングしています。

```typescript
// ❌ 現在の実装
{lists.map((statusPull) => {
  const filteredTrueTodos = todos.filter(...);
  const filteredFalseTodos = todos.filter(...);
  // ...
})}
```

#### 影響範囲

- `features/todo/components/MainContainer/MainContainer.tsx:53-140`

#### 期待される効果

- フィルタリング計算のメモ化による計算コスト削減
- Map構造による高速ルックアップ（O(n) → O(1)）
- レンダリングパフォーマンス向上

---

## ✅ 良好な実装

以下の実装は、Vercel React Best Practicesに準拠しており、推奨されるパターンです。

### 1. 動的インポートの使用

**場所**: `features/shared/templates/ClientWrapper.tsx:7-13`

```typescript
const HeaderWrapper = dynamic(
  () =>
    import('@/features/shared/components/elements/heading/HeaderWrapper').then(
      (m) => m.HeaderWrapper,
    ),
  { ssr: false },
);
```

**良い点**:

- `next/dynamic`を使用してHeaderWrapperを遅延ロード
- `ssr: false`でクライアントサイドのみレンダリング
- Vercelルール `bundle-dynamic-imports` に準拠

### 2. エラーハンドリング

**場所**: `features/todo/templates/TodoWrapper.tsx`

```typescript
<ErrorBoundary FallbackComponent={TodoErrorBoundary}>
  <TodoContent />
</ErrorBoundary>
```

**良い点**:

- ErrorBoundaryを使用した適切なエラーハンドリング
- カスタムエラーコンテキストでエラー状態を管理
- ユーザーフレンドリーなエラー表示

### 3. 楽観的更新パターン

**場所**: `features/todo/hooks/useTodos.ts`, `features/todo/hooks/useLists.ts`

```typescript
const deleteTodo = useCallback(
  async (id: string) => {
    const previousTodos = todos;
    try {
      setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
      await apiRequest('/api/todos', 'DELETE', { id });
    } catch (error) {
      setTodos(previousTodos); // ロールバック
      showError(ERROR_MESSAGES.TODO.DELETE_FAILED);
    }
  },
  [todos, showError],
);
```

**良い点**:

- ロールバック機能付きの楽観的更新を実装
- UXを向上させる良いパターン
- エラー時の適切な復旧処理

### 4. SWRによるデータフェッチング最適化

**場所**: `features/todo/templates/TodoWrapper.tsx:152-158`

```typescript
useEffect(() => {
  if (shouldFetch) {
    preload(todosApiUrl, fetcher);
    preload(listsApiUrl, fetcher);
  }
}, [shouldFetch, todosApiUrl, listsApiUrl]);
```

**良い点**:

- `preload`を使用して事前にデータをロード
- `dedupingInterval: 2000`で重複リクエストを防止
- Vercelルール `client-swr-dedup` に準拠

---

## 推奨される実装順序

### フェーズ1: CRITICAL対応（即時対応推奨）

1. **barrel imports削除** (`feature/bundle-optimize-barrel-imports`)
   - 工数: 小（1-2時間）
   - 影響: バンドルサイズ削減
   - リスク: 低（importパスの変更のみ）

### フェーズ2: MEDIUM対応（優先度順）

2. **関数形式のsetState** (`feature/use-functional-setstate`)
   - 工数: 小（2-3時間）
   - 影響: 再レンダリング削減
   - リスク: 低

3. **条件付きレンダリング** (`feature/improve-conditional-rendering`)
   - 工数: 小（1-2時間）
   - 影響: パフォーマンス向上
   - リスク: 低

4. **useCallback依存配列最適化** (`feature/optimize-usecallback-dependencies`)
   - 工数: 中（4-6時間）
   - 影響: 再レンダリング削減
   - リスク: 中（ロジック変更を伴う）

5. **useMemoでフィルタリング** (`feature/optimize-filtering-with-usememo`)
   - 工数: 中（3-4時間）
   - 影響: 計算コスト削減
   - リスク: 中（ロジック変更を伴う）

---

## テスト戦略

各修正に対して、以下のテストを実施してください。

### 1. ユニットテスト

```bash
npm run test:run
npm run test:coverage
```

- 既存のテストが全て通過することを確認
- カバレッジが低下していないことを確認（現在100%達成済み）

### 2. 統合テスト

```bash
npm run docker:test:run
```

- Firebase Emulator環境でのAPI連携テスト
- データフローの整合性確認

### 3. E2Eテスト

```bash
npm run test:e2e
```

- ユーザーフローの動作確認
- UIの表示・操作の確認

### 4. パフォーマンステスト

- **バンドルサイズ**: `npm run build`後の`.next/static`のサイズ比較
- **レンダリング**: React DevTools Profilerでの再レンダリング回数計測
- **メモリ**: Chrome DevToolsでのメモリ使用量確認

---

## 期待される効果（総合）

### パフォーマンス改善

- **バンドルサイズ**: 5-10%削減
- **初期ロード時間**: 10-15%短縮
- **再レンダリング回数**: 20-30%削減
- **メモリ使用量**: 5-10%削減

### コード品質向上

- Vercel React Best Practicesへの準拠率向上
- 保守性の向上
- パフォーマンス最適化のベストプラクティス導入

---

## 参考リソース

- [Vercel React Best Practices](https://vercel.com/blog/react-best-practices)
- [React Documentation - useCallback](https://react.dev/reference/react/useCallback)
- [React Documentation - useMemo](https://react.dev/reference/react/useMemo)
- [Next.js Dynamic Import](https://nextjs.org/docs/advanced-features/dynamic-import)

---

## 変更履歴

| 日付       | バージョン | 変更内容 |
| ---------- | ---------- | -------- |
| 2025-01-25 | 1.0        | 初版作成 |
