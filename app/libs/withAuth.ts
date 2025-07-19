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

  // テスト環境では X-User-ID ヘッダーから認証情報を取得
  if (
    process.env.NODE_ENV === 'test' ||
    process.env.NEXT_PUBLIC_EMULATOR_MODE === 'true'
  ) {
    uid = req.headers.get('X-User-ID') || undefined;
    console.log('Test auth mode - Using X-User-ID:', uid);
  } else {
    // 本番環境では通常のセッション認証
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
      if (req.method === 'DELETE') {
        // DELETEリクエストのクエリパラメータから id を取得
        try {
          const url = new URL(req.url);
          const id = url.searchParams.get('id');
          if (id) {
            body = { id } as T;
          }
          console.log('DELETE request parsed - id:', id);
        } catch (error) {
          console.error('Error parsing DELETE URL:', error);
        }
      } else {
        // POST/PUTなどのリクエストではJSONボディを解析
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
    }

    return await handler(uid, body);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
