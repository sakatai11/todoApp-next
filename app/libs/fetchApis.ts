import { db } from '@/app/utils/firebase';
import { getDocs, collection, query, orderBy } from 'firebase/firestore';

// データの取得
export const fetchApis = async () => {
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

  return {
    todos: sortedTodos,
    lists: listsData,
  };
};
