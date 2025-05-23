import { messageType } from '@/data/form';
import { ValidationParams } from '@/types/form/formData';

// バリデーション判定する関数
export const getValidationStatus = ({
  success,
  message,
  option,
  fieldType,
}: ValidationParams) => {
  const isError = success === false;

  // 各フィールドのエラー条件を判定

  const isPasswordError =
    (isError &&
      (message === messageType.password ||
        message === messageType.passwordError)) ||
    option === 'password' ||
    option === 'default';

  const isEmailError =
    (isError &&
      (message === messageType.mail ||
        message === messageType.addressError ||
        message === messageType.mailError)) ||
    option === 'email' ||
    option === 'default';

  const isNoPasswordAndOrMailError =
    (isError &&
      (message === 'メールアドレスまたはパスワードが間違っています' ||
        message ===
          '登録処理中にエラーが発生しました。時間をおいて再度お試しください')) ||
    option === '';

  if (message && option === '') {
    return isNoPasswordAndOrMailError;
  }

  // フィールドタイプに応じたエラー状態を返す
  return fieldType === 'password' ? isPasswordError : isEmailError;
};

// バリデーション結果によってメッセージを返す関数
export const getErrorMessage = ({
  message,
  option,
  fieldType,
}: ValidationParams): string | null => {
  switch (fieldType) {
    case 'password':
      if (message === messageType.password || option === 'default') {
        return messageType.password;
      } else if (message === messageType.passwordError) {
        return messageType.passwordError;
      }
      break;

    case 'email':
      if (message === messageType.mail || option === 'default') {
        return messageType.mail;
      } else if (message === messageType.addressError) {
        return messageType.addressError;
      } else if (message === messageType.mailError) {
        return messageType.mailError;
      }
      break;
  }

  return null;
};
