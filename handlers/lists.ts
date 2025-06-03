// mocks/handlers/lists.ts
import { http, HttpResponse } from 'msw';
import { lists as mockLists } from '../data/lists';
import { ListPayload, ListResponse, StatusListProps } from '@/types/lists';

let lists = [...mockLists];

export const listsHandlers = [
  // Get all lists
  http.get('/api/lists', () => {
    return HttpResponse.json(lists);
  }),

  // Create new list
  http.post('/api/lists', async ({ request }) => {
    const body = (await request.json()) as ListPayload<'POST'>;
    const newList: StatusListProps = {
      id: `list-${Date.now()}`,
      ...body,
    };
    lists.push(newList);

    // レスポンスは ListResponse<'POST'> 型に準拠
    const response: ListResponse<'POST'> = {
      id: newList.id,
      category: newList.category,
      number: newList.number,
    };
    return HttpResponse.json(response, { status: 200 });
  }),

  // Update list
  http.put('/api/lists', async ({ request }) => {
    const body = (await request.json()) as ListPayload<'PUT'>;

    if (body.type === 'reorder') {
      // TODO: Implement reorder logic
      return HttpResponse.json({ message: 'List reordered' }, { status: 200 });
    }

    if (body.type === 'update' && body.data.category) {
      lists = lists.map((list) =>
        list.id === body.id ? { ...list, category: body.data.category! } : list,
      );
      const response: ListResponse<'PUT'> = { message: 'List updated' };
      return HttpResponse.json(response, { status: 200 });
    }

    return HttpResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }),

  // Delete list
  http.delete('/api/lists', async ({ request }) => {
    const body = (await request.json()) as ListPayload<'DELETE'>;
    const { id } = body;

    if (!id) {
      return HttpResponse.json(
        { error: 'List ID is required' },
        { status: 400 },
      );
    }

    lists = lists.filter((list) => list.id !== id);
    const response: ListResponse<'DELETE'> = { message: 'List deleted' };
    return HttpResponse.json(response, { status: 200 });
  }),
];
