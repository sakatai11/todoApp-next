---
name: todoapp-loop
description: |-
  todoApp-nextの自律開発ループ（Loop Engineering）を1サイクル実行するheartbeatスキル。
  状態読込→triage（CI失敗/open issues/recent commits収集）→優先案件選択→
  既存スキル（todoapp-orchestrator / fix-security-ci）へcreator委譲→
  code-reviewスキルによるverifierゲート→Draft PR作成→状態更新、までを自動実行する。

  使うべき状況: ユーザーが「ループを回して」「/todoapp-loop」と言った時、またはcron/スケジュールからの定期実行。
  引数: --dry-run（Phase 2の選択結果を表示して終了。委譲・PR作成・状態更新を行わない）

  使わない状況: 特定タスクの実装依頼（todoapp-orchestrator）、レビューのみ（code-review）、課題発掘のみ（todoapp-issue-discovery）。
---

# todoApp-next Loop（Heartbeat）

「エージェントに直接プロンプトする人間」を置き換える自律開発ループの1サイクルを定義する。
このスキル自身はコードを書かない・レビューしない。**既存スキルを正しい順序で呼び出し、状態を永続化するオーケストレーター**である。

## Core Principles

- **クリーンでなければ走らない**: dirty tree / `develop-v2` 以外のブランチなら即中断し、理由を triage-inbox に記録して終了
- **verifierのpassなしにPRを出さない**: creator（orchestrator等）の自己申告を信用しない。独立した `code-review` スキルの判定が必須（creator/verifier分離）
- **1サイクル上限を超えない**: 着手最大2件・PR最大2件。残りは繰越キューへ（人間のレビュー帯域＝orchestration taxの保護）
- **迷ったら止めてinboxへ**: 受け入れ条件が曖昧・設計判断が必要な案件は自動で推測せず人間にエスカレーション
- **すべてDraft PR**: 人間がReady化するまでマージ対象にしない。merge / PRのReady化 / Issueのcloseは行わない（人間の役割）

## 状態ファイル

| ファイル                            | 役割                                               |
| ----------------------------------- | -------------------------------------------------- |
| `.claude/state/loop-state.md`       | 前回実行・進行中・繰越キュー・処理済み（直近30件） |
| `.claude/state/triage-inbox.md`     | 人間判断待ち項目（追記式チェックボックス）         |
| `.claude/state/verification-log.md` | verifier判定の監査証跡（pass時も記録）             |

`.claude/state/` はgitignore対象。ファイルが存在しない場合は本ファイル末尾の「初期フォーマット」で新規作成する（初回ブートストラップ）。

## Pipeline

```
Phase 0: 状態読込・前提チェック        [決定論]
Phase 1: Triage情報収集               [決定論・読み取り専用]
Phase 2: スコアリング・ルーティング    [AI判断] ← --dry-run はここで終了
Phase 3: Creator実行                  [既存スキルへ委譲]
Phase 4: Verifierゲート               [AI判断・creator分離]
Phase 5: Draft PR作成                 [決定論]
Phase 6: 状態更新・サマリー            [決定論]
```

---

## Phase 0: 状態読込・前提チェック [決定論]

1. `.claude/state/loop-state.md` を読む。無ければ初期フォーマットで作成
2. 前提チェック（**1つでも失敗したら中断**し、サマリーで理由を報告）:

```bash
git status          # クリーンであること
git branch --show-current   # develop-v2 であること
git pull origin develop-v2
```

dirty tree / ブランチ違いの場合は新規着手せず、triage-inbox に `環境異常` として記録して終了する。

3. **進行中項目の再開判定**: loop-state の「進行中」に項目がある場合、`gh pr view <PR番号>` / `git branch -a` で現状を確認:
   - PRがマージ/クローズ済み → 「処理済み」へ移動
   - 作業途中（verifierゲート前で中断等） → そのサイクルはこの項目の続きを優先する（新規着手枠を1つ消費）
   - 開始から **7日超** 放置 → stale と判定し triage-inbox へ移動（ブランチは削除しない）

## Phase 1: Triage情報収集 [決定論・読み取り専用]

`LAST_RUN` = loop-state の前回実行日時（初回は7日前）として収集する:

```bash
# CI失敗（前回実行以降）
gh run list --status failure --created ">LAST_RUN" \
  --json databaseId,name,workflowName,displayTitle,url,createdAt --limit 20

# Open issues
gh issue list --state open --json number,title,labels,updatedAt --limit 30

# Recent commits（コンテキスト把握用。候補にはしない）
git log --since="LAST_RUN" --oneline
```

**stale failureの除外**: CI失敗は採用前に `gh run list --workflow "<workflowName>" --limit 3 --json status,conclusion` で同一workflowの最新runを確認し、**最新が成功していれば除外**する（既に解消済みの失敗に着手枠を浪費しない）。

**突合**: loop-state の「処理済み」「繰越キュー」、triage-inbox の既載項目と照合し、未処理の項目だけを候補リストにする（冪等性の担保）。

**候補ゼロの日のみ**: CI失敗もopen issuesも0件の場合、Skill ツールで skill: "todoapp-issue-discovery" を起動（mixedモード・読み取り専用）して新規課題を発掘し、**GitHub Issueとして起票して今サイクルを終了**する。発掘したIssueは次サイクルの入力になる（発見と実装の分離。同一サイクル内で発見→実装まではしない）。

## Phase 2: スコアリング・ルーティング [AI判断]

`references/triage-rules.md` を **必ずRead** し、その基準に従って:

1. 各候補をスコアリング（security CI失敗 > bugラベル > その他CI失敗 > 機能Issue > 改善系）
2. ルーティング判定:

