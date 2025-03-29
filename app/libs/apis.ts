import { db } from '@/app/libs/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { adminDB } from '@/app/libs/firebaseAdmin';
import { TodoListProps } from '@/types/todos';
import { StatusListProps } from '@/types/lists';

export const getApiRequest = async (): Promise<{
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

export const getServerApiRequest = async (email: string) => {
  try {
    // Firestoreのusersコレクションからemailが一致するドキュメントを取得
    const q = query(collection(db, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(q);

    // もし1つでも一致するユーザーがいれば存在する
    return !querySnapshot.empty ? true : null;
  } catch (error) {
    console.error('API request error:', error);
    throw error; // 呼び出し元でエラーハンドリング
  }
};
