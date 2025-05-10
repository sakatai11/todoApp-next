import { auth } from '@/auth';
import { adminDB } from '@/app/libs/firebaseAdmin';
import { NextResponse } from 'next/server';
import { UserData } from '@/types/auth/authData';

export async function GET(
  _request: Request,
  { params }: { params: { userId: string } },
) {
  try {
    const { userId } = params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 管理者権限チェック
    const sessionUserDoc = await adminDB
      .collection('users')
      .doc(session.user.id)
      .get();
    if (!sessionUserDoc.exists) {
      return NextResponse.json(
        { error: 'Session user not found' },
        { status: 404 }
      );
    }
    const sessionUser = sessionUserDoc.data();
    if (sessionUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 指定ユーザー取得
    const userDoc = await adminDB.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const data = userDoc.data();
    const user: UserData = {
      id: userDoc.id,
      email: data?.email,
      role: data?.role,
      createdAt: data?.createdAt.toMillis(),
      name: data?.name ?? null,
      image: data?.image ?? null,
      updatedAt: data?.updatedAt?.toMillis() ?? null,
    };

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/users/[userId]:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
