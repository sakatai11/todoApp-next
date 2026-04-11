import { auth } from '@/auth';
import { adminDB } from '@/app/libs/firebaseAdmin';
import { NextResponse } from 'next/server';
import { AdminUser } from '@/types/auth/authData';

export async function GET() {
  try {
    const session = await auth();
    if (!(session?.user as { id?: string })?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Check role from session (set during authentication)
    if ((session?.user as { role?: string })?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const usersSnapshot = await adminDB
      .collection('users')
      .orderBy('createdAt', 'desc')
      .get();
    const users: AdminUser[] = usersSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data['email'] as string,
        role: data['role'] as 'ADMIN' | 'USER',
        createdAt: (data['createdAt'] as { toMillis: () => number }).toMillis(),
        name: (data['name'] as string | undefined) ?? undefined,
        image: (data['image'] as string | undefined) ?? undefined,
      };
    });
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/users:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
