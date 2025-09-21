// api/auth/token/route.ts
import { NextResponse } from 'next/server';
import { AuthResponseSchema } from '@/data/validatedData';

// Dynamic imports to avoid client-side loading
const getFirebaseAdmin = async () => {
  if (process.env.NEXT_PUBLIC_API_MOCKING !== 'enabled') {
    const { adminAuth, adminDB } = await import('@/app/libs/firebaseAdmin');
    return { adminAuth, adminDB };
  }
  return null;
};

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: 'メールとパスワードが必要です' },
      { status: 400 },
    );
  }

  try {
    // モック環境または統合テスト環境の場合
    if (
      (process.env.NODE_ENV === 'development' &&
        process.env.NEXT_PUBLIC_API_MOCKING === 'enabled') ||
      (process.env.NODE_ENV === 'test' &&
        process.env.NEXT_PUBLIC_EMULATOR_MODE === 'true')
    ) {
      // モックユーザーの認証
      const { mockUser } = await import('@/todoApp-submodule/mocks/data/user');
      const user = mockUser.find((u) => u.email === email);

      if (!user || password !== 'password') {
        // モック環境では固定パスワード
        return NextResponse.json({ error: '認証エラー' }, { status: 401 });
      }

      // モックレスポンスを生成
      const mockDecodedToken = {
        uid: user.id,
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + 3600, // 1時間後
      };

      const response = {
        decodedToken: mockDecodedToken,
        customToken: `mock-custom-token-${user.id}`,
        tokenExpiry: 3600,
        userRole: user.role,
      };

      return NextResponse.json(response);
    }

    // 本番環境の場合（既存のコード）
    const firebaseAdmin = await getFirebaseAdmin();
    if (!firebaseAdmin) {
      throw new Error('Firebase Admin SDK not available');
    }

    const { adminAuth, adminDB } = firebaseAdmin;

    // Firebase Auth REST APIを使ってサーバー側で認証（パスワード検証）
    const isEmulatorMode =
      process.env.FIREBASE_AUTH_EMULATOR_HOST ||
      process.env.NEXT_PUBLIC_EMULATOR_MODE === 'true';
    const firebaseApiKey =
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'fake-api-key';

    // Emulator環境とプロダクション環境でURLを切り替え
    const authUrl = isEmulatorMode
      ? `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=${firebaseApiKey}`
      : `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`;

    const requestBody = isEmulatorMode
      ? {
          email,
          password,
          returnSecureToken: true,
        }
      : {
          email,
          password,
          returnSecureToken: true,
        };

    const res = await fetch(authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const error = await res.json();
      console.error('server-login: Firebase REST login error:', error);
      return NextResponse.json({ error: '認証エラー' }, { status: 401 });
    }

    const data = await res.json();
    const idToken = data.idToken;

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    // Firebase トークンの有効期限を取得（秒単位）
    const tokenExpiry = decodedToken.exp - Math.floor(Date.now() / 1000);
    // カスタムトークンを発行
    const customToken = await adminAuth.createCustomToken(uid);

    // Firestore から role を取得
    let userRole: string | undefined = undefined;
    try {
      const userDoc = await adminDB.collection('users').doc(uid).get();
      userRole = userDoc.data()?.role;

      // Emulator環境でユーザーロールが存在しない場合のデフォルト値設定
      if (!userRole && isEmulatorMode) {
        userRole = email?.includes('admin') ? 'admin' : 'user';
      }
    } catch (e) {
      console.error('Error fetching user role:', e);
      // Emulator環境でのフォールバック
      if (isEmulatorMode) {
        userRole = email?.includes('admin') ? 'admin' : 'user';
      }
    }

    const response = { decodedToken, customToken, tokenExpiry, userRole };
    // **Zod でバリデーション**
    const validatedData = AuthResponseSchema.parse(response);

    return NextResponse.json(validatedData);
  } catch (error) {
    console.error('server-login: エラー発生:', error);
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 500 });
  }
}
