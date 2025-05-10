import { auth } from '@/auth';
import { adminDB } from '@/app/libs/firebaseAdmin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const sessionUserSnap = await adminDB
      .collection('users')
      .doc(session.user.id)
      .get();
    if (!sessionUserSnap.exists) {
      return NextResponse.json(
        { error: 'Session user not found' },
        { status: 404 },
      );
    }
    const sessionUserData = sessionUserSnap.data();
    if (sessionUserData?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const usersSnapshot = await adminDB
      .collection('users')
      .orderBy('createdAt', 'desc')
      .get();
    const users = usersSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        role: data.role,
        createdAt: data.createdAt.toMillis(),
        name: data.name ?? null,
        image: data.image ?? null,
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
