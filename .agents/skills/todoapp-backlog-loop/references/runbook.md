# todoapp-backlog-loop Runbook

`todoapp-backlog-loop` の運用時に見る場所と対応手順をまとめる。

## まず見るもの

| 状況                    | 確認先                               |
| ----------------------- | ------------------------------------ |
| runner が止まった       | `.claude/state/loop-runner.log`      |
| 人間判断が必要          | `.claude/state/triage-inbox.md`      |
| verifier の判定詳細     | `.claude/state/verification-log.md`  |
| 実装開始承認の承認待ち  | `.claude/state/pending-approvals.md` |
| 現在のキュー / 処理済み | `.claude/state/loop-state.md`        |
| PR内容                  | GitHub Draft PR                      |

## `LOOP_RESULT` 別の対応

### `LOOP_RESULT: STOP`

正常終了。追加対応は不要。

次に確認すること:

- `loop-state.md` の前回実行が更新されているか
- discovery のみ実行された場合は `triage-inbox.md` に候補が追加されているか

### `LOOP_RESULT: CONTINUE`

自動処理可能な候補がまだ残っている。runner が起動している場合は次サイクルに進む。

手動運用の場合:

```bash
.agents/skills/todoapp-backlog-loop/scripts/loop-runner.sh
```

ただし、Draft PR が複数溜まっている場合は先にレビューする。

### `LOOP_RESULT: BLOCKED`

人間確認または環境復旧が必要。runner は停止する。

確認順:

1. `.claude/state/loop-runner.log`
2. `.claude/state/triage-inbox.md`
3. `git status --short --untracked-files=all`
4. `git branch --show-current`
5. `gh auth status`

## よくある停止理由

### dirty tree

ユーザー作業を壊さないため、新規サイクルは開始しない。

対応:

- 自分の変更なら commit / stash / 別ブランチへ退避する。
- 他者または別agentの変更なら勝手に戻さず、内容を確認する。

### ブランチ違い

runner は既定で `develop-v2` 上だけ動く。

対応:

```bash
git checkout develop-v2
git pull --ff-only origin develop-v2
```

別ブランチで動かす必要がある場合だけ、明示的に指定する。

```bash
LOOP_BRANCH=<branch> .agents/skills/todoapp-backlog-loop/scripts/loop-runner.sh
```

### `gh` 認証切れ

対応:

```bash
gh auth status
gh auth login
```

### verifier reject

Critical / High 指摘が残っているためPRを作らない。

対応:

1. `verification-log.md` の対象行を確認する。
2. 残ったブランチで修正するか、Issueとして切り直す。
3. 必要なら `triage-inbox.md` の項目を更新する。

### 多重起動ロック

`loop-runner.sh` は `.claude/state/loop-runner.lock` で多重起動を防ぐ。
別の runner が実行中の場合、後発は preflight で exit 1 する（cron の毎時起動が前回と重なっても安全）。

対応:

1. `cat .claude/state/loop-runner.lock/pid` で実行中 runner の PID を確認する。
2. `ps -p <pid>` でプロセスが生きていれば、完了を待つ（多重起動させない）。
3. プロセスが存在しない stale lock は次回起動時に runner が自動で奪取するため、手動削除は不要。

### claude 権限待ち / 非対話実行失敗

既定の `LOOP_PERMISSION_MODE=acceptEdits` は安全側の設定。
Bashや外部コマンドで承認待ちが出る場合がある。

対応:

- まず手動で1サイクル実行して、必要な承認範囲を確認する。
- 無人運用する場合だけ `LOOP_EXTRA_ARGS` で許可ツールを絞って指定する。
- 全権限バイパスを常用しない。

## 実装開始承認バッチ（pending-approvals）

無人運用（`--unattended`、runner 起動時は常時）では、`todoapp-orchestrator` ルートの項目は
人間の事前承認がないと実装されない。承認待ちは `.claude/state/pending-approvals.md` に溜まる。

1. `.claude/state/pending-approvals.md` を開く。
2. 各項目の実装開始プロンプトを確認する。必要なら本文を修正する。
3. 着手してよい項目の `- [ ] approved` を `- [x] approved` に変える。
4. 却下する項目はブロックごと削除する（理由を残す場合は `triage-inbox.md` に記録する）。
5. 次の runner 起動時、承認済み項目が新規候補より優先して着手される。

`fix-security-ci` ルートは事前承認なしで自動処理される。

## Draft PRが作られた後

1. PR本文の `verifier verdict` を確認する。
2. `conditional` の場合は Medium / Low 指摘を読む。
3. CI結果を確認する。
4. 問題なければ人間が Ready for review に変更する。
5. merge / Issue close は人間が行う。

## 安全な手動確認

状態を変更せずに選択結果だけ見る。

```bash
.agents/skills/todoapp-backlog-loop/scripts/loop-runner.sh --dry-run
```

runner の制御だけ確認する。

```bash
.agents/skills/todoapp-backlog-loop/scripts/test-loop-runner.sh
```

## 定期運用前のチェック

- `test-loop-runner.sh` が通る
- `--dry-run` が通る
- `triage-inbox.md` の未処理が溜まりすぎていない
- `pending-approvals.md` の承認待ちが溜まりすぎていない
- Draft PR を処理できる人間のレビュー枠がある
- `LOOP_MAX_CYCLES` と `LOOP_MAX_BUDGET_USD` が過剰でない
