---
name: code-review
description: CodeRabbitの静的解析を第一段階として実行し、Codex（他社レビュー）と4専門Claudeエージェントを並列で動かして多角的分析を行うオーケストレータースキル。単純なCodeRabbitのみのレビューより深い多角的分析が必要な時に使用する。ユーザーが「コードレビュー」「詳細にレビュー」「多角的にレビュー」「/code-review」と言った時に使用する。「CodeRabbitだけでレビュー」「素早くレビュー」の場合は coderabbit-review スキルを使うこと。
---

# Code Review オーケストレーター

## Overview

CodeRabbitの静的解析 → Codex他社レビュー（バックグラウンド）+ 4専門Claudeエージェント（並列） → 集約レポートの流れでコードレビューを実施する。

Codex（OpenAI）をClaudeとは別の視点を持つ「他社レビュアー」として組み込むことで、単一AIに依存しない多角的なレビューを実現する。

## Workflow

### Step 1: 事前確認

```bash
git status
git log --oneline -5
git diff HEAD --stat
```

**untracked files がある場合（新規ファイルのみの変更）**:
`git diff HEAD` は untracked files を含まないため、以下のコマンドで差分を取得する：

```bash
# untracked filesの一覧を取得
git ls-files --others --exclude-standard

# 各新規ファイルを差分として取得（複数ファイル対応）
git ls-files --others --exclude-standard | xargs -I{} git diff --no-index /dev/null {}
```

**変更ファイルが0件かつ untracked files もない場合**はユーザーに確認する：

> 「未コミットの変更がありません。以下のどちらをレビューしますか？
>
> 1. 現在のブランチと main（または develop）の差分
> 2. 直近のコミット内容」

ユーザーの回答に応じてコマンドを選択：

```bash
# 選択肢1: ブランチ全体の差分
git diff main...HEAD
# または
git diff develop...HEAD

# 選択肢2: 直近コミット
git diff HEAD~1 HEAD
```

### Step 2: git diff の取得

```bash
# 未コミット変更がある場合
git diff HEAD

# ブランチ差分の場合（Step 1 の確認結果による）
git diff main...HEAD
```

差分が1000行を超える場合は `git diff HEAD --stat` で変更ファイル一覧のみ取得し、各エージェントには「差分が大きいため以下のファイルが変更されています」としてファイル一覧を渡す。

### Step 3: CodeRabbit 実行（フォアグラウンド）

CodeRabbit は TTY（インタラクティブ端末）を必要とするため、**フォアグラウンドで実行**する。

```bash
coderabbit --prompt-only 2>&1
```

ユーザーに「CodeRabbitの静的解析を実行しています...」と伝える。

コマンドが完了したら出力テキスト全体を保持し、Step 4 への入力に使用する。

CodeRabbitの出力が空または最小限（10行未満）の場合は「CodeRabbitから有意な結果が得られませんでした。git diff のみで分析を続けます」としてStep 4へ進む。

### Step 4: Codex 他社レビュー（バックグラウンド）+ 4専門エージェント（並列）を同時起動

CodeRabbit完了後、**同じターンで同時に**以下を起動する：

#### 4-A: Codex レビュー（バックグラウンド実行）

