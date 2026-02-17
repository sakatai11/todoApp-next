# todoApp-next Docker操作スキル作成プラン

## Context（背景）

### なぜこのスキルが必要か

todoApp-next プロジェクトは、開発環境とテスト環境で異なる Docker 構成を持つ複雑な環境です：

- **開発環境**: 日常の開発作業に最適化（ポート3000、データセッション中保持）
- **テスト環境**: 統合テスト・E2Eテスト専用（ポート3002、毎回クリーンデータ）
- **Firebase Emulator**: 両環境で本番同等の機能を提供
- **複数の npm scripts**: 環境管理・データ管理・クリーンアップの各種コマンド

これらの操作を統合的に管理し、トラブルシューティングを効率化するため、プロジェクト専用のスキルを作成します。

### 参照ドキュメント

以下の充実したドキュメントを基に設計：

- `todoApp-submodule/docs/DOCKER_DEVELOPMENT.md` (350行) - 開発環境の詳細ガイド
- `todoApp-submodule/docs/DOCKER_TESTING.md` (330行) - テスト環境の詳細ガイド
- `docker-compose.yml` - 開発環境構成
- `docker-compose.test.yml` - テスト環境構成
- `.claude/rules/development.md` - 開発フローとコマンド

## 実装計画

### 1. スキルの基本設計

#### スキル名

`todoapp-docker-ops`

#### スキルの役割

TodoApp-next 専用の Docker 環境管理スキル。以下の機能を提供：

1. **環境管理**: 開発/テスト環境の起動・停止・状態確認
2. **トラブルシューティング**: ポート競合検出・解決、エラー診断
3. **データ管理**: テストデータ初期化、テストユーザークリーンアップ
4. **ログ・デバッグ**: コンテナログ表示、リソース監視

#### トリガー条件

ユーザーが以下のような発言をした時：

- 「Docker環境を起動」「開発環境を起動」「テスト環境を起動」
- 「統合テストを実行」
- 「ポート競合を解決」「ポート8080が使われている」
- 「Firebase Emulatorの状態を確認」「Emulatorが起動しない」
- 「テストユーザーをクリーンアップ」「テストデータをリセット」
- 「Docker環境のログを確認」「コンテナのエラーログ」
- `/todoapp-docker-ops` コマンド実行時

### 2. SKILL.md の構成

既存の `docker-cleanup` スキルを参考に、以下の構成で作成：

```markdown
---
name: todoapp-docker-ops
description: TodoApp-next専用Docker環境管理。開発環境（ポート3000）とテスト環境（ポート3002）の起動・停止、トラブルシューティング、データ管理、Firebase Emulator管理を統合的に提供。
---

# TodoApp Docker Operations

## Overview

## Environment Architecture

## Workflow

## Operations

- Environment Management
- Troubleshooting
- Data Management
- Log & Debug

## Integration with docker-cleanup

## Error Handling

## Best Practices

## Reference
```

### 3. 機能の詳細仕様

#### 3.1 環境管理機能（高優先度）

**開発環境の起動**

```bash
# 実行コマンド
npm run docker:dev

# 確認事項
- ポート競合チェック（3000/4000/8080/9099）
- 既存コンテナの停止確認
- サービスヘルスチェック（Firebase Emulator UI: localhost:4000, Next.js: localhost:3000）
```

**テスト環境の起動**

```bash
# 実行コマンド
npm run docker:test

# 確認事項
- ポート競合チェック（3002/4000/8080/9099）
- サービスヘルスチェック（Firebase Emulator UI: localhost:4000, Next.js: localhost:3002）
```

**統合テストの実行**

```bash
# 実行コマンド
npm run docker:test:run

# 自動実行される処理
- テスト環境起動
- Firebase Emulator起動（ヘルスチェック付き）
- テストデータ初期化（scripts/init-firebase-data.ts）
- 統合テスト実行（vitest）
- 環境停止・クリーンアップ
```

**環境の停止**

```bash
# 開発環境
npm run docker:dev:down
# → テストユーザークリーンアップ自動実行

# テスト環境
npm run docker:test:down
```

**環境状態確認**

```bash
# 実行コマンド
docker ps
docker-compose ps

# 確認項目
- 実行中コンテナ一覧
- 各サービスの状態（nextjs, firebase-emulator, nextjs-test, firebase-emulator-test）
- ポート使用状況（lsof -ti:3000,3002,4000,8080,9099）
```

#### 3.2 トラブルシューティング機能（高優先度）

**ポート競合の検出と解決**

```bash
# ポート使用確認
lsof -ti:3000,4000,8080,9099,5001,3002

# 解決策の提示（AskUserQuestion）
1. プロセスを終了（kill -9 [PID]）
2. Dockerコンテナを停止（docker-compose down）
3. 手動で対処
```

