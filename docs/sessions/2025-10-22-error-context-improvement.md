# エラーハンドリング改善セッション

**日付**: 2025-10-22
**ブランチ**: `claude/feature/error-context-improvement-011CUMBohiBqnm1MHKva4Zun`
**PR**: #40

## 調査内容

### SSR vs SPA の検討

**質問**: `/api/todos` と `/api/lists` をSSRで取得する場合の懸念点

**調査結果**:
- 現在はクライアントサイドでSWRを使用してデータ取得
- SSR化の主な懸念点:
  1. 認証とセッション管理の複雑化
  2. TTFB（Time To First Byte）の増加
  3. ハイドレーション不一致のリスク
  4. キャッシュ戦略の問題
  5. リアルタイム性の低下

**結論**: SPAのまま維持することを推奨
- ユーザー固有データのためSEO不要
- インタラクティブなTodoアプリにはクライアント側フェッチが適切
- SWRによる自動再バリデーションが有効

### クライアントサイドでのデータ取得改善点

**改善項目**:
1. 楽観的更新のロールバック機能が無い → 実装
2. SWRとuseStateの二重管理 → 検討事項
3. エラーハンドリングの一貫性が無い → ErrorContext導入
4. SWR設定の改善余地 → 実装
5. パフォーマンス最適化の余地 → 依存配列改善

## 実装内容

### 1. ErrorContextの追加

**新規ファイル**:
- `features/todo/contexts/ErrorContext.tsx`
- `features/todo/components/elements/Error/ErrorSnackbar.tsx`

**機能**:
- グローバルなエラー管理
- Material-UIのSnackbarで統一的にエラー通知
- 5秒後に自動消去

```typescript
const { showError } = useError();
showError('Todoの削除に失敗しました');
```

### 2. バリデーションエラーとAPIエラーの分離

**変更内容**:
- `error` → `validationError` に名前変更
- バリデーションエラー: ローカルstate（フォーム表示）
- APIエラー: グローバルErrorContext（Snackbar表示）

**使い分け**:
| エラー種類 | 管理場所 | 表示方法 |
|-----------|---------|---------|
| バリデーション | ローカルstate | フォームフィールド横 |
| APIエラー | ErrorContext | Snackbar |

### 3. 楽観的更新のロールバック実装

**対象操作**:
- useTodos: `addTodo`, `deleteTodo`, `toggleSelected`, `saveTodo`
- useLists: `addList`, `handleDragEnd`, `handleButtonMove`

**実装パターン**:
```typescript
const deleteTodo = async (id: string) => {
  const previousTodos = todos; // ロールバック用に保存

  try {
    setTodos(prev => prev.filter(todo => todo.id !== id)); // 楽観的更新
    await apiRequest('/api/todos', 'DELETE', { id });
  } catch (error) {
    setTodos(previousTodos); // ロールバック
    showError('Todoの削除に失敗しました');
  }
};
```

### 4. パフォーマンス最適化

**変更**:
- `editTodo`の依存配列から不要な`input`を削除
- 再レンダリングを最小化

**Before**:
```typescript
const editTodo = useCallback((id: string) => {
  // ...
}, [input, todos]);
```

**After**:
```typescript
const editTodo = useCallback((id: string) => {
  // ...
}, [todos]);
```

### 5. 型定義の更新

**types/common.ts**:
```typescript
export type BaseHookType<TInput, TError> = {
  input: TInput;
  validationError: TError;  // error → validationError
  setInput: (input: TInput) => void;
  setValidationError: (error: TError) => void;
};
```

## 変更されたファイル (11ファイル)

### 新規作成
- `features/todo/contexts/ErrorContext.tsx`
- `features/todo/components/elements/Error/ErrorSnackbar.tsx`

### 修正
- `features/todo/hooks/useTodos.ts`
- `features/todo/hooks/useLists.ts`
- `features/todo/contexts/TodoContext.tsx`
- `features/todo/components/elements/Add/AddTodo.tsx`
- `features/todo/components/elements/Add/AddList.tsx`
- `features/todo/components/elements/Modal/EditModal.tsx`
- `features/todo/components/elements/Status/StatusPullList.tsx`
- `types/common.ts`
- `types/components.ts`

## メリット

✅ **統一的なUX**: すべてのAPIエラーが同じ場所・スタイルで表示
✅ **堅牢性**: APIエラー時に自動ロールバックでデータ整合性を維持
✅ **保守性**: エラー表示ロジックが1箇所に集約
✅ **明確な責務分離**: バリデーションとAPIエラーを明確に区別
✅ **パフォーマンス向上**: 不要な再レンダリングを削減

## Git操作

### ブランチ作成
```bash
git checkout -b claude/feature/error-context-improvement-011CUMBohiBqnm1MHKva4Zun origin/develop-v2
```

### コミット
```bash
git add -A
git commit -m "Improve error handling with unified ErrorContext and optimistic updates"
git push -u origin claude/feature/error-context-improvement-011CUMBohiBqnm1MHKva4Zun
```

### PR作成
- **方法**: GitHub API (curl)
- **PR番号**: #40
- **URL**: https://github.com/sakatai11/todoApp-next/pull/40

## テスト項目

- [ ] Todo追加時のバリデーションエラー表示
- [ ] Todo追加時のAPIエラー表示（Snackbar）
- [ ] Todo削除時のロールバック動作
- [ ] リスト並び替え時のロールバック動作
- [ ] エラーメッセージの自動消去（5秒）

## 技術的な学び

### GitHub Token設定
- Claude Code Web版で設定したtokenは環境変数としてアクセスできない
- `CLAUDE_CODE_OAUTH_TOKEN_FILE_DESCRIPTOR` はセキュリティ上直接アクセス不可
- curlでGitHub APIを使用する場合は、`GITHUB_TOKEN`環境変数を設定する必要がある

### Claude Codeでの開発フロー
1. develop-v2からブランチ作成
2. コード変更・実装
3. コミット（末尾に`🤖 Generated with Claude Code`を追加）
4. プッシュ（ブランチ名は`claude/`で始まり、セッションIDで終わる必要がある）
5. GitHub APIでPR作成

## 次のステップ

1. PRのレビュー
2. テスト項目の実行
3. develop-v2へのマージ
4. 本番デプロイ
