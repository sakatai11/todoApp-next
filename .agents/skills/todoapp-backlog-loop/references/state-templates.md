# State Templates

`.claude/state/` はローカル運用状態であり、git 管理しない。初回実行時にファイルが存在しない場合、
`todoapp-backlog-loop` は以下の形式で初期化する。

手動で準備する場合も、このテンプレートをそのまま使う。

## `.claude/state/loop-state.md`

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

## `.claude/state/triage-inbox.md`

```markdown
# Triage Inbox

処理したら行ごと削除するか [x] を付ける。

- [ ] YYYY-MM-DD | item_id:<id> | 種別:<type> | 理由:<reason> | 関連:<url>
```

## `.claude/state/verification-log.md`

```markdown
# Verification Log

| 日時 | item_id | ブランチ | creator | verdict | Critical/High | Medium/Low | PR  | 備考 |
| ---- | ------- | -------- | ------- | ------- | ------------- | ---------- | --- | ---- |
```

## `.claude/state/pending-approvals.md`

```markdown
# Pending Approvals

無人サイクルが実装開始承認を求めている項目。`- [ ] approved` を `- [x] approved` にすると
次サイクル以降に優先着手する。却下する場合は項目ブロックごと削除する。

## <item_id>

- [ ] approved
- 登録日: YYYY-MM-DD
- route: todoapp-orchestrator
- score: <score>
- source: <url>

実装開始プロンプト:

> <実装開始プロンプト本文（複数行可）>
```

## 運用メモ

- `item_id` は `issue:156`、`ci:security-review:123456` のように安定した値にする。
- `triage-inbox.md` に未処理 `[ ]` としてある item は、自動選択から除外する。
- `pending-approvals.md` の承認待ち `[ ]` item は自動選択から除外し、承認済み `[x]` item は新規候補より優先して着手する。
- Obsidian の会話履歴は詳細ログとして扱い、この state は次サイクル用の短い運用台帳として扱う。
