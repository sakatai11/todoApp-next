import { auth } from '@/auth';
import { adminDB } from '@/app/libs/firebaseAdmin';
import { NextResponse } from 'next/server';
import { StatusListProps } from '@/types/lists';

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
    const listsSnap = await adminDB
      .collection(`users/${userId}/lists`)
      .orderBy('number', 'asc')
      .get();
    const lists: StatusListProps[] = listsSnap.docs.map((doc) => {
      const d = doc.data();
      return { id: doc.id, category: d.category, number: d.number };
    });
    return NextResponse.json({ lists }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/users/[userId]/lists:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
