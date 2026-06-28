# Factory: ui-change（設計フェーズ）

UI 変更のための **設計工場**。Phase 3a で起動され、対象コンポーネントを特定して **Codex に渡す実装指示書を出力する**。**実装・スクショ取得・テスト作成は行わない**（実装は Phase 3b の Codex）。ただし **ビジュアル確認と a11y 担保** は指示書に明記し、最終的な目視確認は orchestrator が人間に依頼する。

## 入力

`NormalizedTask`（type=ui-change）。`context.screenshotPath` または description 内の対象画面情報が必要。

## ゴール

`phases/phase3-factory-execution.md` の「実装指示書テンプレート」に沿った Markdown 本文を返す。

## 処理フロー

### Step 1: 対象コンポーネント特定

```bash
# ルート → ファイル
ls app/<該当ルート>/   # page.tsx, layout.tsx を読む
# page.tsx が import する features/**/templates を辿る
```

修正対象を1〜数件に絞る。複数候補があれば人間に確認：

```
以下のうちどのコンポーネントを修正しますか？
1. features/todo/components/TodoCard.tsx
2. features/todo/templates/TodoList.tsx
```

### Step 2: 現状の挙動把握

`code-explorer` エージェントを起動：

```
プロンプト:
「<対象コンポーネント> の現状を把握してください。

# 観点
1. 利用している MUI / Tailwind のクラス
2. 親コンポーネントから渡される props
3. 参照している Context の状態
4. 既存の a11y 属性（aria-*, role, alt 等）
5. レスポンシブ対応（sm/md/lg breakpoint）

# 変更要求
<NormalizedTask.description>

# 注釈（あれば）
<context.screenshotPath を Read した結果の要約>
」
```

### Step 3: 変更方針の確認（構造変更時のみ）

軽微な変更（padding/margin/文言）なら方針確認は不要。構造変更（レイアウト変更/コンポーネント分割）なら人間に方針を確認：

> 「以下の方針で実装しますか？
> A. 既存コンポーネントを最小限変更
> B. 新コンポーネントを切り出して再利用性を上げる」

### Step 4: 実装指示書の生成

指示書テンプレートを埋める。ui-change 固有として以下を必ず指示書に含める：

- **セクション4（遵守規約・a11y）**:
  - MUI と Tailwind の使い分け規約に従う／ハードコード色は Theme 経由に揃える
  - `<button>` と `<a>` の使い分けを正しく／アイコンに `aria-label`／フォーカス可能要素に `focus-visible` スタイル
  - すべての button/link に判別可能なテキスト or aria-label、フォームコントロールに label
- **セクション5（テスト要件）**:
  - 変更コンポーネントに対応する UT（`features/<機能>/components/__tests__/<Component>.test.tsx`）を実装と同時に作成・更新
  - レンダリング／props・Context 反応／インタラクションを検証
  - スクショテストがあれば `npm run test:e2e -- --grep "<該当画面>" --update-snapshots` の更新も指示
- **セクション6（禁止事項）**: スコープ外の画面に手を入れない

### Step 5: ビジュアル確認の段取り（指示書に記載 + orchestrator が人間依頼）

ビジュアル変更は最終的に人間判断が必要。指示書には「Codex は実装と UT/スクショまで」と書き、**目視確認は orchestrator が Phase 3b 完了後に人間へ依頼**する：

> 「http://localhost:3000/<該当ルート> で確認してください。
> 確認ポイント: 期待通りのレイアウトか / レスポンシブ崩れ（モバイル・デスクトップ）/ ダークモード崩れ」

### Step 6: 返却

完成した実装指示書本文（Markdown）だけを返す。

→ orchestrator が `.codex-tasks/<branchSlug>.md` に書き出し、指示書承認ゲート（Phase 3a）→ Phase 3b（Codex 実装）へ。
a11y の深掘りは Phase 5（code-review）の `accessibility-reviewer` が担う。

## 想定外パターン（設計段階で検出したら人間へ）

### デザインシステム外の変更

新しい色 / サイズ / フォントが必要なら、人間に確認：「新しいデザイントークンを追加しますか？ワンオフで実装しますか？」決定を指示書に反映する。

### 大規模なレイアウト刷新

1コンポーネントに収まらず複数画面に影響する場合、ui-change ではなく feature 扱い。SKILL.md に戻して `factories/feature.md` への切替を提案する。

### モバイル / デスクトップで挙動が異なる

両 breakpoint での確認を人間依頼に必ず含める（Playwright の viewport 切替で自動化も可）。
