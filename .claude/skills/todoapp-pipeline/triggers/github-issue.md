# Trigger: GitHub Issue

GitHub Issue から NormalizedTask を構築する。Issue 内容を解析して bug / feature を自動振り分け。

## 入力形式

```bash
/todoapp-pipeline #123
/todoapp-pipeline https://github.com/sakatai11/todoApp-next/issues/123
/todoapp-pipeline issue: 123
```

## 処理フロー

### Step 1: Issue 取得

```bash
gh issue view <番号> --json number,title,body,labels,assignees,state
```

### Step 2: 種別判定

ラベルを最優先で判定する：

| ラベル                                | task.type                        |
| ------------------------------------- | -------------------------------- |
| `bug`, `bugfix`, `defect`             | `bugfix`                         |
| `feature`, `enhancement`, `feat`      | `feature`                        |
| `ui`, `design`, `ux`                  | `ui-change`                      |
| `performance`, `perf`, `optimization` | `optimization`                   |
| `documentation`, `docs`               | パイプライン対象外（人間に確認） |

ラベルが判定不能な場合は本文から判定：

- `## 再現手順` `## Steps to reproduce` 見出し → `bugfix`
- `## ユーザーストーリー` `## As a user` → `feature`
- `## スクショ` + UI言及 → `ui-change`
- 判定不能 → 人間に確認

### Step 3: フィールドマッピング

| Issue フィールド                         | NormalizedTask                 |
| ---------------------------------------- | ------------------------------ |
| `title`                                  | `task.title`                   |
| `body`                                   | `task.description`（適宜整形） |
| `number`                                 | `task.context.issueNumber`     |
| `body` の Acceptance Criteria セクション | `task.acceptanceCriteria`      |

Acceptance Criteria が本文にない場合は **必ず人間に質問**して追加する。bugfix の場合は再現手順が代わりになるが、それでも完了条件は明示が必要。

### Step 4: branchSlug 生成

```
<type>/<issue番号>-<title-kebab>
```

例：

```
feature/123-add-todo-tags
bugfix/124-fix-empty-dashboard
```

長すぎる場合は title 部分を50文字以内に切り詰める。

### Step 5: NormalizedTask 構築

```typescript
{
  type: <判定した type>,
  source: 'github-issue',
  title: <Issue title>,
  description: <Issue body を整形>,
  acceptanceCriteria: [...],
  context: {
    issueNumber: <番号>,
  },
  branchSlug: <type>/<番号>-<slug>,
}
```

### Step 6: トリガー固有の追加処理

bugfix の場合は `triggers/qa.md` の Step 2（再現手順抽出）も実行して `context.reproSteps` を埋める。

ui-change の場合は `triggers/ui-annotator.md` の Step 2（対象画面特定）も実行する。

### Step 7: SKILL.md Phase 1 へ戻る

## PR との関連付け

Phase 7 で PR 作成時に `Closes #<issueNumber>` を本文に含めるよう `todoapp-pr-creator` に指示する。これにより PR マージで Issue が自動クローズされる。

## エラー時

- Issue が存在しない / 権限がない: 即エラー報告
- Issue が closed: 「再オープンしますか？」と人間に確認
- ラベルなし & 本文も判定不能: 種別を人間に質問
