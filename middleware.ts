import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Middleware for route protection and role-based access control
 */
export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/about',
    '/accessibility',
    '/contact',
    '/blog',
    '/careers',
    '/press',
    '/partners',
    '/developers',
    '/help',
    '/support',
    '/how-it-works',
    '/pricing',
    '/terms',
    '/privacy',
    '/cookies',
    '/events',
    '/auth/login',
    '/auth/verify',
  ];

  // Check if route is public or public API
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  const isPublicAPI = pathname.startsWith('/api/events/public') ||
                      pathname.startsWith('/api/auth/') ||
                      pathname.startsWith('/api/webhooks/');

  // Allow public routes and APIs
  if (isPublicRoute || isPublicAPI) {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated (for protected routes)
  if (!token && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
    const url = new URL('/auth/login', req.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // Role-based access control
  if (token) {
    const userRole = token.role as string;

    // ADMIN/SUPER_ADMIN only routes
    if (pathname.startsWith('/admin') && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    // ALL authenticated users can access /dashboard
    // This includes ATTENDEE role by default
    // When they create their first event, they automatically become an ORGANIZER

    // NOTE: Affiliate and Staff routes removed
    // Affiliate/Staff are event-specific ASSIGNMENTS, not global roles
    // Access is checked at the event level via TeamMember and AffiliateLink tables
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