import { Session as DefaultSession, User as DefaultUser } from 'next-auth';
import { DefaultJWT } from 'next-auth/jwt';
import { UserRole } from '@/types/auth/authData';
declare module 'next-auth' {
  // ログインユーザーのセッション情報，auth(),useSession(),getServerSession()で使用可能
  interface Session extends DefaultSession {
    backendToken?: string;
    user?: {
      backendToken?: string;
      id?: string;
      email?: string;
      role?: UserRole;
    } & DefaultSession['user'];
  }

  //jwt callbackとsession callbackで使用可能。データベースを使用する場合は、session callbackの2番目のパラメータ。
  interface User extends DefaultUser {
    backendToken?: string;
    role?: UserRole;
  }
}

declare module 'next-auth/jwt' {
  // JWT session使用時にjwt callbackで返されるオブジェクトの形状
  interface JWT extends DefaultJWT {
    backendToken?: string;
    uid?: string;
    role?: UserRole;
    lastUpdated?: number;
  }
}