| 候補の種類                                               | 委譲先                                         |
| -------------------------------------------------------- | ---------------------------------------------- |
| security-review.yml / npm audit 系のCI失敗               | `fix-security-ci` スキル                       |
| 受け入れ条件が明確なバグ・機能・UI Issue                 | `todoapp-orchestrator` スキル（Issueトリガー） |
| 受け入れ条件が曖昧 / 設計判断が必要 / 委譲禁止リスト該当 | **委譲しない** → triage-inbox へ理由付きで記録 |

3. スコア上位 **最大2件** を選択。3件目以降は「繰越キュー」へ
4. 選択結果をテーブルで表示:

```markdown
| #   | 項目 | 種別 | スコア | ルート |
| --- | ---- | ---- | ------ | ------ |
```

**`--dry-run` の場合はここで終了**（委譲・PR作成・状態ファイル更新を一切行わない）。

## Phase 3: Creator実行 [既存スキルへ委譲]

選択した項目を **1件ずつ順次** 処理する（2件目は1件目のPhase 6完了後、`develop-v2` に戻ってから着手）。タスク内部の分解・worktree並列は委譲先のorchestratorが判断する（このスキルはworktreeを直接管理しない）。

- Skill ツールで skill: "todoapp-orchestrator"（または "fix-security-ci"）を起動
- **orchestratorへの委譲時指示（必ず伝える）**:

> Phase 5（Cross-Model Review）と Phase 7（Draft PR作成）はスキップし、Phase 6 の commit & push まで完了したらブランチ名を返却すること。レビューとPR作成はループ側のverifierゲートが担当する。

（レビューの二重実行を防ぎつつ、creator/verifier分離をループ側で保証するため）

- creatorが品質ゲート（format/lint/test/build）失敗等で人間確認を要求した場合: その項目を中断し triage-inbox へ記録、次の項目へ進む

## Phase 4: Verifierゲート [AI判断・creator分離]

creatorが返却したブランチに対して、Skill ツールで skill: "code-review" を起動（CodeRabbit + Codex他社モデル + 専門エージェント群 = creatorとは別系統のverifier）。

**判定マッピング**:

| code-review集約結果   | verdict         | アクション                                                                                                             |
| --------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Critical/High指摘なし | **pass**        | Phase 5へ                                                                                                              |
| Medium/Lowのみ        | **conditional** | Phase 5へ進むがPR本文に指摘一覧を明記                                                                                  |
| Critical/Highあり     | **reject**      | creator（委譲元と同じスキル）に**1回だけ**修正させ再レビュー。再rejectならPRを出さず triage-inbox へ（ブランチは残す） |

**全verdictを `.claude/state/verification-log.md` に追記する**（pass時も記録＝監査証跡）。

## Phase 5: Draft PR作成 [決定論]

verdict が pass / conditional の項目のみ:

- Skill ツールで skill: "todoapp-pr-creator" を起動。**必ず Draft**（draft: true）
- PR本文末尾に以下を記載:

```markdown
---

🤖 autonomous loop（todoapp-loop）による自動生成 / verifier: pass|conditional
検証記録: .claude/state/verification-log.md 参照
```

- conditional の場合は Medium/Low 指摘の一覧をPR本文に含める
- 1サイクルのPR上限は **2件**。超過分は次サイクルへ繰越

## Phase 6: 状態更新・サマリー [決定論]

1. `loop-state.md` を更新: 前回実行（日時・結果）、進行中、繰越キュー、処理済み（30件超は古い順に削除）
2. `triage-inbox.md` にエスカレーション項目を追記（既載と重複する項目は追記しない）
3. inbox の未処理（`[ ]`）が **10件を超えたら警告** をサマリーに含める
4. サマリーをテーブルで出力:

```markdown
## Loop サイクル完了

| 指標       | 結果                     |
| ---------- | ------------------------ |
| 処理件数   | N件                      |
| 作成PR     | <URL> (verdict)          |
| inbox追加  | N件（合計N件）           |
| 繰越       | N件                      |
| 次回開始点 | <繰越キュー先頭 or なし> |
```

---

## 安全装置（暴走防止）

- push先は常に feature/fix ブランチのみ。`develop-v2` / `main` への直接コミット禁止
- リトライは verifier reject 時の1回のみ。同一項目を3サイクル連続で失敗したら inbox へ
- merge / PRのReady化 / Issueのclose / ブランチ削除は行わない
- どのPhaseでも想定外の状態に遭遇したら、サイレントに進まず中断してサマリーで報告

## 状態ファイル初期フォーマット（ブートストラップ用）

**loop-state.md**:

```markdown
# Loop State

最終更新: -

## 前回実行

- 日時: -
- 結果: -（処理 0件 / PR 0件 / inbox 0件 / 繰越 0件）

## 進行中

| 項目 | 種別 | ブランチ | PR  | 開始日 | 状態 |
| ---- | ---- | -------- | --- | ------ | ---- |

## 繰越キュー（次サイクルの優先候補）

| 項目 | 種別 | スコア | 初観測日 |
| ---- | ---- | ------ | -------- |

## 処理済み（直近30件、古いものから削除）

| 項目ID | 完了日 | 結果 |
| ------ | ------ | ---- |
```

**triage-inbox.md**:

```markdown
# Triage Inbox（人間判断待ち）

処理したら行ごと削除するか [x] を付けてください。

- [ ] YYYY-MM-DD | <種別> | <項目> | 理由: <なぜ自動処理しなかったか> | 関連: <Issue#/run URL>
```

**verification-log.md**:

```markdown
# Verification Log（検証履歴監査）

| 日付 | 対象 | creator | verdict | Critical/High件数 | PR  | 備考 |
| ---- | ---- | ------- | ------- | ----------------- | --- | ---- |
```
