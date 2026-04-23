# Trigger: spec.md

仕様書ファイルから NormalizedTask を構築する。

## 入力形式

ファイルパス（絶対 or プロジェクトルート相対）。

```
/todoapp-pipeline specs/feature-add-tag.md
/todoapp-pipeline /Users/.../specs/foo.md
```

## 期待する spec.md フォーマット

最低限必要な項目（不足時は人間に質問して埋める）：

```markdown
---
type: spec
title: タグ機能を追加する
branchSlug: add-tag-to-todo
---

# Spec: タグ機能を追加する

## Why

ユーザーがTodoを分類できるようにする

## What

- Todoにタグを複数つけられる
- タグでフィルタできる

## Acceptance Criteria

- [ ] Todo作成時にタグ入力UIが表示される
- [ ] タグでフィルタできる
- [ ] タグはユーザーごとに保存される

## Out of Scope

- タグの色設定
- タグの並び替え
```

## 処理フロー

### Step 1: ファイル読み込み

```
Read で ファイルパスを読む
```

### Step 2: フロントマター解析

YAML フロントマターから `type`, `title`, `branchSlug` を抽出。

| フロントマター      | NormalizedTask への対応 |
| ------------------- | ----------------------- |
| `type: spec`        | `task.type = 'feature'` |
| `type: enhancement` | `task.type = 'feature'` |
| `title`             | `task.title`            |
| `branchSlug`        | `task.branchSlug`       |

フロントマターがない場合：

- `# Spec:` または `# Feature:` 見出しから title を抽出
- branchSlug は title から自動生成（kebab-case化）。生成案を人間に確認

### Step 3: セクション抽出

| セクション               | NormalizedTask への対応             |
| ------------------------ | ----------------------------------- |
| `## Why` + `## What`     | `task.description` に統合           |
| `## Acceptance Criteria` | `task.acceptanceCriteria`（配列）   |
| `## Out of Scope`        | `task.description` に注記として追加 |

### Step 4: NormalizedTask 構築

```typescript
{
  type: 'feature',
  source: 'spec',
  title: <抽出したtitle>,
  description: `## Why\n${why}\n\n## What\n${what}\n\n## Out of Scope\n${outOfScope}`,
  acceptanceCriteria: [...],
  context: {
    specPath: '<元のファイルパス>',
  },
  branchSlug: <抽出 or 生成>,
}
```

### Step 5: SKILL.md の Phase 1 へ戻る

構築した NormalizedTask を持って Phase 1 (Spec Quality Gate) へ。

## エラー時

- ファイルが存在しない: 即エラー報告
- フォーマットが大きく崩れている: 内容を要約して人間に質問（「これは spec として扱っていいですか？」）
- Acceptance Criteria が空: 人間に追加を求める（パイプラインの完了判定に必須）
