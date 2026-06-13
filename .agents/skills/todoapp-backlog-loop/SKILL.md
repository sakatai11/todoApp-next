---
name: todoapp-backlog-loop
description: |-
  todoApp-next の backlog / CI / issue を対象に、Loop Engineering の heartbeat を 1 サイクルだけ実行するスキル。
  状態読込、triage、優先順位付け、既存スキルへの実装委譲、独立 verifier、Draft PR 作成、状態更新までを扱う。
  内部で無期限に回り続けない。継続が必要な場合は最後に LOOP_RESULT: CONTINUE を出し、cron や外側の loop runner に次サイクルを任せる。

  使うべき状況: ユーザーが「ループを回して」「/todoapp-backlog-loop」「todoApp の backlog loop を実行して」と言った時。
  引数:
    --dry-run: Phase 2 の選択結果を表示して終了。状態ファイル更新、実装、PR作成は行わない。
    --max-items=N: このサイクルで着手する最大件数。未指定時は 1、最大 2。

  使わない状況: 特定タスクの実装依頼、レビューのみ、PR作成のみ、課題発掘のみ。
---

# todoApp Loop Heartbeat

このスキルは「自律開発を永遠に走らせるもの」ではなく、**安全に中断可能な 1 heartbeat** を定義する。
継続制御はスキル外に置く。これにより、停止不能ループ、レビュー待ちPRの大量作成、状態の二重更新を避ける。

## 自律実行（外部 runner）

「タスクが尽きるまで回し続ける」自律性は、スキル内部のループではなく外部 runner で実現する。
`scripts/loop-runner.sh` が `LOOP_RESULT` を読み、最大サイクル数・サイクル間インターバル・
コスト上限・ブランチ/クリーン検証・`BLOCKED` 即停止というサーキットブレーカー付きで次サイクルを起動する。

```bash
# 既定（最大5サイクル / 60s間隔）で自律実行
.agents/skills/todoapp-backlog-loop/scripts/loop-runner.sh

# 1サイクルだけ選択結果を確認（状態を変更しない）
.agents/skills/todoapp-backlog-loop/scripts/loop-runner.sh --dry-run
```

設定・セーフガード・終了コード・cron 運用の詳細は `references/runner.md` を参照。
運用開始前の最小確認は `references/runbook.md`、状態ファイルの初期形は `references/state-templates.md` を参照。
サブエージェントや既存スキルへ委譲する場合の入出力契約は `references/subagent-contracts.md` を参照。
runner の制御だけを確認する場合は `scripts/test-loop-runner.sh` を実行する。

## Principles

- **1サイクルで終わる**: どの結果でも最後に `LOOP_RESULT: STOP|CONTINUE|BLOCKED` を出して終了する。
- **状態を先に読む**: `.claude/state/` を読み、処理済み、inbox、進行中、繰越を突合してから候補を選ぶ。
- **dirty tree では新規着手しない**: ユーザー作業を壊さない。既存の進行中項目の状態確認だけ行う。
- **creator と verifier を分離する**: 実装側の自己評価をPR条件にしない。`code-review` を独立ゲートとして使う。
- **PR は Draft のみ**: Ready 化、merge、Issue close、ブランチ削除はしない。
- **人間判断待ちは消化済み扱いにする**: inbox 登録済みの項目は、未処理 issue として再選択しない。
- **上限を守る**: デフォルト着手 1 件、明示指定でも最大 2 件。verifier reject の修正依頼は 1 回だけ。

## State Files

`.claude/state/` は gitignore 対象のローカル運用状態とする。存在しなければ `--dry-run` 以外で初期化する。

| ファイル                            | 役割                                                    |
| ----------------------------------- | ------------------------------------------------------- |
| `.claude/state/loop-state.md`       | 前回実行、進行中、繰越キュー、処理済みID                |
| `.claude/state/triage-inbox.md`     | 人間判断待ち。ここにある項目は自動選択から除外する      |
| `.claude/state/verification-log.md` | verifier の判定ログ。pass / conditional / reject を記録 |

状態に記録する `item_id` は安定した値にする。

| 種別         | item_id 例                  |
| ------------ | --------------------------- |
| GitHub Issue | `issue:156`                 |
| CI Run       | `ci:security-review:123456` |
| Discovery    | `discovery:2026-06-10:slug` |

## Pipeline

