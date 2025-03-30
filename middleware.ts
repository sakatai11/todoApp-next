import { auth } from '@/auth';
import { NextResponse, type NextRequest } from 'next/server';

export default async function middleware(request: NextRequest) {
  const session = await auth();

  // 保護ページの定義
  const isProtectedPage = request.nextUrl.pathname.startsWith('/confirm');
  const isAuthPage = request.nextUrl.pathname.startsWith('/signin');

  // 認証状態によるリダイレクト処理
  if (isProtectedPage && !session?.user) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  if (isAuthPage && session?.user) {
    return NextResponse.redirect(new URL('/confirm', request.url));
  }

  const response = NextResponse.next();
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // MUI フォント用
      "font-src 'self' https://fonts.gstatic.com data:", // MUI アイコン用
      "img-src 'self' data:", // データURI画像許可
      "connect-src 'self'", // API接続制限
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  );
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}

// matcherで特定のパスにのみミドルウェアを適用
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
