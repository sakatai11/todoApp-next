'use server';
import { adminDB } from '@/app/libs/firebaseAdmin';
import { TodoListProps } from '@/types/todos';
import { StatusListProps } from '@/types/lists';

export const fetchFirestoreData = async (): Promise<{
  todos: TodoListProps[];
  lists: StatusListProps[];
}> => {
  try {
    // Firestoreクエリ
    const todosSnapshot = await adminDB
      .collection('todos')
      .orderBy('updateTime', 'desc') // 降順
      .get();

    const listsSnapshot = await adminDB
      .collection('lists')
      .orderBy('number', 'asc') // 昇順
      .get();

    // データマッピング
    const todosData: TodoListProps[] = todosSnapshot.docs.map((document) => ({
      id: document.id,
      updateTime: document.data().updateTime,
      createdTime: document.data().createdTime,
      text: document.data().text,
      status: document.data().status,
      bool: document.data().bool,
    }));

    const listsData: StatusListProps[] = listsSnapshot.docs.map((document) => ({
      id: document.id,
      category: document.data().category,
      number: document.data().number,
    }));

    // JSONレスポンスを返す
    return { todos: todosData, lists: listsData };
  } catch (error) {
    console.error('Error fetching data:', error);
    return { todos: [], lists: [] };
  }
};
