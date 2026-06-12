#!/bin/bash
set -euo pipefail

# Lightweight operational tests for loop-runner.sh.
# These tests use fake claude/gh commands and a temporary git repository, so
# they do not call external services or mutate the real workspace.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
RUNNER_SRC="$ROOT_DIR/.agents/skills/todoapp-backlog-loop/scripts/loop-runner.sh"

if [[ ! -f "$RUNNER_SRC" ]]; then
  echo "runner not found: $RUNNER_SRC" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required to test loop-runner.sh" >&2
  exit 1
fi

PASS_COUNT=0
FAIL_COUNT=0
TMP_ROOT=""
CASE_REPO=""

cleanup() {
  if [[ -n "$TMP_ROOT" && -d "$TMP_ROOT" ]]; then
    rm -rf "$TMP_ROOT"
  fi
}
trap cleanup EXIT

assert_eq() {
  local name="$1"
  local expected="$2"
  local actual="$3"

  if [[ "$expected" == "$actual" ]]; then
    echo "ok - $name"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    echo "not ok - $name: expected=$expected actual=$actual" >&2
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
}

setup_case() {
  local name="$1"
  local fake_mode="$2"

  TMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/todoapp-loop-test.XXXXXX")"
  mkdir -p "$TMP_ROOT/repo/.agents/skills/todoapp-backlog-loop/scripts"
  mkdir -p "$TMP_ROOT/repo/.claude/state"
  mkdir -p "$TMP_ROOT/fakebin"

  cp "$RUNNER_SRC" "$TMP_ROOT/repo/.agents/skills/todoapp-backlog-loop/scripts/loop-runner.sh"
  chmod +x "$TMP_ROOT/repo/.agents/skills/todoapp-backlog-loop/scripts/loop-runner.sh"

  (
    cd "$TMP_ROOT/repo"
    git init -q -b develop-v2
    git config user.email "loop-test@example.com"
    git config user.name "Loop Test"
    printf '.claude/state/\n' > .gitignore
    touch README.md
    git add README.md .gitignore .agents/skills/todoapp-backlog-loop/scripts/loop-runner.sh
    git commit -q -m "test: init loop runner fixture"
  )

  cat > "$TMP_ROOT/fakebin/gh" <<'EOF'
#!/bin/bash
set -euo pipefail
if [[ "${1:-}" == "auth" && "${2:-}" == "status" ]]; then
  exit 0
fi
echo "unexpected gh call: $*" >&2
exit 1
EOF
  chmod +x "$TMP_ROOT/fakebin/gh"

  cat > "$TMP_ROOT/fakebin/claude" <<'EOF'
#!/bin/bash
set -euo pipefail
mode="${FAKE_CLAUDE_MODE:-stop}"
state_file="${FAKE_CLAUDE_STATE:-/tmp/fake-claude-state}"

case "$mode" in
  stop)
    printf '{"result":"LOOP_RESULT: STOP\\nreason: done","is_error":false,"total_cost_usd":0.01}\n'
    ;;
  blocked)
    printf '{"result":"LOOP_RESULT: BLOCKED\\nreason: blocked","is_error":false,"total_cost_usd":0.01}\n'
    ;;
  missing)
    printf '{"result":"no loop result","is_error":false,"total_cost_usd":0.01}\n'
    ;;
  continue_then_stop)
    count=0
    [[ -f "$state_file" ]] && count="$(cat "$state_file")"
    count=$((count + 1))
    printf '%s' "$count" > "$state_file"
    if [[ "$count" -eq 1 ]]; then
      printf '{"result":"LOOP_RESULT: CONTINUE\\nnext_item: issue:1","is_error":false,"total_cost_usd":0.01}\n'
    else
      printf '{"result":"LOOP_RESULT: STOP\\nreason: done","is_error":false,"total_cost_usd":0.01}\n'
    fi
    ;;
  continue_forever)
    printf '{"result":"LOOP_RESULT: CONTINUE\\nnext_item: issue:1","is_error":false,"total_cost_usd":0.01}\n'
    ;;
  error)
    printf '{"result":"failed","is_error":true,"total_cost_usd":0.01}\n'
    ;;
  *)
    echo "unknown fake mode: $mode" >&2
    exit 1
    ;;
esac
EOF
  chmod +x "$TMP_ROOT/fakebin/claude"

  export PATH="$TMP_ROOT/fakebin:$PATH"
  export FAKE_CLAUDE_MODE="$fake_mode"
  export FAKE_CLAUDE_STATE="$TMP_ROOT/fake-claude-state"

  CASE_REPO="$TMP_ROOT/repo"
}

run_case() {
  local name="$1"
  local fake_mode="$2"
  local expected_rc="$3"
  local setup_dirty="${4:-false}"

  setup_case "$name" "$fake_mode"
  local repo="$CASE_REPO"

  if [[ "$setup_dirty" == "true" ]]; then
    printf 'dirty\n' > "$repo/dirty.txt"
  fi

  set +e
  local output_file="$TMP_ROOT/${name// /_}.out"
  (
    cd "$repo"
    LOOP_BRANCH=develop-v2 \
      LOOP_MAX_CYCLES=2 \
      LOOP_INTERVAL=0 \
      LOOP_CYCLE_TIMEOUT=30 \
      LOOP_LOG=.claude/state/test-loop-runner.log \
      .agents/skills/todoapp-backlog-loop/scripts/loop-runner.sh >"$output_file" 2>&1
  )
  local rc=$?
  set -e

  assert_eq "$name" "$expected_rc" "$rc"
  if [[ "$expected_rc" != "$rc" ]]; then
    sed -n '1,160p' "$output_file" >&2
  fi
  cleanup
  TMP_ROOT=""
}

run_case "STOP exits 0" "stop" 0
run_case "BLOCKED exits 2" "blocked" 2
run_case "CLAUDE error exits 2" "error" 2
run_case "missing LOOP_RESULT exits 3" "missing" 3
run_case "CONTINUE then STOP exits 0" "continue_then_stop" 0
run_case "CONTINUE hits max cycles exits 0" "continue_forever" 0
run_case "dirty tree fails preflight" "stop" 1 true

echo "passed: $PASS_COUNT, failed: $FAIL_COUNT"
if [[ "$FAIL_COUNT" -ne 0 ]]; then
  exit 1
fi
