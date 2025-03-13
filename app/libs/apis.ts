export const apiRequest = async <T = undefined>(
  url: string, // エンドポイントURL
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: T,
): Promise<T | undefined> => {
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
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
