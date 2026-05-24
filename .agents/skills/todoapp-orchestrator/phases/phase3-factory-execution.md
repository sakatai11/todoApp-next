# Phase 3: Factory Execution [Agent サブエージェント]

`task.type` に応じて該当 factory ファイルを Read し、**Agent ツール（サブエージェント）** として実行する。

> **なぜ Skill ではなく Agent か**: Factory の実行はコードベース探索・実装・テスト作成を含む重いフロー。サブエージェントとして分離することでメインコンテキストウィンドウを保護し、パイプライン全体の管理（Phase 4〜8）を維持できる。

## Factory マッピング

| task.type      | 委譲先                                                                                       |
| -------------- | -------------------------------------------------------------------------------------------- |
| `feature`      | `factories/feature.md`（Exploration → Architecture → Implementation をパイプライン内で完結） |
| `bugfix`       | `factories/bugfix.md`（再現テスト→修正→検証）                                                |
| `ui-change`    | `factories/ui-change.md`（コンポーネント特定→修正→ビジュアル確認）                           |
| `optimization` | `factories/bugfix.md`（`type=optimization` として実行。計測ベースの修正サイクルを適用）      |

## Agent 起動前の事前確認（全規模共通）

Factory を起動する前に、NormalizedTask と関連仕様書から変更予定ファイルを推定してユーザーに提示し、承認を得る。

```text
以下のファイルを変更・作成する予定です。実装を開始してよいですか？

## 変更予定ファイル
- <ファイルパス>: <変更内容1行>
- <ファイルパス>: <変更内容1行>
...

[Y] 開始する  [N] キャンセル  [E] ファイル一覧を修正してから開始
```

- **Y**: Agent を起動する
- **N**: パイプラインを中断
- **E**: ユーザーに「追加・削除したいファイルのパスと理由を教えてください」と尋ね、反映後に更新された一覧を再度提示して Y/N を確認する。確定したファイル一覧は、Agent 起動時の prompt に「修正対象ファイル」として明示的に含める

> **注意**: この時点の一覧は推定であり、探索後に変更が生じる場合がある。その際は実装途中でもユーザーに報告する。

---

## Agent での実行方法（順次実行）

```text
Agent ツールで以下を実行:
  description: "<task.type> factory: <task.title>"
  subagent_type: "general-purpose"
  prompt: """
  <Factory マッピングで解決した factoryPath（例: optimization は factories/bugfix.md）の全内容を Read して貼り付ける>

  ---

  ## 実行するタスク（NormalizedTask）

  type: <task.type>
  source: <task.source>
  title: <task.title>
  description: |
    <task.description>
  acceptanceCriteria:
    - <task.acceptanceCriteria[0]>
    - <task.acceptanceCriteria[1]>
    ...
  context: <task.context の内容>
  branchSlug: <task.branchSlug>

  ---

  ## 返却フォーマット（厳守）

  完了後のサマリーは以下の形式で **500 トークン以内** に収めること。
  実装の詳細説明・コードの引用・探索の記録は含めない。

  ## 変更ファイルリスト
  - <変更ファイルのパス一覧>

  ## IT 必要性
  - app/api/ 変更あり: <yes/no>
  - 変更した API ルート: <パス一覧（あれば）>

  ## 作成・更新した UT ファイル
  - <UT ファイルのパス一覧>
  """
```

## 並列実行モード（Phase 1 で B: Worktree 並列実行が選ばれた場合）

Phase 1 のタスク分解で「B. Worktree 並列実行」が選択されたとき、各タスクを独立した worktree で同時実行する。

**前提確認（並列起動前に必ず確認）**:

- タスク間に依存関係がない（Task 2 が Task 1 の成果物を参照しない）
- 同一ファイルを同時編集しない
- `.claude/rules/development.md` の並列化条件を満たす

**起動方法**:

```text
# 全タスクを同一ターンで並列起動する（順次起動は禁止）
Agent({
  isolation: "worktree",
  subagent_type: "general-purpose",
  description: "<task.type> factory: <task1.title>",
  prompt: "<factory内容 + Task1のNormalizedTask + 返却フォーマット指示>"
})

Agent({
  isolation: "worktree",
  subagent_type: "general-purpose",
  description: "<task.type> factory: <task2.title>",
  prompt: "<factory内容 + Task2のNormalizedTask + 返却フォーマット指示>"
})
```

**並列完了後の処理**:

各 worktree のブランチに対して Phase 4〜8 を**順次実行**する（Quality Gate は並列不可）。
worktree が残存している場合は `git merge` か `git rebase` でメインブランチに統合する方針を人間に確認する。

## Agent 完了後の受け取り情報

Agent が完了したら、以下の情報を受け取って Phase 4 へ進む：

- 変更ファイル一覧
- `app/api/` 変更の有無（IT 実行フラグ）
- 作成・更新した UT ファイル一覧
