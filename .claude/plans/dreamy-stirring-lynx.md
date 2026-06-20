# fix-security-ci スキル作成プラン

## Context

CIのセキュリティレビュー（`npm audit` ベースのゲート）が Critical 脆弱性を検出した際、
今回は手動で調査・修正・コミット・プッシュを行った。
同様のケースで Claude が自律的に対処できるよう、スキルとして手順を定義する。
スキルのみ（GitHub Actions 連携なし）で実装し、ユーザーが run URL を貼ると Claude が完結する形にする。

---

## スキル構造

```
.claude/skills/fix-security-ci/
├── SKILL.md               # ワークフロー全体（500行以内）
└── references/
    └── fix-strategies.md  # 修正戦略詳細・npm overrides パターン
```

`scripts/` と `assets/` は不要（npm audit 解析は node -e インラインで十分）。

---

## SKILL.md 設計

### フロントマター

```yaml
---
name: fix-security-ci
description: >
  CIのセキュリティゲート（npm audit ベース）が失敗した際に自律的に修正する。
  GitHub Actions の run URL を貼るだけで、ログ取得・脆弱性解析・
  依存関係アップデート・ビルド確認・コミット・プッシュまでを自動実行する。
  「セキュリティCIが失敗した」「npm auditでCritical脆弱性が出た」
  「CIのセキュリティゲートが落ちた」と言った時、または GitHub Actions の
  run URL が貼られた時、または /fix-security-ci コマンド実行時に使用する。
---
```

### ワークフロー（6ステップ）

| Step | 内容                                                                       | 使用ツール                    |
| ---- | -------------------------------------------------------------------------- | ----------------------------- |
| 1    | run URL からリポジトリ・run_id を抽出、なければ最新 run を取得             | `gh run list`                 |
| 2    | 失敗ステップのログ取得・失敗原因を特定（Critical 件数を確認）              | `gh run view --log-failed`    |
| 3    | ローカルで `npm audit --json` を解析し、脆弱パッケージと依存チェーンを特定 | `npm audit --json \| node -e` |
| 4    | `references/fix-strategies.md` を参照し修正戦略を選択（A→B→C 優先順）      | `npm ls` で依存チェーン確認   |
| 5    | 修正を実行 → `npm run build` + `npm run test:run` で確認                   | `npm install`                 |
| 6    | `package.json` + `package-lock.json` をコミット・プッシュ                  | `git add / commit / push`     |

---

## references/fix-strategies.md 設計

- **Strategy A（直接更新）**: `fixAvailable.name` が存在 → `npm install {pkg}@latest`
- **Strategy B（間接依存の親を更新）**: 依存チェーンを辿り、ルートに近い依存を更新（今回の実例: `firebase-admin` + `@google-cloud/storage` を更新）
- **Strategy C（overrides）**: A/B が不可能な場合のみ `package.json` に `overrides` セクションを追加
- セキュリティゲートの判定ロジック: Critical=exit1（ゲートで止まる）、High=warning のみ
- このプロジェクト固有の注意: `npm run build` は `.next` 削除 + ビルドを含むため時間がかかる

---

## 作成手順

### 1. init_skill.py でスケルトン生成

```bash
python3 ~/.claude/plugins/cache/anthropic-agent-skills/document-skills/69c0b1a06741/skills/skill-creator/scripts/init_skill.py \
  fix-security-ci \
  --path .claude/skills
```

### 2. 不要ファイルの削除と内容実装

- `scripts/` ディレクトリを削除
- `assets/` ディレクトリを削除
- `references/api_reference.md` → `references/fix-strategies.md` にリネーム・内容実装
- `SKILL.md` を上記設計に従って実装

### 3. package_skill.py でパッケージ化

```bash
python3 ~/.claude/plugins/cache/anthropic-agent-skills/document-skills/69c0b1a06741/skills/skill-creator/scripts/package_skill.py \
  .claude/skills/fix-security-ci
```

生成された `fix-security-ci.skill` をユーザーに確認してもらいインストール。

---

## 参照ファイル

- `.claude/skills/todoapp-docker-ops/SKILL.md` — Workflow-Based パターンの文体参考
- `.claude/skills/pr-review-todoapp/SKILL.md` — Step-by-Step 記述パターン参考
- `.github/workflows/security-review.yml` — ゲート判定ロジック（Critical=exit1）確認済み

---

## 検証方法

1. スキルインストール後、「セキュリティCIが失敗した」と入力 → スキルがトリガーされることを確認
2. 実際の失敗 run URL を貼って、6ステップが自律的に実行されることを確認
3. `npm audit` で Critical=0 になり CI が通ることを確認
