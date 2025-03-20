// import { Timestamp } from 'firebase/firestore';
// バリデーション付きの安全な実装例
import { z } from 'zod';

// 認証データの型
export type AuthData = {
  email?: string;
  password?: string;
};

// tokenRoleのリテラル型
export type UserRole = 'ADMIN' | 'USER';

// Zodスキーマで厳密に定義
export const AuthResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  accessToken: z.string(),
});

// 認証レスポンスデータの型
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

// ユーザーデータの型定義
// export type UserData = {
//   id: string;
//   email: string;
//   name?: string;
//   createdAt: Timestamp;
//   updatedAt?: Timestamp;
// };
