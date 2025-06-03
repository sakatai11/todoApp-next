// mocks/data/user.ts
import { MockUserData } from '@/types/auth/authData';

export const mockUser: MockUserData[] = [
  {
    id: 'user-data-1',
    email: 'example@test.com',
    createdAt: new Date(1744749991599).toISOString(),
    role: 'USER',
  },
];
