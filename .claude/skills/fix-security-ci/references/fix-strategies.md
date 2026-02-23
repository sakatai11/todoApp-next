# Fix Strategies — npm 脆弱性修正パターン集

このファイルは `fix-security-ci` スキルで使用する修正戦略の詳細を定義します。

---

## 修正戦略の優先順位

```text
Strategy A（直接更新）
  ↓ 不可能な場合
Strategy B（親パッケージの更新）
  ↓ 不可能な場合
Strategy C（overrides）
```

**原則**: シンプルな解決策を優先する。overrides は最終手段。

---

## Strategy A: 直接更新

**適用条件**: `npm audit --json` の `vulnerabilities[pkg].fixAvailable.name` が存在する場合

```bash
# npm audit JSON の解析で fixAvailable を確認
npm audit --json | node -e "
  const chunks = [];
  process.stdin.on('data', c => chunks.push(c));
  process.stdin.on('end', () => {
    const data = JSON.parse(chunks.join(''));
    const vulns = data.vulnerabilities || {};
    Object.entries(vulns).forEach(([name, info]) => {
      if (info.severity === 'critical' && info.fixAvailable) {
        const fix = info.fixAvailable;
        if (fix === true) {
          console.log('[A] Direct fix available:', name, '→ npm install', name + '@latest');
        } else if (fix.name) {
          console.log('[A] Fix via:', fix.name, '@' + fix.version);
        }
      }
    });
  });
"
```

**実装例:**

```bash
# 単一パッケージ
npm install {vulnerable-package}@latest

# 複数パッケージ同時更新
npm install {pkg1}@latest {pkg2}@latest

# 特定バージョン指定（latest に問題がある場合）
npm install {pkg}@{safe-version}
```

---

## Strategy B: 間接依存の親パッケージを更新

**適用条件**: 脆弱なパッケージが直接依存ではなく、親パッケージ経由で引き込まれている場合

**手順:**

### 1. 依存チェーンの確認

```bash
# 脆弱パッケージを引き込んでいる全パッケージを表示
npm ls {vulnerable-package}

# 出力例:
# todoApp-next@0.1.0
# └─┬ firebase-admin@12.x.x
#   └─┬ @google-cloud/storage@7.x.x
#     └── vulnerable-package@old-version
```

### 2. ルートに近い親パッケージを更新

```bash
# 依存チェーン上の直接依存を更新
npm install firebase-admin@latest

# 複数の親パッケージが関係する場合は同時更新
npm install firebase-admin@latest @google-cloud/storage@latest
```

### 3. 更新後の確認

```bash
npm audit
# Critical: 0 を確認
```

**実際の修正例（このプロジェクトで発生した事例）:**

- **脆弱パッケージ**: `path-to-regexp` (Critical)
- **依存チェーン**: `firebase-admin` → `@google-cloud/storage` → `path-to-regexp`
- **修正**: `firebase-admin@latest` と `@google-cloud/storage@latest` を同時更新

```bash
npm install firebase-admin@latest @google-cloud/storage@latest
```

---

## Strategy C: overrides（最終手段）

**適用条件**: Strategy A/B では解決できない場合（例: 親パッケージが古いバージョンにピン留めされていて更新できない）

**注意**: overrides はメンテナビリティを下げる。使用する場合はコメントで理由を記載すること。

### package.json への overrides 追加

```json
{
  "dependencies": {
    // 既存の依存関係
  },
  "overrides": {
    "{vulnerable-package}": "^{safe-version}"
  }
}
```

**複数パッケージをまとめて overrides する場合:**

```json
{
  "overrides": {
    "vulnerable-pkg-1": "^safe-version-1",
    "vulnerable-pkg-2": "^safe-version-2"
  }
}
```

**overrides 後の手順:**

```bash
# overrides 追加後に必ず npm install を実行
npm install

# 確認
npm audit
```

### overrides の解除条件

- 親パッケージが脆弱性を内包した新バージョンをリリースしたら overrides を削除し、Strategy A/B に切り替える
- 定期的に `npm ls {pkg}` で依存チェーンを確認し、不要になった overrides を削除する

---

## セキュリティゲートの判定ロジック（参考）

`.github/workflows/security-review.yml` の `Enforce security gates` ステップ:

```javascript
// Critical > 0 → exit 1（CIが失敗）
if (critical > 0) {
  console.log('::error::Critical vulnerabilities found: ' + critical);
  exit = 1;
}
// High > 0 → warning のみ（ゲートは落とさない）
else if (high > 0) {
  console.log('::warning::High vulnerabilities found: ' + high);
}
// Moderate → notice のみ
else if (moderate > 0) {
  console.log('::notice::Moderate vulnerabilities found: ' + moderate);
}
```

**ゲートが落ちる条件**: `critical > 0` のみ。

---

## よくある脆弱性パターンと対処法

### Firebase Admin SDK 関連

Firebase Admin SDK は多数のGoogle Cloud パッケージを依存として持ち、
それらの古いサブ依存がセキュリティ脆弱性を引き起こすことがある。

```bash
# Firebase 関連の依存チェーンを一括確認
npm ls | grep firebase
npm ls | grep google-cloud

# Firebase Admin + Google Cloud Storage を同時更新（推奨）
npm install firebase-admin@latest @google-cloud/storage@latest
```

### next.js / React 関連

Next.js の間接依存（`undici`, `path-to-regexp` 等）が脆弱性を持つことがある。

```bash
npm install next@latest
```

### 汎用的なユーティリティパッケージ（path-to-regexp, semver 等）

複数の親パッケージから引き込まれることが多い。`npm ls {pkg}` で全ての依存チェーンを確認。

```bash
# 全依存チェーンを確認
npm ls path-to-regexp

# 全親パッケージを一括更新
npm install firebase-admin@latest next@latest
```

---

## 修正後のチェックリスト

```
[ ] npm audit で Critical: 0 を確認
[ ] npm run build が成功（時間がかかるため注意）
[ ] npm run test:run が全テストパス
[ ] package.json と package-lock.json のみが変更されていることを確認
[ ] git add package.json package-lock.json
[ ] コミットメッセージに変更内容と audit 結果を記載
[ ] git push
[ ] CI の再実行を gh run list で確認
```