**エラー診断**

```bash
# エラーログ確認
docker-compose logs [service]

# 既知のエラーパターン
- Firebase Emulator起動失敗（Java Runtime Environment不足）
- Next.jsビルドエラー
- 環境変数未設定エラー
- Docker imageビルドエラー
```

**Docker環境のリセット**

3段階のリセットオプション（AskUserQuestion で選択）：

```bash
# 軽度（再起動のみ、データ保持）
docker-compose restart
# 影響: コンテナ再起動のみ
# 所要時間: 10秒

# 中度（ボリューム削除、データ削除）
docker-compose down --volumes
docker-compose up -d
# 影響: ボリューム削除、初期データで再開
# 所要時間: 30秒

# 完全（イメージ再ビルド含む、全リソース削除）
docker-compose down --volumes --remove-orphans
docker system prune -f
docker-compose build --no-cache
docker-compose up -d
# 影響: イメージ再ビルド含む全リソース削除
# 所要時間: 5分
```

#### 3.3 データ管理機能（中優先度）

**テストデータの初期化**

```bash
# 実行コマンド
tsx scripts/init-firebase-data.ts

# 初期化内容
- 開発環境: dev-user-1 / dev-admin-1
- テスト環境: test-user-1 / test-admin-1
- Firestoreサブコレクション構造
```

**テストユーザークリーンアップ**

```bash
# 手動実行
npm run cleanup:test-users

# 自動実行（開発環境停止時）
npm run docker:dev:down
# → 自動的に cleanup:test-users を実行

# 対象ユーザー
- E2Eテストで作成された newuser-* アカウント
```

**データのリセット**

```bash
# 開発環境データリセット
docker-compose restart firebase-emulator
# → 初期データで再スタート

# テスト環境データリセット
docker-compose -f docker-compose.test.yml restart firebase-emulator-test
# → クリーンデータで再スタート
```

#### 3.4 ログ・デバッグ機能（中優先度）

**コンテナログの表示**

```bash
# 全ログ表示
docker-compose logs --tail=50 --follow

# サービス別ログ
docker-compose logs nextjs --tail=50 --follow
docker-compose logs firebase-emulator --tail=50 --follow
docker-compose -f docker-compose.test.yml logs nextjs-test --tail=50
docker-compose -f docker-compose.test.yml logs firebase-emulator-test --tail=50
```

**エラーログの抽出**

```bash
# エラーログのみ抽出
docker-compose logs | grep -i error
docker-compose logs | grep -i warn
```

**リソース監視**

```bash
# Docker リソース使用状況
docker stats --no-stream

# ディスク使用量
docker system df
```

### 4. docker-cleanup スキルとの統合

#### 役割分担

| 項目                        | todoapp-docker-ops | docker-cleanup |
| --------------------------- | ------------------ | -------------- |
| **環境起動/停止**           | ✓                  | -              |
| **トラブルシューティング**  | ✓                  | -              |
| **データ管理**              | ✓                  | -              |
| **Docker リソース削除**     | -                  | ✓              |
| **イメージ/ボリューム削除** | -                  | ✓              |

#### 連携タイミング

1. **環境停止後のクリーンアップ提案**
   - todoapp-docker-ops で環境停止後、以下を提案：

   ```
   Docker環境を停止しました。

   さらにクリーンアップを実行しますか？
   → /docker-cleanup を実行してください
   ```

2. **エラー発生時の完全リセット提案**
   - 重度のエラー検出時：

   ```
   Docker環境に深刻な問題が検出されました。

   完全なクリーンアップを推奨します:
   → /docker-cleanup --full を実行してください
   ```

### 5. プロジェクト固有の考慮事項

#### 開発/テスト環境の明確な分離

**注意**: 開発環境とテスト環境はFirebase Emulatorのポート（4000/8080/9099）を共有しているため、**同時起動はできません**。

| 項目               | 開発環境                         | テスト環境                 |
| ------------------ | -------------------------------- | -------------------------- |
| **ポート番号**     | 3000 / 4000 / 8080 / 9099        | 3002 / 4000 / 8080 / 9099  |
| **Docker Compose** | docker-compose.yml               | docker-compose.test.yml    |
| **環境変数**       | USE_DEV_DB_DATA=true             | USE_TEST_DB_DATA=true      |
| **テストユーザー** | dev-user-1 / dev-admin-1         | test-user-1 / test-admin-1 |
| **データ永続化**   | セッション中保持、停止時リセット | 毎回クリーン状態           |

#### Firebase Emulator統合

