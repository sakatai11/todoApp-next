# Todo機能ガイドライン

## 仕様書参照

**重要**: 実装の詳細仕様は以下のドキュメントを参照してください：
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
- **楽観的更新**: UX向上のため即座にUI更新、API呼び出しは非同期
- **エラーハンドリング**: 各機能別にエラー状態を分離管理

### コンポーネント開発
- **MUI + Tailwind**: MUIをベースにTailwindで調整
- **React.memo**: 不要な再レンダリングを防止
- **レスポンシブ**: モバイル対応（@media max-width: 767px）

### API連携
- **エンドポイント**: `/api/(general)/todos/` と `/api/(general)/lists/`
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

## テスト要件

- **100%カバレッジ**: 全フック・コンポーネント
- **MSW**: API モッキング統一
- **テストパターン**: 楽観的更新、エラーハンドリング、ドラッグ&ドロップ