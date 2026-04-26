# Factory: feature

新機能実装のための工場フロー。**既存の `todoapp-feature-dev` スキルに委譲**することで重複実装を避ける。

## 入力

`NormalizedTask`（type=feature）

## 処理フロー

### Step 1: コンテキスト引き継ぎ準備

`todoapp-feature-dev` スキルは Phase 1 (Discovery) で `$ARGUMENTS` を受け取る設計。NormalizedTask を以下の形に整形して渡す：

```
[Source: <source>]
[Branch: feature/<branchSlug>]

# <title>

<description>

## Acceptance Criteria
- <acceptanceCriteria[0]>
- <acceptanceCriteria[1]>
...

## Context
<context フィールドの内容（specPath, issueNumber 等）>
```

### Step 2: スキル委譲

```
Skill ツールで skill: "todoapp-feature-dev" を起動
args: <Step 1 で整形したテキスト>
```

### Step 3: Phase 重複の回避

`todoapp-feature-dev` には Phase 7 (Quality Review) があるが、**これは pipeline 側の Phase 5 (Cross-Model Review) と重複する**。

委譲時に明示的に伝える：

> 「Phase 7 (Quality Review) はパイプライン側で実行するためスキップしてください。Phase 8 (Summary) で完了したファイルリストを返してください。」

これにより `todoapp-feature-dev` は Phase 1〜6 + Phase 8 (Summary) を実行する。

### Step 3.5: IT の扱い

`todoapp-feature-dev` の Phase 5 (Testing) は UT を作成する。**IT は pipeline 側の Phase 4-5 で実行**するため、`todoapp-feature-dev` に IT 実行を依頼しない。

ただし、`app/api/` を新規追加・変更した場合は Phase 4-5 で IT 必須となることを、実装ファイルリストに明記して引き継ぐ。

### Step 4: 実装ファイルリストの収集

`todoapp-feature-dev` の Phase 8 で出力された変更ファイルリストを取得し、SKILL.md 側のコンテキストに保存。

Phase 4 (Quality Gate) と Phase 5 (Cross-Model Review) で使う。

### Step 5: SKILL.md Phase 4 へ戻る

実装完了状態でパイプラインに戻る。

## なぜ委譲か（再実装しない理由）

- `todoapp-feature-dev` は Discovery / Codebase Exploration / Architecture Design / Implementation の品質確保された フローを既に持っている
- ここで再実装すると同じことを 2 箇所で保守することになる
- 委譲することで、`todoapp-feature-dev` の改善が自動的にパイプラインにも反映される

## 委譲しないケース

以下の場合は委譲せず、軽量フローで実装する（将来検討）：

- 1ファイルだけの変更（typoや文言修正など）
- 既存パターンをコピーするだけのCRUD追加

現状はすべて `todoapp-feature-dev` に委譲する。
