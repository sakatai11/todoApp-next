import * as Todo from '@/features/todo/templates/Index';

export default async function TodoPage() {
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/info`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }

  const { todos, lists } = await response.json();

  return (
    <>
      <Todo.TodoWrapper initialTodos={todos} initialLists={lists} />
    </>
  );
}
