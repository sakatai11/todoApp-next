#!/bin/bash
# コミット範囲決定スクリプト
# 使用方法: ./determine_commit_range.sh "$ARGUMENTS"

ARG="$1"

# 数字部分と-bフラグを抽出
COUNT=""
USE_BRANCH_MODE=false

if [[ "$ARG" =~ ^([0-9]+)[[:space:]]+-b$ ]]; then
  # "10 -b" の形式：数字 + ブランチモード
  COUNT="${BASH_REMATCH[1]}"
  USE_BRANCH_MODE=true
elif [[ "$ARG" =~ ^([0-9]+)$ ]]; then
  # 数字のみ
  COUNT="${BASH_REMATCH[1]}"
  USE_BRANCH_MODE=false
elif [ "$ARG" = "-b" ]; then
  # -b のみ
  USE_BRANCH_MODE=true
elif [ -z "$ARG" ]; then
  # 引数なし：デフォルト
  COUNT="5"
  USE_BRANCH_MODE=false
else
  # カスタム範囲指定（例: HEAD~10..HEAD）
  COMMIT_RANGE="$ARG"
  LOG_COUNT=10
fi

# ブランチモードまたは通常モードでコミット範囲を決定
if [ -n "$COUNT" ] || [ "$USE_BRANCH_MODE" = true ]; then
  if [ "$USE_BRANCH_MODE" = true ]; then
    # ブランチ分岐点を取得（develop-v2を優先、なければmain）
    BASE_BRANCH=$(git merge-base develop-v2 HEAD 2>/dev/null || git merge-base main HEAD 2>/dev/null)

    if [ -z "$BASE_BRANCH" ]; then
      echo "エラー: ベースブランチ (develop-v2/main) が見つかりません" >&2
      exit 1
    fi

    if [ -n "$COUNT" ]; then
      # "10 -b" の形式：ブランチ分岐から最新N件
      COMMITS=$(git log --format=%H ${BASE_BRANCH}..HEAD | head -n $COUNT)

      if [ -z "$COMMITS" ]; then
        echo "エラー: ブランチ分岐後のコミットが見つかりません" >&2
        exit 1
      fi

      OLDEST=$(echo "$COMMITS" | tail -n 1)
      COMMIT_RANGE="${OLDEST}^..HEAD"
      LOG_COUNT=$COUNT
    else
      # "-b" のみ：ブランチ分岐から全コミット
      COMMIT_RANGE="${BASE_BRANCH}..HEAD"
      LOG_COUNT=50
    fi
  else
    # 数字のみ：通常モードで直近N件
    COMMIT_RANGE="HEAD~${COUNT}..HEAD"
    LOG_COUNT=$((COUNT > 10 ? COUNT : 10))
  fi
fi

# 結果を出力（COMMIT_RANGE=xxx の形式）
echo "COMMIT_RANGE=${COMMIT_RANGE}"
echo "LOG_COUNT=${LOG_COUNT}"
