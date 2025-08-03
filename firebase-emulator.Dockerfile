# Firebase Emulator用カスタムDockerfile（開発環境）
FROM node:18-alpine

# 必要なパッケージをインストール
RUN apk add --no-cache openjdk11-jre curl && \
    npm install -g firebase-tools tsx

# 作業ディレクトリを設定
WORKDIR /workspace

# Firebase Emulatorを起動し、データ初期化を実行するコマンド
CMD ["sh", "-c", "firebase emulators:start --project=todoapp-next-dev --config=firebase.dev.json --only=firestore,auth,ui & until curl -s http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/todoapp-next-dev/config?key=fake-api-key > /dev/null; do sleep 2; done && sleep 10 && env USE_DEV_DB_DATA=true FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 FIREBASE_PROJECT_ID=todoapp-next-dev tsx scripts/init-firebase-data.ts && wait"]