// _signUp/signUp.ts
'use server';

import { revalidatePath } from 'next/cache';
import { PrevState } from '@/types/form/formData';
import { messageType } from '@/data/form';
import { getClientApiRequest } from '@/app/libs/apis';
import { db } from '@/app/libs/firebase';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { handleError } from '@/app/utils/authUtils';
// import { hashPassword } from '@/app/utils/auth-utils';
// import { redirect } from 'next/navigation';
// import { signIn } from '@/auth';
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

export async function signUpData(_prevState: PrevState, formData: FormData) {
  // formの属性ごとにformData.get()で値を取り出す
  const rawFormData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    // timestamp: serverTimestamp(),
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
    // メール重複チェック
    const existingUser = await getClientApiRequest(rawFormData.email);
    if (existingUser.exists()) {
      return {
        success: false,
        option: 'email',
        message: messageType.mailError,
      };
    }

    // パスワードハッシュ化
    // const hashedPassword = hashPassword(rawFormData.password);

    // ユーザーデータ保存
    await setDoc(
      doc(db, 'users', rawFormData.email),
      {
        email: rawFormData.email,
        password: rawFormData.password,
        createdAt: serverTimestamp(),
        lastLogin: null,
        failedAttempts: 0,
        lockedUntil: null,
      },
      { merge: true },
    );

    // // 自動ログイン処理
    // const email = rawFormData.email;
    // const password = rawFormData.password;

    // const result = await signIn('credentials', {
    //   email,
    //   password,
    //   redirect: false,
    // });

    // if (result?.error) {
    //   throw new Error('自動ログインに失敗しました');
    // }

    // NEXT_REDIRECTが投げられ，catchでリダイレクトされる
    // await signIn('credentials', rawFormData);

    // Cacheの再検証
    revalidatePath('/signup');
  } catch (error) {
    return handleError(error);
  }
  return { success: true, message: '登録しました！' };
}
