'use server';

import { revalidatePath } from 'next/cache';
import { PrevState } from '@/types/email/formData';
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
  // formのname属性ごとにformData.get()で値を取り出す
  const rawFormData = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    timestamp: serverTimestamp(),
  };

  if (
    !rawFormData.name &&
    (!rawFormData.email || !validateEmail(rawFormData.email))
  ) {
    return {
      success: false,
      message: messageType.nameAndmail,
    };
  }

  if (!rawFormData.name) {
    return {
      success: false,
      option: 'name',
      message: messageType.name,
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

  try {
    const authResponse = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: rawFormData.name,
        email: rawFormData.email,
      }),
    });
    const data = await authResponse.json();
    console.log(data);
  } catch (e) {
    console.error('Error during authentication:', e);
  }

  // Cacheの再検証
  revalidatePath('/');

  return { success: true };
}
