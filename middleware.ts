// middeware/ts
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { NextResponse } from 'next/server';

export default NextAuth(authConfig).auth;

// matcherで特定のパスにのみミドルウェアを適用
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};

const response = NextResponse.next();
response.headers.set('Content-Security-Policy', "default-src 'self'");
