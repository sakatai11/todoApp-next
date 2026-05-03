# ファイルと仕様書のマッピングルール

## 仕様書が必要なファイル

以下のファイルは仕様書の更新・作成対象：

- `app/**/*.ts(x)` - ページ、API、ライブラリ
- `features/**/*.ts(x)` - コンポーネント、フック、コンテキスト
- `types/**/*.ts` - 型定義
- `constants/**/*.ts` - 定数
- `scripts/**/*.ts` - スクリプト

## 除外ファイル

以下は仕様書不要：

- `tests/**/*.test.ts(x)`
- `*.config.ts`
- `.claude/**`

## マッピングルール

| 実装ファイル                                                | 仕様書パス                                                           |
| ----------------------------------------------------------- | -------------------------------------------------------------------- |
| `app/(auth)/signin/page.tsx`                                | `todoApp-submodule/docs/app/サインインページ.md`                     |
| `app/api/(general)/todos/route.ts`                          | `todoApp-submodule/docs/app/api/general/todosAPI.md`                 |
| `features/todo/hooks/useTodos.ts`                           | `todoApp-submodule/docs/features/todo/hooks/useTodos.md`             |
| `features/todo/contexts/TodoContext.tsx`                    | `todoApp-submodule/docs/features/todo/contexts/TodoContext.md`       |
| `features/todo/components/elements/Error/ErrorSnackbar.tsx` | `todoApp-submodule/docs/features/todo/components/components-spec.md` |
| `types/todos.ts`                                            | `todoApp-submodule/docs/types/todos.md`                              |
| `constants/errorMessages.ts`                                | `todoApp-submodule/docs/constants/errorMessages.md`                  |

**注意**: 小規模コンポーネントは`components-spec.md`にまとめ、大規模なものは個別ファイルを作成
