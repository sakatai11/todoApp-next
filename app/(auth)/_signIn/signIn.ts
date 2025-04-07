// _signIn/signIn.ts
'use server';

import { revalidatePath } from 'next/cache';
import { PrevState } from '@/types/form/formData';
import { messageType } from '@/data/form';
import { AuthError } from 'next-auth';
// import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { redirect } from 'next/navigation';
// import { AuthError } from 'next-auth';
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

  try {
    await signIn('credentials', {
      email: rawFormData.email,
      password: rawFormData.password,
      redirect: false, // 明示的に自動リダイレクトを無効化
    });

    throw new Error('NEXT_REDIRECT');
  } catch (error) {
    if (error instanceof AuthError) {
      console.error('Signin error:', error);

      switch (error.type) {
        case 'CallbackRouteError':
          return {
            success: false,
            message: 'メールアドレスまたはパスワードが間違っています',
          };
      }
      return {
        success: false,
        message:
          '登録処理中にエラーが発生しました。時間をおいて再度お試しください',
      };
    }
  }
  // Cacheの再検証
  revalidatePath('/signin');
  // リダイレクト
  redirect('/todo');
}
