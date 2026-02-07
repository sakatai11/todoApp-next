---
name: pr-review-todoapp
description: todoApp-next専用GitHub PR Review Workflow（gh pr-review extension使用）
---

# todoApp-next専用 GitHub PR Review Workflow

このスキルは、todoApp-nextプロジェクト専用のPRレビューワークフローです。`gh-pr-review` 拡張を使用して、レビューコメントの対応からスレッド解決までを自動化します。

**ベースワークフロー**: [github-pr-review-workflow](~/.claude/skills/github-pr-review-workflow/SKILL.md)
**gh-pr-reviewドキュメント**: https://github.com/agynio/gh-pr-review

---

## このプロジェクト固有の特徴

### 技術スタック

- **フレームワーク**: Next.js 15（App Router + Turbopack）
- **認証**: NextAuth.js v5（beta）
- **バックエンド**: Firebase Admin SDK
- **UI**: Material-UI + Tailwind CSS
- **状態管理**: React Context + SWR
- **テスト**: Vitest + React Testing Library + MSW + Playwright

### 重要な開発原則

- **型安全性**: `any`型禁止、厳密な型チェック
- **テストカバレッジ**: 100%達成済み（UT）
- **コード品質**: ESLint + Prettier準拠
- **フィーチャーベース設計**: `features/`内で機能自己完結

---

## Installation

**gh-pr-review拡張をインストール（未インストールの場合）:**

```bash
gh extension install agynio/gh-pr-review
```

**インストール確認:**

```bash
gh pr-review --help
```

---

## Workflow Overview

```text
PR Review Request
  ├─ Get PR number/repo context
  ├─ List all review threads
  ├─ Analyze feedback and comments
  ├─ Validate whether each comment applies and explain decisions
  ├─ Implement fixes in code
  ├─ Run tests (npm run format + npm run test:run)
  ├─ Reply to all open review threads with explanations
  ├─ Wait up to 5 minutes for follow-up
  ├─ Resolve review threads (or address follow-ups)
  └─ Commit and push changes
```

---

## Step-by-Step Process

### 1. Get PR Context

**現在のPR詳細を取得:**

```bash
# PR番号を取得
gh pr view --json number

# PRタイトルとステータスを取得
gh pr view --json title,author,state,reviews

# リポジトリ情報を取得
git remote get-url origin
```

**出力**: PR番号（例: `<PR_NUMBER>`）とリポジトリ（例: `<OWNER/REPO>`）

---

### 2. List Review Threads

**全レビュースレッドを一覧表示:**

```bash
gh pr-review threads list --pr <PR_NUMBER> --repo <OWNER/REPO>
```

**レスポンス形式:**

```json
[
  {
    "threadId": "<THREAD_ID>",
    "isResolved": false,
    "updatedAt": "2026-01-17T22:48:36Z",
    "path": "path/to/file.ts",
    "line": 42,
    "isOutdated": false
  }
]
```

全スレッドが解決済みまたは存在しない場合は、通常のコメントを検索:

```bash
gh pr view <PR_NUMBER> --comments --json author,comments,reviews
```

---

### 3. Read and Analyze Feedback

**GitHubAPI経由でレビューコメントを取得:**

```bash
gh api repos/<OWNER>/<REPO>/pulls/<PR_NUMBER>/comments

# jqでクリーンな出力
gh api repos/<OWNER>/<REPO>/pulls/<PR_NUMBER>/comments \
  --jq '.[] | {id,body,author,created_at,line,path}'
```

**指摘されたファイルを読み取り:**

```bash
# Readツールを使用してファイルコンテキストを理解
```

**フィードバックの分類:**

- **High priority**: セキュリティ、バグ、破壊的変更
- **Medium priority**: コード品質、保守性、テストカバレッジ
- **Low priority**: スタイル、ドキュメント、nice-to-have

**適用可能性の検証（必須）:**

- 各コメントが現在のコードに対して正確で関連性があるか確認
- 提案が不正確、古い、またはこのコードベースで意味をなさない場合は、**詳細な説明とともに返信**
- 時間がかかるという理由で変更をスキップしない—実装するか、なぜすべきでないかを明確に説明

---

### 4. Implement Fixes

**レビューで指摘されたファイルを編集:**

```bash
# EditツールまたはWriteツールを使用
```

**プロジェクト固有の注意事項:**

#### NextAuth.js v5のエラーハンドリング

NextAuth.js v5では、エラーが`CallbackRouteError`でラップされることがあります:

```typescript
try {
  // NextAuth処理
} catch (error) {
  // error.causeをチェック
  if (error instanceof Error && 'cause' in error) {
    console.error('Original error:', error.cause);
  }
}
```

#### Firebase Admin SDK

- サーバーサイド専用（クライアントコンポーネントで使用禁止）
- 環境変数で認証情報を管理

#### 状態管理パターン

**楽観的更新**（削除・移動系）:

- `deleteTodo`, `toggleSelected`, `handleDragEnd`, `handleButtonMove`

**サーバーレスポンス待ち**（作成・編集系）:

- `addTodo`, `saveTodo`, `addList`, `deleteList`, `editList`

#### リポジトリ規約に従う

- 既存パターンを確認（MUI + Tailwind、NextAuth.js v5、Firebase Admin SDK）
- CLAUDE.mdガイドラインに従う
- コードスタイルの一貫性を維持
- 新しいロジックにはテストを追加/更新

---

### 5. Verify Changes (CRITICAL)

**返信前に必ずテストを実行:**

