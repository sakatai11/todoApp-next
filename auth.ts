// auth.ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from '@/auth.config';
// import { FirestoreAdapter } from '@auth/firebase-adapter';
// import { firebaseAdminApp } from '@/app/libs/firebaseAdmin';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { clientAuth } from '@/app/libs/firebase';

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
        // credentialsの存在チェックを追加
        if (!credentials?.email || !credentials?.password) {
          throw new Error('認証情報が不足しています');
        }

        // 環境変数が未定義時のハンドリング
        if (!process.env.NEXTAUTH_URL) {
          throw new Error('NEXTAUTH_URL is not defined');
        }

        try {
          const email = credentials.email as string;
          const password = credentials.password as string;

          // Firebase Authentication でログイン（メール+パスワードを検証）
          const userCredential = await signInWithEmailAndPassword(
            clientAuth,
            email,
            password,
          );
          const idToken = await userCredential.user.getIdToken(); // IDトークンを取得

          // ここでバックエンドにリクエストを送信してサーバートークンを取得
          const url = process.env.NEXTAUTH_URL + '/api/auth/token';
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken }),
          });

          if (!res.ok) {
            throw new Error('ログインに失敗しました');
          }

          const { customToken, decodedToken, tokenExpiry } = await res.json();
          console.log('token:', customToken);
          return {
            id: decodedToken.uid,
            email: decodedToken.email,
            customToken,
            tokenExpiry,
          };
        } catch (error) {
          console.error('Error signing in with custom token:', error);
          throw new Error('カスタムトークンによるログインに失敗しました');
        }
      },
    }),
  ],
  // Google 認証や GitHub 認証などで使用できる
  // 認証成功したらデータを取得するようにする（複数箇所ででfirebaseAdminAppのインポートしない）
  // adapter: FirestoreAdapter(firebaseAdminApp),
});
