# Subagent Contracts

`todoapp-backlog-loop` は制御プレーンを親エージェントに残し、調査・実装・検証の重い作業だけを
サブエージェントまたは既存スキルへ委譲する。

親エージェントが保持する責務:

- runner 制御
- `.claude/state/` の読み書き
- item_id の重複排除
- dirty tree / branch / gh auth の preflight
- Draft PR 作成可否の最終判断
- `LOOP_RESULT: STOP|CONTINUE|BLOCKED` の最終出力

サブエージェントは `.claude/state/` を更新しない。必要な状態変更は、以下の戻り値を受け取った親が行う。

## Triage Analyst

候補収集とスコアリングだけを任せる。実装、PR作成、状態更新はしない。

推奨委譲先:

- `.claude/agents/loop-triage-analyst.md`

入力:

```yaml
item:
  last_run: '<YYYY-MM-DD>'
  processed_item_ids:
    - '<item_id>'
  inbox_item_ids:
    - '<item_id>'
  open_draft_pr_item_ids:
    - '<item_id>'
  max_items: '<1|2>'
```

戻り値:

```yaml
triage_result:
  selected:
    - item_id: 'issue:123'
      type: 'issue|ci|discovery'
      score: 80
      route: 'todoapp-orchestrator|fix-security-ci|triage-inbox'
      auto_processable: true
      reason: '具体的な再現手順と完了条件がある'
      source_url: 'https://github.com/...'
  excluded:
    - item_id: 'ci:security-review:123456'
      reason: 'latest run succeeded'
  inbox_candidates:
    - item_id: 'issue:124'
      reason: '受け入れ条件が曖昧'
  next_signal_hint: 'STOP|CONTINUE|BLOCKED'
```

親の判定:

- `selected` が空で `inbox_candidates` のみなら、親が inbox に追記して `STOP`。
- `selected` に自動処理可能候補があれば Phase 3 へ進む。
- gh / network / git log が実行不能なら `BLOCKED`。

## Creator

実装、テスト、コミットまでを任せる。PR作成、loop state 更新、最終 `LOOP_RESULT` はしない。

推奨委譲先:

- `fix-security-ci`
- `todoapp-orchestrator`

入力:

```yaml
item_id: '<item_id>'
source_url: '<issue or run url>'
route: '<todoapp-orchestrator|fix-security-ci>'
constraints:
  - 'Phase 5 Cross-Model Review は実行しない'
  - 'Phase 7 Draft PR Creation は実行しない'
  - 'merge / Issue close / branch delete はしない'
  - '.env / secrets は読まない'
```

戻り値:

```yaml
creator_result:
  item_id: 'issue:123'
  status: 'completed|needs_human|failed'
  branch: 'feature/...'
  commit_sha: 'abcdef0'
  changed_files:
    - 'features/...'
  verification_commands:
    - 'npm run test:run -- ...'
  human_input_required: false
  summary: '...'
  notes:
    - '...'
```

親の判定:

- `status=completed` かつ `branch` / `commit_sha` があれば Phase 4 へ進む。
- `human_input_required=true` または `status=needs_human` は inbox に記録し、PRを作らない。
- `status=failed` は状況に応じて inbox または `BLOCKED`。

## Verifier

creator と独立した観点で差分を検証する。修正はしない。PR作成、loop state 更新、最終
`LOOP_RESULT` はしない。

推奨委譲先:

- `code-review`
- `.claude/agents/security-reviewer.md`
- `.claude/agents/api-design-reviewer.md`
- `.claude/agents/frontend-pattern-reviewer.md`
- `.claude/agents/accessibility-reviewer.md`
- `.claude/agents/performance-reviewer.md`
- `.claude/agents/code-quality-reviewer.md`

入力:

```yaml
item_id: '<item_id>'
branch: '<creator branch>'
base: 'develop-v2'
diff_scope: 'develop-v2...HEAD'
creator_summary: '<summary>'
changed_files:
  - '<path>'
```

戻り値:

```yaml
verifier_result:
  item_id: 'issue:123'
  verdict: 'pass|conditional|reject|blocked'
  critical_high_count: 0
  medium_low_notes:
    - '...'
  required_fixes:
    - severity: 'Critical|High|Medium|Low'
      file: 'features/...'
      issue: '...'
      recommendation: '...'
  commands_reviewed:
    - 'npm run test:run -- ...'
  summary: '...'
```

親の判定:

- `pass`: Phase 5 へ進む。
- `conditional`: Phase 5 へ進み、PR本文に `medium_low_notes` を書く。
- `reject`: creator に 1 回だけ修正依頼し、再 verifier。
- 再 verifier でも `reject` または `blocked`: inbox に記録し、PRを作らない。

## PR Creator

Draft PR 作成だけを任せる。Ready 化、merge、Issue close はしない。

推奨委譲先:

- `todoapp-pr-creator`

戻り値:

```yaml
pr_result:
  item_id: 'issue:123'
  status: 'created|failed'
  pr_url: 'https://github.com/...'
  pr_number: 123
  draft: true
  branch: 'feature/...'
```

親の判定:

- `status=created` なら `loop-state.md` と `verification-log.md` を更新する。
- `status=failed` なら inbox に環境異常として記録し、必要に応じて `BLOCKED`。
