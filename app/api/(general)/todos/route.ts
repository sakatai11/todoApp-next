import { TodoPayload } from '@/types/todos';
import { adminDB } from '@/app/libs/firebaseAdmin';
import { NextResponse } from 'next/server';
import { withAuthenticatedUser } from '@/app/libs/withAuth';
import { TodoResponse } from '@/types/todos';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(req: Request) {
  return withAuthenticatedUser<TodoPayload<'POST'>, TodoResponse<'POST'>>(
    req,
    async (uid, body) => {
      const { text, status, updateTime, createdTime } = body;

      if (text && status) {
        const validUpdateTime = Number(updateTime);
        const validCreatedTime = Number(createdTime);
        
        if (isNaN(validUpdateTime) || isNaN(validCreatedTime)) {
          return NextResponse.json(
            { error: 'Invalid timestamp values' },
            { status: 400 },
          );
        }
        
        const newTodo = {
          updateTime: Timestamp.fromMillis(validUpdateTime),
          createdTime: Timestamp.fromMillis(validCreatedTime),
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

        if (
          'id' in payload &&
          'text' in payload &&
          'status' in payload &&
          'updateTime' in payload
        ) {
          const { id, updateTime, text, status } = payload;
          const validUpdateTime = Number(updateTime);
          
          if (isNaN(validUpdateTime)) {
            return NextResponse.json(
              { error: 'Invalid updateTime value' },
              { status: 400 },
            );
          }

          await todosCollection.doc(id).update({
            updateTime: Timestamp.fromMillis(validUpdateTime),
            text,
            status
          });
          return NextResponse.json(
            { message: 'Todo updated save' },
            { status: 200 },
          );
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
