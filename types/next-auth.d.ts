import { Session as DefaultSession, User as DefaultUser } from 'next-auth';
import { DefaultJWT } from 'next-auth/jwt';
declare module 'next-auth' {
  // ログインユーザーのセッション情報，auth(),useSession(),getServerSession()で使用可能
  interface Session extends DefaultSession {
    user?: {
      id?: string;
      email?: string;
      role?: string;
      customToken?: string;
    } & DefaultSession['user'];
  }

  //jwt callbackとsession callbackで使用可能。データベースを使用する場合は、session callbackの2番目のパラメータ。
  interface User extends DefaultUser {
    lastRefresh?: number;
    tokenIssuedAt?: number;
    tokenExpiry?: number;
    customToken?: string;
    lastUpdated?: number;
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  // JWT session使用時にjwt callbackで返されるオブジェクトの形状
  interface JWT extends DefaultJWT {
    lastRefresh?: number;
    tokenIssuedAt?: number;
    tokenExpiry?: number;
    customToken?: string;
    lastUpdated?: number;
    role?: string;
  }
}
