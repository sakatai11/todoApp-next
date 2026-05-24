# Trigger: QA / バグ報告

QAやユーザーからのバグ報告を NormalizedTask に正規化する。

## 入力形式

3パターン対応：

```bash
# 1. 接頭辞つき自然言語
/todoapp-orchestrator qa: ログイン後にダッシュボードが空白になる
/todoapp-orchestrator bug: Todo追加で500エラー

# 2. .md ファイル（先頭が "# Bug Report:" や "# QA:" で始まる）
/todoapp-orchestrator reports/bug-2026-04-23.md

# 3. 対話モードからの選択
（SKILL.md Phase 0 の対話で「3. QAバグを修正」を選択）
```

## 期待する bug-report.md フォーマット

```markdown
---
type: bugfix
title: ログイン後にダッシュボードが空白になる
branchSlug: fix-empty-dashboard-after-login
severity: high
---

# Bug Report: ログイン後にダッシュボードが空白になる

## 環境

- ブラウザ: Chrome 134
- OS: macOS 15
- ユーザー種別: 一般ユーザー

## 再現手順

1. /signin でログイン
2. /dashboard にリダイレクトされる
3. ダッシュボードが空白で表示される

## 期待動作

Todoリストとリストカテゴリが表示される

## 実際の動作

真っ白な画面が表示される。コンソールに `Cannot read property 'todos' of undefined`

## スクショ / ログ（任意）

<添付パス>
```

## 処理フロー

### Step 1: 入力種別判定

- 接頭辞 (`qa:`, `bug:`) → 後続テキストを `description` として扱う。再現手順は対話で抽出
- ファイルパス → Read してフォーマット解析
- 対話モード → 必要情報を順番に質問

### Step 2: 必須情報の抽出 / 確認

bugfix では以下が**必須**（NormalizedTask Phase 1 でも再検証）：

| 項目                        | 取得元                             | 不足時                       |
| --------------------------- | ---------------------------------- | ---------------------------- |
| **再現手順**                | `## 再現手順` セクション or 対話   | 必ず質問                     |
| **期待動作**                | `## 期待動作` セクション or 対話   | 必ず質問                     |
| **実際の動作**              | `## 実際の動作` セクション or 対話 | 必ず質問                     |
| **エラーログ / コンソール** | `## スクショ / ログ` or 対話       | 任意（あれば原因特定が早い） |
| **影響範囲**                | `severity` フロントマター or 対話  | 任意                         |

### Step 3: NormalizedTask 構築

```typescript
{
  type: 'bugfix',
  source: 'qa',
  title: <bug report の title または「Fix: <要約>」>,
  description: `## 期待動作\n${expected}\n\n## 実際の動作\n${actual}\n\n## エラーログ\n${logs}`,
  acceptanceCriteria: [
    '再現手順を実行しても期待動作になる',
    '関連するリグレッションテストが pass する',
    // ユーザー追加分があればここに
  ],
  context: {
    reproSteps: [<再現手順の各ステップ>],
    specPath: <bug report ファイルパス（あれば）>,
  },
  branchSlug: <フロントマター or title から生成>,
}
```

### Step 4: SKILL.md Phase 1 へ戻る

→ Phase 3 では `factories/bugfix.md` がディスパッチされる（type=bugfix のため）。

## 補足: 再現テストの先行作成

`factories/bugfix.md` 側で「最初に失敗するテスト（red）を書く」フローを取るため、ここで再現手順を構造化しておくと工場側が楽になる。

`reproSteps` は配列で具体的に：

```typescript
reproSteps: [
  '/signin で email=test@example.com でログイン',
  '/dashboard へリダイレクト',
  'ページが空白になる（コンソールエラー: ...）',
];
```

## エラー時

- 再現手順が抽象的すぎる場合: 具体化を求める（「ボタンを押す」→「どのボタン？」）
- 再現できないバグの場合: パイプラインを進めず、調査タスクに切り替えることを提案
