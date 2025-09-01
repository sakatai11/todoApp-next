#!/bin/bash

# GitHub PR作成時のVRT統合スクリプト
# このスクリプトは以下の処理を順次実行します:
# 1. VRTテスト実行
# 2. VRT結果の解析
# 3. PR テンプレートにVRT結果を自動挿入
# 4. GitHub PR作成

set -e  # エラー時にスクリプトを停止

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ログ関数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# プロジェクトルートディレクトリ
PROJECT_ROOT=$(pwd)
VRT_RESULTS_FILE="${PROJECT_ROOT}/vrt-results.json"
PR_TEMPLATE_PATH="${PROJECT_ROOT}/.github/pull_request_template.md"
TEMP_PR_TEMPLATE="${PROJECT_ROOT}/.github/temp_pr_template.md"

# 引数解析
TITLE=""
BODY=""
SKIP_VRT=false
FORCE_CREATE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --title)
      TITLE="$2"
      shift 2
      ;;
    --body)
      BODY="$2"
      shift 2
      ;;
    --skip-vrt)
      SKIP_VRT=true
      shift
      ;;
    --force)
      FORCE_CREATE=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [OPTIONS]"
      echo "Options:"
      echo "  --title TITLE    PR タイトル"
      echo "  --body BODY      PR 本文"
      echo "  --skip-vrt       VRT テストをスキップ"
      echo "  --force          VRT が失敗してもPR を作成"
      echo "  --help, -h       このヘルプを表示"
      exit 0
      ;;
    *)
      log_error "不明なオプション: $1"
      echo "使用方法: $0 --help"
      exit 1
      ;;
  esac
done

# 必須チェック
check_prerequisites() {
    log_info "前提条件をチェック中..."

    # Node.js/npm
    if ! command -v node &> /dev/null; then
        log_error "Node.js が見つかりません。Node.js をインストールしてください。"
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        log_error "npm が見つかりません。npm をインストールしてください。"
        exit 1
    fi

    # GitHub CLI
    if ! command -v gh &> /dev/null; then
        log_error "GitHub CLI (gh) が見つかりません。GitHub CLI をインストールしてください。"
        log_info "インストール方法: https://cli.github.com/"
        exit 1
    fi

    # tsx (TypeScript実行環境)
    if ! command -v tsx &> /dev/null; then
        log_warning "tsx が見つかりません。npm でインストール中..."
        npm install -g tsx
    fi

    # Gitリポジトリチェック
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "このディレクトリは Git リポジトリではありません。"
        exit 1
    fi

    # PRテンプレートの存在確認
    if [[ ! -f "$PR_TEMPLATE_PATH" ]]; then
        log_error "PR テンプレートが見つかりません: $PR_TEMPLATE_PATH"
        exit 1
    fi

    log_success "前提条件のチェックが完了しました。"
}

# VRT実行
run_vrt_tests() {
    if [[ "$SKIP_VRT" == true ]]; then
        log_warning "VRT テストをスキップしました。"
        return 0
    fi

    log_info "VRT テストを実行中..."
    
    # VRTスクリプトを実行
    if tsx "${PROJECT_ROOT}/scripts/run-vrt.ts"; then
        log_success "VRT テストが正常に完了しました。"
        return 0
    else
        local exit_code=$?
        log_error "VRT テストが失敗しました（終了コード: $exit_code）"
        
        if [[ "$FORCE_CREATE" == true ]]; then
            log_warning "--force オプションが指定されているため、PR作成を続行します。"
            return 0
        else
            log_error "VRT テストの失敗により、PR作成を中止します。"
            log_info "強制的にPRを作成する場合は --force オプションを使用してください。"
            exit $exit_code
        fi
    fi
}

# VRT結果の解析と挿入
process_vrt_results() {
    if [[ "$SKIP_VRT" == true ]]; then
        # VRTをスキップした場合はスキップ情報を挿入
        generate_vrt_skip_content
        return 0
    fi

    if [[ ! -f "$VRT_RESULTS_FILE" ]]; then
        log_warning "VRT 結果ファイルが見つかりません: $VRT_RESULTS_FILE"
        generate_vrt_error_content "VRT結果ファイルが見つかりませんでした"
        return 0
    fi

    log_info "VRT 結果を解析中..."
    
    # jqでJSONを解析
    if ! command -v jq &> /dev/null; then
        log_warning "jq が見つかりません。jq なしでVRT結果を処理します。"
        generate_vrt_fallback_content
        return 0
    fi

    # VRT結果を解析
    local success=$(jq -r '.success' "$VRT_RESULTS_FILE" 2>/dev/null || echo "false")
    local total=$(jq -r '.totalTests' "$VRT_RESULTS_FILE" 2>/dev/null || echo "0")
    local passed=$(jq -r '.passedTests' "$VRT_RESULTS_FILE" 2>/dev/null || echo "0")
    local failed=$(jq -r '.failedTests' "$VRT_RESULTS_FILE" 2>/dev/null || echo "0")
    local screenshots=$(jq -r '.screenshots | length' "$VRT_RESULTS_FILE" 2>/dev/null || echo "0")
    local failed_screenshots=$(jq -r '.failedScreenshots | length' "$VRT_RESULTS_FILE" 2>/dev/null || echo "0")
    local error_message=$(jq -r '.errorMessage // empty' "$VRT_RESULTS_FILE" 2>/dev/null || echo "")
    local report_path=$(jq -r '.reportPath // empty' "$VRT_RESULTS_FILE" 2>/dev/null || echo "")

    generate_vrt_content "$success" "$total" "$passed" "$failed" "$screenshots" "$failed_screenshots" "$error_message" "$report_path"
}

