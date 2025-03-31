import { TodoPayload } from '@/types/todos';
import { adminDB } from '@/app/libs/firebaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json(); // JSONデータを取得
  const { text, status, updateTime, createdTime }: TodoPayload<'POST'> = body;

  if (text && status) {
    const newTodo = {
      updateTime,
      createdTime,
      text,
      bool: false,
      status,
    };

    try {
      const docRef = await adminDB.collection('todos').add(newTodo);
      return NextResponse.json({ id: docRef.id, ...newTodo }, { status: 200 });
    } catch (error) {
      console.error('Error add todo:', error);
      return NextResponse.json({ error: 'Error adding todo' }, { status: 500 });
    }
  } else {
    return NextResponse.json(
      { error: 'Text and status are required' },
      { status: 400 },
    );
  }
}

export async function PUT(req: Request) {
  const body = await req.json();
  const payload: TodoPayload<'PUT'> = body;

  try {
    //  toggleSelected
    if ('id' in payload && 'bool' in payload) {
      const { id, bool } = payload;
      await adminDB.collection('todos').doc(id).update({ bool: bool });
      return NextResponse.json(
        { message: 'Todo updated toggle' },
        { status: 200 },
      );
    }

    // saveTodo
    if (
      'id' in payload &&
      'text' in payload &&
      'status' in payload &&
      'updateTime' in payload
    ) {
      const { id, updateTime, text, status } = payload;
      console.log(text);
      await adminDB.collection('todos').doc(id).update({
        updateTime: updateTime,
        text: text,
        status: status,
      });
      return NextResponse.json(
        { message: 'Todo updated save' },
        { status: 200 },
      );
    }

    // editList（バッチ処理）
    if (payload.type === 'restatus') {
      const { oldStatus, status } = payload.data;
      const todosQuerySnapshot = await adminDB.collection('todos').get();
      const batch = adminDB.batch();

      todosQuerySnapshot.forEach((doc) => {
        const todo = doc.data();
        const docRef = doc.ref;
        if (todo.status === oldStatus) {
          batch.update(docRef, { status: status });
        }
      });

      await batch.commit();
      return NextResponse.json(
        { message: 'Todo updated successfully' },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { error: 'Invalid payload: Missing required fields.' },
      { status: 400 },
    );
  } catch (error) {
    console.error('Error update todo:', error);
    return NextResponse.json({ error: 'Error updating todo' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const body = await req.json();
  const { id }: TodoPayload<'DELETE'> = body;

  if (id) {
    try {
      await adminDB.collection('todos').doc(id.toString()).delete();
      return NextResponse.json({ message: 'Todo deleted' }, { status: 200 });
    } catch (error) {
      console.error('Error delete todo:', error);
      return NextResponse.json(
        { error: 'Error deleting todo' },
        { status: 500 },
      );
    }
  } else {
    return NextResponse.json(
      { error: 'TodoDelete is required' },
      { status: 400 },
    );
  }
}
