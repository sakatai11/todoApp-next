import { db } from '@/app/libs/firebase';
import {
  doc,
  getDocs,
  addDoc,
  collection,
  updateDoc,
  runTransaction,
  query,
  orderBy,
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

  try {
    // editList
    if (payload.type === 'update') {
      const { id } = payload;
      await updateDoc(doc(db, 'lists', id), {
        category: payload.data.category,
      });
      return NextResponse.json(
        { message: 'List updated category' },
        { status: 200 },
      );
    }

    // handleButtonMov
    // handleDragEnd
    if (payload.type === 'reorder') {
      await runTransaction(db, async (transaction) => {
        // 順序変更処理
        const listsCollection = collection(db, 'lists');

        // 現在の全リストを取得
        const snapshot = await getDocs(listsCollection);
        const currentLists = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // バリデーション
        const isValidOrder = payload.newOrder.every((id) =>
          currentLists.some((list) => list.id === id),
        );

        if (!isValidOrder) {
          throw new Error('Invalid list IDs in newOrder');
        }

        // 新しい順序で番号更新
        payload.newOrder.forEach(async (listId, index) => {
          const docRef = doc(db, 'lists', listId);
          transaction.update(docRef, { number: index + 1 });
        });
      });
      return NextResponse.json(
        { message: 'List updated number' },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { error: 'Invalid payload: Missing required fields.' },
      { status: 400 },
    );
  } catch (error) {
    console.error('Error update list:', error);
    return NextResponse.json(
      { error: 'Error updating list category' },
      { status: 500 },
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

        // リストを番号順に取得
        const snapshot = await getDocs(
          query(listsCollection, orderBy('number', 'asc')),
        );

        // 削除対象を除外しつつ番号順を維持
        const lists = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((list) => list.id !== id);

        // 削除対象のリストドキュメント
        const listDocRef = doc(db, 'lists', id);
        transaction.delete(listDocRef);

        // 番号を1から再割り振り
        const updatedLists = lists.map((list, index) => ({
          ...list,
          number: index + 1,
        }));

        console.log(updatedLists);

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
