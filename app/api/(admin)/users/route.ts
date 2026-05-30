import { auth } from '@/auth';
import { adminDB } from '@/app/libs/firebaseAdmin';
import { NextResponse } from 'next/server';
import { AdminUser } from '@/types/auth/authData';
import { AdminUserFirestoreDocSchema } from '@/data/validatedData';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Check role from session (set during authentication)
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const usersSnapshot = await adminDB
      .collection('users')
      .orderBy('createdAt', 'desc')
      .get();
    const users: AdminUser[] = usersSnapshot.docs
      .map((doc): AdminUser | null => {
        const result = AdminUserFirestoreDocSchema.safeParse(doc.data());
        if (!result.success) {
          console.warn('Skipping invalid user document:', doc.id);
          return null;
        }
        const { email, role, createdAt, name, image } = result.data;
        return {
          id: doc.id,
          email,
          role,
          createdAt: createdAt.toMillis(),
          name: name ?? undefined,
          image: image ?? undefined,
        };
      })
      .filter((user): user is AdminUser => user !== null);
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/users:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
