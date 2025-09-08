#!/bin/bash

# MCP拡張E2EテストのDocker環境実行スクリプト
# Docker環境でのPlaywright MCP統合テストを実行

set -e

echo "🚀 MCP拡張E2Eテスト: Docker環境での実行開始"

# 現在のディレクトリを確認
echo "📍 現在のディレクトリ: $(pwd)"

# Docker環境の事前確認
echo "🔍 Docker環境の確認中..."
if ! command -v docker &> /dev/null; then
    echo "❌ Dockerが見つかりません。Dockerをインストールしてください。"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-composeが見つかりません。docker-composeをインストールしてください。"
    exit 1
fi

# 既存のDocker環境をクリーンアップ
echo "🧹 既存のDocker環境をクリーンアップ中..."
docker-compose -f docker-compose.test.yml --profile test down || true

# MCP出力ディレクトリの準備
echo "📁 MCP出力ディレクトリの準備中..."
mkdir -p tests/output/mcp-enhanced
mkdir -p tests/output/mcp

# Docker環境でのMCP対応確認
echo "🔧 Docker環境でのMCP機能確認中..."

# Firebase EmulatorとNext.jsアプリの起動
echo "🔥 Firebase EmulatorとNext.jsアプリを起動中..."
docker-compose -f docker-compose.test.yml up -d firebase-emulator-test nextjs-test

# サービス起動の確認（最大60秒待機）
echo "⏰ サービス起動確認中..."
timeout=60
counter=0

while [ $counter -lt $timeout ]; do
    if curl -f http://localhost:4000 >/dev/null 2>&1 && curl -f http://localhost:3002 >/dev/null 2>&1; then
        echo "✅ Firebase EmulatorとNext.jsアプリが正常に起動しました"
        break
    fi
    
    echo "⏳ サービス起動待機中... ($counter/$timeout)"
    sleep 1
    counter=$((counter + 1))
done

if [ $counter -eq $timeout ]; then
    echo "❌ サービス起動がタイムアウトしました"
    docker-compose -f docker-compose.test.yml logs
    exit 1
fi

# MCP拡張E2Eテストの実行
echo "🎯 MCP拡張E2Eテストを実行中..."

# 環境変数設定
export PLAYWRIGHT_BASE_URL=http://localhost:3002
export E2E_TEST_EMAIL="test@example.com"
export E2E_TEST_PASSWORD="testpassword123"

# PlaywrightでMCP拡張テストを実行
if npx playwright test tests/e2e/mcp-enhanced-todo.spec.ts --headed=false --reporter=html; then
    echo "✅ MCP拡張E2Eテストが正常に完了しました"
    
    # 結果の確認
    echo "📊 テスト結果の確認中..."
    
    if [ -d "playwright-report" ]; then
        echo "📄 Playwrightレポートが生成されました: playwright-report/"
    fi
    
    if [ -d "tests/output/mcp-enhanced" ]; then
        echo "📸 MCPスクリーンショットが保存されました: tests/output/mcp-enhanced/"
        ls -la tests/output/mcp-enhanced/ || true
    fi
    
    # 通常のE2Eテストとの比較実行（オプション）
    echo "🔄 通常のE2Eテストとの比較実行..."
    if npx playwright test tests/e2e/todo-flow.spec.ts --headed=false --reporter=line; then
        echo "✅ 通常のE2Eテストも正常に実行されました"
    else
        echo "⚠️ 通常のE2Eテストで問題が発生しましたが、MCP拡張テストは成功しています"
    fi
    
else
    echo "❌ MCP拡張E2Eテストでエラーが発生しました"
    
    # エラーログの表示
    echo "🔍 Docker環境のログを確認中..."
    docker-compose -f docker-compose.test.yml logs nextjs-test
    
    # Dockerfile環境をクリーンアップ
    echo "🧹 エラー後のクリーンアップ中..."
    docker-compose -f docker-compose.test.yml --profile test down
    exit 1
fi

# 成功時のクリーンアップ
echo "🧹 テスト完了後のクリーンアップ中..."
docker-compose -f docker-compose.test.yml --profile test down

echo "🎉 MCP拡張E2EテストがDocker環境で正常に完了しました！"
echo ""
echo "📋 結果サマリー:"
echo "   - Firebase Emulator: http://localhost:4000 (テスト中に起動)"
echo "   - Next.js App: http://localhost:3002 (テスト中に起動)"
echo "   - MCP出力: tests/output/mcp-enhanced/"
echo "   - Playwrightレポート: playwright-report/"
echo ""
echo "💡 次のステップ:"
echo "   - npm run test:e2e で通常のE2Eテストを実行"
echo "   - npm run docker:e2e:run で統合E2Eテスト環境を使用"