'use server';

import { revalidatePath } from 'next/cache';
import { PrevState } from '@/types/form/formData';
import { messageType } from '@/data/form';
import { serverTimestamp } from 'firebase/firestore';

function validateEmail(email: string) {
  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|jp|net|to|cx)$/;
  return pattern.test(email);
}

export async function createLoginData(
  _prevState: PrevState,
  formData: FormData,
) {
  // formの属性ごとにformData.get()で値を取り出す
  const rawFormData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    timestamp: serverTimestamp(),
  };

  if (
    !rawFormData.password &&
    (!rawFormData.email || !validateEmail(rawFormData.email))
  ) {
    return {
      success: false,
      message: messageType.passwordAndmail,
    };
  }

  if (!rawFormData.password) {
    return {
      success: false,
      option: 'password',
      message: messageType.password,
    };
  }

  if (!rawFormData.email) {
    return {
      success: false,
      option: 'email',
      message: messageType.mail,
    };
  } else if (!validateEmail(rawFormData.email)) {
    return {
      success: false,
      option: 'email',
      message: messageType.addressError,
    };
  }

  // try {
  //   const authResponse = await fetch(
  //     `${process.env.NEXTAUTH_URL}/api/auth/signup`,
  //     {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         name: rawFormData.password,
  //         email: rawFormData.email,
  //       }),
  //     },
  //   );

  //   // if (!authResponse.ok) {
  //   //   throw new Error(`HTTP error! Status: ${authResponse.status}`);
  //   // }
  //   const data = await authResponse.json();
  //   console.log(data);
  // } catch (e) {
  //   console.error('Error during authentication:', e);
  // }

  // Cacheの再検証
  revalidatePath('/');

  return { success: true };
}
