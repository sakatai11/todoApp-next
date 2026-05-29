import { adminDB } from '@/app/libs/firebaseAdmin';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { AdminUser } from '@/types/auth/authData';
import { AdminUserFirestoreDocSchema } from '@/data/validatedData';

// ユーザー情報を取得する関数
export async function GET() {
  try {
    const session = await auth();
    console.log(`sessionData:${JSON.stringify(session, null, 2)}`);

    const sessionUserId = session?.user?.id;
    if (!session || !sessionUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const uid = sessionUserId;

    // Firestoreのusersコレクションからuidが一致するドキュメントを取得
    const doc = await adminDB.collection('users').doc(uid).get();
    const data = doc.data();

    let userData: AdminUser[] = [];
    if (data) {
      const parseResult = AdminUserFirestoreDocSchema.safeParse(data);
      if (!parseResult.success) {
        return NextResponse.json(
          { error: 'Invalid user data format' },
          { status: 500 },
        );
      }
      const { email, role, createdAt, name, image } = parseResult.data;
      userData = [
        { id: uid, email, role, createdAt: createdAt.toMillis(), name, image },
      ];
    }

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