```bash
# フォーマットとリント（推奨）
npm run format

# テスト一回実行
npm run test:run

# カバレッジ付きテスト
npm run test:coverage

# 統合テスト（Firebase Emulator使用）
npm run docker:test:run

# E2Eテスト（必要に応じて）
npm run test:e2e
```

**ビルド確認（重要な変更時）:**

```bash
npm run build
```

**全てがパスすることを確認:**

- ✓ TypeScriptエラーなし
- ✓ ESLint警告/エラーなし
- ✓ 全ユニットテストがパス
- ✓ E2Eテストがパス（該当する場合）
- ✓ テストカバレッジ100%維持（可能な限り）

---

### 6. Commit and Push Changes

**変更をステージングしてコミット:**

```bash
# ステータス確認
git status

# 変更ファイルをステージング
git add <files>

# プロジェクト固有のコミットメッセージ形式
git commit -m "$(cat <<'EOF'
fix: address PR review feedback

- 修正内容のサマリー
- 対応したレビューコメントのリスト

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

**リモートにプッシュ:**

```bash
git push
```

**作業ツリーを確認:**

```bash
git status
# 出力: "nothing to commit, working tree clean"
```

---

### 7. Reply to Review Threads

**修正内容の説明とともに返信:**

```bash
gh pr-review comments reply \
  --pr <PR_NUMBER> \
  --repo <OWNER/REPO> \
  --thread-id <THREAD_ID> \
  --body "$(cat <<'EOF'
@reviewer フィードバックありがとうございます！以下の対応を行いました:

1. 指摘された箇所をリファクタリング
2. 重複ロジックを削除
3. バリデーションを改善
4. テストを追加/更新（カバレッジ100%維持）

変更はコミット abc1234 に含まれています。全テストがパスしています。
EOF
)"
```

**ベストプラクティス:**

- フィードバックを認識
- 何が変更されたかを説明
- 該当する場合はコミットを参照
- 簡潔かつ明確に
- コードスニペットにはコードフェンスを使用

**注意**: 変更をプッシュ後は常に`@reviewer`で返信を開始（例: `@gemini-code-assist...` または `@greptile...`）。複数のレビュアーがいる場合は、コメント元のレビュアーを確認。

**通常のコメントへの返信（レビューではない場合）:**

```bash
gh pr comment <PR_NUMBER> --body "$(cat <<'EOF'
@reviewer … <上記と同様>
EOF
)"
```

**全オープンスレッドに最初に返信:**

1. 全オープンコメントに、実行内容**または**実行しなかった理由を返信
2. 全返信を投稿した後、待機/解決フェーズに進む

---

### 8. Wait for Follow-ups and Resolve Threads

**修正実装、コミットプッシュ、全オープンコメントへの返信後、最大5分間フォローアップを待機:**

```bash
# 1分間レビュアーの応答を待つ
sleep 60

# 新しい返信やスレッドを再確認
gh pr-review threads list --pr <PR_NUMBER> --repo <OWNER/REPO>
```

このステップを最大5回繰り返して、最大5分間待機。

**フォローアップのヒントがある場合は、対処（ステップ3-7）してから解決。**

**確認がある場合は、スレッドを解決:**

```bash
gh pr-review threads resolve \
  --pr <PR_NUMBER> \
  --repo <OWNER/REPO> \
  --thread-id <THREAD_ID>
```

**戦略:**

1. outdatedスレッドを解決（isOutdated: true） - 返信不要
2. activeスレッドに修正内容を返信（または変更なしの説明）
3. 最大5分間レスポンスを待つ
4. 確認後またはレスポンスがない場合にactiveスレッドを解決

---

### 9. Verify All Threads Resolved

**最終チェック:**

```bash
gh pr-review threads list --pr <PR_NUMBER> --repo <OWNER/REPO>
```

**期待される出力**: 全スレッドが`isResolved: true`を表示

---

## プロジェクト固有の検証チェックリスト

**コード品質:**

- ✓ `any`型を使用していない
- ✓ 既存パターンに従っている（MUI + Tailwind）
- ✓ Zodバリデーションを使用（API）

**テスト:**

- ✓ `npm run test:run` がパス
- ✓ カバレッジ100%を維持（可能な限り）
- ✓ サブモジュールデータを使用（独自モックデータ禁止）

**セキュリティ:**

- ✓ Firebase Admin SDKはサーバーサイドのみ
- ✓ 環境変数で機密情報を管理
- ✓ NextAuth.js v5のエラーハンドリング（`error.cause`）

**状態管理:**

- ✓ 適切な更新パターンを使用（楽観的 vs サーバーレスポンス待ち）
- ✓ SWRは初期データ取得のみ（TodoWrapper）

---

## Troubleshooting

| 問題                                   | 解決策                                                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `command not found: gh-pr-review`      | 拡張をインストール: `gh extension install agynio/gh-pr-review`                                          |
| `must specify a pull request via --pr` | PRディレクトリから実行するか`--pr <number>`を追加                                                       |
| `--repo must be owner/repo`            | `-R <owner/repo>`を追加または認証済みリポジトリから実行                                                 |
| Shell escaping issues                  | `heredoc` を使用します。本文中の `git commit` や `gh pr-review comments reply` の例を参照してください。 |
| テストが失敗                           | `npm run format`を実行してから再テスト                                                                  |
| Firebase接続エラー                     | `npm run docker:test`でEmulatorを起動                                                                   |

---

## Resources

- [gh-pr-review GitHub](https://github.com/agynio/gh-pr-review)
- [プロジェクトCLAUDE.md](@.claude/CLAUDE.md)
- [コード品質ルール](@.claude/rules/code-quality.md)
- [セキュリティルール](@.claude/rules/security.md)
- [開発フロールール](@.claude/rules/development.md)