```text
Phase 0  Bootstrap and preflight
Phase 1  Triage collection
Phase 2  Score and select
Phase 3  Creator execution
Phase 4  Independent verification
Phase 5  Draft PR creation
Phase 6  State update and result signal
```

`--dry-run` は Phase 2 まで実行し、状態ファイルを書かずに終了する。

## Phase 0: Bootstrap And Preflight

1. `git status --short --untracked-files=all` を確認する。
2. `git branch --show-current` が `develop-v2` であることを確認する。
3. `.claude/state/` の 3 ファイルを読む。存在しない場合:
   - `--dry-run` では作成せず「初回実行時に作成予定」と表示する。
   - 通常実行では末尾の初期フォーマットで作成する。
4. `loop-state.md` の「進行中」を確認し、既存作業があれば新規候補より優先する。
5. clean かつ `develop-v2` の場合のみ、次を実行する。

```bash
git fetch origin develop-v2
git pull --ff-only origin develop-v2
```

中断条件:

| 条件                           | 処理                                                                              |
| ------------------------------ | --------------------------------------------------------------------------------- |
| dirty tree                     | Phase 0 で停止し、`LOOP_RESULT: BLOCKED` で終了。read-only 状態確認のみ許可する。 |
| `develop-v2` 以外              | 新規着手しない。`LOOP_RESULT: BLOCKED` で終了。                                   |
| `git pull --ff-only` 失敗      | inbox に環境異常として記録し、`LOOP_RESULT: BLOCKED`。                            |
| gh 認証なし / ネットワーク不可 | 調査不能として inbox に記録し、`LOOP_RESULT: BLOCKED`。                           |

dirty tree の場合、Phase 1 以降には進まない。許可する read-only 状態確認は次に限定する。

- `git status --short --untracked-files=all` による staged / unstaged / untracked の一覧化
- `loop-state.md` の進行中項目の確認
- 既存 Draft PR の状態確認

禁止する操作:

- 新規候補収集
- checkout / pull / commit / push
- creator / verifier / PR 作成

## Phase 1: Triage Collection

候補収集とスコアリングをサブエージェントに委譲する場合は、`.claude/agents/loop-triage-analyst.md`
を使う。委譲時も `.claude/state/` の更新、実装、PR作成、最終 `LOOP_RESULT` 判定は親エージェントが行う。
入出力契約は `references/subagent-contracts.md` の `Triage Analyst` を使う。

`LAST_RUN` は `loop-state.md` の前回実行日時。**初回実行時や値が `-`（未実行）の場合は、現在時刻の
7 日前の日付（`YYYY-MM-DD` 形式、例: `2026-06-03`）を計算して `LAST_RUN` に代入してから使う。**
`-` をそのままコマンドに渡すと `fatal: invalid date format: -` 等でエラーになるため、下記コマンドの
`LAST_RUN` は必ず具体的な日付に置換すること。

収集コマンド（`LAST_RUN` を具体的な日付に置換して実行）:

```bash
gh run list --status failure --created ">LAST_RUN" \
  --json databaseId,name,workflowName,displayTitle,url,createdAt,headBranch,conclusion --limit 20

gh issue list --state open \
  --json number,title,labels,updatedAt,url,body --limit 50

git log --since="LAST_RUN" --oneline
```

CI 失敗は採用前に stale 判定する。

```bash
gh run list --workflow "<workflowName>" \
  --json databaseId,status,conclusion,createdAt,url --limit 3
```

同一 workflow の最新 run が success の場合、その失敗は候補から除外する。

候補から除外するもの:

- `loop-state.md` の処理済み `item_id`
- `triage-inbox.md` に未処理 `[ ]` として存在する `item_id`
- すでに open Draft PR が存在する同一 `item_id`
- 最新 run で解消済みの CI failure

候補ゼロの場合:

1. `todoapp-issue-discovery` の `SKILL.md` を読み、mixed モードの調査手順に従う。
2. GitHub Issue は自動作成しない。発見結果を `triage-inbox.md` に `要確認: discovery` として記録する。
3. `LOOP_RESULT: STOP` で終了する。発見と実装を同一サイクルでつなげない。

## Phase 2: Score And Select

必ず `references/triage-rules.md` を読み、候補をスコアリングする。

選択数:

- カウント単位は **PR 単位**（複数 issue を 1 PR にまとめる場合も 1 件として数える）
- 既定: 1 件（PR）
- `--max-items=N`: `N` 件（PR）を選択。ただし `N > 2` の場合は 2 にクランプする。
- 進行中項目がある場合: 進行中を 1 件として扱い、新規選択枠を消費する

