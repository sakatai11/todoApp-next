import { db } from '@/app/libs/firebase';
import {
  doc,
  getDocs,
  addDoc,
  collection,
  updateDoc,
  runTransaction,
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

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const payload: ListPayload<'PUT'> = body;
  const { id, category } = payload;

  if (id && category) {
    try {
      await updateDoc(doc(db, 'lists', id), {
        category: category,
      });
      return NextResponse.json(
        { message: 'List updated category' },
        { status: 200 },
      );
    } catch (error) {
      console.error('Error update list category:', error);
      return NextResponse.json(
        { error: 'Error updating list category' },
        { status: 500 },
      );
    }
  } else {
    return NextResponse.json(
      { error: 'Invalid payload: Missing required fields.' },
      { status: 400 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { id }: ListPayload<'DELETE'> = body;
  if (id) {
    try {
      await runTransaction(db, async (transaction) => {
        const listsCollection = collection(db, 'lists');

        // すべてのリストを取得
        const snapshot = await getDocs(listsCollection);
        const lists = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // 削除対象のリストドキュメント
        const listDocRef = doc(db, 'lists', id);
        // リストを削除
        transaction.delete(listDocRef);

        // リストをフィルタリングして番号を再割り振り
        const updatedLists = lists
          .filter((list) => list.id !== id)
          .map((list, index) => ({ ...list, number: index + 1 }));

        // トランザクション内でリスト番号を更新
        updatedLists.forEach((list) => {
          const docRef = doc(db, 'lists', list.id);
          transaction.update(docRef, { number: list.number });
        });
      });
      return NextResponse.json({ message: 'List deleted' }, { status: 200 });
    } catch (error) {
      console.error('Error deleting list:', error);
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
