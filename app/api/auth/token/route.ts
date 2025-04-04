// api/auth/token/route.ts
import { adminAuth } from '@/app/libs/firebaseAdmin';
import { NextResponse } from 'next/server';
import { AuthResponseSchema } from '@/data/validatedData';

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'IDトークンが必要です' },
        { status: 400 },
      );
    }
    // Firebase Admin SDK を使ってトークンを検証
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    // Firebase トークンの有効期限を取得（秒単位）
    const tokenExpiry = decodedToken.exp - Math.floor(Date.now() / 1000);
    // カスタムトークンを発行
    const customToken = await adminAuth.createCustomToken(uid);

    const response = { decodedToken, customToken, tokenExpiry };
    // **Zod でバリデーション**
    const validatedData = AuthResponseSchema.parse(response);

    return NextResponse.json(validatedData);
  } catch (error) {
    console.error('Error generating custom token:', error);
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 500 });
  }
}
