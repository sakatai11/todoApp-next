---
name: todoapp-docker-ops
description: TodoApp-next専用Docker環境管理。開発環境（ポート3000）とテスト環境（ポート3002）の起動・停止・状態確認、Firebase Emulator管理、トラブルシューティング（ポート競合検出・解決、エラー診断）、データ管理（初期化・クリーンアップ）、ログ・デバッグ機能を統合提供。「Docker環境を起動」「テスト環境を起動」「統合テストを実行」「ポート競合を解決」「Firebase Emulatorのログを確認」「テストユーザーをクリーンアップ」などのリクエスト、または /todoapp-docker-ops コマンドで使用。
---

# TodoApp Docker Operations

todoApp-next プロジェクト専用のDocker環境管理スキル。開発環境とテスト環境の統合的な管理、トラブルシューティング、データ管理を提供します。

## Environment Architecture

### 開発環境 vs テスト環境

| 項目               | 開発環境                         | テスト環境                     |
| ------------------ | -------------------------------- | ------------------------------ |
| **ポート番号**     | 3000 / 4000 / 8080 / 9099        | 3002 / 4000 / 8080 / 9099      |
| **Docker Compose** | `docker-compose.yml`             | `docker-compose.test.yml`      |
| **環境変数**       | `USE_DEV_DB_DATA=true`           | `USE_TEST_DB_DATA=true`        |
| **テストユーザー** | `dev-user-1` / `dev-admin-1`     | `test-user-1` / `test-admin-1` |
| **データ永続化**   | セッション中保持、停止時リセット | 毎回クリーン状態               |
| **用途**           | 日常の開発作業・E2Eテスト        | 統合テスト                     |

### サービス構成

**開発環境**:

- Next.js App: `localhost:3000`
- Firebase Emulator UI: `localhost:4000`
- Firestore: `localhost:8080`
- Auth: `localhost:9099`

**テスト環境**:

- Next.js App: `localhost:3002`（開発と分離）
- Firebase Emulator UI: `localhost:4000`（共通）
- Firestore: `localhost:8080`（共通）
- Auth: `localhost:9099`（共通）

## Workflow

### 開発環境の起動

```bash
# 開発環境起動
npm run docker:dev

# アクセスURL
# → http://localhost:3000 - Next.jsアプリ
# → http://localhost:4000 - Firebase Emulator UI
```

**自動実行される処理**:

1. Docker環境起動（`docker-compose up -d`）
2. Firebase Emulator起動（Firestore + Auth）
3. 開発用テストデータ自動ロード（`dev-user-1` / `dev-admin-1`）
4. Next.jsアプリ起動

**確認事項**:

- ポート競合チェック（3000/4000/8080/9099）
- サービスヘルスチェック

### テスト環境の起動

```bash
# テスト環境起動
npm run docker:test

# アクセスURL
# → http://localhost:3002 - Next.jsアプリ（テスト用）
# → http://localhost:4000 - Firebase Emulator UI
```

**自動実行される処理**:

1. Docker環境起動（`docker-compose -f docker-compose.test.yml up -d`）
2. Firebase Emulator起動（クリーン状態）
3. テスト用データ自動ロード（`test-user-1` / `test-admin-1`）
4. Next.jsアプリ起動（ポート3002）

### 統合テストの実行

```bash
# 統合テスト実行（全自動）
npm run docker:test:run
```

**自動実行される処理**:

1. テスト環境起動
2. Firebase Emulator起動（ヘルスチェック付き）
3. テストデータ初期化（`scripts/init-firebase-data.ts`）
4. 統合テスト実行（vitest）
5. 環境停止・クリーンアップ

**所要時間**: 約30-35秒

### 環境の停止

```bash
# 開発環境停止
npm run docker:dev:down
# → 自動的にテストユーザークリーンアップ実行

# テスト環境停止
npm run docker:test:down
```

## Operations

### 1. 環境管理

#### 環境状態確認

```bash
# コンテナ状態確認
docker ps

# サービス状態確認
docker-compose ps
docker-compose -f docker-compose.test.yml ps

# ポート使用状況
lsof -ti:3000,3002,4000,8080,9099
```

#### 環境の切り替え

開発環境とテスト環境はFirebase Emulatorのポート（4000/8080/9099）を共有しているため、**同時起動はできません**。必ず一方を停止してから他方を起動してください。