選択結果を必ず表示する。

```markdown
| item_id | 種別 | スコア | ルート | 判断理由 |
| ------- | ---- | ------ | ------ | -------- |
```

### 複数 issue を 1 PR にまとめる判断基準

以下の条件を**すべて満たす**場合に複数 issue を 1 PR にまとめてよい。

1. 変更ファイルが重複している（同じファイルを両方が修正する）
2. issue 同士が同一機能・同一コンポーネントに属する（関係性が明確）
3. 分割するとテストやレビューが冗長になる

いずれか1つでも欠ける場合は、issue ごとに独立した PR を作成する。

`--dry-run` の終了条件:

- 状態ファイルを作成・更新しない。
- creator / verifier / PR 作成を実行しない。
- `LOOP_RESULT: STOP` で終了する。

## Phase 3: Creator Execution

選択項目の実行順序は以下の基準で判断する。

**順次実行（sequential）**: 選択項目間で変更ファイルが重複する場合。コンフリクトリスクを避けるため1件ずつ処理する。

**並列実行（worktree）**: 選択項目間で変更ファイルが完全に独立している場合。`isolation: "worktree"` で並列化して効率を上げる。

実行前に各項目の変更予定ファイルを洗い出し、重複の有無で方式を選択すること。

creator へ委譲する場合は `references/subagent-contracts.md` の `Creator` 戻り値を必須とする。
creator は実装・テスト・コミットまでを担当し、PR作成、state 更新、最終 `LOOP_RESULT` は担当しない。

### Security CI

`security-review.yml`、`npm audit`、critical vulnerability に該当する候補は `fix-security-ci` を使う。

実行方法:

1. `.agents/skills/fix-security-ci/SKILL.md` を読む。
2. 対象 run URL と `item_id` を明示して、その workflow に従う。
3. 完了時にブランチ名、コミット、検証結果を記録する。

### GitHub Issue / Bug / Feature

#### creator委譲 vs 直接実行の判断基準

委譲はメインコンテキストの逼迫を防ぐ手段でもある。直接実行は実装差分・検証ログがすべてメインコンテキストに蓄積するため、1サイクルで複数件を扱う場合や変更規模が大きい場合は委譲を優先する。直接実行は「1〜2ファイルの局所修正」に限定する。

| 条件                                                | 方式                                    |
| --------------------------------------------------- | --------------------------------------- |
| 変更ファイルが3つ以上、またはテスト追加・更新が必要 | `loop-creator` に委譲                   |
| 1〜2ファイルの局所的な修正で受け入れ条件が自明      | backlog-loop 内で直接実行               |
| 複数 issue を1PRにまとめる場合                      | `loop-creator` に委譲（1ブランチ・1PR） |

直接実行する場合も `references/subagent-contracts.md` の `Creator` 戻り値形式で記録すること。

実行方法（委譲）:

1. `loop-creator` サブエージェント（`.claude/agents/loop-creator.md`）に委譲する。
2. 入力は `references/subagent-contracts.md` の `Creator` 入力形式（`items` / `route` / `constraints`）に従う。
3. 複数 issue を1PRにまとめる場合は `items` に複数渡す。issue ごとに委譲を繰り返さない。これにより各 issue の実装差分がメインコンテキストに展開されるのを防ぐ。
4. 戻り値は `creator_result` 形式で受け取る。

`loop-creator` は `route` に応じて `todoapp-orchestrator` または `fix-security-ci` を読み、Cross-Model Review と Draft PR Creation を実行せず Commit & Push まで担当する。これらの制約は `loop-creator` の定義に固定済みのため、呼び出し側で都度指定しなくてよい。

creator が人間確認を要求した場合:

- その項目は `triage-inbox.md` に理由付きで記録する。
- ブランチが作成済みなら `loop-state.md` の進行中に残す。
- この項目の PR は作成しない。

## Phase 4: Independent Verification

creator がブランチとコミットを返した項目だけ verifier に進む。
verifier へ委譲する場合は `references/subagent-contracts.md` の `Verifier` 戻り値を必須とする。
verifier は差分検証だけを担当し、修正、PR作成、state 更新、最終 `LOOP_RESULT` は担当しない。

実行方法:

1. 対象ブランチを checkout する。
2. `.agents/skills/code-review/SKILL.md` を読み、その workflow に従う。
3. レビュー対象は `develop-v2...HEAD` の差分に限定する。
4. 結果を `verification-log.md` に追記する。

