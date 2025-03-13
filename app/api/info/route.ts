import { db } from '@/app/libs/firebase';
import { getDocs, collection, query, orderBy } from 'firebase/firestore';
import { NextResponse } from 'next/server';
import { TodoListProps } from '@/types/todos';
import { StatusListProps } from '@/types/lists';

// 初回レンダリング時にデータを取得する関数
export async function GET() {
  try {
    // Firestoreクエリ
    const qTodos = query(
      collection(db, 'todos'),
      orderBy('updateTime', 'desc'),
    ); // 降順
    const qLists = query(collection(db, 'lists'), orderBy('number', 'asc')); // 昇順

    // データ取得
    const todoSnapshot = await getDocs(qTodos);
    const listSnapshot = await getDocs(qLists);

    // データマッピング
    const todosData: TodoListProps[] = todoSnapshot.docs.map((document) => ({
      id: document.id,
      updateTime: document.data().updateTime,
      createdTime: document.data().createdTime,
      text: document.data().text,
      status: document.data().status,
      bool: document.data().bool,
    }));

    const listsData: StatusListProps[] = listSnapshot.docs.map((document) => ({
      id: document.id,
      category: document.data().category,
      number: document.data().number,
    }));

    // JSONレスポンスを返す
    return NextResponse.json(
      { todos: todosData, lists: listsData },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 },
    );
  }
}