```bash
# 開発環境停止 → テスト環境起動
npm run docker:dev:down
npm run docker:test
```

### 2. トラブルシューティング

#### ポート競合の検出と解決

**ポート使用確認**:

```bash
lsof -ti:3000,4000,8080,9099,5001,3002
```

**解決手順**:

1. ポート使用プロセスを特定
2. **AskUserQuestion**で解決策を提示:
   - オプション1: プロセスを終了（`kill -9 [PID]`）
   - オプション2: Dockerコンテナを停止（`docker-compose down`）
   - オプション3: 手動で対処
3. 選択された方法で解決

**詳細**: @references/troubleshooting.md 参照

#### エラー診断

**既知のエラーパターン**:

- Firebase Emulator起動失敗 → Java 21以上が必要（`openjdk21-jre` をDockerfileに指定）
- Next.jsビルドエラー → `docker-compose logs nextjs` で確認
- 環境変数未設定エラー → `docker-compose.yml` 確認
- Docker imageビルドエラー → `docker-compose build --no-cache`

**エラーログ確認**:

```bash
# サービス別ログ
docker-compose logs [service]
docker-compose -f docker-compose.test.yml logs [service]

# エラーログのみ抽出
docker-compose logs | grep -i error
```

#### Docker環境のリセット

3段階のリセットオプションを**AskUserQuestion**で提示:

**軽度（再起動のみ）**:

```bash
docker-compose restart
# 影響: コンテナ再起動のみ、データ保持
# 所要時間: 10秒
```

**中度（ボリューム削除）**:

```bash
docker-compose down --volumes
docker-compose up -d
# 影響: ボリューム削除、初期データで再開
# 所要時間: 30秒
```

**完全（イメージ再ビルド含む）**:

**⚠️ 警告**: `docker system prune -f` はシステム全体の未使用Dockerリソース（他プロジェクトのイメージ、ビルドキャッシュ、ボリューム等）も削除します。より安全な代替手段として、`docker image prune` または `docker builder prune` の使用を推奨します。

```bash
docker-compose down --volumes --remove-orphans
docker system prune -f  # 注意: 全プロジェクトに影響
docker-compose build --no-cache
docker-compose up -d
# 影響: システム全体の未使用リソース削除、イメージ再ビルド
# 所要時間: 5分
```

### 3. データ管理

#### テストデータの初期化

```bash
# 手動初期化
tsx scripts/init-firebase-data.ts
```

**初期化内容**:

- 開発環境: `dev-user-1` / `dev-admin-1`
- テスト環境: `test-user-1` / `test-admin-1`
- Firestoreサブコレクション構造

#### テストユーザークリーンアップ

```bash
# 手動実行
npm run cleanup:test-users

# 自動実行（開発環境停止時）
npm run docker:dev:down
# → 自動的に cleanup:test-users を実行
```

**対象ユーザー**: E2Eテストで作成された `newuser-*` アカウント

#### データのリセット

```bash
# 開発環境データリセット
docker-compose restart firebase-emulator
# → 初期データで再スタート

# テスト環境データリセット
docker-compose -f docker-compose.test.yml restart firebase-emulator-test
# → クリーンデータで再スタート

# 完全リセット
docker-compose down --volumes
npm run docker:dev  # または docker:test
```

### 4. ログ・デバッグ

#### コンテナログの表示

```bash
# 全ログ表示（開発環境）
docker-compose logs --tail=50 --follow

# サービス別ログ
docker-compose logs nextjs --tail=50 --follow
docker-compose logs firebase-emulator --tail=50 --follow

# テスト環境ログ
docker-compose -f docker-compose.test.yml logs nextjs-test --tail=50
docker-compose -f docker-compose.test.yml logs firebase-emulator-test --tail=50
```

#### エラーログの抽出

```bash
# エラーログのみ抽出
docker-compose logs | grep -i error
docker-compose logs | grep -i warn

# 特定サービスのエラー
docker-compose logs nextjs | grep -i error
```

#### リソース監視

```bash
# Docker リソース使用状況
docker stats --no-stream

# ディスク使用量
docker system df
```

## Integration with docker-cleanup Skill

### 役割分担

| 項目                        | todoapp-docker-ops | docker-cleanup |
| --------------------------- | ------------------ | -------------- |
| **環境起動/停止**           | ✓                  | -              |
| **トラブルシューティング**  | ✓                  | -              |
| **データ管理**              | ✓                  | -              |
| **Docker リソース削除**     | -                  | ✓              |
| **イメージ/ボリューム削除** | -                  | ✓              |