- **カスタムDockerfile**: firebase-emulator.Dockerfile / firebase-emulator.test.Dockerfile
- **Java Runtime Environment**: Firebase Emulatorの依存関係
- **tsx実行環境**: TypeScriptファイル（init-firebase-data.ts）の直接実行
- **Emulator UI**: localhost:4000 でデータ可視化

#### テストユーザー管理

- **開発環境**: E2Eテストで作成される `newuser-*` アカウントのクリーンアップ
- **テスト環境**: 自動初期化されるため手動クリーンアップ不要
- **自動クリーンアップ**: `npm run docker:dev:down` が自動実行

#### データ永続化の違い

- **開発環境**: セッション中は保持、停止時にリセット
- **テスト環境**: テスト実行毎にクリーン状態で開始
- **firebase-emulator-data**: 自動エクスポート/インポートディレクトリ

#### セキュリティ設定

- **ポートバインド**: `127.0.0.1` に制限（localhostのみアクセス）
- **環境変数**: Emulator接続設定必須
- **NEXT_PUBLIC_EMULATOR_MODE**: true 設定の確認

### 6. スキル作成手順

#### スキルクリエイターの使用

```markdown
1. Skill tool を使用して skill-creator スキルを呼び出す
   - スキル名: todoapp-docker-ops
   - 対象: todoApp-next プロジェクト専用

2. 以下のドキュメントを参照情報として提供
   - todoApp-submodule/docs/DOCKER_DEVELOPMENT.md
   - todoApp-submodule/docs/DOCKER_TESTING.md
   - docker-compose.yml
   - docker-compose.test.yml
   - .claude/rules/development.md

3. スキルの主要機能を明示
   - 環境管理（起動/停止/状態確認）
   - トラブルシューティング（ポート競合/エラー診断）
   - データ管理（初期化/クリーンアップ）
   - ログ・デバッグ（コンテナログ/リソース監視）

4. トリガーパターンを定義
   - 「Docker環境を起動」「ポート競合を解決」等
   - /todoapp-docker-ops コマンド

5. docker-cleanup スキルとの統合方法を明記
   - 役割分担の明確化
   - 連携タイミングの定義
```

### 7. 実装の Critical Files

以下のファイルを重点的に参照：

1. **DOCKER_DEVELOPMENT.md** (`todoApp-submodule/docs/DOCKER_DEVELOPMENT.md`)
   - 開発環境の全体構成とワークフロー
   - データ管理と永続化戦略
   - トラブルシューティング手順

2. **DOCKER_TESTING.md** (`todoApp-submodule/docs/DOCKER_TESTING.md`)
   - テスト環境の構成
   - データ管理戦略
   - CI/CD統合方法

3. **docker-compose.yml** (`docker-compose.yml`)
   - 開発環境の具体的な構成
   - ポート設定、環境変数、サービス定義

4. **docker-compose.test.yml** (`docker-compose.test.yml`)
   - テスト環境の具体的な構成
   - ヘルスチェック、統合テスト設定

5. **development.md** (`.claude/rules/development.md`)
   - npm scripts の定義
   - 開発コマンドの説明

## Verification（検証方法）

### スキル作成後の検証手順

1. **スキルのインストール確認**

   ```bash
   # スキルが正しく配置されているか確認
   ls -la .claude/skills/todoapp-docker-ops/
   cat .claude/skills/todoapp-docker-ops/SKILL.md
   ```

2. **トリガー動作確認**

   ```bash
   # Claude Code で以下のコマンドを試す
   /todoapp-docker-ops

   # または自然言語で
   「Docker開発環境を起動して」
   「テスト環境のログを確認」
   ```

3. **機能テスト**

   ```bash
   # 環境起動のテスト
   # → スキルが npm run docker:dev を実行
   # → ポート競合チェックが動作
   # → サービスヘルスチェックが実行される

   # トラブルシューティングのテスト
   # → ポート競合検出が動作
   # → エラー診断が実行される

   # データ管理のテスト
   # → テストユーザークリーンアップが動作
   # → データリセットが実行される
   ```

4. **docker-cleanup との連携確認**

   ```bash
   # 環境停止後のクリーンアップ提案が表示されるか
   # → docker-cleanup スキルへの適切な誘導
   ```

5. **エラーハンドリング確認**
   ```bash
   # ポート競合時の対処
   # エラーログの適切な表示
   # リセットオプションの提示
   ```

## まとめ

このスキルにより、todoApp-next プロジェクトの Docker 環境管理が大幅に効率化されます：

- **統合管理**: 開発環境とテスト環境の一元管理
- **トラブルシューティング**: ポート競合やエラーの迅速な解決
- **データ管理**: テストデータの初期化・クリーンアップの自動化
- **連携**: docker-cleanup スキルとの適切な役割分担

350行以上の詳細なドキュメントを基にした、プロジェクト固有の実用的なスキルです。
