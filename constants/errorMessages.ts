/**
 * エラーメッセージ定数
 *
 * アプリケーション全体で使用するエラーメッセージを一元管理します。
 * ErrorContext（Snackbar）とErrorDisplay（全画面）の両方で使用されます。
 */

// Todo操作関連のエラーメッセージ
export const TODO_ERROR_MESSAGES = {
  ADD_FAILED: 'Todoの追加に失敗しました',
  DELETE_FAILED: 'Todoの削除に失敗しました',
  UPDATE_FAILED: 'Todoの保存に失敗しました',
  TOGGLE_FAILED: 'Todo状態の切り替えに失敗しました',
} as const;

// リスト操作関連のエラーメッセージ
export const LIST_ERROR_MESSAGES = {
  ADD_FAILED: 'リストの追加に失敗しました',
  SORT_FAILED: 'リストの並び替えに失敗しました',
  MOVE_FAILED: 'リストの移動に失敗しました',
} as const;

// 認証関連のエラーメッセージ
export const AUTH_ERROR_MESSAGES = {
  NOT_AUTHENTICATED: '認証されていません。ログインしてください。',
  INCOMPLETE_AUTH: '認証情報が不完全です。再ログインしてください。',
  SESSION_EXPIRED: 'セッションが切れました。再度ログインしてください。',
} as const;

// データ取得関連のエラーメッセージ
export const DATA_ERROR_MESSAGES = {
  FETCH_FAILED: 'データの取得に失敗しました',
  LOAD_FAILED: 'データの読み込みに失敗しました',
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
} as const;

// 全てのエラーメッセージを統合
export const ERROR_MESSAGES = {
  TODO: TODO_ERROR_MESSAGES,
  LIST: LIST_ERROR_MESSAGES,
  AUTH: AUTH_ERROR_MESSAGES,
  DATA: DATA_ERROR_MESSAGES,
} as const;

// 型推論用の型定義
export type ErrorMessageType = typeof ERROR_MESSAGES;
