// app/libs/fetchUserForTemplate.ts
import { user } from '@/todoApp-submodule/mocks/data';

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

  // Docker環境では内部ネットワークを使用
  const baseUrl =
    process.env.NEXT_PUBLIC_EMULATOR_MODE === 'true'
      ? 'http://localhost:3000' // Docker内部ネットワーク
      : process.env.NEXTAUTH_URL;

  if (!baseUrl) {
    throw new Error('Base URL is not configured');
  }

  const response = await fetch(`${baseUrl}/api/user`, {
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
