// api/auth/token/route.ts
// import { AuthData } from '@/types/auth/authData';
import { adminAuth } from '@/app/libs/firebaseAdmin';

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return Response.json({ error: 'IDトークンが必要です' }, { status: 400 });
    }
    // Firebase Admin SDK を使ってトークンを検証
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Firebase トークンの有効期限を取得（秒単位）
    const tokenExpiry = decodedToken.exp - Math.floor(Date.now() / 1000);

    // カスタムトークンを発行
    const customToken = await adminAuth.createCustomToken(uid);

    return Response.json({ customToken, decodedToken, tokenExpiry });
  } catch (error) {
    console.error('Error generating custom token:', error);
    return Response.json({ error: 'Invalid credentials' }, { status: 500 });
  }
}
