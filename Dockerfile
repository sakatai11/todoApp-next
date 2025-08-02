# Node.js公式の軽量イメージ
FROM node:20-alpine

# 作業ディレクトリ作成
WORKDIR /app

# package.jsonとlockファイルを先にコピーして依存関係インストール
COPY package*.json ./
RUN npm install --legacy-peer-deps

# アプリケーションの全コードをコピー
COPY . .

# Next.jsのポートを開放
EXPOSE 3000

# 開発用コマンド（turbopack対応）
CMD ["npm", "run", "dev"]