// auth.config.ts
import type { NextAuthConfig, Session, User } from 'next-auth';
import { NextRequest } from 'next/server';
// import { verifyPassword } from '@/app/utils/auth-utils';
// import { db } from '@/app/libs/firebase';
// import { doc, getDoc } from 'firebase/firestore';

export const authConfig = {
  pages: {
    signIn: 'signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30日
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
      console.log('authorized', auth, nextUrl.pathname);

      // /todo配下のルートの保護
      const isOnAuthenticatedPage = nextUrl.pathname.startsWith('/confirm');
      const isLoggedin = !!auth?.backendToken;

      if (isOnAuthenticatedPage && !isLoggedin) {
        // 未認証ならfalseを返し，Signinページにリダイレクトされる
        return false;
      }
      return true;
    },
    // JSON Web Token が作成されたとき（サインイン時など）や更新されたとき（クライアントでセッションにアクセスしたときなど）に呼び出される。
    // ここで返されるものはすべて JWT に保存され，session callbackに転送される。そこで、クライアントに返すべきものを制御できる。それ以外のものは、フロントエンドからは秘匿される。
    // JWTはAUTH_SECRET環境変数によってデフォルトで暗号化される。
    // セッションに何を追加するかを決定するために使用される
    async jwt({ token, user }) {
      console.log('jwt', token, user);
      if (user) {
        token.backendToken = user.backendToken;
        token.uid = user.id;
        token.email = user.email;
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
      session.backendToken = token.backendToken;
      session.user = token.user;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [],
} satisfies NextAuthConfig;
