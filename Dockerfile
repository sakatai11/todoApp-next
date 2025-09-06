# Node.js公式の軽量イメージ
FROM node:20-alpine

# 必要なパッケージをインストール（health check用）
RUN apk add --no-cache wget curl

# nextjsユーザーを作成（セキュリティ向上のためnon-root実行）
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nextjs

# 作業ディレクトリ作成
WORKDIR /app

# package.jsonとlockファイルを先にコピーして依存関係インストール
COPY package*.json ./
RUN npm install --legacy-peer-deps

# アプリケーションの全コードをコピー（適切な所有権で）
COPY --chown=nextjs:nodejs . .

# Next.jsのポートを開放
EXPOSE 3000

# アプリケーションファイルの所有権を再帰的に変更
RUN chown -R nextjs:nodejs /app

# nextjsユーザーに切り替え（non-root実行）
USER nextjs

# 開発用コマンド（turbopack対応）
CMD ["npm", "run", "dev"]