export const messageType = {
  password: 'パスワードを入力してください',
  passwordAndmail: 'パスワードとメールアドレス項目を入力して下さい',
  passwordError: 'パスワードは12文字以上で大文字と数字を含めてください',
  mail: 'メールアドレスを確認して下さい',
  addressError: 'メールアドレスに問題があります',
  mailError: 'このメールアドレスは既に登録されています',
} as const;

// Message 型定義
export type validationMessage =
  | typeof messageType.password
  | typeof messageType.passwordAndmail
  | typeof messageType.passwordError
  | typeof messageType.mail
  | typeof messageType.addressError
  | typeof messageType.mailError;
