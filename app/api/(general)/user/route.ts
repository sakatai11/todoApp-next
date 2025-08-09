import { adminDB } from '@/app/libs/firebaseAdmin';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { UserData } from '@/types/auth/authData';

// ユーザー情報を取得する関数
export async function GET() {
  try {
    const session = await auth();
    console.log(`sessionData:${JSON.stringify(session, null, 2)}`);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const uid = session.user.id;

    // Firestoreのusersコレクションからuidが一致するドキュメントを取得
    const doc = await adminDB.collection('users').doc(uid).get();
    const data = doc.data();
    // 各データマッピング
    const userData: UserData[] = data
      ? [
          {
            id: uid,
            email: data.email,
            role: data.role,
            createdAt: data.createdAt.toMillis(),
          },
        ]
      : [];

    // JSONレスポンスを返す
    return NextResponse.json({ user: userData }, { status: 200 });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 },
    );
  }
}
