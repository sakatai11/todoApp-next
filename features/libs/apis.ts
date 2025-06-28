export const apiRequest = async <TRequest, TResponse = TRequest>(
  url: string, // エンドポイントURL
  method: 'POST' | 'PUT' | 'DELETE',
  body?: TRequest,
): Promise<TResponse> => {
  try {
    const response = await fetch(url, {
      method,
      credentials: 'include', // セッション情報を送信
      headers: {
        'Content-Type': 'application/json',
      },
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
