export const messageType = {
  password: 'パスワードを入力してください',
  passwordAndmail: 'パスワードとメールアドレス項目を入力して下さい',
  mail: 'メールアドレスを確認して下さい',
  addressError: 'メールアドレスに問題があります',
} as const;

// Message 型定義
export type validationMessage =
  | typeof messageType.password
  | typeof messageType.passwordAndmail
  | typeof messageType.mail
  | typeof messageType.addressError;
