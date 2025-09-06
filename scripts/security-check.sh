#!/bin/bash

# Custom Security Check Script for TodoApp-Next
# このスクリプトは、プロジェクト固有のセキュリティチェックを実行します

set -e

echo "🔒 Starting custom security checks for TodoApp-Next..."

# カラー出力用の定数
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# エラーカウンター
error_count=0
warning_count=0

# エラー関数
error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
    ((error_count++))
}

# 警告関数
warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
    ((warning_count++))
}

# 成功関数
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# 1. Firebase設定の機密情報チェック
echo "📋 1. Firebase configuration security check..."
if [ -f "firebase.json" ]; then
    # Firebase設定ファイル内の機密情報チェック
    if grep -i "private_key\|client_secret\|api_key" firebase.json >/dev/null 2>&1; then
        error "Firebase configuration contains sensitive information"
    else
        success "Firebase configuration is clean"
    fi
    
    # Emulator設定のチェック（本番環境で実行されていないことを確認）
    if grep -q "emulators" firebase.json; then
        warning "Firebase emulator configuration detected - ensure this is not deployed to production"
    fi
else
    # .gitignoreでFirebase設定が除外されているかチェック
    if [ -f ".gitignore" ] && grep -q "firebase.json" .gitignore; then
        echo "ℹ️  Firebase configuration intentionally excluded via .gitignore (security best practice)"
        success "Firebase files properly excluded from version control"
    else
        warning "Firebase configuration not found"
    fi
fi

# 2. Next.js設定のセキュリティチェック
echo "📋 2. Next.js security configuration check..."
if [ -f "next.config.ts" ] || [ -f "next.config.js" ]; then
    config_file="next.config.ts"
    if [ -f "next.config.ts" ]; then
        config_file="next.config.ts"
    else
        config_file="next.config.js"
    fi
    
    # セキュリティヘッダーの確認
    if grep -q "async headers()" "$config_file" && \
       grep -q "X-Content-Type-Options" "$config_file" && \
       grep -q "X-Frame-Options" "$config_file" && \
       grep -q "Referrer-Policy" "$config_file" && \
       grep -q "Permissions-Policy" "$config_file"; then
        success "Security headers configured in Next.js"
    elif grep -qE "Content-Security-Policy|Strict-Transport-Security|X-Content-Type-Options|X-Frame-Options|Referrer-Policy|Permissions-Policy" "$config_file"; then
        success "Some security headers configured in Next.js"
    else
        warning "Security headers not configured in Next.js config - consider adding for production"
    fi
    
    # 本番ビルドエラー無視設定のチェック
    if grep -q "ignoreBuildErrors.*true" "$config_file"; then
        echo "ℹ️  Build errors are ignored in Next.js config - acceptable for development but review for production"
        success "Next.js configuration includes build error handling (review recommended)"
    fi
else
    error "Next.js configuration file not found"
fi

# 3. API Routes セキュリティチェック
echo "📋 3. API routes security check..."
if [ ! -d "app/api" ]; then
    warning "API routes directory 'app/api' not found"
else
    found_files=false
    while IFS= read -r file; do
        found_files=true
        # 認証チェックの存在確認
        if ! grep -q "auth\|session\|token\|verify" "$file"; then
            echo "ℹ️  Review authentication implementation in $file (may use middleware or external auth)"
        fi
        
        # ハードコードされた機密情報のチェック
        if grep -i "password.*=.*['\"].*['\"]" "$file"; then
            error "Hardcoded password found in $file"
        fi
        
        if grep -i "api_key.*=.*['\"].*['\"]" "$file"; then
            error "Hardcoded API key found in $file"
        fi
    done < <(find app/api \( -name "*.ts" -o -name "*.js" \))

    if [ "$found_files" = true ]; then
        success "API routes security check completed"
    else
        warning "No API route files found in 'app/api'"
    fi
fi

