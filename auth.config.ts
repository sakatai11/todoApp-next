// auth.config.ts
import type { NextAuthConfig, Session, User } from 'next-auth';
import { NextRequest } from 'next/server';
import { getClientUserById } from '@/app/libs/apis';
// import { verifyPassword } from '@/app/utils/auth-utils';
// import { db } from '@/app/libs/firebase';
// import { doc, getDoc } from 'firebase/firestore';

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
      console.log('authorized', auth, nextUrl.pathname);

      // /todo配下のルートの保護
      const isOnAuthenticatedPage = nextUrl.pathname.startsWith('/confirm');
      const isLoggedin = !!auth?.customToken;

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
    // user は authorize() の結果として渡される。
    // token に user の情報をコピー。
    async jwt({ token, user }) {
      if (user) {
        token.sub ??= user.id; // `sub` が未定義の場合のみ `user.id` を設定
        token.email = user.email;
        token.role = user.role; // ログイン時に role を保存
        token.customToken = user.customToken;
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

      return session;
    },
    // リダイレクト設定
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) {
        return url; // 通常のリダイレクト
      }
      return baseUrl + '/confirm'; // 既定のリダイレクト先
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [],
} satisfies NextAuthConfig;
