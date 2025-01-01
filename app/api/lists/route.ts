import { db } from '@/app/libs/firebase';
import {
  doc,
  addDoc,
  collection,
  deleteDoc,
  // updateDoc,
} from 'firebase/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { ListPayload } from '@/types/lists';

export async function POST(req: NextRequest) {
  const body = await req.json(); // JSONデータを取得
  const { category, number }: ListPayload<'POST'> = body;

  if (category && number) {
    const newList = {
      category,
      number,
    };

    try {
      const docRef = await addDoc(collection(db, 'lists'), newList);
      return NextResponse.json({ id: docRef.id, ...newList }, { status: 200 });
    } catch (error) {
      console.error('Error add list:', error);
      return NextResponse.json({ error: 'Error adding list' }, { status: 500 });
    }
  } else {
    return NextResponse.json(
      { error: 'Category and Number are required' },
      { status: 400 },
    );
  }
}

export async function PUT() {
  // req: NextRequest
  // const body = await req.json();
  // const payload: TodoPayload<'PUT'> = body;
  // try {
  //   //  toggleSelected
  //   if ('id' in payload && 'bool' in payload) {
  //     const { id, bool } = payload;
  //     await updateDoc(doc(db, 'todos', id), {
  //       bool: bool,
  //     });
  //     return NextResponse.json(
  //       { message: 'Todo updated toggle' },
  //       { status: 200 },
  //     );
  //   }
  //   // saveTodo
  //   if (
  //     'id' in payload &&
  //     'text' in payload &&
  //     'status' in payload &&
  //     'updateTime' in payload
  //   ) {
  //     const { id, updateTime, text, status } = payload;
  //     console.log(text);
  //     await updateDoc(doc(db, 'todos', id), {
  //       updateTime: updateTime,
  //       text: text,
  //       status: status,
  //     });
  //     return NextResponse.json(
  //       { message: 'Todo updated save' },
  //       { status: 200 },
  //     );
  //   }
  //   return NextResponse.json(
  //     { error: 'Invalid payload: Missing required fields.' },
  //     { status: 400 },
  //   );
  // } catch (error) {
  //   console.error('Error update todo:', error);
  //   return NextResponse.json({ error: 'Error updating todo' }, { status: 500 });
  // }
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { id }: ListPayload<'DELETE'> = body;
  if (id) {
    try {
      await deleteDoc(doc(db, 'lists', id.toString()));
      return NextResponse.json({ message: 'List deleted' }, { status: 200 });
    } catch (error) {
      console.error('Error delete list:', error);
      return NextResponse.json(
        { error: 'Error deleting list' },
        { status: 500 },
      );
    }
  } else {
    return NextResponse.json(
      { error: 'ListDelete is required' },
      { status: 400 },
    );
  }
}
