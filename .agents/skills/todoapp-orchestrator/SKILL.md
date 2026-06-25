---
name: todoapp-orchestrator
description: |-
  todoApp-nextプロジェクトで、仕様書・バグ報告・UIの問題・GitHub Issueなどを起点に、実装からコミット・PR作成まで複数ステップを一気通貫で自動実行したいときに使うスキル。

  このスキルを使うべき状況: 「〜してPRまで出して」「〜してcommitまで全部やって」「オーケストレーターを回して」「実装からレビューまで全部」のように、単一作業ではなくエンドツーエンドの連続作業を依頼している場合。入力がspec/バグ/UIスクショ/Issueのいずれかで、最終的にcommitかPRを出すゴールがある場合も対象。

  使わない状況: 実装のみ（todoapp-feature-dev）、レビューのみ（code-review）、PR作成のみ（todoapp-pr-creator）など単一ステップの依頼。
---

# todoApp-next Orchestrator

仕様書・バグ・Issue を受け取り、**設計（Claude）→ 実装（Codex）→ レビュー（Claude）→ コミット・PR作成**までをオーケストレートする。

## 役割分担（Claude 設計 / Codex 実装）

- **Claude = 脳**: 探索・アーキテクチャ設計・監督・レビューに専念する。Phase 3a で **実装指示書 `.codex-tasks/<branchSlug>.md`** を生成する
- **Codex = 手**: 承認済み指示書に基づき、実装 + UT + 自己修正ループ（format → lint → test:run → build をゼロエラーまで）を Codex セッション内で完結させる
- **狙い**: tsc/test/lint の冗長出力を Codex 側に閉じ込め、Claude のメインコンテキストを「設計の前提」の保持に使う。実装者が Codex（別モデル）になることで Phase 5 レビューのクロスモデル性も成立する

## Core Principles

- **決定論的ステップは止める**: lint / typecheck / test / build / git は失敗したら必ず止める。ハルシネーションでスキップしない
- **Codex の自己申告を信頼の根拠にしない**: Codex が「全ゲート green」と報告しても、Phase 4 で最終ゲートを **1回決定論再実行** して裏取りする。コミット対象は常に実 diff
- **AI判断ステップは前後をゲートで挟む**: Codex 実装の前に Spec Quality Gate と **指示書承認ゲート**、後ろに最終ゲート再実行
- **既存スキルは再利用**: 実装は `codex:codex-rescue`、レビューは `code-review`、PR は `todoapp-pr-creator` を呼ぶ。factories は設計（指示書生成）に専念する
- **往復は有限化**: orchestrator ↔ Codex の差し戻しは最大2回。2回で緑にならなければ人間に確認（Codex 内部ループ自体は無制限でよい）
- **トリガーごとに工場を切り替える**: 機能追加 / バグ修正 / UI 変更で設計フローが違う