### 連携タイミング

#### 環境停止後のクリーンアップ提案

```markdown
Docker環境を停止しました。

さらにクリーンアップを実行しますか？
→ /docker-cleanup を実行してください
```

#### エラー発生時の完全リセット提案

```markdown
Docker環境に深刻な問題が検出されました。

完全なクリーンアップを推奨します:
→ /docker-cleanup --full を実行してください
```

## Error Handling

### エラー発生時の対処フロー

1. **エラー検出**: コマンド実行時のエラーを検出
2. **ログ確認**: 該当サービスのログを自動確認
3. **診断**: 既知のエラーパターンとマッチング
4. **解決策提示**: AskUserQuestionで複数の解決策を提示
5. **実行**: ユーザー選択に基づいて解決策を実行

### 既知のエラーと解決策

詳細は `@references/troubleshooting.md` を参照してください。

## Best Practices

### 開発ワークフロー

1. **環境起動**: `npm run docker:dev`
2. **開発作業**: `http://localhost:3000`
3. **データ確認**: `http://localhost:4000` のEmulator UI
4. **環境停止**: `npm run docker:dev:down`（自動クリーンアップ）

### テストワークフロー

1. **統合テスト**: `npm run docker:test:run`（全自動）
2. **E2Eテスト**: `npm run docker:e2e:run`
   - **⚠️ 前提条件**: 開発環境（ポート3000）が起動していること（`npm run docker:dev`）
   - Playwright の `baseURL` は `http://localhost:3000`（ポート3000）固定
   - E2Eテストは**開発環境（ポート3000）**に対して実行される
   - `docker:e2e:run` はテスト環境（docker-compose.test.yml）を起動するが、Playwright接続先はポート3000
   - 開発環境が起動していない場合、Playwrightがポート3000に接続できずテストが失敗する
3. **手動確認**: `npm run docker:test` → `http://localhost:3002`

### データ管理のポイント

- **開発環境**: セッション中はデータ保持、停止時にリセット
- **テスト環境**: 毎回クリーン状態で開始
- **テストユーザー**: 自動クリーンアップ設定

### セキュリティ

- **ポートバインド**: `127.0.0.1` に制限（localhostのみアクセス）
- **環境変数**: Emulator接続設定必須
- **データ分離**: 開発/テスト環境で完全分離

## Reference

### 詳細ドキュメント

プロジェクトには以下の充実したドキュメントがあります：

- `todoApp-submodule/docs/DOCKER_DEVELOPMENT.md` (350行) - 開発環境の詳細ガイド
- `todoApp-submodule/docs/DOCKER_TESTING.md` (330行) - テスト環境の詳細ガイド
- `@references/troubleshooting.md` - トラブルシューティングガイド

### npm Scripts

```bash
# 開発環境
npm run docker:dev              # 開発環境起動
npm run docker:dev:down         # 開発環境停止 + テストユーザークリーンアップ

# テスト環境
npm run docker:test             # テスト環境起動
npm run docker:test:run         # 統合テスト実行（全自動）
npm run docker:test:down        # テスト環境停止
npm run docker:e2e:run          # E2Eテスト実行

# Firebase Emulator
npm run emulator:start          # 開発用Emulator起動
npm run emulator:test           # テスト用Emulator起動

# データ管理
npm run cleanup:test-users      # テストユーザークリーンアップ
```

### Docker Compose Files

- `docker-compose.yml` - 開発環境構成
- `docker-compose.test.yml` - テスト環境構成
- `firebase-emulator.Dockerfile` - 開発用Emulator Dockerfile
- `firebase-emulator.test.Dockerfile` - テスト用Emulator Dockerfile

### Firebase Configuration

- `firebase.json` - 開発用Firebase設定
- `firebase.test.json` - テスト用Firebase設定

## Quick Reference

### 頻繁に使用するコマンド

```bash
# 開発環境起動
npm run docker:dev

# 統合テスト実行
npm run docker:test:run

# ポート競合確認
lsof -ti:3000,3002,4000,8080,9099

# ログ確認
docker-compose logs nextjs --tail=50 --follow

# 環境停止
npm run docker:dev:down
npm run docker:test:down

# クリーンアップ
docker-compose down --volumes
```
