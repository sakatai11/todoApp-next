---
name: coderabbit-review
description: CodeRabbit CLIでコードレビューを実行（バックグラウンド）。コードの品質チェック、セキュリティ脆弱性の検出、ベストプラクティスの検証を行い、レビュー結果を整理してユーザーに報告する。ユーザーが「コードレビュー」「CodeRabbitでレビュー」と言った時、または/coderabbit-reviewコマンドが実行された時に使用する。
---

# CodeRabbit Review

## Overview

CodeRabbit CLIを使用してコードレビューを実行し、結果を整理してユーザーに報告する。

## Workflow

### 1. 実行前の確認

まず、以下を確認：

```bash
# 現在のブランチとコミット状況
git status
git log --oneline -5

# レビュー対象の変更内容
git diff HEAD
```

### 2. 認証確認

レビュー前に認証状態を確認する：

```bash
coderabbit auth status
```

未認証の場合は **API key 認証を推奨**する。OAuth の `coderabbit auth login` はローカル callback server を立てるため、Codex/サンドボックス環境では失敗しやすい。

API key は機密情報なので、チャットに貼らせない。ユーザー自身のターミナルで以下を実行してもらう：

```bash
coderabbit auth login --api-key <YOUR_API_KEY>
coderabbit auth status
```

### 3. レビュー実行

以下のコマンドをフォアグラウンドで実行：

```bash
coderabbit review --agent --type uncommitted
```

対象に応じて変更する：

```bash
coderabbit review --agent --type committed
coderabbit review --agent --base main
```

**重要**: agent-friendly な構造化出力が必要なため `--agent` を付ける。古い `coderabbit --prompt-only` は使用しない。

### 4. 進行状況の監視

レビュー実行後、以下の手順で進行状況を確認：

1. **ユーザーへの進行状況報告**
   - レビュー開始時: 「CodeRabbitレビューを開始しました」
   - 進行中: 出力を確認して状況を報告
   - 完了時: レビュー結果のサマリーを表示

### 5. レビュー結果の整理

レビューが完了したら、以下の情報を整理して報告：

#### レビュー概要

- レビュー対象のファイル数
- 検出された問題の総数
- 重要度別の内訳（Critical, High, Medium, Low）

#### 主要な指摘事項

重要度の高い指摘事項をピックアップして表形式で表示：

| ファイル | 重要度 | 指摘内容 | 推奨対応 |
| -------- | ------ | -------- | -------- |
| ...      | ...    | ...      | ...      |

#### 推奨アクション

- 優先的に対応すべき項目
- 後回しにできる項目
- 議論が必要な項目

## オプション引数

コマンド実行時に引数が指定された場合の動作：

```bash
/coderabbit-review [オプション]
```

サポートされる引数：

- `committed` - コミット済み変更のみレビュー
- `uncommitted` - 未コミット変更のみレビュー
- `--base <branch>` - 指定ブランチとの差分をレビュー
- `--dir <path>` - 指定ディレクトリ内の変更のみレビュー

例：

```bash
/coderabbit-review uncommitted
/coderabbit-review --base main
```

引数がある場合は内容を CodeRabbit CLI の現行オプションへ変換して実行する：

```bash
coderabbit review --agent --type uncommitted
coderabbit review --agent --base main
```

## エラーハンドリング

以下のエラーが発生した場合の対処：

**CodeRabbit CLIが見つからない**

- インストール状況を確認
- `npm install -g @coderabbit/cli` または `brew install coderabbit` の実行を提案

**認証エラー**

- CodeRabbitの認証状態を確認
- 未認証なら API key 認証を案内する
- API key はチャットに貼らせず、ユーザー自身のターミナルで `coderabbit auth login --api-key <YOUR_API_KEY>` を実行してもらう
- OAuth callback server の起動エラー（`Failed to start server. Is port 0 in use?` / `listen EPERM`）では、OAuth 再試行より API key 認証を優先する

**タイムアウト**

- 大規模な変更の場合は時間がかかることを説明
- 進行状況を定期的に確認

## 注意事項

- レビューには数分かかる場合がある（変更量により異なる）
- `coderabbit --prompt-only` は現行 CLI では使用しない
- ネットワーク接続が必要
- レビュー結果は標準出力に表示される

## 完了後のアクション

レビュー完了後、ユーザーに以下を確認：

1. 指摘事項の修正を開始するか？
2. 特定の指摘について詳細な説明が必要か？
3. レビュー結果をファイルに保存するか？

ユーザーの要望に応じて次のアクションを実行する。
