// /app/api/auth/refresh/route.ts
import { NextResponse } from 'next/server';
import { AuthDecodedTokenSchema } from '@/data/validatedData';

export async function POST(req: Request) {
  try {
    // 内部シークレット検証: auth.config.ts の JWT コールバックからのみ呼び出し可能
    const internalSecret = req.headers.get('X-Internal-Secret');
    if (!internalSecret || internalSecret !== process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const response: unknown = await req.json();

    // **Zod でバリデーション**
    const validatedData = AuthDecodedTokenSchema.safeParse(response);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: '無効なリクエスト: ユーザーIDが必要です' },
        { status: 400 },
      );
    }

    const { uid } = validatedData.data;

    if (
      process.env.NODE_ENV === 'development' &&
      process.env.NEXT_PUBLIC_API_MOCKING === 'enabled'
    ) {
      return NextResponse.json({
        customToken: `mock-custom-token-${uid}`,
        success: true,
        message: 'トークンが更新されました',
      });
    }

    const { adminAuth } = await import('@/app/libs/firebaseAdmin');

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
