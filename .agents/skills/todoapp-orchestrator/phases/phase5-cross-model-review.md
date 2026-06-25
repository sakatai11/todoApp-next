# Phase 5: Cross-Model Review [AI判断]

実装者が Codex に変わったため、**レビューの第三者性の向きが反転する**。Claude（別モデル）が Codex の書いたコードをレビューすることでクロスモデル性が自然に成立する。

```text
Skill ツールで skill: "code-review" を起動
```

`code-review` スキルが以下を自動実行する：

- **CodeRabbit 静的解析**（ベンダー中立。実装者が誰でも有効。維持）
- **Claude 専門エージェント群**（security / performance / a11y / code-quality 等）→ **第三者レビューの主役**。Codex が書いたコードを別モデルが検証する
- **Codex レビュー** → `code-review` が `codex-companion.mjs review` として実行する補助レビュー。`task/rescue` の resume とは別系統の review 実行として扱い、第三者レビューの主役は Claude 専門エージェント群に置く

> **役割反転の要点**: 従来は「Claude 実装 → Codex レビュー」で他者性を得ていた。今は「Codex 実装 → Claude（専門 agent）レビュー」が主、Codex レビューは補助。

## レビュー結果の対応

集約レポートを受け取り、以下を提示する：

| 重要度           | 対応                                       |
| ---------------- | ------------------------------------------ |
| **Critical**     | パイプライン中断、ユーザーに必ず確認       |
| **High**         | ユーザーに確認（即修正 / PR後修正 / 無視） |
| **Medium / Low** | サマリーに含めるが自動進行                 |

## 修正の差し戻し先

修正を選んだ場合、**実装者である Codex に `--resume` で差し戻す**のが原則（Phase 4-2 の往復2回ルールを適用）。差し戻し時はレビュー指摘の要点のみを渡す。

- 軽微な修正（lint レベル）は orchestrator（Claude）側で直接対応してよい。
- 差し戻し後は **Phase 4（最終ゲート再実行）から再開**して回帰を確認する。
