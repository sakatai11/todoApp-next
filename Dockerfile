# Node.js公式の軽量イメージ
FROM node:20-alpine

# 必要なパッケージをインストール（health check用）
RUN apk add --no-cache wget curl

# nextjsユーザーを作成（Alpine BusyBox対応）
RUN addgroup -S -g 1001 nodejs || addgroup -S nodejs && \
    adduser -S -u 1001 -G nodejs -H -D nextjs || true

# 作業ディレクトリ作成
WORKDIR /app

# package.jsonとlockファイルを先にコピーして依存関係インストール
COPY package*.json ./
RUN npm install --legacy-peer-deps

# アプリケーションの全コードをコピー
COPY . .

# Next.jsのポートを開放
EXPOSE 3000

# アプリケーションファイルの所有権を再帰的に変更
RUN chown -R nextjs:nodejs /app

# nextjsユーザーに切り替え（non-root実行）
USER nextjs

# 開発用コマンド（turbopack対応）
CMD ["npm", "run", "dev"]