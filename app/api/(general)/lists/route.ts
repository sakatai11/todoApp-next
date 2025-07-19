import { adminDB } from '@/app/libs/firebaseAdmin';
import { ListPayload, ListResponse, StatusListProps } from '@/types/lists';
import { NextResponse } from 'next/server';
import { withAuthenticatedUser } from '@/app/libs/withAuth';

/**
 * 認証されたユーザーのリストを取得します。
 *
 * ユーザーのFirestoreドキュメントからリストアイテムのリストを取得し、番号順でソートして返します。認証が失敗した場合や取得に失敗した場合はエラーレスポンスを返します。
 */
export async function GET(req: Request) {
  return withAuthenticatedUser<
    undefined,
    { lists: StatusListProps[] } | { error: string }
  >(req, async (uid) => {
    try {
      const listsSnapshot = await adminDB
        .collection('users')
        .doc(uid)
        .collection('lists')
        .orderBy('number', 'asc')
        .get();

      const lists: StatusListProps[] = listsSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as StatusListProps,
      );

      return NextResponse.json({ lists }, { status: 200 });
    } catch (error) {
      console.error('Error fetching lists:', error);
      return NextResponse.json(
        { error: 'Error fetching lists' },
        { status: 500 },
      );
    }
  });
}

export async function POST(req: Request) {
  return withAuthenticatedUser<ListPayload<'POST'>, ListResponse<'POST'>>(
    req,
    async (uid, body) => {
      if (!body) {
        return NextResponse.json(
          { error: 'Request body is required' },
          { status: 400 },
        );
      }

      const { category, number } = body;

      if (!category || !number) {
        return NextResponse.json(
          { error: 'Category and Number are required' },
          { status: 400 },
        );
      }

      const newList = {
        category,
        number,
      };

      try {
        const docRef = await adminDB
          .collection('users')
          .doc(uid)
          .collection('lists')
          .add(newList);
        return NextResponse.json(
          { id: docRef.id, ...newList },
          { status: 201 },
        );
      } catch (error) {
        console.error('Error add list:', error);
        return NextResponse.json(
          { error: 'Error adding list' },
          { status: 500 },
        );
      }
    },
  );
}

export async function PUT(req: Request) {
  return withAuthenticatedUser<ListPayload<'PUT'>, ListResponse<'PUT'>>(
    req,
    async (uid, payload) => {
      if (!payload) {
        return NextResponse.json(
          { error: 'Request body is payload' },
          { status: 400 },
        );
      }

      try {
        const listsCollection = adminDB
          .collection('users')
          .doc(uid)
          .collection('lists');

        // editList
        if (payload.type === 'update') {
          const { id } = payload;
          if (!id || !payload.data?.category) {
            return NextResponse.json(
              { error: 'ID and category are required' },
              { status: 400 },
            );
          }

          await listsCollection.doc(id).update({
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
          if (!Array.isArray(payload.data) || payload.data.length === 0) {
            return NextResponse.json(
              { error: 'Valid order array is required' },
              { status: 400 },
            );
          }

          await adminDB.runTransaction(async (transaction) => {
            // 現在の全リストを取得
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
            payload.data.forEach((listId, index) => {
              const docRef = listsCollection.doc(listId);
              transaction.update(docRef, { number: index + 1 });
            });
          });

          return NextResponse.json(
            { message: 'List updated number' },
            { status: 200 },
          );
        }

        return NextResponse.json(
          {
            error: 'Invalid payload: Missing required fields or invalid type.',
          },
          { status: 400 },
        );
      } catch (error) {
        console.error('Error update list:', error);
        return NextResponse.json(
          { error: 'Error updating list category' },
          { status: 500 },
        );
      }
    },
  );
}

export async function DELETE(req: Request) {
  return withAuthenticatedUser<ListPayload<'DELETE'>, ListResponse<'DELETE'>>(
    req,
    async (uid, body) => {
      const id = body?.id;

      if (!id) {
        return NextResponse.json(
          { error: 'ListDelete is required' },
          { status: 400 },
        );
      }

      try {
        const listsCollection = adminDB
          .collection('users')
          .doc(uid)
          .collection('lists');

        await adminDB.runTransaction(async (transaction) => {
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

          // トランザクション内でリスト番号を更新
          updatedLists.forEach((list) => {
            const docRef = listsCollection.doc(list.id);
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
    },
  );
}
