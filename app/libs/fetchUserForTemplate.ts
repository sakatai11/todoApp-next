// app/libs/mockDataFetcher.ts
import { user } from '@/mocks/data';

export async function fetchUserForTemplate() {
  // モック環境の場合
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_API_MOCKING === 'enabled'
  ) {
    console.log('Using mock data for user in template');
    const mockUserData = {
      user: [...user], // 配列として返す
    };
    console.log('Mock user data:', mockUserData);
    return mockUserData;
  }

  // 本番環境の場合は通常のfetchを使用
  const { headers } = await import('next/headers');
  const incomingHeaders = await headers();
  const cookieHeader = incomingHeaders.get('cookie') || '';

  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/user`, {
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

  return response.json();
}
