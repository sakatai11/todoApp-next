// auth.config.ts
import type { NextAuthConfig, Session, User } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export const authConfig = {
  pages: {
    signIn: 'signin',
  },
  session: {
    strategy: 'jwt',
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
    // JSON Web Token が作成されたとき（サインイン時など）や更新されたとき（クライアントでセッションにアクセスしたときなど）に呼び出される。
    // ここで返されるものはすべて JWT に保存され，session callbackに転送される。そこで、クライアントに返すべきものを制御できる。それ以外のものは、フロントエンドからは秘匿される。
    // JWTはAUTH_SECRET環境変数によってデフォルトで暗号化される。
    // セッションに何を追加するかを決定するために使用される
    // user は authorize() の結果として渡される。
    // token に user の情報をコピー。
    async jwt({ token, user, session, trigger }) {
      // 初回ログイン時にユーザー情報をトークンにコピー
      if (user) {
        token.sub ??= user.id; // `sub` が未定義の場合のみ `user.id` を設定
        token.email = user.email;
        token.role = user.role; // ログイン時に role を保存
        token.customToken = user.customToken;
        token.tokenExpiry = user.tokenExpiry; // トークン有効期限を保存
        token.tokenIssuedAt = Math.floor(Date.now() / 1000); // トークン発行時刻を保存
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
            const refreshResponse = await fetch(
              `${process.env.NEXTAUTH_URL}/api/auth/refresh`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  uid: token.sub,
                  email: token.email,
                }),
              },
            );

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
    //セッションがチェックされるたびに呼び出される（useSessionやgetSessionを使用して/api/sessionエンドポイントを呼び出した場合など）。
    // 戻り値はクライアントに公開されるので、ここで返す値には注意が必要！
    // jwt callbackを通してトークンに追加したものをクライアントが利用できるようにしたい場合，ここでも明示的に返す必要がある
    // token引数はjwtセッションストラテジーを使用する場合にのみ利用可能で、user引数はデータベースセッションストラテジーを使用する場合にのみ利用可能
    // JWTに保存されたデータのうち，クライアントに公開したいものを返す
    async session({ session, token }) {
      console.log('session', session, token);
      session.user = {
        id: token.sub,
        email: token.email,
        role: token.role,
        customToken: token.customToken,
      };

      // トークンの有効期限情報をセッションに追加
      session.tokenExpiry = token.tokenExpiry;
      session.tokenIssuedAt = token.tokenIssuedAt;

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [],
} satisfies NextAuthConfig;
