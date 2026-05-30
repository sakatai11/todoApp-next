import { auth } from '@/auth';
import { adminDB } from '@/app/libs/firebaseAdmin';
import { NextResponse } from 'next/server';
import { TodoListProps } from '@/types/todos';
import { TodoFirestoreDocSchema } from '@/data/validatedData';

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
    const todosSnap = await adminDB
      .collection(`users/${userId}/todos`)
      .orderBy('updateTime', 'desc')
      .get();
    const todos: TodoListProps[] = todosSnap.docs
      .map((doc): TodoListProps | null => {
        const result = TodoFirestoreDocSchema.safeParse(doc.data());
        if (!result.success) {
          console.warn('Skipping invalid todo document:', doc.id);
          return null;
        }
        return { id: doc.id, ...result.data };
      })
      .filter((todo): todo is TodoListProps => todo !== null);
    return NextResponse.json({ todos }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/users/[userId]/todos:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