判定:

| verifier 結果                | verdict     | 次の処理                                                  |
| ---------------------------- | ----------- | --------------------------------------------------------- |
| Critical / High なし         | pass        | Phase 5 へ進む                                            |
| Medium / Low のみ            | conditional | Phase 5 へ進む。PR本文に指摘を明記する                    |
| Critical / High あり         | reject      | creator に 1 回だけ修正依頼し、再度 verifier を実行する   |
| 再 verifier でも reject      | rejected    | PR を作らず inbox へ。ブランチは削除しない                |
| verifier 実行不能 / 判断不能 | blocked     | PR を作らず inbox へ。`LOOP_RESULT: BLOCKED` の候補にする |

## Phase 5: Draft PR Creation

`pass` または `conditional` の項目だけ PR を作成する。
PR作成を委譲する場合は `references/subagent-contracts.md` の `PR Creator` 戻り値を必須とする。

実行方法:

1. `.agents/skills/todoapp-pr-creator/SKILL.md` を読む。
2. ベースブランチは `develop-v2`。
3. PR は必ず Draft。
4. PR 本文に verifier 結果を直接書く。ローカル状態ファイルだけを参照先にしない。

PR本文末尾に追加する内容:

```markdown
---

Generated by todoapp-backlog-loop

- item_id: <item_id>
- creator: <todoapp-orchestrator|fix-security-ci>
- verifier verdict: <pass|conditional>
- Critical/High: <count>
- Medium/Low notes:
  - <conditional の場合のみ列挙>
```

PR 作成後は `develop-v2` に戻る。

```bash
git checkout develop-v2
git pull --ff-only origin develop-v2
```

戻れない場合は `LOOP_RESULT: BLOCKED` とし、次サイクルに進ませない。

## Phase 6: State Update And Result Signal

通常実行では以下を更新する。

- `loop-state.md`
  - 前回実行日時
  - 処理した `item_id`
  - 作成PR URL
  - 繰越キュー
  - 進行中のブランチ
  - 処理済み直近30件
- `triage-inbox.md`
  - 人間判断待ち
  - 環境異常
  - verifier reject / blocked
- `verification-log.md`
  - pass / conditional / reject / blocked の全判定

最後に必ず次のいずれかを出力して終了する。

```text
LOOP_RESULT: STOP
reason: 候補なし、またはこのサイクルで安全に完了
```

```text
LOOP_RESULT: CONTINUE
reason: 繰越キューに自動処理可能な候補が残っている
next_item: <item_id>
```

```text
LOOP_RESULT: BLOCKED
reason: 人間判断、環境異常、verifier実行不能、ブランチ復帰失敗
```

`CONTINUE` を出せる条件:

- 繰越キューに自動処理可能な候補がある
- inbox 未処理数が上限未満
- 現在ブランチが `develop-v2`
- worktree が clean
- このサイクルで PR 作成上限を超えていない

`STOP` を出す条件:

- 候補がない
- 候補はあるがすべて inbox 登録済み
- discovery のみ実行した
- `--dry-run`

`BLOCKED` を出す条件:

- dirty tree
- ブランチ違い
- gh / network / verifier が実行不能
- creator が人間確認を要求
- verifier reject が再発
- `develop-v2` に戻れない

## Initial State Formats

初期テンプレートだけを確認したい場合は `references/state-templates.md` を参照。

**loop-state.md**

```markdown
# Loop State

最終更新: -

## 前回実行

- 日時: -
- 結果: -

## 進行中

| item_id | 種別 | ブランチ | PR  | 開始日 | 状態 |
| ------- | ---- | -------- | --- | ------ | ---- |

## 繰越キュー

| item_id | 種別 | スコア | 初観測日 | 理由 |
| ------- | ---- | ------ | -------- | ---- |

## 処理済み（直近30件）

| item_id | 完了日 | 結果 | PR  |
| ------- | ------ | ---- | --- |
```

**triage-inbox.md**

```markdown
# Triage Inbox

処理したら行ごと削除するか [x] を付ける。

- [ ] YYYY-MM-DD | item_id:<id> | 種別:<type> | 理由:<reason> | 関連:<url>
```

**verification-log.md**

```markdown
# Verification Log

| 日時 | item_id | ブランチ | creator | verdict | Critical/High | Medium/Low | PR  | 備考 |
| ---- | ------- | -------- | ------- | ------- | ------------- | ---------- | --- | ---- |
```
