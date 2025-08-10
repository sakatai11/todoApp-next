// auth.config.ts
import type { NextAuthConfig, Session, User } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export const authConfig = {
  pages: {
    signIn: '/signin',
  },
  session: {
    strategy: 'jwt',
    // セッション有効期限を 1 日 (24 hours) に設定（デフォルトは 30 日）
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    // Middlewareでユーザーの認証を行うときに呼び出される
    // NextResponseを返すことでリダイレクトやエラーを返すことができる
    authorized({
      auth,
      request: { nextUrl },
    }: {
      auth: Session | null;
      request: NextRequest;
    }) {
      console.log('Middleware authorized check:', {
        auth,
        pathName: nextUrl.pathname,
        hasCustomToken: !!auth?.user?.customToken,
        user: auth?.user,
      });

      // 管理者ページ保護
      const isOnAdminPage = nextUrl.pathname.startsWith('/admin');
      if (isOnAdminPage && auth?.user?.role !== 'ADMIN') {
        return false;
      }
      // /todo配下のルートの保護
      const isOnAuthenticatedPage = nextUrl.pathname.startsWith('/todo');
      const isLoggedin = !!auth?.user?.customToken;

      const isOnSignInPage = nextUrl.pathname === '/signin';

      if (isOnAuthenticatedPage && !isLoggedin) {
        // 未認証ならfalseを返し，Signinページにリダイレクトされる
        return false;
      }

      // ログイン済みでサインインページにアクセス → ダッシュボードへリダイレクト
      if (isOnSignInPage && isLoggedin) {
        return NextResponse.redirect(new URL('/todo', nextUrl.origin));
      }
      return true;
    },
    // JWT作成時や更新時に呼び出される
    async jwt({ token, user, session, trigger }) {
      // 初回ログイン時にユーザー情報をトークンにコピー
      if (user) {
        token.sub ??= user.id;
        token.email = user.email;
        token.customToken = user.customToken;
        token.tokenExpiry = user.tokenExpiry;
        token.tokenIssuedAt = Math.floor(Date.now() / 1000);
        // ユーザーロールをトークンに保存
        if ('role' in user && user.role) {
          token.role = user.role;
        }
      }

      // トークンリフレッシュの処理
      if (token.customToken && token.tokenIssuedAt) {
        const currentTime = Math.floor(Date.now() / 1000);
        const tokenAge = currentTime - token.tokenIssuedAt;
        console.log(tokenAge);

        // トークンが45分以上経過していて、かつ最後のリフレッシュから最低5分以上経っている場合のみ
        if (
          tokenAge > 45 * 60 ||
          currentTime - (token.lastRefresh ?? 0) > 5 * 60
        ) {
          try {
            console.log(token.lastRefresh);
            console.log('リフレッシュトークンを取得します');
            // Docker環境では内部ネットワークを使用
            const baseUrl =
              process.env.NEXT_PUBLIC_EMULATOR_MODE === 'true'
                ? process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
                : process.env.NEXTAUTH_URL;

            if (!baseUrl) {
              throw new Error('Base URL is not configured for token refresh');
            }

            const refreshResponse = await fetch(`${baseUrl}/api/auth/refresh`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                uid: token.sub,
                email: token.email,
              }),
            });

            if (refreshResponse.ok) {
              const { customToken } = await refreshResponse.json();
              token.customToken = customToken;
              token.tokenIssuedAt = currentTime;
              token.lastRefresh = currentTime;
              console.log('トークンが更新されました');
            } else {
              console.error('トークンの更新に失敗しました');
            }
          } catch (error) {
            console.error('トークンリフレッシュエラー:', error);
          }
        }
      }

      // update トリガーの場合（セッションが更新された場合）
      if (trigger === 'update' && session?.customToken) {
        token.customToken = session.customToken;
        token.tokenIssuedAt = Math.floor(Date.now() / 1000);
      }

      return token;
    },
    // セッションに公開するデータを設定
    async session({ session, token }) {
      console.log('session', session, token);
      session.user = {
        id: token.sub,
        email: token.email,
        role: token.role,
      };
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [],
} satisfies NextAuthConfig;
