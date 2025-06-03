// バリデーション付きの安全な実装例
import { z } from 'zod';

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
