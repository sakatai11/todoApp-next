# Phase 4: Quality Gate [決定論 + AIリトライ]

実行コマンドは以下の順番。**前のステップが失敗したら次へ進まない。**

## 4-1: Format（自動修正）

```bash
npm run format
```

失敗時：

1. エラーログを取得
2. 該当ファイルを Read してフォーマット崩れの原因を特定
3. AI が修正 → 再度 `npm run format` 実行
4. 3回リトライしても失敗したら人間に報告

## 4-2: Lint（自動修正）

```bash
npm run lint
```

失敗時：

1. エラーログから違反箇所を取得
2. AI がコード修正 → 再度 `npm run lint` 実行
3. 3回リトライしても失敗したら人間に報告

## 4-3: UT（ユニットテスト）（人間確認）

```bash
npm run test:run
```

factories が実装とともに作成した UT をここで全件実行する。カバレッジ100%を維持することを目標とする。

失敗時：

1. **自動修正しない**
2. 失敗したテストとエラーログをユーザーに提示
3. ユーザーに選択肢を提示：
   - **A**: AI が修正を試みる（テスト or 実装どちらを直すか確認）
   - **B**: パイプラインを中断（ユーザーが手動修正）
   - **C**: テストを skip してそのまま進む（推奨しない、明示確認）

## 4-4: Build（人間確認）

```bash
npm run build
```

このプロジェクトは `package.json` に独立した `typecheck` スクリプトが存在しない。`npm run build` が TypeScript コンパイルを内包するため、型チェックはこのステップで兼ねる。

失敗時：Test と同じく人間に確認。型エラーは ESLint 修正以上に副作用が広いため AI 自動修正禁止。

## 4-5: IT（統合テスト）（人間確認）

API ルートや Firebase Emulator との連携が変更に含まれる場合のみ実行する。

**実行判断基準**:

| 変更内容                                 | IT 実行       |
| ---------------------------------------- | ------------- |
| `app/api/` 配下の変更あり                | ✅ 必須       |
| Firebase Firestore / Auth の操作変更あり | ✅ 必須       |
| `features/` のみ（API呼び出しなし）      | ⬜ スキップ可 |
| スキルファイル・ドキュメントのみ         | ⬜ スキップ   |

IT が必要と判断した場合は `todoapp-docker-ops` スキルに委譲する：

```
Skill ツールで skill: "todoapp-docker-ops" を起動
args: "統合テストを実行してください"
```

`todoapp-docker-ops` が以下を自動処理する：

- ポート競合チェック（3002/4000/8080/9099）
- Docker + Firebase Emulator 起動（`npm run docker:test`）
- 統合テスト実行（`npm run docker:test:run`）
- テスト完了後のクリーンアップ

失敗時：UT と同じく人間に確認。Docker 環境の問題（ポート競合・Emulator 起動失敗等）は `todoapp-docker-ops` のトラブルシューティングフローに従う。
