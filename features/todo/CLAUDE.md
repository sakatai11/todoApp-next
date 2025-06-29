# Todo機能ガイドライン

## 全体情報参照

**重要**: プロジェクト全体の方針は `CLAUDE.md`（プロジェクトルート）を参照してください。
このファイルはTodo機能固有の技術的詳細に特化しています。

## 仕様書参照

**詳細仕様**: 実装の詳細仕様は以下のドキュメントを参照してください：

- `@todoApp-submodule/docs/features/todo/contexts/TodoContext.md` - Context仕様
- `@todoApp-submodule/docs/features/todo/hooks/useTodos.md` - useTodosフック仕様
- `@todoApp-submodule/docs/features/todo/hooks/useLists.md` - useListsフック仕様
- `@todoApp-submodule/docs/features/todo/hooks/useDeleteList.md` - useDeleteListフック仕様
- `@todoApp-submodule/docs/features/todo/hooks/useUpdateStatusAndCategory.md` - useUpdateStatusAndCategoryフック仕様
- `@todoApp-submodule/docs/features/todo/components/components-spec.md` - 全コンポーネント仕様
- `@todoApp-submodule/docs/features/todo/templates/TodoWrapper.md` - TodoWrapperテンプレート仕様

## 機能構造

```
features/todo/
├── contexts/TodoContext.tsx     # 状態管理
├── hooks/                       # 4つのカスタムフック
├── components/                  # UI コンポーネント
│   ├── MainContainer/          # メインレイアウト
│   ├── PushContainer/          # 新規追加ボタン
│   └── elements/               # 11個のUI要素
├── dnd/SortableItem.tsx        # ドラッグ&ドロップ
└── templates/TodoWrapper.tsx    # ページテンプレート
```

## 開発原則

### 状態管理

- **TodoContext必須**: 全てのTodo関連操作はTodoContextを使用
- **useSWR**: 初期データ取得（TodoWrapperでのみ使用）
- **楽観的更新**: UX向上のため即座にUI更新、API呼び出しは非同期
- **エラーハンドリング**: 各機能別にエラー状態を分離管理

### コンポーネント開発

- **MUI + Tailwind**: MUIをベースにTailwindで調整
- **React.memo**: 不要な再レンダリングを防止
- **レスポンシブ**: モバイル対応（@media max-width: 767px）

### API連携

- **エンドポイント**: `/api/(general)/todos/` と `/api/(general)/lists/`
- **初期データ**: useSWRで初期データ取得（TodoWrapper）
- **バリデーション**: Zodスキーマで全リクエスト/レスポンス検証
- **認証**: NextAuth.jsトークンで認証

## 重要な実装パターン

### カスタムフック使用

```typescript
const { todoHooks, listHooks, deleteListHooks } = useTodoContext();
```

### エラー状態

- `listPushArea`: Todo追加エラー
- `listModalArea`: Todo編集エラー
- `addListNull`: リスト名空エラー
- `addListSame`: リスト名重複エラー

### ドラッグ&ドロップ

- `@dnd-kit/core`使用
- `arrayMove`で配列並び替え
- サーバー同期必須

### 実際のデータ更新パターン

```typescript
// useStateベースの楽観的更新（useTodos.ts）
const addTodo = async (newTodo: Omit<TodoListProps, 'id'>) => {
  try {
    // 1. API呼び出し
    const result = await apiRequest('/api/todos', 'POST', newTodo);
    // 2. 成功時のローカル状態更新
    setTodos((prevTodos) => [...prevTodos, result]);
  } catch (error) {
    // エラーハンドリング
    setError(error.message);
    throw error;
  }
};

// 削除時の楽観的更新
const deleteTodo = async (id: string) => {
  // 削除対象を保存（ロールバック用）
  const todoToDelete = todos.find(todo => todo.id === id);
  
  try {
    // 1. 即座にUI更新（楽観的更新）
    setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
    // 2. API呼び出し
    await apiRequest('/api/todos', 'DELETE', { id });
  } catch (error) {
    // 3. エラー時はロールバック
    if (todoToDelete) {
      setTodos((prevTodos) => [...prevTodos, todoToDelete]);
    }
    setError(error.message);
    throw error;
  }
};
```

### useSWR使用箇所

```typescript
// TodoWrapper.tsx - 初期データ取得のみ
const { data, error, isLoading } = useSWR<DataProps>(
  '/api/dashboards',
  fetcher,
  {
    revalidateOnMount: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    suspense: false,
    shouldRetryOnError: false,
  },
);

// データ取得完了後、TodoProviderに初期データを渡す
if (isLoading || !data || !data.contents) return <TodosLoading />;
if (error) return <ErrorDisplay message={error.message} />;

const { contents } = data;
const { todos, lists } = contents;

<TodoProvider initialTodos={todos} initialLists={lists}>
  <Box>
    <PushContainer />
    <MainContainer />
  </Box>
</TodoProvider>
```

## テスト要件

- **100%カバレッジ**: 全フック・コンポーネント
- **MSW**: API モッキング統一
- **テストパターン**: 楽観的更新、エラーハンドリング、ドラッグ&ドロップ
