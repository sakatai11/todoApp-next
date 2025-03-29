// /app/api/auth/refresh/route.ts
import { adminAuth } from '@/app/libs/firebaseAdmin';

export async function POST(req: Request) {
  try {
    const { uid, email } = await req.json();

    if (!uid || !email) {
      return Response.json(
        { error: 'ユーザーIDもしくはemailが必要です' },
        { status: 400 },
      );
    }

    // Firebase Admin SDK を使って新しいカスタムトークンを発行
    const customToken = await adminAuth.createCustomToken(uid);

    return Response.json({
      customToken,
      success: true,
      message: 'トークンが更新されました',
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    return Response.json(
      {
        error: 'トークンの更新に失敗しました',
      },
      { status: 500 },
    );
  }
}
