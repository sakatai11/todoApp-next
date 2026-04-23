# Factory: ui-change

UI 変更のための工場フロー。**ビジュアル確認**と**a11y担保**を組み込む。

## 入力

`NormalizedTask`（type=ui-change）

`context.screenshotPath` または description 内の対象画面情報が必要。

## 処理フロー

### Step 1: 対象コンポーネント特定

trigger 段階で大まかに特定済みでも、ここで確定させる。

```bash
# ルート → ファイル
ls app/<該当ルート>/
# → page.tsx, layout.tsx を読む

# 該当 page.tsx が import している features/**/templates を辿る
```

最終的に修正対象のコンポーネントファイルを1〜数件に絞る。

複数候補がある場合は人間に確認：

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

### Step 3: 変更方針の確認

軽微な変更（padding/margin/文言）なら即実装。
構造変更（レイアウト変更/コンポーネント分割）なら人間に方針を確認：

> 「以下の方針で実装しますか？
>
> A. 既存コンポーネントを最小限変更
> B. 新コンポーネントを切り出して再利用性を上げる」

### Step 4: 実装

**遵守事項**:

- MUI と Tailwind の使い分け規約に従う
- ハードコードされた色は Theme 経由に揃える
- `<button>` と `<a>` の使い分けを正しく（a11y）
- アイコンには `aria-label` を付与
- フォーカス可能要素は `focus-visible` スタイルを欠かさない

### Step 5: ビジュアル確認

#### 5-1: 開発サーバー起動

```bash
# まだ起動していなければ
npm run dev   # または npm run docker:dev
```

#### 5-2: Playwright スクショ取得（推奨）

このプロジェクトには Playwright が導入されているため、変更前後のスクショで比較する：

```bash
# 変更前のスクショ（修正前にgit stashして取得しておくのが理想）
# 変更後の確認テスト
npx playwright test --grep "<該当画面>" --update-snapshots
```

スクショテストがない場合は、新規にスクショアサーションを追加することを検討。

#### 5-3: 手動確認のリクエスト

ビジュアル変更は最終的に人間の判断が必要。**以下を必ず人間に確認**：

> 「以下の URL で変更後の見た目を確認してください: http://localhost:3000/<該当ルート>
>
> 確認ポイント:
>
> - 期待通りのレイアウトか
> - レスポンシブ崩れがないか（モバイル / デスクトップ）
> - ダークモード対応が崩れていないか（プロジェクトで対応している場合）」

### Step 6: a11y 簡易チェック

以下を確認：

- すべての button / link に判別可能なテキスト or aria-label
- フォームコントロールに label が紐づいている
- カラーコントラストが極端に悪くないか（変更箇所のみ）
- フォーカスリングが見える

不明点があれば pipeline 側の Phase 5 (code-review) で `accessibility-reviewer` が走るので深掘りはそこに任せる。

### Step 7: 変更ファイルリスト返却

- 修正コンポーネントファイル
- 追加 / 更新したスクショテスト
- 人間が手動確認した URL とポイント

→ Phase 4 (Quality Gate) へ

## 想定外パターン

### デザインシステム外の変更

新しい色 / サイズ / フォントを使う必要がある場合は、デザイントークン化を検討。
人間に確認：「新しいデザイントークンを追加しますか？それともワンオフで実装しますか？」

### 大規模なレイアウト刷新

1コンポーネントに収まらず複数画面に影響する場合、これは ui-change ではなく feature 扱い。
SKILL.md に戻して `factories/feature.md` への切替を提案する。

### モバイル / デスクトップで挙動が異なる

両方の breakpoint で動作確認することを必ず人間に依頼。Playwright のviewport 切替で自動化も可。