---

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Phase 0: Trigger Detection                              │
│   入力形式 → トリガー種別 → triggers/*.md で正規化      │
└────────────┬────────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────────────┐
│ Phase 1: Spec Quality Gate                              │
│   正規化された NormalizedTask の妥当性を検証            │
│   不足があれば人間に確認                                │
│   [1-4] 大規模仕様は複数 NormalizedTask に分割提案      │
└────────────┬────────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────────────┐
│ [タスク分解が選ばれた場合]                               │
│   A. 順次実行: Phase 2〜8 をタスクごとに繰り返す        │
│   B. 設計並列: 読み取り専用 Agent で指示書生成を並列化  │
│   C. 分割しない: そのまま Phase 2 へ                    │
└────────────┬────────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────────────┐
│ Phase 2: Branch Creation [決定論]                        │
│   git checkout -b <type>/<slug>                         │
└────────────┬────────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────────────┐
│ Phase 3a: Design [Claude サブエージェント]                │
│   factories/*.md で探索・アーキ設計→実装指示書を生成     │
│   .codex-tasks/<slug>.md に書出し→指示書承認ゲート(Y/N/E)│
│   （規模で full/light レーンを切替。些末は対象外）        │
└────────────┬────────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────────────┐
│ Phase 3b: Implementation [Codex サブエージェント]         │
│   codex-rescue --write で指示書を実装+UT                 │
│   format→lint→test:run→build を自己修正ループ           │
└────────────┬────────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────────────┐
│ Phase 4: Quality Gate [最終決定論再実行]                 │
│   最終ゲート1回再実行→赤はCodexへ差し戻し最大2回         │
│   実diff突合→IT（条件付き・Codex対象外）                │
└────────────┬────────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────────────┐
│ Phase 5: Cross-Model Review [AI判断]                     │
│   /code-review（CodeRabbit + Claude専門agent群が主役 +   │
│   Codexレビューは補助）。修正はCodexへ差し戻し           │
└────────────┬────────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────────────┐
│ Phase 6: Commit & Push [決定論]                          │
│   git add → git commit → git push -u origin             │
└────────────┬────────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────────────┐
│ Phase 7: Draft PR Creation [人間承認 → 決定論]            │
│   PR内容を提示→人間承認→/todoapp-pr-creator 起動        │
│   （Draft フラグ付き: draft: true を引数に指定）         │
└────────────┬────────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────────────┐
│ Phase 8: Summary                                         │
│   実行ログ・PR URL・残課題を提示                        │
└─────────────────────────────────────────────────────────┘
```

---

## NormalizedTask Schema

全トリガーは Phase 1 までに以下の形式に正規化する。型定義の詳細は `references/normalized-task.ts` を参照。

```text
type / source / title / description / acceptanceCriteria / context? / branchSlug
```

## TypeScript + Markdown 手順の役割分担

`references/normalized-task.ts` はフェーズ間で受け渡すデータ契約だけを型で固定し、実行中の判断手順は各 Phase の Markdown に残す。

- TypeScript: `NormalizedTask.type` / `source`、`DesignDocPlan.lane` / `approvedByHuman`、`CodexImplementationResult.integrationTest`、`DraftPullRequestPlan.draft` など、後続 Phase が読み取る構造化データを管理する
- Markdown: ユーザー承認、リトライ可否、skip 判断、High 指摘への対応方針、Codex への差し戻し可否など、状況依存の運用手順を管理する
- boolean だけでは判断理由が失われる実行判定は、`IntegrationTestPlan` のように理由付き union として TypeScript 側に渡す
- 実行結果の採否や例外処理は TypeScript 型に閉じ込めず、Phase 手順で明示する

`NormalizedTask` は仕様を表す入力モデルであり、実行中に変わるテスト実行判断やレビュー件数などを追加しない。実行時の判定は Phase 3 以降の結果型（`DesignDocPlan` / `CodexImplementationResult` / `FactoryResult`）として扱い、判断の進め方は Markdown の Phase 手順に従う。

---

## 実行手順

各 Phase の詳細手順は対応する `phases/` ファイルを Read して従う。

| Phase | 概要                                 | 詳細ファイル                          |
| ----- | ------------------------------------ | ------------------------------------- |
| 0     | トリガー検出・NormalizedTask構築     | `phases/phase0-trigger-detection.md`  |
| 1     | Spec 検証・仕様書収集・タスク分解    | `phases/phase1-spec-quality-gate.md`  |
| 2     | ブランチ作成                         | `phases/phase2-branch-creation.md`    |
| 3     | 設計(Claude)→指示書→Codex実装(3a/3b) | `phases/phase3-factory-execution.md`  |
| 4     | 最終ゲート再実行・差し戻し・IT       | `phases/phase4-quality-gate.md`       |
| 5     | クロスモデルレビュー                 | `phases/phase5-cross-model-review.md` |
| 6     | コミット & プッシュ                  | `phases/phase6-commit-push.md`        |
| 7     | Draft PR 作成                        | `phases/phase7-draft-pr.md`           |
| 8     | サマリー提示                         | `phases/phase8-summary.md`            |

---

## エラーハンドリング全般

- **どのフェーズでも例外発生時は即座に人間に報告**。サイレントに次へ進まない
- **作業途中の中断時はブランチを残す**。デリート提案禁止（CLAUDE.md準拠）
- **環境セットアップが必要な場合**（例: Docker emulator 起動）は事前に人間に確認

---

## 関連スキル / ファイル

- 既存スキル: `code-review`, `todoapp-pr-creator`, `coderabbit-review`（`todoapp-feature-dev` は兄弟スキルで下請けにしない）
- Codex 実装委譲: `codex:codex-rescue` サブエージェント（`codex-companion.mjs task --write` のラッパー）
- ルール: `.claude/rules/development.md`, `.claude/rules/code-quality.md`, `.claude/rules/security.md`
- triggers: `triggers/spec.md`, `triggers/qa.md`, `triggers/github-issue.md`, `triggers/ui-annotator.md`, `triggers/posthog.md`
- factories（設計＝指示書生成に専念）: `factories/feature.md`, `factories/bugfix.md`, `factories/ui-change.md`
- 実装指示書の置き場所: `.codex-tasks/<branchSlug>.md`（`.gitignore` 済み・設計記録として保持）
- phase result types: `references/normalized-task.ts`
- evals: `evals/evals.json`
