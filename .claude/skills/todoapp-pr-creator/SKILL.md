---
name: todoapp-pr-creator
description: 'todoApp-next専用PR作成スキル。グローバルのpr-creatorをベースに、PR作成後にcode-reviewオーケストレーターを自動起動するStep 7を追加したバージョン（Generator-Verifierパターン）。使用タイミング: (1) ユーザーが明示的にPR作成を依頼した時（「PRを作成して」「Pull Requestを作成」など）、(2) コミット完了後にPRが必要な文脈、(3) feature/hotfix/releaseブランチからのマージ準備時'
model: sonnet
---

# GitHub Pull Request 自動作成（todoApp-next専用）

グローバルの `pr-creator` をベースに、PR作成後に `code-review` オーケストレーターを自動起動する Step 7 を追加したバージョン。

## Configuration

### Project-Specific Branch Strategy

プロジェクトルートに `.claude-pr-config.json` がある場合は読み込む。設定ファイルの詳細は [branch-config-example.json](references/branch-config-example.json) を参照。

### Default Branch Strategy

設定ファイルがない場合のデフォルト設定:

- `feature/*` → `develop-v2`
- `hotfix/*` → `main`
- `release/*` → `main`
- `bugfix/*` → `develop-v2`
- その他 → git 履歴から判定、不明な場合は `develop-v2`

## Workflow

### Step 1: Check Prerequisites

以下を確認:

```bash
# GitHub CLI がインストール済みか確認
gh --version

# 現在のブランチを確認
git branch --show-current

# コミット済みの変更があるか確認
git status
```

未コミットの変更がある場合は、ユーザーに確認してコミットを促す。

### Step 2: Determine Base Branch

以下の優先順位でベースブランチを決定:

1. **設定ファイルがある場合**: `.claude-pr-config.json` のブランチパターンマッチング
2. **設定ファイルがない場合**: デフォルトのブランチ戦略を使用
3. **パターンマッチ失敗時**: git reflog で分岐元を確認

#### Pattern Matching Logic

現在のブランチ名が以下のパターンに一致するか確認:

```bash
# 現在のブランチ名を取得
CURRENT_BRANCH=$(git branch --show-current)

# パターンマッチング（設定ファイルまたはデフォルト）
# feature/* の場合 → develop-v2 (または設定ファイルの値)
# hotfix/* の場合 → main (または設定ファイルの値)
# etc.
```

#### Git History Fallback

パターンマッチが失敗した場合:

```bash
# 分岐元ブランチを確認
git reflog show --all | grep "checkout: moving from" | head -1

# または merge-base で共通祖先を探す
git merge-base --fork-point ${BASE_BRANCH:-develop-v2} 2>/dev/null
```

### Step 3: Gather PR Information

PR 作成に必要な情報を収集:

```bash
# 現在のブランチとベースブランチの差分を確認
git diff ${BASE_BRANCH}...HEAD

# コミット履歴を確認（PR説明文用）
git log ${BASE_BRANCH}..HEAD --oneline

# より詳細なログ（Summary作成用）
git log ${BASE_BRANCH}..HEAD --pretty=format:"%h - %s (%an, %ar)"
```

### Step 4: Create PR Description

#### 4.1 Check for Project PR Template

プロジェクトルートの`.github/pull_request_template.md`を確認:

```bash
if [ -f .github/pull_request_template.md ]; then
  cat .github/pull_request_template.md
fi
```

#### 4.2 Generate PR Description

**テンプレートが存在する場合**:

- テンプレートの構造に従って PR 説明文を生成
- **重要**: テンプレートファイルのタイトル行（例: `# プルリクエストテンプレート`）は除外する
- コミットメッセージと差分から各セクションを埋める
- コメント行（`<!-- ... -->`）はそのまま残す
- チェックリスト項目は未チェック状態で残す

**テンプレートがない場合**:
以下のデフォルト形式で PR 説明文を作成:

```markdown
## Summary

- [変更内容のサマリー（箇条書き）]
- [主な機能追加や修正内容]
- [影響範囲]

## Test plan

- [テスト実施内容]
- [確認項目]
- [動作確認方法]

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

#### 4.3 Determine PR Title

Conventional Commits形式でPRタイトルを決定:

**形式**: `<type>[optional scope]: <description>`

**タイプ判定の手順**:

1. **変更内容を分析**:

   ```bash
   # 変更されたファイルを確認
   git diff ${BASE_BRANCH}...HEAD --name-only

   # 差分内容を確認
   git diff ${BASE_BRANCH}...HEAD
   ```

2. **変更内容からtypeを判定**:
   - **feat**: 新しいファイル・コンポーネント・機能の追加
   - **fix**: バグ修正（エラーハンドリング、条件分岐の修正等）
   - **docs**: ドキュメント、README、コメントのみの変更
   - **style**: フォーマット、空白、セミコロン等（ロジック変更なし）
   - **refactor**: 機能変更なしのコード改善
   - **perf**: パフォーマンス改善
   - **test**: テストファイルの追加・修正（`*.test.*`, `*.spec.*`）
   - **build**: package.json、webpack、ビルド設定の変更
   - **ci**: CI設定（`.github/workflows/`, `.circleci/`等）
   - **chore**: その他（.gitignore、設定ファイル、ツール変更等）

3. **descriptionの生成**:
   - 変更内容を簡潔に要約
   - 英語推奨だが、日本語プロジェクトなら日本語でも可
   - 動詞から始める（add, update, fix, remove等）

### Step 5: Push and Create PR

ブランチをプッシュして PR を作成:

```bash
# リモートブランチの状態を確認
git remote -v
git branch -vv

# 常に最新コミットをリモートにプッシュ
git push -u origin ${CURRENT_BRANCH}

# PRを作成（Step 4 で生成した説明文を使用）
gh pr create \
  --base ${BASE_BRANCH} \
  --title "${PR_TITLE}" \
  --body "${PR_DESCRIPTION}"
```

### Step 6: Return PR URL

PR 作成後、URL を返す:

```bash
# 作成したPRのURLを取得
gh pr view --json url -q '.url'
```

### Step 7: 自動コードレビュー（Generator-Verifier）

PR 作成完了後、**自動的にコードレビューを起動**する。ユーザーへの確認は不要。

1. ユーザーに「PR作成完了。コードレビューを開始します...」と伝える
2. `code-review` スキルを呼び出す（Skill ツールで `skill: "code-review"` を実行）
3. `code-review` の Step 1 で未コミット変更がないと判断された場合は、ブランチ差分（`git diff ${BASE_BRANCH}...HEAD`）を使用するよう指示する
4. レビュー結果の優先対応リストを提示し、修正するかユーザーに確認する

## Error Handling

### No Commits

変更がコミットされていない場合:

```bash
if [ -z "$(git log ${BASE_BRANCH}..HEAD)" ]; then
  echo "エラー: ベースブランチとの差分がありません。コミットを作成してください。"
  exit 1
fi
```

### GitHub CLI Not Installed

`gh` コマンドが利用できない場合、ユーザーに通知:

```text
GitHub CLIがインストールされていません。
以下のコマンドでインストールしてください:

brew install gh  # macOS
```

### Authentication Required

GitHub 認証が必要な場合:

```bash
gh auth status || gh auth login
```

## Notes

- グローバルの `pr-creator` をオーバーライドしたtodoApp-next固有バージョン
- Step 7 のみグローバル版と異なる（`code-review` 自動起動）
- グローバル版に変更があった場合は Step 1〜6 を手動で同期すること
