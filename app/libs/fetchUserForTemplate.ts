// app/libs/mockDataFetcher.ts

export async function fetchUserForTemplate() {
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
