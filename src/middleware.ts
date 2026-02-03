import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'haulz_session';

export function middleware(req: NextRequest) {
  const session = req.cookies.get(COOKIE_NAME)?.value;
  const isLoginPage = req.nextUrl.pathname === '/login';

  // Valid session: payload.signature format (has a dot)
  const hasValidFormat = session && session.includes('.');
  if (hasValidFormat && isLoginPage) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  if (!hasValidFormat && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|icon.png|favicon.ico).*)'],
};