Codex（OpenAI）を他社レビュアーとして起動する。TTY不要なためバックグラウンド実行可能。

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/codex-companion.mjs" review --scope branch
```

`run_in_background: true` でBashを呼び出す。起動後は「Codex他社レビューをバックグラウンドで開始しました」とユーザーに伝える。

- ブランチ差分レビューの場合は `--scope branch` を付与してCodexが同じスコープを分析できるようにする
- 未コミット変更のレビューの場合は `--scope branch` を省略する（デフォルトのworking-tree）

**`CLAUDE_PLUGIN_ROOT` が未設定の場合**のフォールバック（動的パス解決）：

```bash
CODEX_SCRIPT=$(ls ~/.claude/plugins/cache/openai-codex/codex/*/scripts/codex-companion.mjs 2>/dev/null | tail -1)
node "$CODEX_SCRIPT" review --scope branch
```

フォールバック実行前に `[ -z "$CODEX_SCRIPT" ]` で存在確認し、空の場合は「Codex他社レビューをスキップ（スクリプト未検出）」と記録して続行する。

#### 4-B: 4専門 Claude エージェントに並列配布（同じターンで同時起動）

CodeRabbitの結果と git diff を以下の4エージェントに **同じターンで同時並行** で渡す（順次実行しないこと）。

Agent ツールの `subagent_type` に各エージェント名を指定して呼び出す：

- `subagent_type: "security-reviewer"`
- `subagent_type: "performance-reviewer"`
- `subagent_type: "accessibility-reviewer"`
- `subagent_type: "code-quality-reviewer"`

各エージェントへの入力テンプレート：

```
以下の情報を元に、専門レビュアーとして分析してください。

## CodeRabbit 静的解析結果
[BashOutput で取得した CodeRabbit の出力テキスト。空の場合は「なし」と記載]

## 変更差分 (git diff)
[git diff の出力。1000行超の場合はファイル一覧のみ]

## 変更ファイル一覧
[git diff --stat の出力]
```

### Step 5: Codex 結果の取得

4エージェントの結果を受け取った後、バックグラウンドのCodexレビューが完了しているか確認する。

- 完了していれば結果テキストを保持する
- まだ実行中の場合は最大3分間待機し、完了次第結果を取得する
- タイムアウトした場合は「Codexレビューが時間内に完了しませんでした」と記録してStep 6へ進む

### Step 6: 集約レポートの作成

CodeRabbit + Codex + 4エージェントの全結果を受け取り、以下の形式で最終レポートを作成：

---

## コードレビュー 総合レポート

### 全体サマリー

| 観点              | Critical   | High       | Medium     | Low        |
| ----------------- | ---------- | ---------- | ---------- | ---------- |
| セキュリティ      | [実数]     | [実数]     | [実数]     | [実数]     |
| パフォーマンス    | [実数]     | [実数]     | [実数]     | [実数]     |
| アクセシビリティ  | [実数]     | [実数]     | [実数]     | [実数]     |
| コード品質        | [実数]     | [実数]     | [実数]     | [実数]     |
| **Codex（他社）** | [実数]     | [実数]     | [実数]     | [実数]     |
| **合計**          | **[合計]** | **[合計]** | **[合計]** | **[合計]** |

### 優先対応リスト（Critical / High のみ）

重要度の高い指摘事項を統合して優先順に列挙：

1. **[Critical]** [観点] - [ファイル]: [問題の概要]
2. **[High]** [観点] - [ファイル]: [問題の概要]

### Codex 他社レビュー結果

Codex（OpenAI）によるレビュー結果をそのまま展開する。Claudeとは異なる視点からの指摘を確認する。

### Claude 専門エージェント別詳細

各エージェントのレビュー結果をそのまま展開する。

---

レポート出力後、優先的に対応すべき項目について修正を始めるかユーザーに確認する。

## エラーハンドリング

**CodeRabbit が見つからない場合**:

- `npm install -g @coderabbit/cli` または `brew install coderabbit` の実行を提案
- git diff のみを4エージェントとCodexに渡してレビューを続行するか確認

**CodeRabbit 認証エラーの場合**:

- `coderabbit auth` での再認証を提案
- git diff のみを4エージェントとCodexに渡してレビューを続行するか確認

**CodeRabbit が TTY エラー（Raw mode not supported）で失敗した場合**:

- `coderabbit --prompt-only` に切り替えて再実行を試みる
- それも失敗する場合は git diff のみを4エージェントとCodexに渡してレビューを続行

**CodeRabbit がタイムアウト（5分超）した場合**:

- git diff のみを4エージェントとCodexに渡してレビューを続行

**Codex が起動できない場合（`CLAUDE_PLUGIN_ROOT` 未設定など）**:

- フォールバックパス `/Users/sakaitaichi/.claude/plugins/cache/openai-codex/codex/1.0.2/scripts/codex-companion.mjs` を試みる
- それも失敗する場合は「Codex他社レビューをスキップ（環境未設定）」と記録してClaude4エージェントのみで続行

**Codex がタイムアウト（3分超）した場合**:

- 「Codexレビューが時間内に完了しませんでした」と記録して集約レポートを作成

**Claude エージェントがエラーになった場合**:

- そのエージェントの結果を「取得できませんでした」と記載して他の結果で集約レポートを作成

## 注意事項

- CodeRabbit は `--prompt-only` でフォアグラウンド実行し、完了を待ってから次のステップへ進む（バックグラウンド実行は TTY エラーのため不可）
- Codex はバックグラウンド実行可能（TTY不要）。4専門エージェントと同じターンで同時起動する
- 4 Claude エージェントは必ず同じターンで並列実行する（順次実行しない）
- Codex は OpenAI 製のため、Claude とは独立した視点でのレビューが期待できる
- 各エージェント・Codexの出力は整形せずそのまま集約レポートに含める
