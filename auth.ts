// auth.ts
import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from '@/auth.config';
import { CredentialsSchema } from '@/data/validatedData';

// カスタムエラークラスの定義
class InvalidCredentialsError extends CredentialsSignin {
  code = 'invalid_credentials';
}

class MissingCredentialsError extends CredentialsSignin {
  code = 'missing_credentials';
}

class MissingEnvError extends CredentialsSignin {
  code = 'missing_environment';
}

class AuthenticationFailedError extends CredentialsSignin {
  code = 'authentication_failed';
}

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
        const parsedCredentials = CredentialsSchema.safeParse(credentials);
        if (!parsedCredentials.success) {
          throw new InvalidCredentialsError(
            '認証情報が不足しているか、形式が間違っています',
          );
        }

        const { email, password } = parsedCredentials.data;

        // credentialsの存在チェックを追加
        if (!email || !password) {
          throw new MissingCredentialsError('認証情報が不足しています');
        }

        // 環境変数が未定義時のハンドリング
        if (!process.env.NEXTAUTH_URL) {
          throw new MissingEnvError('NEXTAUTH_URL is not defined');
        }

        try {
          // Docker環境では内部ネットワークを使用
          const baseUrl =
            process.env.NEXT_PUBLIC_EMULATOR_MODE === 'true'
              ? process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
              : process.env.NEXTAUTH_URL;

          if (!baseUrl) {
            throw new MissingEnvError(
              'Base URL is not configured for authentication',
            );
          }

          const res = await fetch(`${baseUrl}/api/auth/server-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          if (!res.ok) {
            throw new AuthenticationFailedError('ログインに失敗しました');
          }

          const { customToken, decodedToken, tokenExpiry, userRole } =
            await res.json();
          return {
            id: decodedToken.uid,
            email: decodedToken.email,
            customToken,
            tokenExpiry,
            role: userRole, // server-loginから返されたroleを使用
          };
        } catch (error) {
          // カスタムエラーはそのまま再スロー（error.codeを保持）
          if (error instanceof CredentialsSignin) {
            throw error;
          }
          if (error instanceof Error && 'cause' in error) {
            const cause = (error as { cause?: { err?: Error } }).cause;
            console.error('[auth][cause]', cause?.err);
            console.error('[auth][details]', error.message);
          } else {
            console.error('[auth][error]', error);
          }
          throw new AuthenticationFailedError(
            'カスタムトークンによるログインに失敗しました',
          );
        }
      },
    }),
  ],
});
