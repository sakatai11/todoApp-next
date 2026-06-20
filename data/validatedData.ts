// バリデーション付きの安全な実装例
import { z } from 'zod';
import { Timestamp } from 'firebase-admin/firestore';

export const AuthDecodedTokenSchema = z.object({
  uid: z.string(),
  email: z.string().email().optional(),
});

export const AuthResponseSchema = z.object({
  decodedToken: AuthDecodedTokenSchema,
  customToken: z.string(),
  tokenExpiry: z.number(),
  userRole: z.string().optional(),
});

export const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// === タスクリクエストボディスキーマ ===
export const TodoPostBodySchema = z.object({
  text: z.string(),
  status: z.string(),
  bool: z.boolean().optional(),
});

export const TodoPutBodySchema = z.union([
  z.object({ id: z.string().min(1), bool: z.boolean() }),
  z.object({ id: z.string().min(1), text: z.string(), status: z.string() }),
  z.object({
    type: z.literal('restatus'),
    data: z.object({ oldStatus: z.string(), status: z.string() }),
  }),
]);

export const TodoDeleteBodySchema = z.object({ id: z.string().min(1) });

// === リストリクエストボディスキーマ ===
export const ListPostBodySchema = z.object({
  category: z.string(),
  number: z.number(),
});

export const ListPutBodySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('reorder'),
    data: z.array(z.string()),
  }),
  z.object({
    type: z.literal('update'),
    id: z.string().min(1),
    data: z.object({ category: z.string().trim().min(1) }),
  }),
]);

export const ListDeleteBodySchema = z.object({ id: z.string().min(1) });

// === Firestore ドキュメントデータスキーマ ===
export const TodoFirestoreDocSchema = z.object({
  updateTime: z.instanceof(Timestamp),
  createdTime: z.instanceof(Timestamp),
  text: z.string(),
  status: z.string(),
  bool: z.boolean(),
});

export const StatusListFirestoreDocSchema = z.object({
  category: z.string(),
  number: z.number(),
});

export const AdminUserFirestoreDocSchema = z.object({
  email: z.string(),
  role: z.enum(['ADMIN', 'USER']),
  createdAt: z.instanceof(Timestamp),
  name: z.string().nullish(),
  image: z.string().nullish(),
  updatedAt: z.instanceof(Timestamp).nullish(),
});
