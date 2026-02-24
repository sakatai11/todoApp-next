import { StatusListProps } from '@/types/lists';
import { TodoListProps } from '@/types/todos';

// 重複カテゴリ名のチェック
export const isDuplicateCategory = (
  lists: StatusListProps[],
  category: string,
  id: string,
): boolean => {
  return lists.some((list) => list.category === category && list.id !== id);
};

// リストとタスクの更新（最新化）
export const updateListsAndTodos = (
  setLists: React.Dispatch<React.SetStateAction<StatusListProps[]>>,
  setTodos: React.Dispatch<React.SetStateAction<TodoListProps[]>>,
  id: string,
  finalCategory: string,
  oldCategory: string,
): void => {
  const updateLists = (prevLists: StatusListProps[]) => {
    return prevLists.map((list) =>
      list.id === id ? { ...list, category: finalCategory } : list,
    );
  };

  const updateTodos = (prevTodos: TodoListProps[]) => {
    return prevTodos.map((todo) =>
      todo.status === oldCategory ? { ...todo, status: finalCategory } : todo,
    );
  };

  setLists((prevLists) => {
    const updatedLists = updateLists(prevLists);
    setTodos(updateTodos);
    return updatedLists;
  });
};
