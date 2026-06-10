# Triage Rules

`todoapp-backlog-loop` の Phase 2 で使うスコアリングと自動委譲可否の基準。

## Scoring

| 候補                          | スコア | 判定方法                                  |
| ----------------------------- | ------ | ----------------------------------------- |
| security CI / critical audit  | 100    | `security-review.yml`、npm audit critical |
| production bug                | 80     | GitHub Issue に `bug` ラベル              |
| failing CI                    | 65     | 最新 run でも失敗している workflow        |
| regression / test gap         | 55     | Issue に `regression`、`test`、`quality`  |
| feature                       | 40     | Issue に `enhancement` または `feature`   |
| UI / UX / accessibility       | 35     | Issue に `ui`、`ux`、`a11y`               |
| docs / refactor / maintenance | 20     | 上記以外                                  |

同点の場合は以下の順で優先する。

1. ラベルに `priority:high` があるもの
2. 最新更新日時が古いもの
3. issue number または run id が小さいもの

`priority:high` を最優先にするのは、タイムスタンプ差でほぼ確実にタイが解消され、重要度の高い
タスクの優先機会が失われるのを防ぐため。2 で古いものを優先するのは、毎回新しい issue だけを
拾い続けて backlog が沈むことを避けるため。

## Routing

| 条件                                 | ルート                 | 自動処理 |
| ------------------------------------ | ---------------------- | -------- |
| security-review / npm audit critical | `fix-security-ci`      | 可       |
| 明確な bug issue                     | `todoapp-orchestrator` | 可       |
| 明確な feature / UI issue            | `todoapp-orchestrator` | 可       |
| non-security CI failure              | `todoapp-orchestrator` | 条件付き |
| discovery result                     | `triage-inbox`         | 不可     |
| 曖昧な issue                         | `triage-inbox`         | 不可     |
| 委譲禁止リスト該当                   | `triage-inbox`         | 不可     |

non-security CI failure を自動処理できる条件:

- 最新 run でも失敗している
- 失敗ログから対象ファイルまたは失敗テストが特定できる
- 対応がアプリコードまたはテストコードに閉じている

## Clear Acceptance Criteria

Issue を creator に渡してよい条件。すべて満たすこと。

1. 期待する動作、再現手順、または失敗条件が具体的。
2. 完了条件が検証可能。
3. 対象画面、API、機能、テストのいずれかが特定できる。
4. 影響範囲が単一機能または小さな横断修正に収まる。

満たさない場合は、実装せず `triage-inbox.md` に理由付きで送る。

## Delegation Ban List

以下はスコアに関係なく自動委譲しない。

- Firestore スキーマや既存データ構造の変更
- NextAuth、Firebase Auth、RBAC、認可境界の変更
- `proxy.ts`、認証 middleware 相当、セッション制御の変更
- 依存パッケージのメジャーアップデート
- GitHub Actions、Vercel、Docker、Firebase 設定そのものの変更
- 既存 API のレスポンス形式を変える破壊的変更
- 秘密情報、認証情報、`.env` を読む必要がある作業
- 複数機能をまたぐ大規模改修
- 受け入れ条件が主観的な UI 改善のみの作業

## Limits

| 項目                        | 値       |
| --------------------------- | -------- |
| 1サイクルのデフォルト着手数 | 1        |
| 1サイクルの最大着手数       | 2        |
| 1サイクルの最大Draft PR数   | 2        |
| verifier reject の修正依頼  | 1回      |
| 進行中 stale 判定           | 7日      |
| inbox 警告しきい値          | 10件     |
| 処理済み履歴                | 直近30件 |

## Result Signal

外側の runner は最後の `LOOP_RESULT` だけを見る。

| 結果     | 意味                         |
| -------- | ---------------------------- |
| STOP     | 追加サイクル不要             |
| CONTINUE | 次サイクルを起動してよい     |
| BLOCKED  | 人間確認または環境復旧が必要 |
