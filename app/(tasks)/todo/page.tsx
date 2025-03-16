import { getApiRequest } from '@/app/libs/apis';
import * as Todo from '@/features/todo/templates/Index';

export default async function TodoPage() {
  const { todos, lists } = await getApiRequest('todo');

  if (!todos || !lists) {
    console.error('No response received from API');
    return <div>Error: Failed to fetch data</div>;
  }

  return (
    <>
      <Todo.TodoWrapper initialTodos={todos} initialLists={lists} />
    </>
  );
}
