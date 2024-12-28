import { db } from '@/app/libs/firebase';
import { getDocs, collection, query, orderBy } from 'firebase/firestore';

// データの取得
export const getApi = async () => {
  const qTodos = query(collection(db, 'todos'), orderBy('time', 'desc')); // 降順
  const qLists = query(collection(db, 'lists'), orderBy('number', 'asc')); // 昇順
  const todoSnapshot = await getDocs(qTodos);
  const listSnapshot = await getDocs(qLists);
  const todosData = todoSnapshot.docs.map((document) => ({
    // オブジェクトにとして格納
    id: document.id,
    time: document.data().time,
    text: document.data().text,
    status: document.data().status,
    bool: document.data().bool,
  }));

  const sortedTodos = todosData.sort((a, b) => {
    const timeComparison = b.time - a.time;
    return timeComparison;
  });
  const listsData = listSnapshot.docs.map((document) => ({
    // オブジェクトにとして格納
    id: document.id,
    category: document.data().category,
    number: document.data().number,
  }));

  console.log(sortedTodos);
  console.log(listsData);

  return {
    todos: sortedTodos,
    lists: listsData,
  };
};

export const apiRequest = async <T>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body: T,
): Promise<T> => {
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'API request failed');
    }

    return response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error; // 呼び出し元でエラーハンドリング
  }
};
