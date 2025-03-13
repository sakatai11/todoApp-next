// import { getApi } from '@/app/libs/apis';
import { apiRequest } from '@/app/libs/apis';
import { GetApiResponse } from '@/types/common';

import * as Todo from '@/features/todo/templates/Index';

export default async function TodoPage() {
  const response = await apiRequest<GetApiResponse>(
    `${process.env.NEXTAUTH_URL}/api/info`,
    'GET',
  );

  if (!response) {
    console.error('No response received from API');
    return <div>Error: Failed to fetch data</div>;
  }

  const { todos, lists } = response;

  return (
    <>
      <Todo.TodoWrapper initialTodos={todos} initialLists={lists} />
    </>
  );
}
