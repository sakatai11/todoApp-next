# Loop Runner（外部継続制御）

`todoapp-backlog-loop` スキルは **1 heartbeat = 1 サイクル** で必ず終了し、末尾に
`LOOP_RESULT: STOP|CONTINUE|BLOCKED` を出す。継続させるかどうかの判断はスキルの外に置く。

`scripts/loop-runner.sh` はその外部制御プレーンであり、PR #156 が持っていた
「タスクが尽きるまで自律的に回り続ける」性質を、**サーキットブレーカー付き**で取り戻す。

## なぜ runner を分離するか

ループ本体が自分自身の停止条件を評価して内部で回り続けると、停止条件の評価ミスや
無限に湧くキューによって暴走しうる（Loop Engineering が警告する runaway loop）。
制御をスキル外の runner に出すことで、以下を保証する。

- サイクル境界で必ず制御が戻る → 割り込み可能・観測可能
- runner 側にハードな上限（サイクル数・コスト・実時間）を置ける
- `BLOCKED` で即停止し、人間にエスカレーションできる

## 結果シグナルと runner の挙動

| LOOP_RESULT | runner の挙動                                        |
| ----------- | ---------------------------------------------------- |
| `STOP`      | 正常終了（exit 0）。処理すべきタスクなし             |
| `CONTINUE`  | インターバル待機後に次サイクルを起動（上限内のとき） |
| `BLOCKED`   | 即停止（exit 2）。人間の確認・環境復旧が必要         |
| 未検出/不正 | 安全側に停止（exit 3）。シグナル契約違反として扱う   |

## セーフガード（暴走防止）

| ガード                 | 環境変数               | 既定値                           | 役割                                                                    |
| ---------------------- | ---------------------- | -------------------------------- | ----------------------------------------------------------------------- |
| 最大サイクル数         | `LOOP_MAX_CYCLES`      | `5`                              | ループ全体のハードキャップ                                              |
| サイクル間インターバル | `LOOP_INTERVAL`        | `60`（秒）                       | レート制限 / orchestration tax の抑制                                   |
| 1 サイクル実時間上限   | `LOOP_CYCLE_TIMEOUT`   | `1800`（秒）                     | ハング検知（watchdog で強制終了）                                       |
| 1 サイクルコスト上限   | `LOOP_MAX_BUDGET_USD`  | `5`（USD）                       | claude `--max-budget-usd` に渡す                                        |
| 着手件数               | `LOOP_MAX_ITEMS`       | `1`                              | スキル `--max-items` に渡す（最大 2）                                   |
| 動作ブランチ           | `LOOP_BRANCH`          | `develop-v2`                     | サイクル毎に検証。違えば停止                                            |
| クリーン検証           | （常時）               | -                                | サイクル毎に dirty なら停止                                             |
| 多重起動防止ロック     | `LOOP_LOCK_DIR`        | `.claude/state/loop-runner.lock` | 同時実行を 1 つに制限。別 runner 実行中は exit 1、stale lock は自動奪取 |
| 権限モード             | `LOOP_PERMISSION_MODE` | `acceptEdits`                    | claude `--permission-mode` に渡す                                       |

加えて runner は次を行う。

- 各サイクルの**開始前**にもブランチ/クリーンを再検証し、前サイクルが repo を異常な状態で
  残していたら停止する（多層防御）。
- `SIGINT` / `SIGTERM` を受けたら、現在のサイクル完了後に安全に停止する。
- 全サイクルの結果・コストを `.claude/state/loop-runner.log` に追記する。

## 無人モードと実装開始承認（バッチ承認）

runner はスキルを `--unattended` 付きで起動する。`todoapp-orchestrator` ルートの項目は
`.claude/state/pending-approvals.md` に人間が事前承認（`[x]`）したプロンプトがある場合のみ実装され、
未承認の項目は同ファイルに承認待ちとして登録されてスキップされる（`BLOCKED` にはならない）。
`fix-security-ci` ルートは事前承認なしで自動処理される。承認手順は `references/runbook.md` を参照。

## 権限モードについて（重要）

無人で完全自律させるには、claude が非対話で git / gh / 実装スキルを実行できる必要がある。
既定の `acceptEdits` はファイル編集を自動承認するが、Bash 等で承認待ちが出ると停止する。
**安全のため、全権限バイパスを既定にはしていない。** 無人運用する場合のみ、運用者が明示的に
リスクを理解した上で `LOOP_PERMISSION_MODE` を引き上げる（または `LOOP_EXTRA_ARGS` で
`--allowedTools` を allowlist 指定する）こと。

スキル本体の安全装置（Draft PR のみ・委譲禁止リスト・`.env`/秘密情報を読む作業の除外・
merge/close をしない）は権限モードに関わらず常に効く。

## 使い方

```bash
# 既定（最大 5 サイクル / 60s 間隔）で自律実行
.agents/skills/todoapp-backlog-loop/scripts/loop-runner.sh

# 控えめに（最大 3 サイクル / 120s 間隔）
LOOP_MAX_CYCLES=3 LOOP_INTERVAL=120 .agents/skills/todoapp-backlog-loop/scripts/loop-runner.sh

# 1 サイクルだけ選択結果を確認（状態を変更しない）
.agents/skills/todoapp-backlog-loop/scripts/loop-runner.sh --dry-run
```

## 終了コード

| コード | 意味                                        |
| ------ | ------------------------------------------- |
| `0`    | `STOP` 到達、または最大サイクル到達（正常） |
| `1`    | preflight 失敗 / runner 内部エラー          |
| `2`    | `BLOCKED`、タイムアウト、claude エラー終了  |
| `3`    | `LOOP_RESULT` を解釈不能（契約違反）        |

## 定期運用

### ローカル cron

runner 自体が 1 起動で完結する。前回起動がまだ実行中の場合でも、`.claude/state/loop-runner.lock` の
多重起動防止ロックにより後発は exit 1 で即終了するため、二重には回らない。

```cron
# 平日 9-18 時に 1 時間おきに 1 起動（各起動は最大 5 サイクルで自己完結）
0 9-18 * * 1-5 cd /path/to/todoApp-next && LOOP_MAX_CYCLES=5 .agents/skills/todoapp-backlog-loop/scripts/loop-runner.sh >> .claude/state/loop-cron.log 2>&1
```

ローカル cron はマシンが起動している間しか回らない点に注意する。

### クラウドスケジューリング（Routines / Claude Code on the web）

Claude Code のスケジュール実行（Routines 等）は Anthropic のクラウド上で動くため、
ローカルマシンの稼働に依存しない。ただし本スキルの `.claude/state/` は gitignore された
ローカル状態であり、エフェメラルなクラウドセッションでは実行間で保持されない。

- **現状のスキルはローカル runner を前提とする。** クラウドで定期実行する場合は、state を
  リモートに永続化する再設計（state 専用ブランチへのコミット、GitHub Issue / ラベルを
  state として使う等）が先に必要。
- それまでの運用方針: ローカルでは本 runner + cron、クラウドでの定期実行は非対応と扱う。
