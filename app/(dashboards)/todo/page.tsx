export const dynamic = 'force-dynamic';

import * as Todo from '@/features/todo/templates/index';
import Template from '@/app/template';

export default async function TodoPage() {
  return (
    <Template showHeader={true}>
      <Todo.TodoWrapper />
    </Template>
  );
}
