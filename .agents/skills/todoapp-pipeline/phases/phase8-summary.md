# Phase 8: Summary

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
- Phase 5 Code Review: <Critical 0 / High N / Medium/Low N>

## 残課題

- <Code Review で「後で修正」を選んだ項目>
- <Quality Gate で skip した項目>

## 次のアクション

1. PR をレビュー
2. Ready for review に変更
3. マージ
```

---

## 途中再開オプション

パイプラインが途中で中断した場合、またはユーザーが手動修正を終えた場合の再開手順。

**「Phase N から再開して」と言われたとき**:

1. 対応する `phases/phaseN-*.md` を Read する
2. 既存のブランチをそのまま使用する（新規ブランチ作成禁止）
3. NormalizedTask は会話履歴から復元する。不明な場合は人間に確認

| 再開ポイント | よくあるケース                                |
| ------------ | --------------------------------------------- |
| Phase 4 から | UT / Build 失敗後に手動修正した               |
| Phase 5 から | Quality Gate は通ったがレビューを再実行したい |
| Phase 6 から | レビュー指摘を修正してコミットし直す          |
| Phase 7 から | PR を作り直したい                             |
