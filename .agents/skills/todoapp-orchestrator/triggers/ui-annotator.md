# Trigger: UI Annotator（インターフェースのみ・将来用プレースホルダー）

> **STATUS**: 暫定実装。Chrome拡張やSaaS統合は未導入のため、現時点ではスクショファイル + 自然言語注釈の手動入力で動作する。完全自動化は将来対応。

## 入力形式

```bash
# 1. 画像ファイル（接頭辞なし、拡張子で判定）
/todoapp-orchestrator screenshots/dashboard-issue.png

# 2. ui: 接頭辞 + 自然言語
/todoapp-orchestrator ui: ダッシュボードのリストカードのpaddingを増やしたい

# 3. 画像 + 注釈テキスト（対話で順番に質問）
```

## 処理フロー

### Step 1: 入力解析

| 入力                    | 抽出するもの                                                           |
| ----------------------- | ---------------------------------------------------------------------- |
| 画像ファイルのみ        | 画像を Read（Claude のマルチモーダル機能で内容把握）→ 注釈は対話で取得 |
| `ui:` 接頭辞 + テキスト | テキストを注釈として扱う。スクショの有無を確認                         |
| 画像 + テキスト         | そのまま使用                                                           |

### Step 2: 対象画面の特定

スクショまたは注釈から以下を特定：

- **ルート**: どのページか（`/dashboard`, `/admin/users` など）
- **コンポーネント**: 該当のReactコンポーネント（`features/**/components/**` から探す）
- **変更内容**: スタイル変更 / 文言変更 / レイアウト変更 / インタラクション追加

不明確なら人間に質問。

### Step 3: NormalizedTask 構築

```typescript
{
  type: 'ui-change',
  source: 'ui-annotator',
  title: <変更内容の要約>,
  description: <注釈テキスト + 対象画面情報>,
  acceptanceCriteria: [
    '<対象画面>で<変更内容>が反映される',
    'デスクトップ/モバイル両対応で崩れない',
    'a11y上の問題が発生していない',
  ],
  context: {
    screenshotPath: <画像ファイルパス（あれば）>,
  },
  branchSlug: 'ui/<変更内容のkebab>',
}
```

### Step 4: SKILL.md Phase 1 へ戻る

→ Phase 3 では `factories/ui-change.md` がディスパッチされる。

## 将来の拡張ポイント

以下を追加すれば完全自動化できる（現時点では未対応）：

| 機能                     | 実装方法案                                                                      |
| ------------------------ | ------------------------------------------------------------------------------- |
| Chrome拡張連携           | UI Annotator 拡張からのwebhookを受ける `app/api/webhooks/ui-annotator/route.ts` |
| Figma連携                | `figma-use` MCPで該当 frame を取得                                              |
| ビジュアルリグレッション | Playwrightスクショ比較を `factories/ui-change.md` に組み込む                    |

## エラー時

- 画像ファイルが読めない: 即エラー報告
- 対象画面が特定できない: 人間に質問（「どのページの話ですか？」）
- 該当コンポーネントが複数候補: ユーザーに選んでもらう
