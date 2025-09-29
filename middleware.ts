import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { ROUTE_PROTECTION } from '@/lib/auth/rbac';

export async function middleware(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const { pathname } = req.nextUrl;

    // Public routes that don't need authentication
    const publicRoutes = [
      '/',
      '/auth/login',
      '/auth/register',
      '/auth/verify',
      '/auth/reset-password',
      '/api/auth',
      '/api/health',
      '/_next',
      '/favicon.ico',
      '/manifest.json',
      '/icons',
      '/logos',
      '/favicons'
    ];

    // Check if route is public
    const isPublicRoute = publicRoutes.some(route =>
      pathname === route || pathname.startsWith(route + '/')
    );

    if (isPublicRoute) {
      return NextResponse.next();
    }

    // If no token and trying to access protected route, redirect to login
    if (!token) {
      const loginUrl = new URL('/auth/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check email verification for non-public routes
    if (!token.isVerified) {
      // Allow access to verification route
      if (pathname === '/auth/verify') {
        return NextResponse.next();
      }

      // Redirect unverified users to verification page
      const verifyUrl = new URL('/auth/verify', req.url);
      return NextResponse.redirect(verifyUrl);
    }

    // Route-based role checking
    if (pathname.startsWith('/admin')) {
      if (token.role !== 'ADMIN' && token.role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }

    if (pathname.startsWith('/organizer')) {
      const allowedRoles = ['ORGANIZER', 'ADMIN', 'SUPER_ADMIN'];
      if (!allowedRoles.includes(token.role as string)) {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }

    // API route protection
    if (pathname.startsWith('/api/')) {
      // Allow public API routes
      const publicApiRoutes = [
        '/api/auth',
        '/api/health'
      ];

      const isPublicApi = publicApiRoutes.some(route =>
        pathname === route || pathname.startsWith(route + '/')
      );

      if (isPublicApi) {
        return NextResponse.next();
      }

      // Check authentication for protected API routes
      if (!token) {
        return new NextResponse(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check email verification for API routes
      if (!token.isVerified) {
        return new NextResponse(
          JSON.stringify({ error: 'Email verification required' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Admin API routes
      if (pathname.startsWith('/api/admin')) {
        if (token.role !== 'ADMIN' && token.role !== 'SUPER_ADMIN') {
          return new NextResponse(
            JSON.stringify({ error: 'Admin access required' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      // Organizer API routes
      if (pathname.startsWith('/api/organizer')) {
        const allowedRoles = ['ORGANIZER', 'ADMIN', 'SUPER_ADMIN'];
        if (!allowedRoles.includes(token.role as string)) {
          return new NextResponse(
            JSON.stringify({ error: 'Organizer access required' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, manifest.json (metadata files)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|logos|favicons).*)',
  ],
};