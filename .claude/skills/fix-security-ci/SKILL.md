---
name: fix-security-ci
description: CIのセキュリティゲート（npm audit ベース）が失敗した際に自律的に修正する。GitHub Actions の run URL を貼るだけで、ログ取得・脆弱性解析・依存関係アップデート・ビルド確認・コミット・プッシュまでを自動実行する。「セキュリティCIが失敗した」「npm auditでCritical脆弱性が出た」「CIのセキュリティゲートが落ちた」と言った時、または GitHub Actions の run URL が貼られた時、または /fix-security-ci コマンド実行時に使用する。
---

# Fix Security CI

CIのセキュリティゲート（`npm audit` ベース）で Critical 脆弱性が検出された際、
自律的に調査・修正・コミット・プッシュまで完結するワークフロー。

## Workflow Overview

```text
Run URL / 失敗報告
  ├─ Step 1: Run情報の取得とリポジトリ特定
  ├─ Step 2: 失敗ログ取得と脆弱性件数の確認
  ├─ Step 3: ローカルで npm audit を実行し脆弱パッケージを特定
  ├─ Step 4: fix-strategies.md を参照して修正戦略を選択（A→B→C 優先順）
  ├─ Step 5: 修正実行 → npm run build + npm run test:run で検証
  └─ Step 6: package.json + package-lock.json をコミット・プッシュ
```

---

## Step-by-Step Process

### Step 1: Run情報の取得

**run URL が貼られた場合:**

URLから `run_id` とリポジトリを抽出する。
URL形式: `https://github.com/{owner}/{repo}/actions/runs/{run_id}`

````bash
# リポジトリ情報の確認
git remote get-url origin

# 最新のセキュリティCIを確認（run URLがない場合）
gh run list --workflow=security-review.yml --limit=5
```1

---

### Step 2: 失敗ログの取得と原因特定

```bash
# 失敗したステップのログを取得
gh run view {run_id} --log-failed

# または最新の失敗runのログを取得
gh run list --workflow=security-review.yml --status=failure --limit=1 \
  | awk 'NR==1 {print $NF}' | xargs -I{} gh run view {} --log-failed
````

**確認すべき箇所**: `Enforce security gates (fail at end)` ステップのログ

```
::error::Critical vulnerabilities found: N
```

Critical が 1 以上でゲートが落ちる（`exit 1`）。High は warning のみ（ゲートは落とさない）。

---

### Step 3: ローカルで脆弱パッケージを特定

```bash
# npm audit の結果を JSON で取得し脆弱パッケージを解析
npm audit --json | node -e "
  const chunks = [];
  process.stdin.on('data', c => chunks.push(c));
  process.stdin.on('end', () => {
    const data = JSON.parse(chunks.join(''));
    const v = (data.metadata && data.metadata.vulnerabilities) || {};
    console.log('Critical:', v.critical || 0, '/ High:', v.high || 0);
    console.log('---');
    const vulns = data.vulnerabilities || {};
    Object.entries(vulns).forEach(([name, info]) => {
      if (info.severity === 'critical') {
        console.log('[CRITICAL]', name);
        console.log('  via:', (info.via || []).map(v => typeof v === 'string' ? v : v.name).join(', '));
        console.log('  fixAvailable:', JSON.stringify(info.fixAvailable));
      }
    });
  });
"
```

**依存チェーンの確認（間接依存の場合）:**

```bash
# 脆弱パッケージがどの直接依存に含まれているか確認
npm ls {脆弱なパッケージ名}
```

---

### Step 4: 修正戦略の選択

`@references/fix-strategies.md` を参照して Strategy A → B → C の順で試みる。

| Strategy               | 条件                                               | アクション                                     |
| ---------------------- | -------------------------------------------------- | ---------------------------------------------- |
| **A** 直接更新         | `fixAvailable.name` が存在する（直接依存）         | `npm install {pkg}@latest`                     |
| **B** 親パッケージ更新 | 間接依存だが親パッケージのアップデートで解決できる | 依存チェーンを辿り親パッケージを更新           |
| **C** overrides        | A/B が不可能な場合のみ                             | `package.json` に `overrides` セクションを追加 |

---

### Step 5: 修正実行と検証

**Strategy A / B の場合:**

```bash
# 直接依存パッケージを更新
npm install {package}@latest

# 複数パッケージを同時更新
npm install {package1}@latest {package2}@latest
```

**Strategy C の場合:**

`package.json` の `overrides` セクションに追加し `npm install` を実行する。
詳細は `@references/fix-strategies.md` の Strategy C セクションを参照。

**検証（必須）:**

```bash
# npm audit で Critical が 0 になったことを確認
npm audit

# ビルド確認（.next 削除 + ビルドを含むため数分かかる）
npm run build

# テスト確認
npm run test:run
```

**期待する結果:**

- `npm audit` で Critical: 0
- `npm run build` が成功
- `npm run test:run` が全テストパス

---

### Step 6: コミット・プッシュ

```bash
# 変更ファイルを確認
git status

# package.json と package-lock.json をステージング
git add package.json package-lock.json

# コミット（変更内容を具体的に記載）
git commit -m "$(cat <<'EOF'
fix: {脆弱なパッケージ名}のCritical脆弱性を修正

- {修正した操作の要約（例: firebase-adminを最新バージョンに更新）}
- npm audit: Critical 0件を確認

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"

# プッシュ
git push
```

**プッシュ後の確認:**

```bash
# CIの再実行を確認
gh run list --workflow=security-review.yml --limit=3
```

---

## CI ゲート判定ロジック

`.github/workflows/security-review.yml` の `Enforce security gates` ステップより:

| 脆弱性レベル | 判定          | 動作                           |
| ------------ | ------------- | ------------------------------ |
| **Critical** | `exit 1`      | CIが失敗してゲートで止まる     |
| **High**     | `::warning::` | 警告のみ（ゲートは落とさない） |
| **Moderate** | `::notice::`  | 通知のみ                       |
| **Low**      | 無視          | 無視                           |

---

## プロジェクト固有の注意事項

- **`npm run build`** は `.next` ディレクトリ削除 + ビルドを含むため数分かかる
- **TypeScript ビルドエラー** は `ignoreBuildErrors: true` のため無視される
- **間接依存** が多い Firebase 関連パッケージは Strategy B が有効なことが多い
- **overrides** は最終手段。メンテナビリティが下がるため乱用しない

---

## Troubleshooting

| 問題                               | 解決策                                                                                |
| ---------------------------------- | ------------------------------------------------------------------------------------- |
| `npm install` 後も Critical が残る | `npm ls {pkg}` で依存チェーンを再確認、別の親パッケージも更新が必要な可能性           |
| `npm run build` が失敗             | ビルドエラーの内容を確認。TypeScript エラーは基本無視されるが、構文エラーは修正が必要 |
| `npm run test:run` が失敗          | テスト失敗の内容を確認。依存関係の更新でAPIが変わった可能性                           |
| overrides 適用後も解決しない       | `npm install` 後に `node_modules` を削除して `npm ci` を試みる                        |

---

## References

- `@references/fix-strategies.md` — 修正戦略の詳細とパターン集
- `.github/workflows/security-review.yml` — セキュリティゲートの判定ロジック
