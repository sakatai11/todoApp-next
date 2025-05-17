'use server';

import { signOut } from '@/auth';

/**
 * サーバーサイドでサインアウト処理を実行する Server Action
 */
export async function authSignOut() {
  return await signOut({
    redirectTo: '/',
  });
}
