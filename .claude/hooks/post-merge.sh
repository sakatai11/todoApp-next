#!/bin/bash
# .claude/hooks/post-merge.sh
#
# develop-v2 へのマージ時に仕様書（todoApp-submodule/docs/）を自動更新するフック。
# setup-git-hooks.sh によって .git/hooks/post-merge にシンボリックリンクされます。

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# develop-v2 のマージ時のみ実行
[ "$CURRENT_BRANCH" = "develop-v2" ] || exit 0

# 仕様書更新対象ファイルが変更されているか確認
# 対象: app/, features/, types/, constants/ 配下の .ts/.tsx
# 対象: scripts/ 配下の .ts
# 除外: tests/**、*.config.ts
CHANGED_SOURCE=$(git diff --name-only ORIG_HEAD HEAD -- \
  'app/' 'features/' 'types/' 'constants/' 2>/dev/null \
  | grep -E '\.(ts|tsx)$' \
  | grep -v '\.test\.' \
  | grep -v '\.spec\.' \
  | grep -v '\.config\.ts$' \
  || true)

CHANGED_SCRIPTS=$(git diff --name-only ORIG_HEAD HEAD -- 'scripts/' 2>/dev/null \
  | grep '\.ts$' \
  || true)

if [ -z "$CHANGED_SOURCE" ] && [ -z "$CHANGED_SCRIPTS" ]; then
  echo "📚 [update-specs] 仕様書更新対象の変更なし - スキップ"
  exit 0
fi

# Claude Code CLI の存在確認
if ! command -v claude &>/dev/null; then
  echo ""
  echo "⚠️  [update-specs] claude コマンドが見つかりません。"
  echo "    Claude Code CLI をインストール後、手動で /update-specs を実行してください。"
  exit 0
fi

# ファイル検出と同じ範囲（ORIG_HEAD..HEAD）をそのままClaudeに渡す
ORIG_HEAD_SHA=$(cat "$(git rev-parse --git-dir)/ORIG_HEAD")
COMMIT_RANGE="${ORIG_HEAD_SHA}..HEAD"

echo ""
echo "📚 ============================================"
echo "📚 [update-specs] 仕様書の自動更新を開始します"
echo "📚 ブランチ       : $CURRENT_BRANCH"
echo "📚 コミット範囲   : $COMMIT_RANGE"
echo "📚 ============================================"
echo ""

# プロジェクトルートで実行
cd "$(git rev-parse --show-toplevel)"

# スキルを実行（ファイル検出と同じ範囲を指定）
# --dangerously-skip-permissions: バックグラウンド実行のため確認プロンプトをスキップ
claude --dangerously-skip-permissions -p "/update-specs ${COMMIT_RANGE}"

EXIT_CODE=$?
echo ""
if [ $EXIT_CODE -eq 0 ]; then
  echo "📚 [update-specs] 仕様書の更新が完了しました"
else
  echo "⚠️  [update-specs] 実行中にエラーが発生しました (exit: $EXIT_CODE)"
  echo "    手動で /update-specs を実行して確認してください"
fi

# フックのエラーで git 操作自体を妨げない
exit 0
