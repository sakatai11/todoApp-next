// /app/api/auth/refresh/route.ts
import { adminAuth } from '@/app/libs/firebaseAdmin';
import { NextResponse } from 'next/server';
import { AuthDecodedTokenSchema } from '@/data/validatedData';

export async function POST(req: Request) {
  try {
    const response = await req.json();

    // **Zod でバリデーション**
    const validatedData = AuthDecodedTokenSchema.safeParse(response);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: '無効なリクエスト: ユーザーIDが必要です' },
        { status: 400 },
      );
    }

    const { uid } = validatedData.data;

    // Firebase Admin SDK を使って新しいカスタムトークンを発行
    const customToken = await adminAuth.createCustomToken(uid);

    return NextResponse.json({
      customToken,
      success: true,
      message: 'トークンが更新されました',
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    return NextResponse.json({ error: 'sever error' }, { status: 500 });
  }
}
