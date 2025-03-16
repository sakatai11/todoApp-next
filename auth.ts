// auth.ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from '@/auth.config';

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
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

        const url = process.env.NEXTAUTH_URL + '/api/auth/login';
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
        });

        if (!res.ok) {
          throw new Error('ログインに失敗しました');
        }

        const responseData = await res.json();
        const backendToken = responseData.accessToken;

        console.log('token:', backendToken);
        if (!backendToken) {
          // 認証に失敗した場合は nullを返すか，エラーを投げることが期待される
          // CredentialsSignin がスローされた場合、または null が返された場合、以下の 2 つのことが起こる：
          // 1. URL に error=CredentialsSignin&code=credentials を指定して、ユーザーをログインページにリダイレクトする。
          // 2. フォームアクションをサーバーサイドで処理するフレームワークでこのエラーを投げる場合(例えばserver actionsでsignInを呼び出す場合)、このエラーはログインフォームアクションによって投げられるので、そこで処理する必要がある。
          throw new Error('トークンの取得に失敗しました');
        }
        return { backendToken };
      },
    }),
  ],
  // リダイレクト設定
  callbacks: {
    ...authConfig.callbacks,
    async redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : baseUrl + '/confirm';
    },
  },
});
