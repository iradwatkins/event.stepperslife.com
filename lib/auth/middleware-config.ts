import type { NextAuthConfig } from 'next-auth';

// Edge-compatible auth config for middleware
// This excludes any Node.js-specific imports like argon2
export const middlewareAuthConfig: NextAuthConfig = {
  trustHost: true,
  providers: [], // Providers are defined in main auth config

  callbacks: {
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl;

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
        return true;
      }

      // Require authentication for all other routes
      if (!auth) {
        return false;
      }

      // Check email verification
      if (!auth.user?.isVerified) {
        // Allow access to verification route
        if (pathname === '/auth/verify') {
          return true;
        }
        return false;
      }

      // Admin route protection
      if (pathname.startsWith('/admin')) {
        return auth.user.role === 'ADMIN' || auth.user.role === 'SUPER_ADMIN';
      }

      // Organizer route protection
      if (pathname.startsWith('/organizer')) {
        const allowedRoles = ['ORGANIZER', 'ADMIN', 'SUPER_ADMIN'];
        return allowedRoles.includes(auth.user.role);
      }

      return true;
    }
  },

  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
    newUser: '/dashboard'
  },

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  }
};