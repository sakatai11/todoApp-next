/**
 * サーバーサイド用バリデーションユーティリティ
 * APIルート（Route Handlers）で使用される共通バリデーション関数
 */

/**
 * 半角・全角スペース（U+3000）の両方をトリミングする
 * @param value - トリミング対象の文字列
 * @returns トリミング後の文字列
 * @example
 * trimAllSpaces('  test  ') // => 'test'
 * trimAllSpaces('　test　') // => 'test'（全角スペース除去）
 * trimAllSpaces('　　　') // => ''（全角スペースのみ → 空文字）
 * trimAllSpaces(null) // => ''（null/undefined → 空文字）
 */
export const trimAllSpaces = (value: string): string => {
  if (!value) return '';
  return value.replace(/^[\s\u3000]+|[\s\u3000]+$/g, '');
};
