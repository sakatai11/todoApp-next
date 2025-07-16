import { TodoPayload } from '@/types/todos';
import { adminDB } from '@/app/libs/firebaseAdmin';
import { NextResponse } from 'next/server';
import { withAuthenticatedUser } from '@/app/libs/withAuth';
import { TodoResponse } from '@/types/todos';
import { Timestamp } from 'firebase-admin/firestore';

/**
* 認証されたユーザーに対して新しいtodoアイテムを作成します。
*
* リクエストボディに`text`と`status`フィールドを期待します。成功時に生成されたIDとタイムスタンプを含む作成されたtodoアイテムを返します。必須フィールドが不足している場合または作成に失敗した場合はエラーを応答します。
*/
export async function POST(req: Request) {
  return withAuthenticatedUser<TodoPayload<'POST'>, TodoResponse<'POST'>>(
    req,
    async (uid, body) => {
      const { text, status } = body;

      if (text && status) {
        const currentTime = Timestamp.now();
        const newTodo = {
          updateTime: currentTime,
          createdTime: currentTime,
          text,
          bool: false,
          status,
        };

        try {
          const docRef = await adminDB
            .collection('users')
            .doc(uid)
            .collection('todos')
            .add(newTodo);

          return NextResponse.json(
            { id: docRef.id, ...newTodo },
            { status: 200 },
          );
        } catch (error) {
          console.error('Error add todo:', error);
          return NextResponse.json(
            { error: 'Error adding todo' },
            { status: 500 },
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Text and status are required' },
          { status: 400 },
        );
      }
    },
  );
}

/**
 * 認証されたユーザーのtodoアイテムの更新を処理します。
 *
 * `bool`フィールドの切り替え、`text`と`status`の更新（`updateTime`の自動更新を含む）、または複数のtodoのステータスの一括更新をサポートします。完了時に更新されたtodoまたは成功メッセージを返し、ペイロードが無効または更新に失敗した場合はエラーレスポンスを返します。
 */
export async function PUT(req: Request) {
  return withAuthenticatedUser<TodoPayload<'PUT'>, TodoResponse<'PUT'>>(
    req,
    async (uid, payload) => {
      const todosCollection = adminDB
        .collection('users')
        .doc(uid)
        .collection('todos');

      try {
        if ('id' in payload && 'bool' in payload) {
          await todosCollection.doc(payload.id).update({ bool: payload.bool });
          return NextResponse.json(
            { message: 'Todo updated toggle' },
            { status: 200 },
          );
        }

        if ('id' in payload && 'text' in payload && 'status' in payload) {
          const { id, text, status } = payload;
          const currentTime = Timestamp.now();

          await todosCollection.doc(id).update({
            updateTime: currentTime,
            text,
            status,
          });

          // 更新されたドキュメントを取得してレスポンスを返す
          const updatedDoc = await todosCollection.doc(id).get();
          const updatedTodo = updatedDoc.data();

          if (!updatedTodo) {
            return NextResponse.json(
              { error: 'Updated document not found' },
              { status: 404 },
            );
          }

          return NextResponse.json({ id, ...updatedTodo }, { status: 200 });
        }

        if (payload.type === 'restatus') {
          const { oldStatus, status } = payload.data;
          const snapshot = await todosCollection.get();
          const batch = adminDB.batch();

          snapshot.forEach((doc) => {
            if (doc.data().status === oldStatus) {
              batch.update(doc.ref, { status });
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
        return NextResponse.json(
          { error: 'Error updating todo' },
          { status: 500 },
        );
      }
    },
  );
}

/**
* Deletes a todo item for the authenticated user. * 認証されたユーザーのtodoアイテムを削除します。
*
* Requires the `id` of the todo item to delete. Returns a success message on completion, and error responses if the ID is missing or deletion fails. * 削除するtodoアイテムの`id`が必要です。完了時に成功メッセージを返し、IDが不足している場合または削除に失敗した場合はエラーレスポンスを返します。
*/
export async function DELETE(req: Request) {
  return withAuthenticatedUser<TodoPayload<'DELETE'>, TodoResponse<'DELETE'>>(
    req,
    async (uid, { id }) => {
      if (!id) {
        return NextResponse.json(
          { error: 'TodoDelete is required' },
          { status: 400 },
        );
      }

      try {
        await adminDB
          .collection('users')
          .doc(uid)
          .collection('todos')
          .doc(id)
          .delete();
        return NextResponse.json({ message: 'Todo deleted' }, { status: 200 });
      } catch (error) {
        console.error('Error delete todo:', error);
        return NextResponse.json(
          { error: 'Error deleting todo' },
          { status: 500 },
        );
      }
    },
  );
}
