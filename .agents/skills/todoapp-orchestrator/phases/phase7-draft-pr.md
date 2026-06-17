# Phase 7: Draft PR Creation [人間承認 → 決定論]

## 7-1: PR 内容の提示と承認

PR を作成する前に、以下の内容をユーザーに提示して確認を取る。

```text
以下の内容で Draft PR を作成します。よいですか？

## タイトル
<NormalizedTask.title から生成した PR タイトル>

## ターゲットブランチ
<base-branch> ← <current-branch>

## Summary
<NormalizedTask.description のサマリー>

## Acceptance Criteria
- [ ] <NormalizedTask.acceptanceCriteria>

## Pipeline Log
- Phase 4 Quality Gate: ✓ PASS
- Phase 5 Code Review: Critical 0 / High <件数> / Medium/Low <件数>

（注: PR 本文ではより詳細な形式で記載されます）

[Y] 作成する  [N] キャンセル  [E] 内容を編集してから作成
```

- **Y**: 7-2 へ進む
- **N**: パイプラインを中断。ブランチとコミットはそのまま残す
- **E**: ユーザーに「どの項目を修正しますか？（タイトル/Summary/AC）」と尋ね、修正内容を反映後、更新されたプレビューを再提示して `Y/N/E` を確認する。`E` が選ばれた場合は同手順を繰り返す。修正された内容は 7-2 のスキル起動時の引数に反映させる

## 7-2: PR 作成

```text
Skill ツールで skill: "todoapp-pr-creator" を起動（引数に draft: true を指定）
```

`references/normalized-task.ts` の `DraftPullRequestPlan` に相当する値として、`draft: true` / `baseBranch` / `headBranch` / `title` / `closesIssueNumber` を確定してから渡す。

PR 本文には以下を含めるよう指示する：

```markdown
## Summary

<NormalizedTask.description のサマリー>

## Trigger

<source>: <context の該当情報>

## Acceptance Criteria

- [ ] <NormalizedTask.acceptanceCriteria>

## Pipeline Log

- Phase 4 Quality Gate: ✓ PASS
- Phase 5 Code Review:
  - Critical: 0
  - High: <件数>（対応: <ユーザー判断>）
  - Medium/Low: <件数>

## Test plan

- [ ] <factory が記録したテスト手順>
```

**Draft フラグ必須**: `gh pr create --draft ...`
