# Phase 7: Draft PR Creation [決定論]

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
