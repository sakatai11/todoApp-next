#!/bin/bash
set -e

# Firebase Emulatorをバックグラウンドで起動
firebase emulators:start --project=todoapp-test --config=firebase.test.json --only=firestore,auth,ui &
EMULATOR_PID=$!

# Auth Emulatorの準備完了を待機（タイムアウト付き）
TIMEOUT=60
COUNTER=0
until curl -s http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/todoapp-test/config?key=fake-api-key > /dev/null; do
  if [ $COUNTER -ge $TIMEOUT ]; then
    echo "❌ Auth Emulator startup timeout"
    kill $EMULATOR_PID 2>/dev/null || true
    exit 1
  fi
  echo "⏳ Waiting for Auth Emulator... ($COUNTER/$TIMEOUT)"
  sleep 3
  COUNTER=$((COUNTER + 3))
done

# 追加待機時間
sleep 5

# データ初期化実行
echo "🚀 Starting data initialization..."
env USE_TEST_DB_DATA=true \
    FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
    FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
    FIREBASE_PROJECT_ID=todoapp-test \
    tsx scripts/init-firebase-data.ts

echo "✅ Data initialization completed!"
wait $EMULATOR_PID