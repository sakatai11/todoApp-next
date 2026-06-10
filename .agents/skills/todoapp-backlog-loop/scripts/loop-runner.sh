#!/bin/bash
set -euo pipefail

# todoapp-backlog-loop external runner
#
# todoapp-backlog-loop スキル（1 heartbeat = 1 サイクル）を、外部から安全に繰り返し起動するための
# loop runner。スキル本体は無期限ループを持たず、毎サイクル末尾に
# `LOOP_RESULT: STOP|CONTINUE|BLOCKED` を出して終了する。この runner はその結果だけを見て
# 次サイクルを起動するかどうかを判断する。
#
# これにより PR #156 が持っていた「タスクが尽きるまで自律的に回り続ける」性質を、
# 暴走防止のサーキットブレーカー（最大サイクル数・サイクル間インターバル・コスト上限・
# ブランチ/クリーン検証・BLOCKED 即停止）付きで取り戻す。
#
# 使い方:
#   .agents/skills/todoapp-backlog-loop/scripts/loop-runner.sh
#   LOOP_MAX_CYCLES=3 LOOP_INTERVAL=120 ./loop-runner.sh
#   ./loop-runner.sh --dry-run         # 1 サイクルだけ Phase 2 まで実行（状態を変更しない）
#
# 制御プレーンはこのスクリプトにあり、ループ本体（スキル）には停止条件の判断を委ねない。

# --- 設定（環境変数で上書き可能） -------------------------------------------

LOOP_MAX_CYCLES="${LOOP_MAX_CYCLES:-5}"          # ハードキャップ: 最大サイクル数
LOOP_INTERVAL="${LOOP_INTERVAL:-60}"             # サイクル間インターバル（秒）
LOOP_BRANCH="${LOOP_BRANCH:-develop-v2}"         # 動作を許可するブランチ
LOOP_MAX_ITEMS="${LOOP_MAX_ITEMS:-1}"            # スキルへ渡す --max-items
LOOP_CYCLE_TIMEOUT="${LOOP_CYCLE_TIMEOUT:-1800}" # 1 サイクルの実時間上限（秒）
LOOP_MAX_BUDGET_USD="${LOOP_MAX_BUDGET_USD:-5}"  # 1 サイクルあたりの claude コスト上限（USD）
LOOP_PERMISSION_MODE="${LOOP_PERMISSION_MODE:-acceptEdits}" # claude の権限モード
LOOP_MODEL="${LOOP_MODEL:-}"                      # 空ならセッション既定モデル
LOOP_LOG="${LOOP_LOG:-.claude/state/loop-runner.log}"
CLAUDE_BIN="${CLAUDE_BIN:-claude}"
LOOP_EXTRA_ARGS="${LOOP_EXTRA_ARGS:-}"           # claude へ追加で渡す引数（例: 権限の allowlist）

DRY_RUN=false
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

# --- 出力ヘルパー -------------------------------------------------------------

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ts() { date '+%Y-%m-%d %H:%M:%S'; }

log()  { echo -e "$(ts) $1" | tee -a "$LOOP_LOG"; }
info() { log "${BLUE}ℹ️  $1${NC}"; }
ok()   { log "${GREEN}✅ $1${NC}"; }
warn() { log "${YELLOW}⚠️  $1${NC}"; }
err()  { log "${RED}❌ $1${NC}"; }

# --- 終了コード ---------------------------------------------------------------
# 0: STOP 到達 or 最大サイクル到達（正常終了）
# 1: preflight 失敗 / runner 内部エラー
# 2: BLOCKED（人間の確認・環境復旧が必要）
# 3: LOOP_RESULT を解釈できなかった（安全側に停止）

# --- 割り込みハンドリング -----------------------------------------------------
STOP_REQUESTED=false
on_interrupt() {
  STOP_REQUESTED=true
  warn "中断シグナルを受信。現在のサイクル完了後に停止します。"
}
trap on_interrupt INT TERM

# --- ユーティリティ -----------------------------------------------------------

# claude を実時間上限つきで実行する（macOS には timeout コマンドが無いため watchdog を自前実装）。
# 標準出力は引数で渡したファイルへリダイレクトする。
run_with_timeout() {
  local secs="$1"; shift
  local outfile="$1"; shift

  "$@" >"$outfile" 2>>"$LOOP_LOG" &
  local cmd_pid=$!
  local waited=0

  while kill -0 "$cmd_pid" 2>/dev/null; do
    if [[ "$waited" -ge "$secs" ]]; then
      warn "サイクルが ${secs}s を超過。プロセス(${cmd_pid})を停止します。"
      kill -TERM "$cmd_pid" 2>/dev/null || true
      sleep 3
      kill -KILL "$cmd_pid" 2>/dev/null || true
      return 124
    fi
    sleep 5
    waited=$((waited + 5))
  done

  wait "$cmd_pid"
  return $?
}

# 作業ツリーがクリーンかつ指定ブランチ上にあるか検証する。
verify_repo_state() {
  local current_branch
  current_branch="$(git branch --show-current)"
  if [[ "$current_branch" != "$LOOP_BRANCH" ]]; then
    err "ブランチが ${LOOP_BRANCH} ではありません（現在: ${current_branch}）。"
    return 1
  fi
  if [[ -n "$(git status --porcelain --untracked-files=all)" ]]; then
    err "作業ツリーがクリーンではありません。新規サイクルを開始しません。"
    return 1
  fi
  return 0
}