# VRT結果のコンテンツ生成（正常時）
generate_vrt_content() {
    local success=$1
    local total=$2
    local passed=$3
    local failed=$4
    local screenshots=$5
    local failed_screenshots=$6
    local error_message=$7
    local report_path=$8

    VRT_CONTENT="### 📸 Visual Regression Test (VRT) 結果

"

    if [[ "$success" == "true" ]]; then
        VRT_CONTENT+="✅ **VRT テスト: 成功**

"
    else
        VRT_CONTENT+="❌ **VRT テスト: 失敗**

"
    fi

    VRT_CONTENT+="| 項目 | 値 |
|------|-----|
| 総テスト数 | ${total} |
| 成功 | ${passed} |
| 失敗 | ${failed} |
| スクリーンショット数 | ${screenshots} |"

    if [[ $failed_screenshots -gt 0 ]]; then
        VRT_CONTENT+="
| 失敗したスクリーンショット | ${failed_screenshots} |"
    fi

    if [[ -n "$report_path" ]]; then
        VRT_CONTENT+="
| レポート | \`${report_path}\` |"
    fi

    VRT_CONTENT+="

"

    if [[ -n "$error_message" && "$error_message" != "null" ]]; then
        VRT_CONTENT+="**エラー詳細:**
\`\`\`
${error_message}
\`\`\`

"
    fi

    if [[ $failed_screenshots -gt 0 ]]; then
        VRT_CONTENT+="⚠️ **注意:** VRT で差分が検出されています。レポートを確認して、意図した変更かどうかを確認してください。

"
    fi
}

# VRT結果のコンテンツ生成（スキップ時）
generate_vrt_skip_content() {
    VRT_CONTENT="### 📸 Visual Regression Test (VRT) 結果

⏭️ **VRT テスト: スキップ**

VRT テストは \`--skip-vrt\` オプションによりスキップされました。

"
}

# VRT結果のコンテンツ生成（エラー時）
generate_vrt_error_content() {
    local error_msg=$1
    VRT_CONTENT="### 📸 Visual Regression Test (VRT) 結果

❌ **VRT テスト: エラー**

VRT テスト実行中にエラーが発生しました。

**エラー詳細:**
\`\`\`
${error_msg}
\`\`\`

"
}

# VRT結果のコンテンツ生成（フォールバック）
generate_vrt_fallback_content() {
    VRT_CONTENT="### 📸 Visual Regression Test (VRT) 結果

📋 **VRT テスト: 実行済み**

VRT テストは実行されましたが、結果の詳細な解析ができませんでした。
結果ファイル: \`vrt-results.json\`

"
}

# PRテンプレートにVRT結果を挿入
update_pr_template() {
    log_info "PR テンプレートにVRT結果を挿入中..."

    # VRT結果を処理
    process_vrt_results

    # テンプレートをコピー
    cp "$PR_TEMPLATE_PATH" "$TEMP_PR_TEMPLATE"

    # スクリーンショットセクションを置き換え
    # "## スクリーンショット（必要に応じて）" の後にVRT結果を挿入
    sed -i.bak '/## スクリーンショット（必要に応じて）/,/## 変更の種類/{
        /## スクリーンショット（必要に応じて）/!{
            /## 変更の種類/!d
        }
    }' "$TEMP_PR_TEMPLATE"

    # VRT結果を挿入
    sed -i.bak "/## スクリーンショット（必要に応じて）/r /dev/stdin" "$TEMP_PR_TEMPLATE" <<< "
<!-- UI変更がある場合、Before/Afterのスクリーンショットを添付してください -->

${VRT_CONTENT}"

    # バックアップファイルを削除
    rm -f "${TEMP_PR_TEMPLATE}.bak"

    log_success "PR テンプレートにVRT結果を挿入しました。"
}

# GitHub PR作成
create_github_pr() {
    log_info "GitHub PR を作成中..."

    local gh_args=()

    # PRテンプレートを使用
    gh_args+=(--template "$TEMP_PR_TEMPLATE")

    # タイトルが指定された場合
    if [[ -n "$TITLE" ]]; then
        gh_args+=(--title "$TITLE")
    fi

    # 本文が指定された場合
    if [[ -n "$BODY" ]]; then
        gh_args+=(--body "$BODY")
    fi

    # PRを作成
    if gh pr create "${gh_args[@]}"; then
        log_success "GitHub PR が正常に作成されました。"
        
        # 一時ファイルを削除
        rm -f "$TEMP_PR_TEMPLATE"
        
        return 0
    else
        log_error "GitHub PR の作成に失敗しました。"
        
        # 一時ファイルを削除
        rm -f "$TEMP_PR_TEMPLATE"
        
        return 1
    fi
}

# クリーンアップ
cleanup() {
    log_info "クリーンアップ中..."
    
    # 一時ファイルを削除
    if [[ -f "$TEMP_PR_TEMPLATE" ]]; then
        rm -f "$TEMP_PR_TEMPLATE"
    fi
    
    # VRT結果ファイルを削除（オプション）
    if [[ -f "$VRT_RESULTS_FILE" ]]; then
        log_info "VRT結果ファイルを保持しています: $VRT_RESULTS_FILE"
    fi
}

# メイン実行
main() {
    log_info "🚀 GitHub PR作成 (VRT統合) を開始します"
    
    # エラー時にクリーンアップを実行
    trap cleanup EXIT
    
    # 前提条件チェック
    check_prerequisites
    
    # VRTテスト実行
    run_vrt_tests
    
    # PRテンプレート更新
    update_pr_template
    
    # GitHub PR作成
    if create_github_pr; then
        log_success "🎉 PR作成が完了しました！"
        exit 0
    else
        log_error "PR作成が失敗しました。"
        exit 1
    fi
}

# スクリプト実行
main "$@"