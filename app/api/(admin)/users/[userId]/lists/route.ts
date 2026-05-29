import { auth } from '@/auth';
import { adminDB } from '@/app/libs/firebaseAdmin';
import { NextResponse } from 'next/server';
import { StatusListProps } from '@/types/lists';
import { StatusListFirestoreDocSchema } from '@/data/validatedData';

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
    // 管理者権限チェック
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const listsSnap = await adminDB
      .collection(`users/${userId}/lists`)
      .orderBy('number', 'asc')
      .get();
    const lists: StatusListProps[] = listsSnap.docs
      .map((doc): StatusListProps | null => {
        const result = StatusListFirestoreDocSchema.safeParse(doc.data());
        if (!result.success) {
          console.warn('Skipping invalid list document:', doc.id);
          return null;
        }
        return { id: doc.id, ...result.data };
      })
      .filter((list): list is StatusListProps => list !== null);
    return NextResponse.json({ lists }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/users/[userId]/lists:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
