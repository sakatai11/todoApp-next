import { fetchApis } from '@/app/libs/fetchApis';
import * as Todo from '@/features/todo/conponents/Index';

export default async function TodoPage() {
  const { todos, lists } = await fetchApis();

  return (
    <>
      <Todo.TodoWrapper todos={todos} lists={lists} />
    </>
  );
}
