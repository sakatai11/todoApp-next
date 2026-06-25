# Phase 3: Design → Codex Implementation

Phase 3 は **3a（Claude 設計）** と **3b（Codex 実装）** の2段に分かれる。

- **3a（Claude）**: コードベース探索・アーキテクチャ設計を行い、結果を **実装指示書** `.codex-tasks/<branchSlug>.md` に書き出す。設計の冗長出力はサブエージェント内に隔離し、メインには指示書だけを残す。
- **3b（Codex）**: `codex:codex-rescue` 経由で承認済み指示書を渡し、実装 + UT + 自己修正ループ（format → lint → test:run → build）まで Codex のセッション内で完結させる。

> **役割分担の原則**: Claude は設計・監督・レビュー（脳）に専念し、Codex に実装と決定論ゲートのエラー修正ループ（tsc/test/lint の冗長出力）を閉じ込める。これによりメインコンテキストを「設計の前提」の保持に使える。

---

## 規模レーンの判定（3a の前に決める）

Phase 1 の規模判定を引き継ぎ、`DesignDocPlan.lane` を決める。

| 判定           | 条件                                                               | lane                         |
| -------------- | ------------------------------------------------------------------ | ---------------------------- |
| **大規模**     | 新規ファイル3件以上 / 複数 `features/` 横断 / API追加+FE変更の両方 | `full`                       |
| **小〜中規模** | 上記に非該当でロジック変更・UT が必要                              | `light`                      |
| **真に些末**   | タイポ/コメント/設定1行・ロジック無し・テスト不要                  | （Phase 3 対象外。下記参照） |

### 真に些末なタスクは orchestrator のスコープ外

ロジック変更もテストも伴わない 1 行修正は、設計セレモニーも Codex 委譲も過剰。**orchestrator を使わず Claude がインラインで直接 Edit** し、commit/PR が必要なら Phase 6〜8（または `todoapp-pr-creator`）に進む。`todoapp-feature-dev` には委譲しない（あれは探索＋レビューを内包する重量級の兄弟スキルで、軽量用の下請けではない）。

---

## Phase 3a: Claude 設計（指示書生成）

`task.type` に応じて該当 factory ファイルを Read し、**Agent ツール（サブエージェント）** として実行する。factory は実装そのものではなく **「Codex に渡す実装指示書」を出力する** ことをゴールとする。

| task.type      | factory                                                 |
| -------------- | ------------------------------------------------------- |
| `feature`      | `factories/feature.md`                                  |
| `bugfix`       | `factories/bugfix.md`                                   |
| `ui-change`    | `factories/ui-change.md`                                |
| `optimization` | `factories/bugfix.md`（`type=optimization` として実行） |

### lane=full の起動

```text
Agent ツールで以下を実行:
  description: "design: <task.title>"
  subagent_type: "general-purpose"
  prompt: """
  <factoryPath の全内容を Read して貼り付ける>

  ---

  ## 設計対象タスク（NormalizedTask）
  type / source / title / description / acceptanceCriteria / context / branchSlug を貼る

  ## あなたのゴール
  探索とアーキテクチャ設計を行い、**実装指示書の本文（Markdown）だけ**を返す。
  実装・テスト作成・コミットは行わない（実装は後段の Codex が行う）。
  探索の冗長な記録は返さず、下記テンプレートに沿った指示書だけを返すこと。
  """
```

サブエージェントが返した指示書本文を、orchestrator が `.codex-tasks/<branchSlug>.md` に書き出す。

### lane=light の起動（設計セレモニーを畳む）

小〜中規模では多エージェント fan-out もアーキ選択ゲートも省く。**orchestrator（メイン）が単発で素早くスコープを確定**し、最小指示書（1セクション）を直接 `.codex-tasks/<branchSlug>.md` に書く。実装者は引き続き Codex（一本化を崩さない）。

---

## 実装指示書テンプレート（`.codex-tasks/<branchSlug>.md`）

