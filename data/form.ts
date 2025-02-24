export const messageType = {
  name: '名前を入力してください',
  nameAndmail: '名前とメールアドレス項目を入力して下さい',
  mail: 'メールアドレスを確認して下さい',
  addressError: 'メールアドレスに問題があります',
} as const;

// Message 型定義
export type validationMessage =
  | typeof messageType.name
  | typeof messageType.nameAndmail
  | typeof messageType.mail
  | typeof messageType.addressError;
