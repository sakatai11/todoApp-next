import * as Todo from '@/features/todo/templates/Index';
import { fetchFirestoreData } from '@/app/(tasks)/actions/fetchFirestoreData';

export default async function TodoPage() {
  // const response = await fetch(`${process.env.NEXTAUTH_URL}/api/info`, {
  //   cache: 'no-store',
  // });

  const { todos, lists } = await fetchFirestoreData();

  return (
    <>
      <Todo.TodoWrapper initialTodos={todos} initialLists={lists} />
    </>
  );
}
