#!/bin/bash
set -e

# Firebase Emulatorデータディレクトリの確認
EXPORT_DIR="./firebase-emulator-data"

if [ -d "$EXPORT_DIR" ] && [ "$(ls -A $EXPORT_DIR 2>/dev/null)" ]; then
  echo "📁 既存のFirebase Emulatorデータが見つかりました"
  SKIP_INIT=true
  # 既存データをインポートして起動
  firebase emulators:start --project=todoapp-next-dev --config=firebase.dev.json --only=firestore,auth,ui --import="$EXPORT_DIR" --export-on-exit="$EXPORT_DIR" &
else
  echo "🆕 初回起動のため、新しいデータを作成します"
  SKIP_INIT=false
  # 初回起動時はエクスポートのみ設定
  firebase emulators:start --project=todoapp-next-dev --config=firebase.dev.json --only=firestore,auth,ui --export-on-exit="$EXPORT_DIR" &
fi
EMULATOR_PID=$!

# Auth Emulatorの準備完了を待機（タイムアウト付き）
TIMEOUT=60
COUNTER=0
until curl -s http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/todoapp-next-dev/config?key=fake-api-key > /dev/null; do
  if [ $COUNTER -ge $TIMEOUT ]; then
    echo "❌ Auth Emulator startup timeout"
    kill $EMULATOR_PID 2>/dev/null || true
    exit 1
  fi
  echo "⏳ Waiting for Auth Emulator... ($COUNTER/$TIMEOUT)"
  sleep 2
  COUNTER=$((COUNTER + 2))
done

# 追加待機時間
sleep 10

# データ初期化実行（初回のみ）
if [ "$SKIP_INIT" = false ]; then
  echo "🚀 Starting data initialization..."
  env USE_DEV_DB_DATA=true \
      FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
      FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
      FIREBASE_PROJECT_ID=todoapp-next-dev \
      tsx scripts/init-firebase-data.ts
  echo "✅ Data initialization completed!"
else
  echo "⏭️ 既存データを使用するため、初期化をスキップします"
fi

# シグナルハンドラーの設定（正常終了時にエクスポートを実行）
cleanup() {
  echo "🛑 Firebase Emulatorを正常終了中..."
  if [ -n "$EMULATOR_PID" ]; then
    kill -TERM $EMULATOR_PID 2>/dev/null || true
    wait $EMULATOR_PID 2>/dev/null || true
    echo "✅ Firebase Emulatorが正常終了しました"
  fi
  exit 0
}

trap cleanup SIGTERM SIGINT

echo "🔄 Firebase Emulator起動完了。SIGTERM/SIGINTで正常終了します"
wait $EMULATOR_PID