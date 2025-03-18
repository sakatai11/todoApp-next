import { AuthResponseSchema } from '@/types/auth/authData';

export const handleError = (error: unknown) => {
  console.error(error);
  throw new Error(typeof error === 'string' ? error : JSON.stringify(error));
};

export const validateResponse = async (response: Response) => {
  try {
    const rawData = await response.json();
    return AuthResponseSchema.parse(rawData);
  } catch (error) {
    console.error('Response validation failed:', error);
    throw new Error('Invalid response format', { cause: error });
  }
};
