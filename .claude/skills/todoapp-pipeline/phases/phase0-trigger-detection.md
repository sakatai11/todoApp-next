# Phase 0: Trigger Detection

ユーザー入力 `$ARGUMENTS` を解析してトリガー種別を判定する。

## 判定ルール

| 入力パターン                                        | トリガー                 | 委譲先                     |
| --------------------------------------------------- | ------------------------ | -------------------------- |
| `*.md` ファイルパス                                 | spec or qa               | ファイル中身で判別（後述） |
| `#数字` または `https://github.com/.../issues/数字` | github-issue             | `triggers/github-issue.md` |
| `qa:` または `bug:` 接頭辞                          | qa                       | `triggers/qa.md`           |
| `ui:` または画像ファイルパス（`.png`/`.jpg`）       | ui-annotator             | `triggers/ui-annotator.md` |
| `posthog:` 接頭辞                                   | posthog                  | `triggers/posthog.md`      |
| 引数なし                                            | 対話モード               | 下記参照                   |
| その他自然言語                                      | 対話モード（種別を質問） | 下記参照                   |

## `.md` ファイルの spec / qa 判別ルール

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

## 対話モード

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

## 委譲方法

`triggers/<種別>.md` を Read で読み込み、その内容に従って NormalizedTask を構築する。
