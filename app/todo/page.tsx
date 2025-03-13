export const dynamic = 'force-dynamic';
import { getApi } from '@/app/libs/apis';
import * as Todo from '@/features/todo/templates/Index';

export default async function TodoPage() {
  const { todos, lists } = await getApi();

  return (
    <>
      <Todo.TodoWrapper initialTodos={todos} initialLists={lists} />
    </>
  );
}
