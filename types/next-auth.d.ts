import { Session as DefaultSession, User as DefaultUser } from 'next-auth';
import { DefaultJWT } from 'next-auth/jwt';
import { UserRole } from '@/types/auth/authData';
declare module 'next-auth' {
  // ログインユーザーのセッション情報，auth(),useSession(),getServerSession()で使用可能
  interface Session extends DefaultSession {
    user?: {
      id?: string;
      email?: string;
      role?: UserRole;
      customToken?: string;
    } & DefaultSession['user'];
    tokenExpiry?: number;
    tokenIssuedAt?: number;
    lastRefresh?: number;
  }

  //jwt callbackとsession callbackで使用可能。データベースを使用する場合は、session callbackの2番目のパラメータ。
  interface User extends DefaultUser {
    lastRefresh?: number;
    tokenIssuedAt?: number;
    tokenExpiry?: number;
    customToken?: string;
    role?: UserRole;
  }
}

declare module 'next-auth/jwt' {
  // JWT session使用時にjwt callbackで返されるオブジェクトの形状
  interface JWT extends DefaultJWT {
    lastRefresh?: number;
    tokenIssuedAt?: number;
    tokenExpiry?: number;
    customToken?: string;
    id?: string;
    role?: UserRole;
    lastUpdated?: number;
  }
}
