---
allowed-tools: Bash(git *), Bash(find *), Read(*), Write(*), Edit(*), Glob(*), Grep(*),
description: gitコミット履歴を基に/todoApp-submodule/docs配下の仕様書を更新・作成
---

gitのコミット履歴を確認し、変更されたファイルに対応する仕様書を更新または新規作成してください。

## 実行手順

### 1. コミット履歴と変更ファイルの確認

**⚠️ 重要: ベースブランチの優先順位を必ず確認してください**

コマンド実行前に、以下の優先順位でベースブランチを決定する必要があります：

1. **`develop-v2`** (最優先)
2. `main` (develop-v2がない場合)

この優先順位を無視して直接`main`を指定することは禁止です。

---

まず、`$ARGUMENTS`を解析してコミット範囲を決定してください：

```bash
# 引数の解析とコミット範囲の決定
ARG="$ARGUMENTS"

# 数字部分と-bフラグを抽出
COUNT=""
USE_BRANCH_MODE=false

if [[ "$ARG" =~ ^([0-9]+)[[:space:]]+-b$ ]]; then
  # "10 -b" の形式：数字 + ブランチモード
  COUNT="${BASH_REMATCH[1]}"
  USE_BRANCH_MODE=true
elif [[ "$ARG" =~ ^([0-9]+)$ ]]; then
  # 数字のみ
  COUNT="${BASH_REMATCH[1]}"
  USE_BRANCH_MODE=false
elif [ "$ARG" = "-b" ]; then
  # -b のみ
  USE_BRANCH_MODE=true
elif [ -z "$ARG" ]; then
  # 引数なし：デフォルト
  COUNT="5"
  USE_BRANCH_MODE=false
else
  # カスタム範囲指定（例: HEAD~10..HEAD）
  COMMIT_RANGE="$ARG"
  LOG_COUNT=10
fi

# ブランチモードまたは通常モードでコミット範囲を決定
if [ -n "$COUNT" ] || [ "$USE_BRANCH_MODE" = true ]; then
  if [ "$USE_BRANCH_MODE" = true ]; then
    # ブランチ分岐点を取得（develop-v2を優先、なければmain）
    BASE_BRANCH=$(git merge-base develop-v2 HEAD 2>/dev/null || git merge-base main HEAD 2>/dev/null)

    if [ -z "$BASE_BRANCH" ]; then
      echo "エラー: ベースブランチ (develop-v2/main) が見つかりません"
      exit 1
    fi

    if [ -n "$COUNT" ]; then
      # "10 -b" の形式：ブランチ分岐から最新N件
      COMMITS=$(git log --format=%H ${BASE_BRANCH}..HEAD | head -n $COUNT)

      if [ -z "$COMMITS" ]; then
        echo "エラー: ブランチ分岐後のコミットが見つかりません"
        exit 1
      fi

      OLDEST=$(echo "$COMMITS" | tail -n 1)
      COMMIT_RANGE="${OLDEST}^..HEAD"
      LOG_COUNT=$COUNT
    else
      # "-b" のみ：ブランチ分岐から全コミット
      COMMIT_RANGE="${BASE_BRANCH}..HEAD"
      LOG_COUNT=50
    fi
  else
    # 数字のみ：通常モードで直近N件
    COMMIT_RANGE="HEAD~${COUNT}..HEAD"
    LOG_COUNT=$((COUNT > 10 ? COUNT : 10))
  fi
fi

# コミット範囲の確認メッセージ
echo "📊 対象コミット範囲: ${COMMIT_RANGE}"
echo ""

# コミット履歴の表示
git log --oneline -${LOG_COUNT}

# 変更されたファイルの確認
git diff --name-only ${COMMIT_RANGE}
```

**オプション**:

- 引数なし（例: `/update-specs`）: デフォルトで直近5コミット（`HEAD~5..HEAD`）
- 数字のみ（例: `/update-specs 10`）: その数だけ直近のコミット（`HEAD~10..HEAD`）
- `-b`のみ（例: `/update-specs -b`）: ブランチ切ってからの全コミット（`develop-v2..HEAD` または `main..HEAD`）
- 数字 + `-b`（例: `/update-specs 10 -b`）: ブランチ切ってから最新10件のコミット
- カスタム範囲（例: `/update-specs HEAD~10..HEAD`）: 指定した範囲をそのまま使用

**ベースブランチの優先順位**:

1. `develop-v2` (最優先)
2. `main` (develop-v2がない場合)

### 2. 対象ファイルの分類

**仕様書が必要なファイル**:

- `app/**/*.ts(x)` - ページ、API、ライブラリ
- `features/**/*.ts(x)` - コンポーネント、フック、コンテキスト
- `types/**/*.ts` - 型定義
- `constants/**/*.ts` - 定数
- `scripts/**/*.ts` - スクリプト

**除外**: `tests/**/*.test.ts(x)`, `*.config.ts`, `.claude/**`

### 3. 仕様書のマッピング

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

### 4. 仕様書の更新・作成

#### 既存仕様書の確認

```bash
find todoApp-submodule/docs -name "*.md" -type f
```

#### ファイル内容の確認

- `git diff ${COMMIT_RANGE} <file-path>` で変更内容を確認（上記で決定したCOMMIT_RANGEを使用）
- `Read`ツールで現在の完全な内容を確認
- Serena MCPツール（`get_symbols_overview`, `find_symbol`）でコード構造を分析

#### 新規作成時のテンプレート

````markdown
# [ファイル名/機能名]

## 概要

このファイル/機能の目的と役割を簡潔に説明。

## ファイルパス

`<実装ファイルの相対パス>`

## 主要な機能

### 1. [機能名]

- **説明**:
- **使用例**:

## 型定義（該当する場合）

```typescript
// 主要な型定義
```

## 依存関係

- import元と使用箇所

## 変更履歴

- YYYY-MM-DD: [コミットメッセージ] (commit: <hash>)
````

#### 更新時の手順

1. 既存仕様書を読み取り
2. 変更内容を分析（機能追加/修正/削除/改善）
3. 該当セクションを更新
4. 変更履歴に追記

### 5. 実行結果の報告

完了後、以下をユーザーに報告：

```markdown
## 📊 更新サマリー

| カテゴリ       | 新規作成 | 更新 | 変更なし |
| -------------- | -------- | ---- | -------- |
| コンポーネント | X件      | Y件  | Z件      |
| フック         | X件      | Y件  | Z件      |
| その他         | X件      | Y件  | Z件      |

## 主な変更内容

- 新規作成: ファイル名と概要
- 更新: ファイル名と変更内容
- 注意が必要な項目
```

## 注意事項

- **⚠️ 必須**: ベースブランチの優先順位（develop-v2 → main）を必ず守ること。直接mainを指定することは禁止
- 既存の仕様書構造とフォーマットを維持
- 実装ファイルの現在の状態を正確に反映
- 変更履歴にコミットハッシュと日付を記録
- 日本語で記述（コード/APIパスは英語のまま）
- 重要な機能に焦点を当て、過度な詳細化は避ける

## 完了確認

- [ ] **ベースブランチの優先順位確認完了**（develop-v2 → main）
- [ ] 全変更ファイルの確認完了
- [ ] 仕様書の更新/作成完了
- [ ] 変更履歴の記録完了
- [ ] ユーザーへのサマリー報告完了
