// mocks/data/users.ts
import { UserData } from '@/types/auth/authData';
import { Timestamp } from 'firebase-admin/firestore';

export const mockUser: UserData[] = [
  {
    id: 'sWOLyYfI8RVRYxSywjbxXf6EFY33',
    email: '4244pretty@rowdydow.com',
    createdAt: Timestamp.fromDate(new Date(1744749991599)),
    role: 'USER',
  },
];
