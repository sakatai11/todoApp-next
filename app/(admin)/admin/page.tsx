import * as Admin from '@/features/admin/templates/index';
import Template from '@/app/template';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const incomingHeaders = await headers();
  const cookieHeader = incomingHeaders.get('cookie') || '';
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/users`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      cookie: cookieHeader,
    },
  });

  if (!response.ok) {
    console.error('Fetch error:', response.status, response.statusText);
    throw new Error('Failed to fetch data');
  }

  const { users } = await response.json();

  return (
    <Template showHeader={true}>
      <Admin.AdminWrapper users={users} />
    </Template>
  );
}