# --- preflight ----------------------------------------------------------------

mkdir -p "$(dirname "$LOOP_LOG")"

info "=== todoapp-backlog-loop runner 起動 ==="
info "設定: max_cycles=${LOOP_MAX_CYCLES} interval=${LOOP_INTERVAL}s branch=${LOOP_BRANCH} max_items=${LOOP_MAX_ITEMS} budget=\$${LOOP_MAX_BUDGET_USD} dry_run=${DRY_RUN}"

for bin in "$CLAUDE_BIN" gh jq git; do
  if ! command -v "$bin" >/dev/null 2>&1; then
    err "必須コマンドが見つかりません: ${bin}"
    exit 1
  fi
done

if ! gh auth status >/dev/null 2>&1; then
  err "gh が認証されていません（gh auth login が必要）。"
  exit 1
fi

if ! verify_repo_state; then
  err "preflight 失敗。リポジトリ状態を整えてから再実行してください。"
  exit 1
fi

ok "preflight 通過。"

# --- メインループ -------------------------------------------------------------

cycle=0
prompt="/todoapp-backlog-loop --max-items=${LOOP_MAX_ITEMS}"
$DRY_RUN && prompt="/todoapp-backlog-loop --dry-run"

while true; do
  cycle=$((cycle + 1))

  if [[ "$cycle" -gt "$LOOP_MAX_CYCLES" ]]; then
    warn "最大サイクル数(${LOOP_MAX_CYCLES})に到達。安全のため停止します。"
    exit 0
  fi

  info "--- サイクル ${cycle}/${LOOP_MAX_CYCLES} 開始 ---"

  # サイクル開始前にも状態を再検証（前サイクルが repo を変な状態で残していないか）
  if ! verify_repo_state; then
    err "サイクル開始前の状態検証に失敗。停止します。"
    exit 2
  fi

  outfile="$(mktemp -t todoapp-backlog-loop.XXXXXX)"
  claude_args=(-p "$prompt"
    --output-format json
    --permission-mode "$LOOP_PERMISSION_MODE"
    --max-budget-usd "$LOOP_MAX_BUDGET_USD")
  [[ -n "$LOOP_MODEL" ]] && claude_args+=(--model "$LOOP_MODEL")
  # shellcheck disable=SC2206
  [[ -n "$LOOP_EXTRA_ARGS" ]] && claude_args+=($LOOP_EXTRA_ARGS)

  set +e
  run_with_timeout "$LOOP_CYCLE_TIMEOUT" "$outfile" "$CLAUDE_BIN" "${claude_args[@]}"
  run_rc=$?
  set -e

  if [[ "$run_rc" -eq 124 ]]; then
    err "サイクル ${cycle} がタイムアウトしました。停止します。"
    rm -f "$outfile"
    exit 2
  fi

  # claude --output-format json の result テキストを取り出す
  result_text="$(jq -r 'if type == "object" then (.result // "") else "" end' "$outfile" 2>/dev/null || true)"
  is_error="$(jq -r 'if type == "object" then (.is_error // false) else false end' "$outfile" 2>/dev/null || echo "true")"
  cost="$(jq -r 'if type == "object" then (.total_cost_usd // 0) else 0 end' "$outfile" 2>/dev/null || echo "0")"
  rm -f "$outfile"

  if [[ "$run_rc" -ne 0 || "$is_error" == "true" ]]; then
    err "claude 実行がエラー終了しました（rc=${run_rc}, is_error=${is_error}）。停止します。"
    exit 2
  fi

  # result から最後の LOOP_RESULT シグナルを抽出
  loop_result="$(printf '%s\n' "$result_text" | grep -Eo 'LOOP_RESULT:[[:space:]]*(STOP|CONTINUE|BLOCKED)' | tail -n1 | grep -Eo '(STOP|CONTINUE|BLOCKED)' || true)"

  info "サイクル ${cycle} 完了: LOOP_RESULT=${loop_result:-<未検出>} cost=\$${cost}"

  case "$loop_result" in
    STOP)
      ok "STOP を受信。処理すべきタスクはありません。ループを正常終了します。"
      exit 0
      ;;
    BLOCKED)
      err "BLOCKED を受信。人間の確認または環境復旧が必要です。triage-inbox を確認してください。"
      exit 2
      ;;
    CONTINUE)
      if $DRY_RUN; then
        ok "dry-run のため CONTINUE でも 1 サイクルで終了します。"
        exit 0
      fi
      if $STOP_REQUESTED; then
        warn "中断要求済みのため CONTINUE を無視して停止します。"
        exit 0
      fi
      info "CONTINUE を受信。${LOOP_INTERVAL}s 待機して次サイクルへ。"
      sleep "$LOOP_INTERVAL"
      ;;
    *)
      err "LOOP_RESULT を解釈できませんでした。安全側に倒して停止します。"
      exit 3
      ;;
  esac
done
