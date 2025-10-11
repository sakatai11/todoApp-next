// app/libs/fetchUserForTemplate.ts
export async function fetchUserForTemplate() {
  // モック環境の場合
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_API_MOCKING === 'enabled'
  ) {
    console.log('Using mock data for user in template');
    const { user } = await import('@/todoApp-submodule/mocks/data');

    console.log('Mock user data:', user);
    return { user };
  }

  try {
    // 本番環境の場合は通常のfetchを使用
    const { headers } = await import('next/headers');
    const incomingHeaders = await headers();
    const cookieHeader = incomingHeaders.get('cookie') || '';

    // baseURLの決定 - 環境に応じた優先順位で決定
    let baseUrl: string | undefined;

    if (process.env.NEXT_PUBLIC_EMULATOR_MODE === 'true') {
      // Docker環境では相対パスを使用（内部ネットワーク通信）
      baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    } else {
      // 本番環境では環境変数またはリクエストヘッダーから構築
      baseUrl = process.env.NEXTAUTH_URL;

      if (!baseUrl) {
        const host = incomingHeaders.get('host');
        const proto = incomingHeaders.get('x-forwarded-proto') ?? 'https';
        baseUrl = host ? `${proto}://${host}` : undefined;
      }
    }

    if (!baseUrl) {
      console.warn('Base URL could not be determined, returning null user');
      return { user: null };
    }

    const response = await fetch(`${baseUrl}/api/user`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      console.warn(
        `Fetch user failed: ${response.status} ${response.statusText}`,
        `URL: ${baseUrl}/api/user`,
      );

      // レスポンスボディがある場合はエラー詳細を取得
      try {
        const errorData = await response.text();
        console.warn('Error response body:', errorData);
      } catch (parseError) {
        console.warn('Could not parse error response:', parseError);
      }

      // 認証エラーの場合はnullユーザーを返す（エラーを投げない）
      return { user: null };
    }

    const { user } = await response.json();
    console.log('Successfully fetched user data for template');
    return { user };
  } catch (error) {
    console.warn('Error fetching user for template:', error);
    // エラーが発生した場合もnullユーザーを返す
    return { user: null };
  }
}
