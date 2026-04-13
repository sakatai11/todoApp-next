#!/bin/bash
# .claude/hooks/setup-git-hooks.sh
#
# .claude/hooks/ のフックスクリプトを .git/hooks/ にシンボリックリンクします。
# クローン後や新環境のセットアップ時に一度だけ実行してください。
#
# 使用方法:
#   bash .claude/hooks/setup-git-hooks.sh

set -e

# スクリプト自身の場所からプロジェクトルートを確実に特定する
# （git rev-parse はサブモジュール内で誤ったパスを返す場合があるため使用しない）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
GIT_HOOKS_DIR="$REPO_ROOT/.git/hooks"
CUSTOM_HOOKS_DIR="$REPO_ROOT/.claude/hooks"

echo "🔧 Git フックのセットアップを開始します..."
echo ""

install_hook() {
  local hook_name="$1"
  local source_file="$CUSTOM_HOOKS_DIR/${hook_name}.sh"
  local target_file="$GIT_HOOKS_DIR/$hook_name"

  if [ ! -f "$source_file" ]; then
    echo "  ⚠️  スキップ: $source_file が存在しません"
    return
  fi

  # 既存フック（シンボリックリンク以外）はバックアップ
  if [ -f "$target_file" ] && [ ! -L "$target_file" ]; then
    echo "  ⚠️  既存フックをバックアップ: ${target_file}.bak"
    mv "$target_file" "${target_file}.bak"
  fi

  ln -sf "$source_file" "$target_file"
  chmod +x "$source_file"
  echo "  ✅ $hook_name → $source_file"
}

install_hook "post-merge"

echo ""
echo "✨ セットアップ完了"
echo ""
echo "─────────────────────────────────────────────"
echo " 動作タイミング"
echo "─────────────────────────────────────────────"
echo "  git pull / git merge を develop-v2 上で実行したとき"
echo "  app/, features/, types/, constants/, scripts/*.ts"
echo "  のいずれかに変更があると /update-specs が自動起動します"
echo ""
echo " 前提条件"
echo "─────────────────────────────────────────────"
echo "  claude コマンドが利用可能であること"
echo "  $ claude --version  で確認"
echo ""
echo " フックの無効化"
echo "─────────────────────────────────────────────"
echo "  $ rm .git/hooks/post-merge"
echo "─────────────────────────────────────────────"
