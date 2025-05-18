// auth.ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from '@/auth.config';
import { CredentialsSchema } from '@/data/validatedData';
import { adminDB } from '@/app/libs/firebaseAdmin';

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
          const res = await fetch(
            `${process.env.NEXTAUTH_URL}/api/auth/server-login`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
            },
          );

          if (!res.ok) {
            throw new Error('ログインに失敗しました');
          }

          const { customToken, decodedToken, tokenExpiry } = await res.json();
          // Firestore から role を取得
          let role: string | undefined = undefined;
          try {
            const userDoc = await adminDB.collection('users').doc(decodedToken.uid).get();
            role = userDoc.data()?.role;
          } catch (e) {
            console.error('Error fetching user role in authorize:', e);
          }
          console.log('token:', customToken);
          return {
            id: decodedToken.uid,
            email: decodedToken.email,
            customToken,
            tokenExpiry,
            role,
          };
        } catch (error) {
          console.error('Error signing in with custom token:', error);
          throw new Error('カスタムトークンによるログインに失敗しました');
        }
      },
    }),
  ],
});
