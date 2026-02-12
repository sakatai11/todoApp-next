# トラブルシューティングガイド

## ポート競合の解決

### ポート使用確認

```bash
# 使用中のポートを確認
lsof -ti:3000,3002,4000,8080,9099,5001

# 特定ポートのプロセス詳細
lsof -i :3000
lsof -i :8080
```

### ポート競合の解決手順

1. **プロセスの特定**

   ```bash
   lsof -ti:8080  # → PIDを取得
   ```

2. **解決策の選択（AskUserQuestion）**
   - オプション1: プロセスを正常終了（`kill [PID]`）
   - オプション2: プロセスを強制終了（`kill -9 [PID]`、最終手段）
   - オプション3: Dockerコンテナを停止（`docker-compose down`）
   - オプション4: 手動で対処

3. **実行**

   ```bash
   # まず通常の終了を試行（推奨）
   kill <PID>

   # プロセスが終了しない場合のみ強制終了
   kill -9 <PID>

   # または Docker停止
   npm run docker:dev:down
   npm run docker:test:down
   ```

## Firebase Emulatorエラー

### Emulatorが起動しない

**症状**: Firebase Emulatorが起動失敗する

**確認コマンド**:

```bash
# Emulator UI接続確認
curl http://localhost:4000

# Firestore Emulator確認
curl http://localhost:8080

# Auth Emulator確認
curl http://localhost:9099
```

**解決策**:

```bash
# 1. Docker環境の再起動
npm run docker:dev:down
npm run docker:dev

# 2. Firebase設定確認
cat firebase.json

# 3. Java Runtime Environment確認（Docker内）
docker-compose exec firebase-emulator java -version
```

### Emulatorデータが表示されない

**症状**: Emulator UIでデータが見えない

**解決策**:

```bash
# Emulator UI確認
# → http://localhost:4000 でFirestoreデータを目視確認

# 初期データの再ロード
docker-compose restart firebase-emulator

# 環境変数確認
docker-compose exec nextjs printenv | grep USE_DEV_DB_DATA
# → USE_DEV_DB_DATA=true であることを確認

# 完全なデータリセット
docker-compose down --volumes
npm run docker:dev
```

## Dockerエラー診断

### コンテナが起動しない

**確認コマンド**:

```bash
# コンテナ状態確認
docker ps -a

# コンテナログ確認
docker-compose logs nextjs
docker-compose logs firebase-emulator
docker-compose -f docker-compose.test.yml logs nextjs-test
docker-compose -f docker-compose.test.yml logs firebase-emulator-test
```

**解決策**:

```bash
# コンテナ強制停止・削除
docker-compose down --volumes --remove-orphans

# イメージ再ビルド
docker-compose build --no-cache

# クリーンスタート
npm run docker:dev
```

### イメージビルドエラー

**症状**: `docker-compose build` が失敗する

**解決策**:

```bash
# ビルドキャッシュクリア
docker builder prune -f

# イメージ再ビルド（キャッシュなし）
docker-compose build --no-cache
```

## 環境変数エラー

### 環境変数が認識されない

**確認コマンド**:

```bash
# Next.js環境変数確認
docker-compose exec nextjs printenv | grep NEXT_PUBLIC

# Firebase Emulator環境変数確認
docker-compose exec firebase-emulator printenv | grep EMULATOR
```

**解決策**:

```bash
# docker-compose.yml確認
cat docker-compose.yml | grep -A5 environment

# 環境変数再読み込み
docker-compose down
docker-compose up -d
```

## Docker環境リセット

### 3段階のリセットオプション

#### 軽度: 再起動のみ（データ保持）

```bash
docker-compose restart
```

- 影響: コンテナ再起動のみ
- データ: 保持される
- 所要時間: 10秒

#### 中度: ボリューム削除（データ削除）

```bash
docker-compose down --volumes
docker-compose up -d
```

- 影響: ボリューム削除、初期データで再開
- データ: 削除される
- 所要時間: 30秒

#### 完全: イメージ再ビルド含む（全リソース削除）

```bash
docker-compose down --volumes --remove-orphans
docker system prune -f
docker-compose build --no-cache
docker-compose up -d
```

- 影響: イメージ再ビルド含む全リソース削除
- データ: 完全削除
- 所要時間: 5分

## エラーログの確認

### コンテナログの表示

```bash
# 全ログ表示（開発環境）
docker-compose logs --tail=50 --follow

# サービス別ログ（開発環境）
docker-compose logs nextjs --tail=50 --follow
docker-compose logs firebase-emulator --tail=50 --follow

# テスト環境ログ
docker-compose -f docker-compose.test.yml logs nextjs-test --tail=50
docker-compose -f docker-compose.test.yml logs firebase-emulator-test --tail=50
```

### エラーログ抽出

```bash
# エラーログのみ抽出
docker-compose logs | grep -i error
docker-compose logs | grep -i warn

# 特定サービスのエラー
docker-compose logs nextjs | grep -i error
docker-compose logs firebase-emulator | grep -i error
```

## リソース監視

### Docker リソース使用状況

```bash
# リソース使用状況
docker stats --no-stream

# ディスク使用量
docker system df

# 詳細なディスク使用量
docker system df -v
```

## 既知のエラーパターン

### Java Runtime Environment不足

**症状**: Firebase Emulatorが起動失敗

**エラーメッセージ**:

```text
Error: Java Runtime Environment not found
```

**解決策**: カスタムDockerfile（firebase-emulator.Dockerfile）を使用

```bash
# Dockerfileでopenjdk11-jreをインストール済み
docker-compose build firebase-emulator
npm run docker:dev
```

### Next.jsビルドエラー

**症状**: Next.jsアプリが起動しない

**確認**:

```bash
docker-compose logs nextjs | grep -i error
```

**解決策**:

```bash
# node_modules再インストール
docker-compose exec nextjs npm install

# または完全リビルド
docker-compose down
docker-compose build --no-cache nextjs
npm run docker:dev
```

### テストユーザークリーンアップエラー

**症状**: `npm run cleanup:test-users` が失敗

**解決策**:

````bash
# Firebase Emulator起動確認
curl http://localhost:9099

# 手動クリーンアップスクリプト実行
tsx scripts/cleanup-test-users.ts
```bash

## データ管理の問題

### データ永続化の問題

**⚠️ 警告**: `sudo chown -R $USER:$USER .` は実行場所によってはシステムファイルの権限を変更する危険があります。必ずプロジェクトルートディレクトリで実行してください。

**症状**: データが保存されない

**確認**:

```bash
# Docker Volume確認
docker volume ls
docker volume inspect <volume_name>

# Volume権限確認
ls -la .
````

**解決策**:

```bash
# Volume権限修正
docker-compose down
sudo chown -R $USER:$USER .
npm run docker:dev
```

### データ初期化の問題

**症状**: テストデータが正しく初期化されない

**確認**:

```bash
# 初期化スクリプト実行確認
docker-compose logs firebase-emulator | grep init-firebase-data
```

**解決策**:

```bash
# 手動データ初期化
tsx scripts/init-firebase-data.ts

# 完全リセット
docker-compose down --volumes
npm run docker:test:run
```