```markdown
# 実装指示書: <task.title>

## 1. タスク概要

- description: <task.description>
- acceptanceCriteria:
  - <...>

## 2. 変更/作成対象ファイル（確定リスト）

- <パス>: <変更内容1行>

## 3. アーキテクチャ方針と理由

<lane=full で選択したアプローチと「なぜ」。light では1〜2行で可>

## 4. 遵守するプロジェクト規約

- features/ で自己完結（共通は features/shared/）
- MUI + Tailwind の使い分け規約に従う
- 新規 API には Zod バリデーション必須
- 状態更新は楽観的更新 / サーバーレスポンス待ちを適切に使い分ける
- <タスク固有の「このプロジェクトでは○○しない」ルール>

## 5. テスト要件

- 対象ファイルに対応する UT を実装と同時に作成
- `npm run test:run -- <ファイル>` で都度確認
- <bugfix の場合: 再現テスト red→green を先行>

## 6. やってはいけないこと

- スコープ外のリファクタリングをしない
- ファイル削除を提案しない（CLAUDE.md 準拠）
- 指示書に無いファイルを勝手に新設しない（必要なら完了報告で提案）

## 7. 完了前の自己修正ループ（Codex が実行）

実装後、以下を自分で実行し、エラーがあればゼロになるまで自己修正してから完了報告すること:
`npm run format && npm run lint && npm run test:run && npm run build`
（IT は実行不要。app/api または Firestore/Auth 変更の有無だけ報告する）

## 8. 完了報告フォーマット（500トークン以内・実装ログ禁止）

## 変更ファイルリスト

- <パス一覧>

## 自己ゲート結果

- format/lint/test:run/build: <all green / 失敗内容>

## IT 必要性

- app/api または Firestore/Auth 変更あり: <yes/no>
- 変更した API ルート: <あれば>

## 作成・更新した UT ファイル

- <パス一覧>
```

---

## 指示書承認ゲート（Codex 起動前に必ず実施）

完成した `.codex-tasks/<branchSlug>.md` をユーザーに提示し、承認を得る。**Codex は承認済み指示書しか触らない**（暴走防止の要）。

```text
以下の実装指示書を生成しました。この内容で Codex に実装させてよいですか？

<.codex-tasks/<branchSlug>.md の本文>

[Y] このまま Codex 実装へ  [N] キャンセル  [E] 指示書を修正してから
```

- **Y**: `DesignDocPlan.approvedByHuman = true` として Phase 3b へ
- **N**: パイプライン中断（指示書ファイルは設計記録として残す）
- **E**: 修正点をユーザーに尋ね、指示書を書き換えて再提示。確定するまで `Y/N/E` を繰り返す

> **注意**: lane=full の承認はアーキ選択ゲート（factory 内 Step 2）の後に行う。lane=light ではアーキ選択を省くので、この指示書承認が唯一の事前ゲートになる。

---

## Phase 3b: Codex 実装

承認済み指示書を `codex:codex-rescue` サブエージェントに渡す。

```text
Agent ツールで以下を実行:
  description: "codex impl: <task.title>"
  subagent_type: "codex:codex-rescue"
  prompt: """
  --write

  リポジトリ内の `.codex-tasks/<branchSlug>.md` を読み、その指示書のとおりに実装と UT を行ってください。
  指示書のセクション7に従い、実装後は format → lint → test:run → build を自分で実行し、
  エラーがゼロになるまで自己修正してから完了してください。
  完了報告は指示書セクション8のフォーマットで 500 トークン以内。実装ログは返さないでください。
  """
```

- **モデル/effort**: 原則指定しない（Codex デフォルト）。lane=full の大規模タスクのみ `--effort high` の付与を**ユーザーに提案**してから付ける（トークンコストが上がるため自動付与しない）。
- **実行モード**: Agent ツールをフォアグラウンドで実行し、orchestrator は完了サマリーを受け取るまで待つ。`--wait` は `/codex:rescue` コマンド側の実行モード指定であり、`codex:codex-rescue` の prompt には含めない。
- **Codex が未認証/障害の場合**: codex-rescue が「`/codex:setup` せよ」で止まる。その場合のみ**「Claude 実装にフォールバックするか」をユーザーに確認**する（通常時は Codex 一本化）。

### Codex 完了後の受け取り情報

`CodexImplementationResult` 相当として以下を受け取り、Phase 4 へ進む：

- 変更ファイル一覧（自己申告。コミット対象は常に実 diff を正とする）
- 自己ゲート結果（`selfGateReportedGreen`）
- `integrationTest.required` と判断理由
- 作成・更新した UT ファイル一覧

---

## 設計並列モードの扱い

Phase 1 で「B. 設計のみ並列化」が選ばれた場合：

- **Phase 3a（Claude 設計）は並列 fan-out 可** — 複数タスクの探索・指示書生成を同一 worktree 上の読み取り専用 Agent で同時実行する。コードやファイルへの書き込みは発生させないため、追加 worktree は作成しない
- **Phase 3b（Codex 実装）は逐次** — 各タスクの指示書を1つずつ Codex に渡す。Agent をフォアグラウンドで待つ構造上、複数 Codex セッションの同時 await は不可。`--resume-last` のスレッド競合・worktree 起点バグ（CLAUDE.md 既知不具合）の同時発生も避ける

> **既知の制限**: 真の並列 Codex 実装（`--background` + ポーリング集約）は将来課題。現状は「設計 fan-out 可・Codex 実装逐次」とする。

各タスクの実装完了後、Phase 4〜8 をタスクごとに**順次実行**する。
