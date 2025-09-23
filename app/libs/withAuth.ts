import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// 認証済みユーザーのリクエストを処理する関数
// T: リクエストボディの型
// R: レスポンスデータの型
export async function withAuthenticatedUser<T, R>(
  req: Request,
  handler: (uid: string, body?: T) => Promise<NextResponse<R>>,
) {
  let uid: string | undefined;

  // 統合テスト環境では X-Test-User-ID ヘッダー認証を使用
  if (process.env.NODE_ENV === 'test' && process.env.FIRESTORE_EMULATOR_HOST) {
    uid = req.headers.get('X-Test-User-ID') || undefined;
  }
  // ローカル開発環境（npm run dev）でのみ X-User-ID ヘッダー認証を使用
  else if (
    process.env.NEXT_PUBLIC_EMULATOR_MODE === 'true' &&
    process.env.NODE_ENV === 'development' &&
    !process.env.FIRESTORE_EMULATOR_HOST
  ) {
    uid = req.headers.get('X-User-ID') || undefined;
  }
  // 本番環境・Docker開発環境では NextAuth.js セッション認証
  else {
    const session = await auth();
    uid = session?.user?.id;
  }

  if (!uid) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    let body: T | undefined;

    // GETリクエストではボディを読み取らない
    if (req.method !== 'GET') {
      // POST/PUT/DELETEリクエストではJSONボディを解析
      const clonedReq = req.clone();
      const contentType = clonedReq.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        try {
          body = await clonedReq.json();
        } catch (error) {
          console.error('Error parsing JSON body:', error);
        }
      }
    }

    return await handler(uid, body);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
