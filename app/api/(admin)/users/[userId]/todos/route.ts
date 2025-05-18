import { auth } from '@/auth';
import { adminDB } from '@/app/libs/firebaseAdmin';
import { NextResponse } from 'next/server';
import { TodoListProps } from '@/types/todos';

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
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const todosSnap = await adminDB
      .collection(`users/${userId}/todos`)
      .orderBy('updateTime', 'desc')
      .get();
    const todos: TodoListProps[] = todosSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        updateTime: d.updateTime,
        createdTime: d.createdTime,
        text: d.text,
        status: d.status,
        bool: d.bool,
      };
    });
    return NextResponse.json({ todos }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/users/[userId]/todos:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
