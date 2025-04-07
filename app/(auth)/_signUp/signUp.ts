// _signUp/signUp.ts
'use server';

import { revalidatePath } from 'next/cache';
import { PrevState } from '@/types/form/formData';
import { messageType } from '@/data/form';
import { getServerApiRequest } from '@/app/libs/apis';
import { serverTimestamp } from 'firebase/firestore';
import { handleError } from '@/app/utils/authUtils';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
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
    const existingUser = await getServerApiRequest(rawFormData.email);
    if (existingUser) {
      return {
        success: false,
        option: 'email',
        message: messageType.mailError,
      };
    }

    const auth = getAuth();
    const userRecord = await auth.createUser({
      email: rawFormData.email.toLowerCase(),
      password: rawFormData.password,
      emailVerified: false,
      disabled: false,
    });

    console.log(`userRecord:${userRecord}`);

    const adminDb = getFirestore();

    // ユーザーデータ管理者権限を使って保存
    await adminDb.collection('users').doc(userRecord.uid).set({
      email: rawFormData.email,
      role: 'USER',
      createdAt: serverTimestamp(),
    });

    // Cacheの再検証
    revalidatePath('/signup');
  } catch (error) {
    return handleError(error);
  }
  return { success: true, message: '登録しました！' };
}
