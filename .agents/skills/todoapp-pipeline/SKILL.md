---
name: todoapp-pipeline
description: |-
  todoApp-nextプロジェクトで、仕様書・バグ報告・UIの問題・GitHub Issueなどを起点に、実装からコミット・PR作成まで複数ステップを一気通貫で自動実行したいときに使うスキル。

  このスキルを使うべき状況: 「〜してPRまで出して」「〜してcommitまで全部やって」「パイプライン（pipeline）を回して」「実装からレビューまで全部」のように、単一作業ではなくエンドツーエンドの連続作業を依頼している場合。入力がspec/バグ/UIスクショ/Issueのいずれかで、最終的にcommitかPRを出すゴールがある場合も対象。

  使わない状況: 実装のみ（todoapp-feature-dev）、レビューのみ（code-review）、PR作成のみ（todoapp-pr-creator）など単一ステップの依頼。
---

# todoApp-next Hybrid Pipeline

仕様書・バグ・Issue を受け取り、実装・レビュー・コミット・PR作成までを自動実行するハイブリッドパイプライン。

## Core Principles

- **決定論的ステップは止める**: lint / typecheck / test / build / git は失敗したら必ず止める。ハルシネーションでスキップしない
- **AI判断ステップは前後をゲートで挟む**: AI 実装の前に Spec Quality Gate、後ろに `npm run format && npm run test:run && npm run build`
- **既存スキルは再利用**: `code-review` / `todoapp-pr-creator` を呼ぶ。factories は内部で完結する
- **品質ゲート失敗時はハイブリッド対応**: lint / format は AI 自動修正 + 再検証、test / build 失敗は人間に確認
- **トリガーごとに工場を切り替える**: 機能追加 / バグ修正 / UI 変更で実装フローが違う

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
│   B. 並列実行: Worktree で Agent を並列起動             │
│   C. 分割しない: そのまま Phase 2 へ                    │
└────────────┬────────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────────────┐
│ Phase 2: Branch Creation [決定論]                        │
│   git checkout -b <type>/<slug>                         │
└────────────┬────────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────────────┐
│ Phase 3: Factory Execution [Agent サブエージェント]       │
│   task.type に応じて factories/*.md のフローを実行       │
└────────────┬────────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────────────┐
│ Phase 4: Quality Gate [決定論 + AIリトライ]              │
│   format → lint → test → build → IT（条件付き）         │
└────────────┬────────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────────────┐
│ Phase 5: Cross-Model Review [AI判断]                     │
│   /code-review を起動（CodeRabbit + agents + 専門agent群）│
└────────────┬────────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────────────┐
│ Phase 6: Commit & Push [決定論]                          │
│   git add → git commit → git push -u origin             │
└────────────┬────────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────────────┐
│ Phase 7: Draft PR Creation [決定論]                      │
│   /todoapp-pr-creator を起動（Draft フラグ付き）         │
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

---

## 実行手順

各 Phase の詳細手順は対応する `phases/` ファイルを Read して従う。

| Phase | 概要                                    | 詳細ファイル                          |
| ----- | --------------------------------------- | ------------------------------------- |
| 0     | トリガー検出・NormalizedTask構築        | `phases/phase0-trigger-detection.md`  |
| 1     | Spec 検証・仕様書収集・タスク分解       | `phases/phase1-spec-quality-gate.md`  |
| 2     | ブランチ作成                            | `phases/phase2-branch-creation.md`    |
| 3     | Factory をサブエージェントで実行        | `phases/phase3-factory-execution.md`  |
| 4     | 品質ゲート（format/lint/test/build/IT） | `phases/phase4-quality-gate.md`       |
| 5     | クロスモデルレビュー                    | `phases/phase5-cross-model-review.md` |
| 6     | コミット & プッシュ                     | `phases/phase6-commit-push.md`        |
| 7     | Draft PR 作成                           | `phases/phase7-draft-pr.md`           |
| 8     | サマリー提示                            | `phases/phase8-summary.md`            |

---

## エラーハンドリング全般

- **どのフェーズでも例外発生時は即座に人間に報告**。サイレントに次へ進まない
- **作業途中の中断時はブランチを残す**。デリート提案禁止（AGENTS.md準拠）
- **環境セットアップが必要な場合**（例: Docker emulator 起動）は事前に人間に確認

---

## 関連スキル / ファイル

- 既存スキル: `todoapp-feature-dev`, `code-review`, `todoapp-pr-creator`, `coderabbit-review`
- ルール: `.agents/rules/development.md`, `.agents/rules/code-quality.md`, `.agents/rules/security.md`
- triggers: `triggers/spec.md`, `triggers/qa.md`, `triggers/github-issue.md`, `triggers/ui-annotator.md`, `triggers/posthog.md`
- factories: `factories/feature.md`, `factories/bugfix.md`, `factories/ui-change.md`
