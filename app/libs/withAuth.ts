import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// 認証済みユーザーのリクエストを処理する関数
// T: リクエストボディの型
// R: レスポンスデータの型
export async function withAuthenticatedUser<T, R>(
  req: Request,
  handler: (uid: string, body: T) => Promise<NextResponse<R>>,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const uid = session.user.id;

  try {
    const clonedReq = req.clone(); // reqパラメータからクローン
    const body = await clonedReq.json();
    return await handler(uid, body);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
