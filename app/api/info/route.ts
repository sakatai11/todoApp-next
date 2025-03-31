import { getApiRequest } from '@/app/libs/apis';
import { NextResponse } from 'next/server';

// 初回レンダリング時にデータを取得する関数
export async function GET() {
  try {
    const { todos, lists } = await getApiRequest();

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
