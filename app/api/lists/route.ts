import { adminDB } from '@/app/libs/firebaseAdmin';
import {} from // doc,
// getDocs,
// addDoc,
// collection,
// updateDoc,
// runTransaction,
// query,
// orderBy,
'firebase/firestore';
import { ListPayload } from '@/types/lists';

export async function POST(req: Request) {
  const body = await req.json(); // JSONデータを取得
  const { category, number }: ListPayload<'POST'> = body;

  if (category && number) {
    const newList = {
      category,
      number,
    };

    try {
      const docRef = await adminDB.collection('lists').add(newList);
      return Response.json({ id: docRef.id, ...newList }, { status: 200 });
    } catch (error) {
      console.error('Error add list:', error);
      return Response.json({ error: 'Error adding list' }, { status: 500 });
    }
  } else {
    return Response.json(
      { error: 'Category and Number are required' },
      { status: 400 },
    );
  }
}

export async function PUT(req: Request) {
  const body = await req.json();
  const payload: ListPayload<'PUT'> = body;

  try {
    // editList
    if (payload.type === 'update') {
      const { id } = payload;
      await adminDB.collection('lists').doc(id).update({
        category: payload.data.category,
      });
      return Response.json(
        { message: 'List updated category' },
        { status: 200 },
      );
    }

    // handleButtonMov
    // handleDragEnd
    if (payload.type === 'reorder') {
      await adminDB.runTransaction(async (transaction) => {
        // 現在の全リストを取得
        const listsCollection = adminDB.collection('lists');

        const snapshot = await listsCollection.get();
        const currentLists = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // バリデーション
        const isValidOrder = payload.data.every((id) =>
          currentLists.some((list) => list.id === id),
        );

        if (!isValidOrder) {
          throw new Error('Invalid list IDs in newOrder');
        }

        // 新しい順序で番号更新
        payload.data.forEach(async (listId, index) => {
          const docRef = listsCollection.doc(listId);
          transaction.update(docRef, { number: index + 1 });
        });
      });
      return Response.json({ message: 'List updated number' }, { status: 200 });
    }

    return Response.json(
      { error: 'Invalid payload: Missing required fields.' },
      { status: 400 },
    );
  } catch (error) {
    console.error('Error update list:', error);
    return Response.json(
      { error: 'Error updating list category' },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  const body = await req.json();
  const { id }: ListPayload<'DELETE'> = body;
  if (id) {
    try {
      await adminDB.runTransaction(async (transaction) => {
        const listsCollection = adminDB.collection('lists');

        // リストを番号順に取得
        const snapshot = await listsCollection.orderBy('number', 'asc').get();

        // 削除対象を除外しつつ番号順を維持
        const lists = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((list) => list.id !== id);

        // 削除対象のリストドキュメント
        const listDocRef = listsCollection.doc(id);
        transaction.delete(listDocRef);

        // 番号を1から再割り振り
        const updatedLists = lists.map((list, index) => ({
          ...list,
          number: index + 1,
        }));

        console.log(updatedLists);

        // トランザクション内でリスト番号を更新
        updatedLists.forEach((list) => {
          const docRef = listsCollection.doc(list.id);
          transaction.update(docRef, { number: list.number });
        });
      });
      return Response.json({ message: 'List deleted' }, { status: 200 });
    } catch (error) {
      console.error('Error deleting list:', error);
      return Response.json({ error: 'Error deleting list' }, { status: 500 });
    }
  } else {
    return Response.json({ error: 'ListDelete is required' }, { status: 400 });
  }
}
