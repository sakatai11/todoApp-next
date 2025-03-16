export const apiRequest = async <T>(
  url: string, // エンドポイントURL
  method: 'POST' | 'PUT' | 'DELETE',
  body?: T,
): Promise<T> => {
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 },
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
