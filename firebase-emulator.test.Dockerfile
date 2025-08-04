# Firebase Emulator用カスタムDockerfile（テスト環境専用）
FROM node:20-alpine

# 必要なパッケージをインストール
RUN apk add --no-cache openjdk11-jre curl bash && \
    npm install -g firebase-tools tsx

# 作業ディレクトリを設定
WORKDIR /workspace

# 全ファイルをコピー（スクリプトを含む）
COPY . .

# シェルスクリプトに実行権限を付与
RUN chmod +x scripts/start-test-emulator.sh

# Firebase Emulatorを起動し、データ初期化を実行するコマンド
CMD ["bash", "./scripts/start-test-emulator.sh"]