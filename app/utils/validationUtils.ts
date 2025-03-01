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
        message === messageType.passwordAndmail)) ||
    option === 'password';

  const isEmailError =
    (isError &&
      (message === messageType.mail ||
        message === messageType.passwordAndmail ||
        message === messageType.addressError)) ||
    option === 'email';

  // フィールドタイプに応じたエラー状態を返す
  return fieldType === 'password' ? isPasswordError : isEmailError;
};

// バリデーション結果によってメッセージを返す関数
export const getErrorMessage = ({ message, fieldType }: ValidationParams) => {
  if (fieldType === 'password') {
    return message === messageType.password ||
      message === messageType.passwordAndmail
      ? messageType.password
      : null;
  }

  return message === messageType.mail || message === messageType.passwordAndmail
    ? messageType.mail
    : message === messageType.addressError
      ? messageType.addressError
      : null;
};
