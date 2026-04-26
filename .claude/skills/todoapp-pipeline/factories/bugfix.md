# Factory: bugfix

バグ修正のための工場フロー。**再現テスト先行（red → green）** でリグレッションを防ぐ。

## 入力

`NormalizedTask`（type=bugfix または type=optimization）

- `type=bugfix`: `context.reproSteps` が必須（trigger 段階で確保済み）
- `type=optimization`: 計測指標（PostHog/Lighthouse 等）が `description` に明記されていること

## 処理フロー

### Step 1: 原因調査

**Goal**: バグが発生している場所と根本原因を特定する

`code-explorer` エージェントを起動：

```
プロンプト:
「以下の再現手順で発生するバグの根本原因を特定してください。

# 再現手順
<reproSteps>

# 期待動作
<description から抽出>

# 実際の動作 / エラー
<description から抽出>

該当する以下のファイルを特定してください:
1. 直接の発生源
2. 関連する状態管理（Context / SWR）
3. 関連するAPI（あれば）
4. 関連するテスト

修正前の現状を正確にトレースしてください。」
```

### Step 2: 既存テストの確認

```bash
# 関連テストファイルを探す
grep -r "<関連する関数名>" tests/ --include="*.test.ts" --include="*.test.tsx"
```

既存テストがあるか、ない場合はどこに追加するかを判断。

### Step 3: 再現テスト作成（red）

**重要**: 修正コードより**先に**テストを書く。

```typescript
// 例: features/todo/contexts/__tests__/TodoContext.test.tsx
describe('Bug: <bug title>', () => {
  it('再現手順を実行するとバグが再現される', async () => {
    // Arrange: reproSteps[0] の状態をセットアップ

    // Act: reproSteps[1..] を実行

    // Assert: 期待動作になることを確認（現状は失敗する）
    expect(...).toBe(<期待値>); // ← 現状はこれが失敗する
  });
});
```

実行して **red を確認**：

```bash
npm run test:run -- <該当テストファイル>
```

failed であることを確認したら次へ。passしてしまった場合は再現条件が不足しているので Step 1 に戻る。

### Step 4: 修正実装

Step 1 で特定した根本原因を修正する。

**遵守事項**:

- バグ修正に直接関係ないリファクタリングはしない（CLAUDE.md準拠）
- 修正は最小限のスコープに留める
- 既存パターン（楽観的更新 / サーバーレスポンス待ち等）を踏襲

### Step 5: 再現テスト確認（green）

```bash
npm run test:run -- <該当テストファイル>
```

green になることを確認。

### Step 6: リグレッション確認

修正範囲に関連する既存テストも実行：

```bash
# 関連ディレクトリのテスト全体
npm run test:run -- features/<該当機能>
```

すべて green であることを確認。

### Step 7: 動作確認（推奨）

UIに関わるバグの場合、開発サーバーで実際に再現手順を試す：

```bash
# Docker環境が必要なら
npm run docker:dev

# または
npm run dev
```

実際に修正されていることを目視で確認。

### Step 8: 変更ファイルリスト返却

以下を整理して SKILL.md 側に返す：

- 修正ファイル一覧
- 追加した再現テストファイル
- 確認した既存テスト（リグレッション影響なしを示す）

→ Phase 4 (Quality Gate) へ

## 想定外パターン

### バグが再現できない

- 環境依存（特定のブラウザ / OS / データ状態）の可能性
- 人間に質問: 「再現環境の詳細を教えてください（ブラウザ / OS / ユーザーデータ）」
- 再現できなければパイプライン中断、調査タスクに切り替え

### 修正が広範囲に及ぶ

- 1ファイル / 数百行に収まらない場合は人間に確認
- 「これは bugfix の範囲を超えるリファクタリングが必要です。続行しますか？」

### 既存テストも修正必要

- バグの修正で既存テストが意図的に red になる場合、そのテストが「バグを正しい仕様として固定していた」可能性
- 人間に確認: 「以下の既存テストも修正が必要です。これは仕様変更扱いになります」
