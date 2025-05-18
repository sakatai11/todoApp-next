import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export default async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production',
  });
  const path = req.nextUrl.pathname;

  // Protect admin routes
  if (path.startsWith('/admin')) {
    // If not authenticated or not admin, redirect to sign-in with callbackUrl
    if (!token || token.role !== 'ADMIN') {
      const url = req.nextUrl.clone();
      url.pathname = '/signin';
      url.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }
  // Protect todo routes for authenticated users
  if (path.startsWith('/todo')) {
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = '/signin';
      url.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/todo/:path*'],
};
