import { auth } from '@/auth';
import { adminDB } from '@/app/libs/firebaseAdmin';
import { NextResponse } from 'next/server';
import { AdminUser } from '@/types/auth/authData';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 管理者権限チェック（セッションに role が設定されている前提）
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 指定ユーザー取得
    const userDoc = await adminDB.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const data = userDoc.data();
    const user: AdminUser = {
      id: userDoc.id,
      email: data?.['email'] as string,
      role: data?.['role'] as 'ADMIN' | 'USER',
      createdAt: (data?.['createdAt'] as { toMillis: () => number }).toMillis(),
      name: (data?.['name'] as string | undefined) ?? undefined,
      image: (data?.['image'] as string | undefined) ?? undefined,
      updatedAt:
        (
          data?.['updatedAt'] as { toMillis: () => number } | undefined
        )?.toMillis() ?? undefined,
    };

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/users/[userId]:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
