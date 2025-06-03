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
    const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      },
    );

    if (!res.ok) {
      const error = await res.json();
      console.error('Firebase REST login error:', error);
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
      const userDoc = await adminDB
        .collection('users')
        .doc(uid)
        .get();
      userRole = userDoc.data()?.role;
    } catch (e) {
      console.error('Error fetching user role:', e);
    }

    const response = { decodedToken, customToken, tokenExpiry, userRole };
    // **Zod でバリデーション**
    const validatedData = AuthResponseSchema.parse(response);

    return NextResponse.json(validatedData);
  } catch (error) {
    console.error('Error generating custom token:', error);
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 500 });
  }
}
