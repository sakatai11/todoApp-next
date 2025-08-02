# Firebase Emulator用カスタムDockerfile
FROM gcr.io/google.com/cloudsdktool/google-cloud-cli:emulators

# 必要なパッケージをビルド時にインストール
RUN apt-get update && \
    apt-get install -y openjdk-11-jre-headless && \
    gcloud components install firebase-cli --quiet && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 作業ディレクトリを設定
WORKDIR /workspace

# Firebase Emulatorを起動するコマンド
CMD ["firebase", "emulators:start", "--project=todoapp-next-dev", "--only=firestore,auth,ui", "--host=0.0.0.0"]