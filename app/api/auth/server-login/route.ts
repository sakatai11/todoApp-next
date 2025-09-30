// api/auth/token/route.ts
import { adminAuth, adminDB } from '@/app/libs/firebaseAdmin';
import { NextResponse } from 'next/server';
import { AuthResponseSchema } from '@/data/validatedData';

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: 'メールとパスワードが必要です' },
      { status: 400 },
    );
  }

  try {
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
