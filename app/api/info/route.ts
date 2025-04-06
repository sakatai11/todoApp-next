import { getApiRequest } from '@/app/libs/apis';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

// 初回レンダリング時にデータを取得する関数
export async function GET() {
  try {
    const session = await auth();
    console.log(`sessionData:${JSON.stringify(session, null, 2)}`);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { todos, lists } = await getApiRequest(session);

    // JSONレスポンスを返す
    return NextResponse.json({ todos, lists }, { status: 200 });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 },
    );
  }
}
