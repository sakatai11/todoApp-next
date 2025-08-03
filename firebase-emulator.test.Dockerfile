# Firebase Emulator用カスタムDockerfile（テスト環境専用）
FROM node:18-alpine

# 必要なパッケージをインストール
RUN apk add --no-cache openjdk11-jre curl && \
    npm install -g firebase-tools tsx

# 作業ディレクトリを設定
WORKDIR /workspace

# Firebase Emulatorを起動するコマンド
CMD ["sh", "-c", "firebase emulators:start --project=todoapp-test --config=firebase.test.json --only=firestore,auth,ui & until curl -s http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/todoapp-test/config?key=fake-api-key > /dev/null; do echo 'Waiting for Auth Emulator...'; sleep 3; done && sleep 5 && echo 'Starting data initialization...' && env USE_TEST_DB_DATA=true FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 FIREBASE_PROJECT_ID=todoapp-test tsx scripts/init-firebase-data.ts && echo 'Data initialization completed!' && wait"]