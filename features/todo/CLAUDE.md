# Todo機能ガイドライン

## 全体情報参照

**重要**: プロジェクト全体の方針は `CLAUDE.md`（プロジェクトルート）を参照してください。
このファイルはTodo機能固有の技術的詳細に特化しています。

## 仕様書参照

**詳細仕様**: 実装の詳細仕様は以下のドキュメントを参照してください：

- `@todoApp-submodule/docs/features/todo/TodoContext.md` - Context仕様
- `@todoApp-submodule/docs/features/todo/useTodos.md` - useTodosフック仕様
- `@todoApp-submodule/docs/features/todo/useLists.md` - useListsフック仕様
- `@todoApp-submodule/docs/features/todo/components/components-spec.md` - 全コンポーネント仕様

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
const addTodo = async () => {
  // 1. API呼び出し
  const result = await apiRequest('/api/todos', 'POST', newTodo);
  // 2. ローカル状態更新
  setTodos((prevTodos) => [...prevTodos, result]);
}

// 削除時の即座更新
const deleteTodo = async (id: string) => {
  // 1. 即座にUI更新
  setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
  // 2. API呼び出し
  await apiRequest('/api/todos', 'DELETE', { id });
}
```

### useSWR使用箇所
```typescript
// TodoWrapper.tsx - 初期データ取得のみ
const { data, error, isLoading } = useSWR('/api/dashboards', fetcher);
// TodoProviderに初期データを渡す
<TodoProvider initialTodos={todos} initialLists={lists}>
```

### mutate使用パターン（将来の改良案）

#### 基本的なmutate使用方法
```typescript
import useSWR, { mutate } from 'swr'

const { data, mutate: boundMutate } = useSWR('/api/dashboards', fetcher)

// 楽観的更新パターン
const addTodoWithMutate = async (newTodo) => {
  const currentData = data?.contents || { todos: [], lists: [] }
  const optimisticData = {
    contents: {
      ...currentData,
      todos: [...currentData.todos, { ...newTodo, id: 'temp-id' }]
    }
  }
  
  try {
    // 1. 即座にUI更新（再検証なし）
    await boundMutate(optimisticData, false)
    
    // 2. API呼び出し
    const result = await apiRequest('/api/todos', 'POST', newTodo)
    
    // 3. 成功時：正しいデータで更新
    const finalData = {
      contents: {
        ...currentData,
        todos: [...currentData.todos, result]
      }
    }
    await boundMutate(finalData, false)
    
  } catch (error) {
    // 4. エラー時：元のデータに復元
    boundMutate(data, false)
    throw error
  }
}
```

#### 現在の実装 vs mutate実装の比較

| 項目 | 現在の実装 | mutate使用時 |
|------|------------|--------------|
| 状態管理 | useState | SWRキャッシュ + useState |
| データ同期 | 手動 | 自動（mutate） |
| 複数コンポーネント | Context経由 | SWRキャッシュ共有 |
| エラー処理 | 手動ロールバック | mutateでロールバック |
| 再検証 | なし | 自動・手動選択可能 |

#### mutate導入時の改良案
```typescript
// TodoWrapper.tsx改良案
const { data, error, isLoading, mutate } = useSWR('/api/dashboards', fetcher)

<TodoProvider 
  initialTodos={todos} 
  initialLists={lists}
  swrMutate={mutate} // mutate関数を渡す
>

// useTodos.ts改良案
export const useTodos = (initialTodos, swrMutate) => {
  const addTodo = async () => {
    // SWRキャッシュも楽観的更新
    if (swrMutate) {
      await swrMutate(optimisticData, false)
    }
    
    // 既存の処理 + SWRキャッシュ更新
    const result = await apiRequest('/api/todos', 'POST', newTodo)
    setTodos(prev => [...prev, result])
    
    if (swrMutate) {
      swrMutate(finalData, false)
    }
  }
}
```

#### 使い分けガイドライン
- **現在の実装で十分**: 単一ページアプリ、シンプルな状態管理
- **mutate推奨**: 複数ページでのデータ共有、複雑な楽観的更新
- **移行時期**: パフォーマンス問題やデータ同期の複雑さが増した時

## テスト要件

- **100%カバレッジ**: 全フック・コンポーネント
- **MSW**: API モッキング統一
- **テストパターン**: 楽観的更新、エラーハンドリング、ドラッグ&ドロップ
