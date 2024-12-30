import { db } from '@/app/libs/firebase';
import {
  doc,
  addDoc,
  collection,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { jstTime } from '@/app/utils/dateUtils';
import { NextRequest, NextResponse } from 'next/server';
import { TodoPayload } from '@/types/todos';

export async function POST(req: NextRequest) {
  const body = await req.json(); // JSONデータを取得
  const { text, status }: TodoPayload<'POST'> = body;

  if (text && status) {
    const newTodo = {
      time: Date.now(),
      text,
      bool: false,
      status,
    };

    try {
      const docRef = await addDoc(collection(db, 'todos'), newTodo);
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

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { todoEditId, updatedText, updatedStatus } = body;

  if (todoEditId && updatedText && updatedStatus) {
    try {
      await updateDoc(doc(db, 'todos', todoEditId), {
        text: updatedText,
        status: updatedStatus,
        time: jstTime().getTime(),
      });
      return NextResponse.json({ message: 'Todo updated' }, { status: 200 });
    } catch (error) {
      console.error('Error update todo:', error);
      return NextResponse.json(
        { error: 'Error updating todo' },
        { status: 500 },
      );
    }
  } else {
    return NextResponse.json(
      { error: 'EditId, updatedText, and updatedStatus are required' },
      { status: 400 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { id }: TodoPayload<'DELETE'> = body;

  if (id) {
    try {
      await deleteDoc(doc(db, 'todos', id.toString()));
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
