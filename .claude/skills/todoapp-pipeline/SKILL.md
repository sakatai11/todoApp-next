---
name: todoapp-pipeline
description: 'todoApp-next専用ハイブリッドパイプラインスキル。spec.md / QAバグ報告 / GitHub Issue / UI Annotator / PostHog の5種トリガーを正規化し、決定論的ステップ（typecheck/lint/test/git/PR）と AI 判断ステップ（実装/レビュー）を交互に連結して Draft PR まで自動生成する。ユーザーが「/todoapp-pipeline」「パイプラインを回して」「specから実装して」「Issueから実装して」「QAバグを直して」と言った時に使用する。単発の機能開発のみなら todoapp-feature-dev、レビューのみなら code-review を使うこと。'
---

# todoApp-next Hybrid Pipeline

スライド「ハーネスエンジニアリングにどう向き合うか」(rkaga, 2026/04) のハイブリッドオーケストレーション思想を、このプロジェクトのスキル群を再利用する形で実装したパイプライン。

## Core Principles

- **決定論的ステップは止める**: lint / typecheck / test / build / git は失敗したら必ず止める。ハルシネーションでスキップしない
- **AI判断ステップは前後をゲートで挟む**: AI 実装の前に Spec Quality Gate、後ろに `npm run format && npm run test:run && npm run build`
- **既存スキルは再利用**: `todoapp-feature-dev` / `code-review` / `todoapp-pr-creator` を呼ぶ。同じことを書き直さない
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
└────────────┬────────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────────────┐
│ Phase 2: Branch Creation [決定論]                        │
│   git checkout -b <type>/<slug>                         │
└────────────┬────────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────────────┐
│ Phase 3: Factory Execution [AI判断]                      │
│   task.type に応じて factories/*.md のフローを実行       │
│   ・feature  → todoapp-feature-dev に委譲                │
│   ・bugfix   → factories/bugfix.md（再現→修正→検証）     │
│   ・ui-change → factories/ui-change.md                   │
└────────────┬────────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────────────┐
│ Phase 4: Quality Gate [決定論 + AIリトライ]              │
│   npm run format         ← 失敗時は AI 自動修正→再実行   │
│   npm run lint           ← 失敗時は AI 自動修正→再実行   │
│   npm run test:run       ← 失敗時は人間に確認           │
│   npm run build          ← 失敗時は人間に確認           │
└────────────┬────────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────────────┐
│ Phase 5: Cross-Model Review [AI判断]                     │
│   /code-review を起動（CodeRabbit + Codex + 専門agent群）│
│   Critical/High は人間に確認                            │
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

全トリガーは Phase 1 までに以下の形式に正規化する。これがパイプライン全体の共通インターフェース。

```typescript
type NormalizedTask = {
  type: 'feature' | 'bugfix' | 'ui-change' | 'optimization';
  source: 'spec' | 'qa' | 'github-issue' | 'ui-annotator' | 'posthog';
  title: string; // PR タイトルの素材
  description: string; // 実装するべき内容
  acceptanceCriteria: string[]; // 完了条件（Phase 1 で必須）
  context?: {
    issueNumber?: number;
    specPath?: string;
    screenshotPath?: string;
    posthogQuery?: string;
    reproSteps?: string[];
    relatedDocs?: string[]; // Phase 1-3 で収集した関連仕様書パス
  };
  branchSlug: string; // <type>/<slug> の slug 部分
};
```

---

## Phase 0: Trigger Detection

ユーザー入力 `$ARGUMENTS` を解析してトリガー種別を判定する。

### 判定ルール

| 入力パターン                                        | トリガー                 | 委譲先                     |
| --------------------------------------------------- | ------------------------ | -------------------------- |
| `*.md` ファイルパス                                 | spec or qa               | ファイル中身で判別（後述） |
| `#数字` または `https://github.com/.../issues/数字` | github-issue             | `triggers/github-issue.md` |
| `qa:` または `bug:` 接頭辞                          | qa                       | `triggers/qa.md`           |
| `ui:` または画像ファイルパス（`.png`/`.jpg`）       | ui-annotator             | `triggers/ui-annotator.md` |
| `posthog:` 接頭辞                                   | posthog                  | `triggers/posthog.md`      |
| 引数なし                                            | 対話モード               | 下記参照                   |
| その他自然言語                                      | 対話モード（種別を質問） | 下記参照                   |

### `.md` ファイルの spec / qa 判別ルール

ファイル冒頭に以下のフロントマターまたは見出しがあれば優先：

```yaml
---
type: spec # または enhancement, bugfix
---
```

または見出し行：

```markdown
# Spec: ... ← spec 扱い

# Bug Report: ← qa 扱い

# QA: ... ← qa 扱い
```

判別不能の場合は人間に確認する。

### 対話モード

引数なしで起動された場合：

```
このパイプラインは何をしますか？
1. spec.md から新機能を実装
2. GitHub Issue から実装
3. QAバグを修正
4. UI スクショから変更
5. その他（自由記述）
```

ユーザーの選択に応じて該当 trigger ファイルへ進む。

### 委譲方法

`triggers/<種別>.md` を Read で読み込み、その内容に従って NormalizedTask を構築する。

---

## Phase 1: Spec Quality Gate

NormalizedTask の妥当性を検証し、関連仕様書を収集する。

### 1-1: 必須項目チェック

```
✓ type が 4種のいずれか
✓ title が空でない（最大72文字）
✓ description が50文字以上
✓ acceptanceCriteria が1件以上
✓ branchSlug が conventional branches 規約に従う（kebab-case）
```

不足があれば人間に質問して補完する。**この時点で曖昧な要件を全て解消すること。** あとで聞き直すと工数が膨らむ。

### 1-2: Type 別の追加チェック

- **feature**: ユーザーストーリー or 利用シナリオが description に含まれる
- **bugfix**: `context.reproSteps` が1件以上必須
- **ui-change**: `context.screenshotPath` または「対象画面」が description に明記
- **optimization**: 計測指標（PostHog/Lighthouse 等）が description に明記

### 1-3: 関連仕様書の収集

NormalizedTask の `title` と `description` からキーワードを抽出し、以下のドキュメント群を Grep して関連仕様書を特定する。

#### 検索対象ドキュメント

| ディレクトリ                         | 内容                                              |
| ------------------------------------ | ------------------------------------------------- |
| `todoApp-submodule/docs/app/`        | ページ別仕様（トップ・サインイン・Todo等）        |
| `todoApp-submodule/docs/app/api/`    | API仕様（admin/auth/general）                     |
| `todoApp-submodule/docs/features/`   | コンポーネント・フック・Context仕様               |
| `todoApp-submodule/docs/PRODUCTS.md` | プロジェクト全体構造                              |
| `.claude/rules/`                     | 開発ルール（code-quality/security/development等） |

#### マッピングルール

```bash
# キーワードから対象ドキュメントを絞る
# 例: "Todo" → docs/features/todo/, docs/app/Todoページ.md
# 例: "API" or "エンドポイント" → docs/app/api/
# 例: "認証" or "ログイン" → docs/auth/, docs/app/api/auth/
# 例: "管理" or "admin" → docs/app/api/admin/, docs/app/管理者ユーザー一覧ページ.md

grep -r "<キーワード>" todoApp-submodule/docs/ --include="*.md" -l
```

#### 収集した仕様書の扱い

- ヒットした仕様書を Read して要点を把握する
- **既存仕様と今回の変更が矛盾しないかチェック**（例: 既存APIのレスポンス形式を変えるなら仕様書も更新が必要）
- 仕様書が見つからない場合は「新規領域」として記録し、実装後に仕様書追加を検討
- 収集した仕様書のパスを `NormalizedTask.context.relatedDocs` に付与して Phase 3 に引き継ぐ

```typescript
// NormalizedTask.context への追加例
context: {
  ...existing,
  relatedDocs: [
    'todoApp-submodule/docs/features/todo/contexts/TodoContext.md',
    'todoApp-submodule/docs/app/api/general/todosAPI.md',
  ],
}
```

---

## Phase 2: Branch Creation [決定論]

```bash
# ブランチ命名規約: <type>/<slug>
# type: feature | bugfix | ui | perf
# slug: NormalizedTask.branchSlug

git checkout -b feature/<slug>   # type=feature の場合
git checkout -b bugfix/<slug>    # type=bugfix の場合
git checkout -b ui/<slug>        # type=ui-change の場合
git checkout -b perf/<slug>      # type=optimization の場合
```

既に同名ブランチが存在する場合は人間に確認（上書き or 別名）。

---

## Phase 3: Factory Execution [AI判断]

`task.type` に応じて該当 factory ファイルを Read して実行する。

| task.type      | 委譲先                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------- |
| `feature`      | `factories/feature.md`（→ `todoapp-feature-dev` スキルへ）                                |
| `bugfix`       | `factories/bugfix.md`（再現テスト→修正→検証）                                             |
| `ui-change`    | `factories/ui-change.md`（コンポーネント特定→修正→ビジュアル確認）                        |
| `optimization` | `factories/bugfix.md`（`type=optimization` も受け付ける。計測ベースの修正サイクルを適用） |

各 factory はこの SKILL.md と同じ目的（NormalizedTask を実装する）を共有するが、フローが異なる。

---

## Phase 4: Quality Gate [決定論 + AIリトライ]

実行コマンドは以下の順番。**前のステップが失敗したら次へ進まない。**

### 4-1: Format（自動修正）

```bash
npm run format
```

失敗時：

1. エラーログを取得
2. 該当ファイルを Read してフォーマット崩れの原因を特定
3. AI が修正 → 再度 `npm run format` 実行
4. 3回リトライしても失敗したら人間に報告

### 4-2: Lint（自動修正）

```bash
npm run lint
```

失敗時：

1. エラーログから違反箇所を取得
2. AI がコード修正 → 再度 `npm run lint` 実行
3. 3回リトライしても失敗したら人間に報告

### 4-3: UT（ユニットテスト）（人間確認）

```bash
npm run test:run
```

factories が実装とともに作成した UT をここで全件実行する。カバレッジ100%を維持することを目標とする。

失敗時：

1. **自動修正しない**
2. 失敗したテストとエラーログをユーザーに提示
3. ユーザーに選択肢を提示：
   - **A**: AI が修正を試みる（テスト or 実装どちらを直すか確認）
   - **B**: パイプラインを中断（ユーザーが手動修正）
   - **C**: テストを skip してそのまま進む（推奨しない、明示確認）

### 4-4: Build（人間確認）

```bash
npm run build
```

このプロジェクトは `package.json` に独立した `typecheck` スクリプトが存在しない。`npm run build` が TypeScript コンパイルを内包するため、型チェックはこのステップで兼ねる。

失敗時：Test と同じく人間に確認。型エラーは ESLint 修正以上に副作用が広いため AI 自動修正禁止。

### 4-5: IT（統合テスト）（人間確認）

API ルートや Firebase Emulator との連携が変更に含まれる場合のみ実行する。

**実行判断基準**:

| 変更内容                                 | IT 実行       |
| ---------------------------------------- | ------------- |
| `app/api/` 配下の変更あり                | ✅ 必須       |
| Firebase Firestore / Auth の操作変更あり | ✅ 必須       |
| `features/` のみ（API呼び出しなし）      | ⬜ スキップ可 |
| スキルファイル・ドキュメントのみ         | ⬜ スキップ   |

IT が必要と判断した場合は `todoapp-docker-ops` スキルに委譲する：

```
Skill ツールで skill: "todoapp-docker-ops" を起動
args: "統合テストを実行してください"
```

`todoapp-docker-ops` が以下を自動処理する：

- ポート競合チェック（3002/4000/8080/9099）
- Docker + Firebase Emulator 起動（`npm run docker:test`）
- 統合テスト実行（`npm run docker:test:run`）
- テスト完了後のクリーンアップ

失敗時：UT と同じく人間に確認。Docker 環境の問題（ポート競合・Emulator起動失敗等）は `todoapp-docker-ops` のトラブルシューティングフローに従う。

---

## Phase 5: Cross-Model Review [AI判断]

```
Skill ツールで skill: "code-review" を起動
```

`code-review` スキルが以下を自動実行する：

- CodeRabbit 静的解析
- Codex（他社モデル）レビュー
- 変更ファイルパターンに応じた専門 Claude エージェント群

集約レポートを受け取り、以下を提示：

| 重要度           | 対応                                       |
| ---------------- | ------------------------------------------ |
| **Critical**     | パイプライン中断、ユーザーに必ず確認       |
| **High**         | ユーザーに確認（即修正 / PR後修正 / 無視） |
| **Medium / Low** | サマリーに含めるが自動進行                 |

修正を選んだ場合は Phase 4 から再実行。

---

## Phase 6: Commit & Push [決定論]

### コミットメッセージ規約

このプロジェクトの規約（`.claude/rules/development.md`）に従う：

```
<type>: <subject>

<body>

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

`type` は task.type から導出：

| task.type      | commit type                                                                    |
| -------------- | ------------------------------------------------------------------------------ |
| `feature`      | `feat`                                                                         |
| `bugfix`       | `fix`                                                                          |
| `ui-change`    | 新規UI追加なら `feat`、既存UI修正なら `fix`（AI が description で判断）        |
| `optimization` | 計測指標の改善なら `perf`、構造改善なら `refactor`（AI が description で判断） |

### 実行

```bash
git add <変更ファイル>          # git add -A は禁止（CLAUDE.md準拠）
git commit -m "$(cat <<'EOF'
<生成したメッセージ>
EOF
)"
git push -u origin <branch>
```

---

## Phase 7: Draft PR Creation [決定論]

```
Skill ツールで skill: "todoapp-pr-creator" を起動
```

PR 本文には以下を含めるよう指示：

```markdown
## Summary

<NormalizedTask.description のサマリー>

## Trigger

<source>: <context の該当情報>

## Acceptance Criteria

- [ ] <NormalizedTask.acceptanceCriteria>

## Pipeline Log

- Phase 4 Quality Gate: ✓ PASS
- Phase 5 Code Review:
  - Critical: 0
  - High: <件数>（対応: <ユーザー判断>）
  - Medium/Low: <件数>

## Test plan

- [ ] <factory が記録したテスト手順>
```

**Draft フラグ必須**: `gh pr create --draft ...`

---

## Phase 8: Summary

最終レポートをユーザーに提示する。

```markdown
# Pipeline Complete

## Trigger

<source> → <type>

## Result

- ブランチ: <branch>
- PR: <URL>
- Status: Draft

## Phase ごとのステータス

- Phase 4 Quality Gate: ✓
- Phase 5 Code Review: <Critical 0 / High N / Medium N>

## 残課題

- <Code Review で「後で修正」を選んだ項目>
- <Quality Gate で skip した項目>

## 次のアクション

1. PR をレビュー
2. Ready for review に変更
3. マージ
```

---

## エラーハンドリング全般

- **どのフェーズでも例外発生時は即座に人間に報告**。サイレントに次へ進まない
- **作業途中の中断時はブランチを残す**。デリート提案禁止（CLAUDE.md準拠）
- **環境セットアップが必要な場合**（例: Docker emulator 起動）は事前に人間に確認

---

## 関連スキル / ファイル

- 既存スキル: `todoapp-feature-dev`, `code-review`, `todoapp-pr-creator`, `coderabbit-review`
- ルール: `.claude/rules/development.md`, `.claude/rules/code-quality.md`, `.claude/rules/security.md`
- triggers: `triggers/spec.md`, `triggers/qa.md`, `triggers/github-issue.md`, `triggers/ui-annotator.md`, `triggers/posthog.md`
- factories: `factories/feature.md`, `factories/bugfix.md`, `factories/ui-change.md`
