---
allowed-tools: Bash(npm run cleanup:test-users:*), Bash(docker ps:*)
description: E2Eテストで作成されたテストユーザーをクリーンアップ
---

E2Eテスト実行時に作成された `newuser-*@example.com` 形式のテストユーザーをFirebase Emulatorから削除してください。

## 実行条件の確認

まず、以下を確認してください：

1. Docker開発環境が起動しているか (`docker ps` で確認)
2. Firebase Emulatorが実行中か (http://localhost:4000 でアクセス可能か)

## 実行手順

以下のコマンドを実行してください：

```bash
npm run cleanup:test-users
```

このコマンドは `scripts/cleanup-test-users.ts` を実行し、以下の処理を行います：

1. Firebase Emulator上の全ユーザーを取得
2. `newuser-` で始まるメールアドレスを持つユーザーを検出
3. 削除対象のユーザー一覧を表示
4. ユーザーに確認プロンプトを表示して削除を実行

## 注意事項

- このスクリプトはFirebase Emulator専用です（本番環境では実行不可）
- Docker環境が起動していない場合はエラーになります
- 削除前に確認プロンプトが表示されるので、`y` を入力して実行してください
