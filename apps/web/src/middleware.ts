import { NextResponse, type NextRequest } from 'next/server';

const guestOnlyPaths = ['/login', '/register'];
const publicPaths = ['/auth/callback', ...guestOnlyPaths];

function matchesPath(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get('refreshToken')?.value);

  // Redirect authenticated users away from guest-only routes.
  if (hasSession && guestOnlyPaths.some((route) => matchesPath(pathname, route))) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirect unauthenticated users away from protected routes.
  if (!hasSession && !publicPaths.some((route) => matchesPath(pathname, route))) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes except static files, _next, and api
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
