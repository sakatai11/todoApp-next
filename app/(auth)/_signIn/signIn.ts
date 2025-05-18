// _signIn/signIn.ts
'use server';

// import { revalidatePath } from 'next/cache';
import { PrevState } from '@/types/form/formData';
import { messageType } from '@/data/form';
import { signIn } from '@/auth';
// import { validatePassword } from 'firebase/auth';

function validateEmail(email: string) {
  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|jp|net|to|cx)$/;
  return pattern.test(email);
}

// パスワード強度チェック
// function validatePassword(password: string) {
//   return (
//     password.length < 12 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)
//   );
// }

export async function signInData(_prevState: PrevState, formData: FormData) {
  // formの属性ごとにformData.get()で値を取り出す
  const rawFormData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  if (
    !rawFormData.password &&
    (!rawFormData.email || !validateEmail(rawFormData.email))
  ) {
    return {
      success: false,
      option: 'default',
    };
  }

  if (!rawFormData.password) {
    return {
      success: false,
      option: 'password',
      message: messageType.password,
    };
  }

  // if (validatePassword(rawFormData.password)) {
  //   return {
  //     success: false,
  //     option: 'password',
  //     errorDivision: '1',
  //     message: messageType.passwordError,
  //   };
  // }

  if (!rawFormData.email) {
    return {
      success: false,
      option: 'email',
      message: messageType.mail,
    };
  }

  if (!validateEmail(rawFormData.email)) {
    return {
      success: false,
      option: 'email',
      message: messageType.addressError,
    };
  }

  // 認証試行
  try {
    const result = await signIn('credentials', {
      email: rawFormData.email,
      password: rawFormData.password,
      redirect: false,
    });
    // 認証失敗時は NextAuth の結果を参照
    if (result?.error) {
      return {
        success: false,
        option: 'default',
        message: 'メールアドレスまたはパスワードが間違っています',
      };
    }
  } catch (error) {
    console.error('Signin exception:', error);
    return {
      success: false,
      option: 'default',
      message: '認証中に予期せぬエラーが発生しました',
    };
  }
  // Cache の再検証
  // revalidatePath('/signin');
  // 認証成功フラグを返却（リダイレクトは middleware にて制御）
  return {
    success: true,
    option: '',
    message: undefined,
  };
}
