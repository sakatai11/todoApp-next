export const apiRequest = async <TRequest, TResponse = TRequest>(
  url: string, // エンドポイントURL
  method: 'POST' | 'PUT' | 'DELETE',
  body?: TRequest,
): Promise<TResponse> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Docker エミュレーター環境では環境変数からユーザーIDを取得
    if (
      process.env.NEXT_PUBLIC_EMULATOR_MODE === 'true' &&
      process.env.NODE_ENV !== 'production'
    ) {
      // デフォルトは一般ユーザー、管理者機能テスト時はTEST_ADMIN_UIDを使用
      const testUserUid = process.env.NEXT_PUBLIC_TEST_USER_UID;
      const testAdminUid = process.env.NEXT_PUBLIC_TEST_ADMIN_UID;

      // 管理者API（/api/admin/）の場合は管理者UIDを使用
      const isAdminAPI = url.includes('/api/admin/') || url.includes('/admin');
      const selectedUid = isAdminAPI ? testAdminUid : testUserUid;

      if (selectedUid) {
        headers['X-User-ID'] = selectedUid;
      } else {
        console.warn('Test user UID environment variable is not set');
      }
    }

    const response = await fetch(url, {
      method,
      credentials: 'include', // セッション情報を送信
      headers,
      cache: 'no-store',
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'API request failed');
    }

    return response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error; // 呼び出し元でエラーハンドリング
  }
};
