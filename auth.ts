// auth.ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from '@/auth.config';
import { CredentialsSchema } from '@/data/validatedData';

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    // signInが呼ばれた際にこの関数が呼び出される
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('authorize:', credentials);

        const parsedCredentials = CredentialsSchema.safeParse(credentials);
        if (!parsedCredentials.success) {
          throw new Error('認証情報が不足しているか、形式が間違っています');
        }

        const { email, password } = parsedCredentials.data;

        // credentialsの存在チェックを追加
        if (!email || !password) {
          throw new Error('認証情報が不足しています');
        }

        // 環境変数が未定義時のハンドリング
        if (!process.env.NEXTAUTH_URL) {
          throw new Error('NEXTAUTH_URL is not defined');
        }

        try {
          // Docker環境では内部ネットワークを使用
          const baseUrl =
            process.env.NEXT_PUBLIC_EMULATOR_MODE === 'true'
              ? 'http://localhost:3000' // Docker内部ネットワーク
              : process.env.NEXTAUTH_URL;

          const res = await fetch(`${baseUrl}/api/auth/server-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          if (!res.ok) {
            throw new Error('ログインに失敗しました');
          }

          const { customToken, decodedToken, tokenExpiry, userRole } =
            await res.json();
          console.log('token:', customToken);
          return {
            id: decodedToken.uid,
            email: decodedToken.email,
            customToken,
            tokenExpiry,
            role: userRole, // server-loginから返されたroleを使用
          };
        } catch (error) {
          console.error('Error signing in with custom token:', error);
          throw new Error('カスタムトークンによるログインに失敗しました');
        }
      },
    }),
  ],
});
