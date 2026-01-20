# コード品質ルール

このファイルはプロジェクト全体のコード品質基準を定義します。

## コーディング規約

### TypeScript型安全性

- **`any`型の禁止**: `any`型の使用を避け、適切な型定義を使用
- **型推論の活用**: 明示的な型注釈が不要な場合は型推論を活用
- **厳密な型チェック**: `tsconfig.json`の`strict: true`を維持
- **null/undefined処理**: Optional Chainingとnullish coalescingを活用

```typescript
// ✅ 推奨
const user: User | null = await fetchUser();
const name = user?.name ?? 'Unknown';

// ❌ 非推奨
const user: any = await fetchUser();
const name = user.name || 'Unknown';
```

### ESLint/Prettier

- **自動修正**: コミット前に`npm run format`を実行
- **ESLint**: ESLint 9.20.0準拠
- **Prettier**: Prettier 3.5.0でコードフォーマット

### コンポーネント設計原則

- **単一責任の原則**: 各コンポーネントは1つの責任のみを持つ
- **React.memo**: パフォーマンス最適化のためメモ化を活用
- **Props型定義**: 全てのPropsに厳密な型定義を提供
- **再利用性**: 共通コンポーネントは`features/shared/`に配置

```typescript
// ✅ 推奨
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export const Button = React.memo<ButtonProps>(({ label, onClick, disabled = false }) => {
  return <button onClick={onClick} disabled={disabled}>{label}</button>;
});

Button.displayName = 'Button';
```

### 既存パターンの踏襲

- **MUI + Tailwind**: Material-UIをベースにTailwind CSSで調整
- **NextAuth.js v5**: カスタム認証プロバイダーパターンを維持
- **Firebase Admin SDK**: サーバーサイド処理での一貫した使用
- **エラーハンドリング**: 統一されたエラーレスポンス形式

```typescript
// API エラーレスポンス統一形式
{
  error: string;
  details?: unknown;
}
```

## テスト品質基準

### テストカバレッジ

- **ユニットテスト**: 通常100%を目標とするが、Firebase通信・外部API等は統合テストで検証
- **統合テスト**: APIエンドポイントと外部依存関係の実際の動作を検証
- **E2Eテスト**: 主要ユーザーフローの包括的検証

### テスト説明文の表記統一

```typescript
// ✅ 推奨パターン
it('コンポーネントが正常にレンダリングされる', () => {});
it('ボタンクリック時に正常に動作する', () => {});
it('入力値が正常に処理される', () => {});

// ❌ 非推奨パターン（表記揺れ）
it('コンポーネントが正しく表示される', () => {}); // → 「正常に」に統一
it('ボタンクリック時に適切に動作する', () => {}); // → 「正常に」に統一
```

**使い分けガイドライン**:
- **「正常に」**: 基本動作・システム処理（推奨）
- **「正しく」**: 非推奨 → 「正常に」に統一

### データ一貫性の維持

```typescript
// ✅ 推奨: サブモジュールデータを使用
import { mockTodos, mockLists } from '@/tests/test-utils';

render(<Component />, {
  initialTodos: mockTodos,
  initialLists: mockLists,
});

// ❌ 非推奨: 独自モックデータの定義
const customMockData = [
  { id: 'test-1', text: 'Custom Todo' }
];
```

### カバレッジに関する原則

**重要**: テストカバレッジは品質の結果であり、目標ではありません。

- **実用的なテスト**: 実際のユーザーシナリオと機能要件に基づいたテスト作成
- **意味のあるテスト**: 各テストケースが明確な目的と検証内容を持つ
- **禁止事項**: 無理やり100%、ダミーテスト、空モック、カバレッジツール操作

## バリデーション

### Zodスキーマの徹底

- **全API**: リクエスト/レスポンスでZodバリデーション必須
- **フォーム**: フォーム入力値の検証にZodスキーマを使用
- **型安全性**: Zodスキーマから型を推論（`z.infer<typeof schema>`）

```typescript
import { z } from 'zod';

const TodoSchema = z.object({
  text: z.string().min(1, 'Todo text is required'),
  status: z.enum(['todo', 'in-progress', 'done']),
  listId: z.string(),
});

type Todo = z.infer<typeof TodoSchema>;

const result = TodoSchema.safeParse(data);
if (!result.success) {
  return NextResponse.json({ error: result.error }, { status: 400 });
}
```

## コード保守性

### 過剰設計の回避

- **機能追加の抑制**: 要求された機能のみを実装
- **リファクタリング**: 変更箇所以外の不要なリファクタリングを避ける
- **コメント**: ロジックが自明でない場合のみコメントを追加
- **型注釈**: 変更しないコードに型注釈を追加しない

#### 過剰設計回避の判断フローチャート

実装前に以下の質問に答えてください：

```
1. この機能は要求に明示的に含まれているか？
   ├─ YES → 2へ
   └─ NO → ❌ 実装しない

2. 既存のコードで実現可能か？
   ├─ YES → ✅ 既存コードを使用
   └─ NO → 3へ

3. 現在3回以上使用されているか？または、将来確実に必要か？
   ├─ YES → 4へ
   └─ NO → ❌ 抽象化せず、直接実装

4. 抽象化することで複雑さが増すか？
   ├─ YES → ❌ 直接実装（3行の重複 > 1つの抽象化）
   └─ NO → ✅ 抽象化を実装
```

**具体例**:
- ❌ **過剰設計**: 1箇所でしか使わない汎用ヘルパー関数を作成
- ✅ **適切な設計**: 3箇所以上で使用する関数を共通化
- ❌ **過剰設計**: バグ修正時に周辺コードをリファクタリング
- ✅ **適切な設計**: バグ修正のみに集中
- ❌ **過剰設計**: 仮定の将来要件に対する設定可能性を追加
- ✅ **適切な設計**: 現在の要件に必要な機能のみを実装

### 後方互換性

- **破壊的変更の回避**: 未使用の`_vars`、再エクスポート、`// removed`コメント等の互換性ハックを避ける
- **不要コードの削除**: 使用されていないコードは完全に削除

```typescript
// ❌ 非推奨
const _oldFunction = () => {}; // 未使用だが残す
export { OldType }; // 使われていない再エクスポート

// ✅ 推奨
// 未使用コードは完全に削除
```
