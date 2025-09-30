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

  // Dockerテスト環境では X-Test-User-ID ヘッダー認証を使用
  // USE_TEST_DB_DATAでDockerテスト環境のみに限定（Docker開発環境はUSE_DEV_DB_DATA）
  if (
    process.env.FIRESTORE_EMULATOR_HOST &&
    process.env.NEXT_PUBLIC_API_MOCKING === 'disabled' &&
    process.env.USE_TEST_DB_DATA === 'true'
  ) {
    uid = req.headers.get('X-Test-User-ID') || undefined;
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
