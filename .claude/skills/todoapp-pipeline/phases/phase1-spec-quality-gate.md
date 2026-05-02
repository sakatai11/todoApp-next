# Phase 1: Spec Quality Gate

NormalizedTask の妥当性を検証し、関連仕様書を収集する。

## 1-1: 必須項目チェック

```
✓ type が 4種のいずれか
✓ title が空でない（最大72文字）
✓ description が50文字以上
✓ acceptanceCriteria が1件以上
✓ branchSlug が conventional branches 規約に従う（kebab-case）
```

不足があれば人間に質問して補完する。**この時点で曖昧な要件を全て解消すること。** あとで聞き直すと工数が膨らむ。

## 1-2: Type 別の追加チェック

- **feature**: ユーザーストーリー or 利用シナリオが description に含まれる
- **bugfix**: `context.reproSteps` が1件以上必須
- **ui-change**: `context.screenshotPath` または「対象画面」が description に明記
- **optimization**: 計測指標（PostHog/Lighthouse 等）が description に明記

## 1-3: 関連仕様書の収集

NormalizedTask の `title` と `description` からキーワードを抽出し、以下のドキュメント群を Grep して関連仕様書を特定する。

### 検索対象ドキュメント

| ディレクトリ                         | 内容                                              |
| ------------------------------------ | ------------------------------------------------- |
| `todoApp-submodule/docs/app/`        | ページ別仕様（トップ・サインイン・タスク等）      |
| `todoApp-submodule/docs/app/api/`    | API仕様（admin/auth/general）                     |
| `todoApp-submodule/docs/features/`   | コンポーネント・フック・Context仕様               |
| `todoApp-submodule/docs/PRODUCTS.md` | プロジェクト全体構造                              |
| `.claude/rules/`                     | 開発ルール（code-quality/security/development等） |

### マッピングルール

キーワードから対象ドキュメントを絞り込む：

- `"タスク"` → `docs/features/todo/`, `docs/app/api/general/`
- `"API"` or `"エンドポイント"` → `docs/app/api/`
- `"認証"` or `"ログイン"` → `docs/auth/`, `docs/app/api/auth/`
- `"管理"` or `"admin"` → `docs/app/api/admin/`

```bash
grep -r "<キーワード>" todoApp-submodule/docs/ --include="*.md" -l
```

### 収集した仕様書の扱い

- ヒットした仕様書を Read して要点を把握する
- **既存仕様と今回の変更が矛盾しないかチェック**（例: 既存APIのレスポンス形式を変えるなら仕様書も更新が必要）
- 仕様書が見つからない場合は「新規領域」として記録し、実装後に仕様書追加を検討
- 収集した仕様書のパスを `NormalizedTask.context.relatedDocs` に付与して Phase 3 に引き継ぐ

```typescript
context: {
  ...existing,
  relatedDocs: [
    'todoApp-submodule/docs/features/todo/contexts/TodoContext.md',
    'todoApp-submodule/docs/app/api/general/todosAPI.md',
  ],
}
```

## 1-4: タスク分解判定

以下の条件のいずれかに該当する場合、タスク分解を検討する：

| 条件                                             | 目安                 |
| ------------------------------------------------ | -------------------- |
| `acceptanceCriteria` が 6件以上                  | 機能ごとにグループ化 |
| `description` に独立した複数機能が列挙されている | 機能単位で分割       |
| 変更ファイルが推定 8件以上になりそう             | 関心領域で分割       |

**判断フロー**:

1. 上記条件に該当する場合、分割案を作成してユーザーに提示する：

   ```
   この仕様は大規模です。以下の分割を提案します：

   Task 1: <title-1>
     AC: ●、●、●
   Task 2: <title-2>
     AC: ●、●、●

   実行方法を選択してください：
   A. 分割して順次実行（デフォルト）
   B. 分割して Worktree 並列実行（タスク間に依存がなく同一ファイルを変更しない場合のみ）
   C. 分割せずそのまま実行
   ```

2. **A（順次実行）**: Task 1 → Phase 2〜8 まで完結 → Task 2 → Phase 2〜8 を繰り返す
3. **B（並列実行）**: 以下の条件を全て確認してから `isolation: "worktree"` で Agent を並列起動する：
   - Task 間に依存関係がない（Task 2 が Task 1 の成果物を参照しない）
   - 同一ファイルを同時編集しない
   - CLAUDE.md の並列化条件（`.claude/rules/development.md` 参照）を満たす
4. **C（そのまま）**: 分割せず Phase 2 へ進む
5. 条件に非該当 or C が選ばれた場合はそのまま Phase 2 へ進む
