# Phase 6: Commit & Push [決定論]

## コミットメッセージ規約

このプロジェクトの規約（`.claude/rules/development.md`）に従う：

```text
<type>: <subject>

<body>

Co-Authored-By: Claude <noreply@anthropic.com>
```

> **モデル名について**: `Co-Authored-By` のモデル名はシステムプロンプトに記載された現在のモデル ID から動的に決定する（例: `Claude Sonnet 4.6`、`Claude Opus 4.7` など）。不明な場合は `Claude` のみで十分。

`type` は task.type から導出：

| task.type      | commit type                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------------- |
| `feature`      | `feat`                                                                                          |
| `bugfix`       | `fix`                                                                                           |
| `ui-change`    | 新規UI追加なら `feat`、既存UI修正なら `fix`（AI が description で判断）                         |
| `optimization` | `refactor`（計測指標改善・構造改善ともに `refactor` で統一。`perf` は規約未定義のため使用禁止） |

## 実行

```bash
git add <変更ファイル>          # git add -A は禁止（CLAUDE.md準拠）
git commit -m "$(cat <<'EOF'
<生成したメッセージ>
EOF
)"
git push -u origin <branch>
```
