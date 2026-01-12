import { PrevState } from '@/types/form/formData';

export const handleError = (error: unknown): PrevState => {
  console.error(error);
  return {
    success: false,
    option: 'default',
    message: 'エラーが発生しました。もう一度お試しください。',
  };
};
