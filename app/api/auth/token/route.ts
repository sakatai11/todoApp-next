// api/auth/sigin/route.ts
import { NextRequest, NextResponse } from 'next/server';
// import { AuthData } from '@/types/auth/authData';
import { getAuth } from 'firebase-admin/auth';
import firebaseAdminApp from '@/app/libs/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'IDトークンが必要です' },
        { status: 400 },
      );
    }

    const auth = getAuth(firebaseAdminApp);
    // Firebase Admin SDK を使ってトークンを検証
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // カスタムトークンを発行
    const customToken = await auth.createCustomToken(uid);

    return NextResponse.json({ customToken, decodedToken });
  } catch (error) {
    console.error('Error generating custom token:', error);
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 500 });
  }
}
