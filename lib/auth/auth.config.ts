import type { NextAuthConfig } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { sendMagicLinkEmail } from '@/lib/services/email';

// Super Admin email addresses - auto-assigned SUPER_ADMIN role
const SUPER_ADMIN_EMAILS = [
  'iradwatkins@gmail.com',
  'bobbygwatkins@gmail.com'
];

// Admin email addresses - auto-assigned ADMIN role
const ADMIN_EMAILS: string[] = [];

export const authOptions: NextAuthConfig = {
  trustHost: true,

  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, // Allow linking Google to existing email accounts
    }),

    // Email Magic Link Provider
    EmailProvider({
      server: {
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: {
          user: 'resend',
          pass: process.env.RESEND_API_KEY!,
        },
      },
      from: process.env.RESEND_FROM_EMAIL || 'noreply@events.stepperslife.com',
      sendVerificationRequest: async ({ identifier: email, url }) => {
        await sendMagicLinkEmail(email, url);
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      // Allow sign in
      if (!user.email || !account) return false;

      try {
        // Find or create user
        let existingUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() }
        });

        if (!existingUser) {
          // Create new user
          const role = SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase())
            ? UserRole.SUPER_ADMIN
            : ADMIN_EMAILS.includes(user.email.toLowerCase())
            ? UserRole.ADMIN
            : UserRole.ATTENDEE;

          // Extract name from profile or user
          const name = user.name || '';
          const [firstName, ...lastNameParts] = name.split(' ');

          existingUser = await prisma.user.create({
            data: {
              email: user.email.toLowerCase(),
              firstName: firstName || '',
              lastName: lastNameParts.join(' ') || '',
              displayName: user.name || '',
              profileImage: user.image || null,
              role,
              isVerified: true, // Auto-verify for OAuth/magic link
              emailVerified: new Date(),
              lastLoginAt: new Date(),
            }
          });

          // Set user.id for the account creation below
          user.id = existingUser.id;
        } else {
          // Update last login and verification
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              lastLoginAt: new Date(),
              emailVerified: new Date(),
            }
          });

          // Set user.id for the account creation below
          user.id = existingUser.id;
        }

        // Check if this provider account is already linked
        if (account.provider !== 'email') {
          const existingAccount = await prisma.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              }
            }
          });

          // Create account link if it doesn't exist
          if (!existingAccount) {
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state as string | null,
              }
            });
          }
        }

        return true;
      } catch (error) {
        console.error('Sign in error:', error);
        return false;
      }
    },

    async redirect({ url, baseUrl }) {
      // Allow callback URLs on the same origin
      if (url.startsWith(baseUrl)) return url;
      // Allow relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Default redirect to dashboard
      return `${baseUrl}/dashboard`;
    },

    async jwt({ token, user }) {
      // On initial sign in, set user data in token
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { id: true, email: true, role: true, isVerified: true, firstName: true, lastName: true, displayName: true }
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.email = dbUser.email;
          token.role = dbUser.role;
          token.isVerified = dbUser.isVerified;
          token.name = dbUser.displayName || `${dbUser.firstName} ${dbUser.lastName}`;
          token.lastRoleCheck = Date.now();
        }
      }

      // Refresh role from database every 5 minutes
      const shouldRefreshRole = !token.lastRoleCheck ||
        (Date.now() - (token.lastRoleCheck as number)) > 5 * 60 * 1000;

      if (shouldRefreshRole && token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, isVerified: true }
          });

          if (dbUser) {
            token.role = dbUser.role;
            token.isVerified = dbUser.isVerified;
            token.lastRoleCheck = Date.now();
          }
        } catch (error) {
          console.error('Error refreshing user role:', error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.role = token.role as UserRole;
        session.user.isVerified = token.isVerified as boolean;
      }
      return session;
    },
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60 // 24 hours
  },

  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    }
  },

  useSecureCookies: true,

  debug: process.env.NODE_ENV === 'development'
};
