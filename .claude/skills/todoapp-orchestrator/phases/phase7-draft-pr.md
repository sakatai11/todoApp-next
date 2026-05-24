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

[Y] 作成する  [N] キャンセル  [E] 内容を編集してから作成
```

- **Y**: 7-2 へ進む
- **N**: パイプラインを中断。ブランチとコミットはそのまま残す
- **E**: ユーザーが修正したい箇所を教えてもらい、反映してから再提示

## 7-2: PR 作成

```text
Skill ツールで skill: "todoapp-pr-creator" を起動
```

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
