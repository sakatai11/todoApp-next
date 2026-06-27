# Phase 4: Quality Gate [Codex 自己修正ループ + 最終決定論再実行]

決定論ゲートのうち **Docker を使わない4つ（format / lint / test:run / build）は Phase 3b の Codex が自己修正ループで緑にする**。orchestrator はその報告を鵜呑みにせず、**最終ゲートを1回だけ決定論的に再実行**して裏取りする。IT は Codex 対象外で、従来どおり orchestrator が管理する。

> **なぜ最終1回を再実行するか**: Core Principle「決定論ステップはハルシネーションでスキップしない」を守るため。Codex の「全部 green です」という自己申告（`selfGateReportedGreen`）を信頼の根拠にしない。

---

## 4-1: 最終ゲートの決定論再実行（1回）

Codex 完了後、orchestrator が以下を順に1回ずつ実行する。**前のステップが失敗したら次へ進まない。**

```bash
npm run format
npm run lint
npm run test:run
npm run build
```

- `npm run build` が TypeScript コンパイルを内包するため、型チェックはここで兼ねる（独立した `typecheck` スクリプトは無い）。
- 全て緑なら Phase 5 へ進む。
- いずれかが赤なら「4-2 エスカレーション」へ。

---

## 4-2: 赤だった場合のエスカレーション（往復は有限）

Codex の自己ループを通ったはずなのに最終再実行で赤になるケース。**orchestrator ↔ Codex の往復を有限化**してトークン爆発と無限 resume を防ぐ。

### lint / format の軽微な失敗

往復コストをかけず、orchestrator（Claude）側で直接 `npm run format` / lint 自動修正 → 再実行してよい（既存のハイブリッド方針）。3回試して直らなければ次項へ。

### test:run / build の失敗

1. **Codex へ `codex exec resume --last` で差し戻す（最大2回まで）**。差し戻し時は **失敗したコマンド名、失敗テスト名（該当時のみ）、代表エラー、ファイル/行番号（分かる場合）**だけを簡潔に渡す（フルログは渡さない＝コンテキスト保護）。Phase 3b と同じく **Bash ツールを `run_in_background: true`** で実行する。

   ```bash
   codex exec resume --last \
     --cd "$(pwd)" \
     --sandbox workspace-write \
     -o ".codex-tasks/<slug>.result.md" \
     "最終ゲートで以下が失敗しました。原因を修正し、再度 format/lint/test:run/build を緑にしてください。
   - 失敗コマンド: <npm run test:run など>
   - 失敗テスト: <テスト名のみ。build 失敗など該当しない場合は省略>
   - 代表エラー: <1〜3行の要約>
   - 関連ファイル/行: <分かる場合のみ>
   最終メッセージは指示書セクション8のフォーマット（500 トークン以内）だけにしてください。" \
     > ".codex-tasks/<slug>.log" 2>&1
   ```
   - `resume --last` は直前の `codex exec` セッションを継続するので、実装時の文脈を保ったまま修正できる。
   - プロセス終了後、`.codex-tasks/<slug>.result.md` を読み、再び 4-1 の最終再実行を行う。

2. **2回差し戻しても緑にならなければ人間に確認**（Core Principle「test/build 失敗は人間に確認」）。この時点で初めてフルログを人間に提示し、判断を仰ぐ：
   - **A**: 人間が手動修正する（パイプライン一時停止）
   - **B**: パイプライン中断（ブランチは残す）
   - **C**: 該当テストを明示承認で skip（推奨しない）

---

## 4-3: 自己申告と実 diff の突合

Codex の完了報告（`changedFiles`）と実際の `git status --porcelain` を突合する。

```bash
git status --porcelain
```

- 食い違う場合、**Codex の自己申告を信じず実 diff を正とする**。
- 後続の Phase 5（レビュー対象）・Phase 6（コミット対象）は常に実 diff に基づく。

---

## 4-4: IT（統合テスト）（Codex 対象外・人間確認）

IT は Docker + Firebase Emulator が必要で重く、`todoapp-docker-ops` に委譲する人間ゲート付きステップ。**Codex の自己修正ループには含めない**。Codex 完了報告の `integrationTest.required` 判定を受けて orchestrator が実行を判断する。

**実行判断基準**:

| 変更内容                                 | IT 実行       |
| ---------------------------------------- | ------------- |
| `app/api/` 配下の変更あり                | ✅ 必須       |
| Firebase Firestore / Auth の操作変更あり | ✅ 必須       |
| `features/` のみ（API呼び出しなし）      | ⬜ スキップ可 |
| スキルファイル・ドキュメントのみ         | ⬜ スキップ   |

`CodexImplementationResult.integrationTest.required`（Phase 3b が渡す契約）が `true` の場合は必須、`false` の場合は `reason` を確認した上でスキップできる。実行するか明示承認で skip するかの判断手順はこの Markdown に従う。

IT が必要な場合は `todoapp-docker-ops` スキルに委譲する：

```text
Skill ツールで skill: "todoapp-docker-ops" を起動
args: "統合テストを実行してください"
```

`todoapp-docker-ops` が以下を自動処理する：

- ポート競合チェック（3002/4000/8080/9099）
- Docker + Firebase Emulator 起動（`npm run docker:test`）
- 統合テスト実行（`npm run docker:test:run`）
- テスト完了後のクリーンアップ

失敗時：4-2 の test/build 失敗と同様に人間に確認。Docker 環境の問題（ポート競合・Emulator 起動失敗等）は `todoapp-docker-ops` のトラブルシューティングフローに従う。