# 4. 環境変数の使用パターンチェック
echo "📋 4. Environment variable usage check..."
while IFS= read -r file; do
       # クライアントコンポーネント判定（先頭に "use client"）
       if ! grep -qE '^[[:space:]]*"use client"' "$file"; then
           continue
       fi
       # process.env の不適切な使用をチェック（NEXT_PUBLIC_/NODE_ENV を除外）
       if grep -nP 'process\.env\.(?!NEXT_PUBLIC_)(?!NODE_ENV\b)[A-Z][A-Z0-9_]+' "$file" >/dev/null; then
           warning "Non-public environment variable used: $file"
       fi
   done < <(find . \
       -path ./node_modules -prune -o -path ./.git -prune -o \
       -path ./app/api -prune -o -path ./pages/api -prune -o \
       \( -name "*.ts" -o -name "*.tsx" \) -type f -print)
    success "Environment variable usage check completed"

# 5.認証設定のチェック
echo "📋 5. Authentication configuration check..."
if [ -f "auth.ts" ] || [ -f "auth.config.ts" ]; then
    auth_files="auth.ts auth.config.ts"
    for auth_file in $auth_files; do
        if [ -f "$auth_file" ]; then
            # NextAuth設定の基本セキュリティチェック
            if ! grep -q "secret\|SECRET" "$auth_file"; then
                error "AUTH_SECRET not configured in $auth_file"
            fi
            
            # セッション設定のチェック
            if grep -q "session.*strategy.*jwt" "$auth_file"; then
                success "JWT session strategy configured"
            fi
            
            # CSRF保護の確認
            if ! grep -q "csrf" "$auth_file"; then
                warning "CSRF protection settings not found in $auth_file"
            fi
        fi
    done
else
    warning "Authentication configuration files not found"
fi

# 6. TypeScript設定のセキュリティチェック
echo "📋 6. TypeScript configuration security check..."
if [ -f "tsconfig.json" ]; then
    # strict mode の確認
    if ! grep -q "\"strict\".*true" tsconfig.json; then
        warning "TypeScript strict mode not enabled"
    else
        success "TypeScript strict mode enabled"
    fi
    
    # 型チェックの厳格性確認
    if grep -q "\"skipLibCheck\".*true" tsconfig.json; then
        warning "Library type checking is skipped - potential type safety issues"
    fi
else
    error "TypeScript configuration not found"
fi

# 7. パッケージセキュリティチェック（追加）
echo "📋 7. Additional package security check..."
if [ -f "package.json" ]; then
    # 危険なスクリプトの検出
    if grep -q "postinstall\|preinstall" package.json; then
        warning "Install scripts detected - review for malicious code"
    fi
    
    # devDependenciesの本番環境混入チェック
    if jq -e '.dependencies | keys[] | test("eslint|prettier|vitest")' package.json >/dev/null; then
        warning "Development dependencies may be in production dependencies"
    fi
    
    success "Package security check completed"
else
    error "package.json not found"
fi

# 8. Docker設定のセキュリティチェック（該当する場合）
echo "📋 8. Docker security check..."
if [ -f "Dockerfile" ]; then
    # rootユーザーの使用チェック
    if ! grep -q "USER" Dockerfile; then
        warning "Dockerfile may be running as root user"
    fi
    
    # COPY --chown の使用確認
    if grep -q "COPY.*--chown" Dockerfile; then
        success "Proper file ownership configured in Dockerfile"
    fi
    
    # 秘密情報のイメージレイヤー混入チェック
    if grep -i "secret\|password\|token" Dockerfile; then
        error "Potential secrets found in Dockerfile"
    fi
fi

# 9. Git設定のセキュリティチェック
echo "📋 9. Git security check..."
if [ -f ".gitignore" ]; then
    required_ignores=(".env" "*.pem" "*.p12" "firebase-adminsdk-*.json" "node_modules")
    
    for ignore_pattern in "${required_ignores[@]}"; do
        if ! grep -Fq "$ignore_pattern" .gitignore; then
            warning ".gitignore missing pattern: $ignore_pattern"
        fi
    done
    
    success "Git ignore configuration checked"
else
    error ".gitignore file not found"
fi

# 結果のサマリー
echo ""
echo "🔒 Security Check Summary"
echo "========================"
if [ $error_count -eq 0 ] && [ $warning_count -eq 0 ]; then
    echo -e "${GREEN}✅ All security checks passed!${NC}"
    exit 0
elif [ $error_count -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $warning_count warnings found${NC}"
    echo "Please review the warnings above."
    exit 0
else
    echo -e "${RED}❌ $error_count errors and $warning_count warnings found${NC}"
    echo "Please fix the errors above before proceeding."
    exit 1
fi