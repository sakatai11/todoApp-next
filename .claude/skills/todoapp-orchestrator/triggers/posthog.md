# Trigger: PostHog（インターフェースのみ・将来用プレースホルダー）

> **STATUS**: 暫定実装。このプロジェクトに PostHog はまだ導入されていない。クエリ結果や指標を**人間が貼り付ける形**で動作する。完全自動化は将来対応。

## 入力形式

```bash
# 1. posthog: 接頭辞 + 指標サマリー（自然言語）
/todoapp-orchestrator posthog: signin → dashboard で離脱率45%

# 2. posthog: 接頭辞 + JSONエクスポート貼り付け
/todoapp-orchestrator posthog: <JSON または CSV パス>
```

## 処理フロー

### Step 1: 入力解析

| 入力              | 抽出                                              |
| ----------------- | ------------------------------------------------- |
| 自然言語          | 指標 / イベント / 数値を会話で抽出                |
| JSON/CSV ファイル | Read してエラーイベント or ファネル離脱箇所を特定 |

### Step 2: 問題の特定

PostHog データから以下のいずれかを特定：

- **エラー多発イベント**: `$exception` イベントやカスタムエラーログ → bugfix 候補
- **ファネル離脱**: 特定の画面遷移で離脱率が高い → ui-change or optimization
- **パフォーマンス劣化**: ページロード時間 / Core Web Vitals → optimization
- **未使用機能**: 想定より使われていない機能 → 設計再検討（パイプライン対象外）

### Step 3: 該当コード特定

PostHog が示すページ / イベント名から、対応するコードを Grep で探す：

- イベント名 → `posthog.capture('event_name', ...)` の呼び出し箇所
- URL → Next.js のルートファイル（`app/.../page.tsx`）
- エラーメッセージ → 発生源のコード

### Step 4: NormalizedTask 構築

問題種別に応じて type を決定：

```typescript
{
  type: 'bugfix' | 'optimization' | 'ui-change',
  source: 'posthog',
  title: <問題の要約>,
  description: <PostHogデータ + 該当コード>,
  acceptanceCriteria: [
    '<指標> が <目標値> まで改善する',
    '関連するリグレッションテストが pass する',
  ],
  context: {
    posthogQuery: <元のデータパス or クエリ説明>,
  },
  branchSlug: '<type>/<問題のkebab>',
}
```

### Step 5: SKILL.md Phase 1 へ戻る

→ type に応じた factory がディスパッチされる。

## 将来の拡張ポイント

| 機能             | 実装方法案                                                     |
| ---------------- | -------------------------------------------------------------- |
| PostHog SDK 導入 | `posthog-node` を `app/api/webhooks/posthog/route.ts` で受ける |
| 自動アラート連携 | PostHog Alert → webhook → 自動的にこのパイプライン起動         |
| 改善効果計測     | PR マージ後に同じクエリを実行して before/after 比較            |

## エラー時

- データの解釈が曖昧: 人間に質問（「これはバグですか？UX改善ですか？」）
- 該当コードが見つからない: イベント名 / URL を再度確認
- 改善目標が定量化できない: 仮目標を設定して人間に確認
