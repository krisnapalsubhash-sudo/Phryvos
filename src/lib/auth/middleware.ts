import { auth } from '@/lib/auth/config';
import { NextResponse } from 'next/server';

const PROTECTED_PATHS = [
  '/feed',
  '/radar',
  '/chat',
  '/profile',
  '/settings',
  '/discover',
  '/search',
  '/notifications',
  '/moderation',
  '/post',
];

const AUTH_PAGES = ['/login', '/register', '/onboarding', '/forgot-password', '/reset-password'];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'));
}

function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some((path) => pathname === path || pathname.startsWith(path + '/'));
}

function isValidCallbackUrl(callbackUrl: string | null): boolean {
  if (!callbackUrl) return false;
  try {
    const url = new URL(callbackUrl);
    // Only allow internal paths
    return url.origin === 'null' || url.origin === process.env.NEXT_PUBLIC_APP_URL;
  } catch {
    return false;
  }
}

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const pathname = req.nextUrl.pathname;
  const method = req.method;
  const searchParams = req.nextUrl.searchParams;
  const callbackUrl = searchParams.get('callbackUrl');

  // 1. CSRF Verification for state-changing API mutations
  const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
  if (isMutation && pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');

    if (origin) {
      try {
        const originUrl = new URL(origin);
        const hostWithoutPort = host ? host.split(':')[0] : '';
        const originHostWithoutPort = originUrl.hostname;

        const isAllowed =
          originHostWithoutPort === hostWithoutPort ||
          originUrl.host === host ||
          originUrl.hostname.endsWith('phryvos.in') ||
          originUrl.hostname === 'localhost' ||
          originUrl.hostname === '127.0.0.1';

        if (!isAllowed) {
          return new NextResponse(
            JSON.stringify({ error: 'Forbidden: Cross-site request rejected', code: 'CSRF_REJECTED' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      } catch {
        return new NextResponse(
          JSON.stringify({ error: 'Forbidden: Malformed request origin', code: 'CSRF_REJECTED' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
  }

  // 2. Redirect logged-in users away from auth pages
  if (isAuthPage(pathname) && isLoggedIn) {
    const safeCallback = callbackUrl && isValidCallbackUrl(callbackUrl) ? callbackUrl : '/feed';
    return NextResponse.redirect(new URL(safeCallback, req.nextUrl));
  }

  // 3. Protect authenticated app pages
  if (isProtectedPath(pathname) && !isLoggedIn) {
    const safeCallback = isValidCallbackUrl(pathname) ? pathname : '/feed';
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(safeCallback)}`, req.nextUrl)
    );
  }

  // 4. Pass through with standard hardened security headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
});

export const config = {
  matcher: [
    '/login',
    '/register',
    '/onboarding',
    '/forgot-password',
    '/reset-password',
    '/feed/:path*',
    '/radar/:path*',
    '/chat/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/discover/:path*',
    '/search/:path*',
    '/notifications/:path*',
    '/moderation/:path*',
    '/post/:path*',
    '/api/:path*',
  ],
};