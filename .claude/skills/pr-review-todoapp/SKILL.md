---
name: pr-review-todoapp
description: CodeRabbit・Gemini Code AssistのPRレビューコメントを解析し、指摘事項を自動修正してコミット・プッシュし、レビュースレッドに返信・解決するスキル。
---

# PR レビュー自動対応ワークフロー

## 概要

このスキルはGitHub ActionsのCI環境で実行される。
CodeRabbit・Gemini Code Assistのレビューコメントを解析し、
コードを修正してコミット・プッシュし、スレッドに返信する。

## 前提条件

- 環境変数 `GH_TOKEN`（または `GITHUB_TOKEN`）が設定済み
- `gh` コマンドが利用可能
- `gh-pr-review` extension がインストール済み

## ワークフロー

### Step 1: PR情報とレビューコメントの取得

```bash
# PR番号はワークフローのpromptから取得済み
# PRのレビューコメント一覧を取得
gh pr view ${PR_NUMBER} --repo ${REPO} --json reviews,comments,reviewRequests
gh pr view ${PR_NUMBER} --repo ${REPO} --comments
```

具体的なコマンド例：
```bash
gh pr view 97 --repo sakatai11/todoApp-next --comments
```

### Step 2: レビューコメントの解析

取得したコメントから以下を特定する：
1. **未解決のスレッド**（resolved でないもの）
2. **修正が必要な指摘**（LGTM・称賛・質問でないもの）
3. **指摘されたファイルと行番号**

### Step 3: コードの修正

各指摘事項について：
1. 対象ファイルを Read で読み込む
2. 指摘内容を理解して修正案を作成
3. Edit で修正を適用

**修正の原則：**
- セキュリティ指摘：最優先で対応
- バグ・ロジックエラー：必ず対応
- パフォーマンス改善：内容を確認して対応
- コードスタイル：プロジェクトの規約に従って対応
- 単なる提案・質問：コメントで返答のみ、コード修正は不要

### Step 4: ビルド確認（オプション）

修正後にビルドエラーがないか確認できる場合：
```bash
npm run build 2>&1 | tail -20
```

### Step 5: 変更のコミットとプッシュ

```bash
git add -A
git commit -m "fix: address PR review feedback [skip ci]"
```

プッシュは `git push` コマンドを直接実行する。

**重要**: コミットメッセージには必ず `[skip ci]` を含める（ワークフローの無限ループ防止）。

### Step 6: PRコメントでの返信

各指摘事項に対して、PRコメントで対応内容を報告する：

```bash
gh pr comment ${PR_NUMBER} --repo ${REPO} --body "## レビュー対応完了

以下の指摘事項に対応しました：

### 対応した修正
- [ファイル名]: [修正内容の説明]

### 対応しなかった指摘（理由付き）
- [指摘内容]: [対応しなかった理由]

修正内容をご確認ください。"
```

### Step 7: レビュースレッドの解決

`gh-pr-review` extensionを使用してスレッドを解決する：

```bash
# 解決済みスレッドをマーク（gh-pr-review extensionが利用可能な場合）
gh pr-review resolve --pr ${PR_NUMBER} --repo ${REPO}
```

extensionが動作しない場合は、コメントで「対応完了」を明示するだけで良い。

## 注意事項

- コミットメッセージには必ず `[skip ci]` を含めること
- 修正できない指摘は、理由を明示してコメントで返答する
- 破壊的変更（APIの変更、DBスキーマ変更など）は実施せず、コメントで確認を求める
- テストファイルの修正も必要に応じて行う

## エラーハンドリング

**gh コマンドが失敗した場合**:
- `GH_TOKEN` 環境変数を確認
- `GITHUB_TOKEN` 環境変数にフォールバック

**git push が失敗した場合**:
- `git pull --rebase` してから再度プッシュ

**修正方法が不明な指摘がある場合**:
- コメントで「対応方法を確認中」と返答し、可能な限り修正を試みる
