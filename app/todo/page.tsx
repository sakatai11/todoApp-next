import { fetchApis } from '@/app/libs/apis';
import * as Todo from '@/features/todo/conponents/Index';

export default async function TodoPage() {
  const { todos, lists } = await fetchApis();

  return (
    <>
      <Todo.TodoWrapper initialTodos={todos} initialLists={lists} />
    </>
  );
}
