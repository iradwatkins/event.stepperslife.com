import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { UserRole } from '@prisma/client';

export const authOptions: NextAuthOptions = {

  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        // Find user with email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          select: {
            id: true,
            email: true,
            emailVerified: true,
            passwordHash: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
            isVerified: true
          }
        });

        if (!user || !user.passwordHash) {
          throw new Error('Invalid email or password');
        }

        // Check if user is verified
        if (!user.emailVerified) {
          throw new Error('Please verify your email before logging in');
        }

        // Check if account is active
        if (user.status !== 'ACTIVE') {
          throw new Error('Your account has been suspended');
        }

        // Verify password
        const isValidPassword = await verifyPassword(
          credentials.password,
          user.passwordHash
        );

        if (!isValidPassword) {
          // Log failed attempt
          await prisma.auditLog.create({
            data: {
              action: 'LOGIN_FAILED',
              entityType: 'USER',
              entityId: user.id,
              metadata: {
                reason: 'Invalid password',
                email: credentials.email
              }
            }
          });

          throw new Error('Invalid email or password');
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });

        // Log successful login
        await prisma.auditLog.create({
          data: {
            action: 'LOGIN_SUCCESS',
            entityType: 'USER',
            entityId: user.id,
            userId: user.id,
            metadata: {
              email: user.email
            }
          }
        });

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          isVerified: user.isVerified
        };
      }
    })
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = (user as any).role || UserRole.ATTENDEE;
        token.isVerified = (user as any).isVerified || false;
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

    async signIn({ user, account, profile }) {
      // Additional sign-in checks can be added here
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
    updateAge: 24 * 60 * 60 // 24 hours
  },

  jwt: {
    secret: process.env.NEXTAUTH_SECRET
  },

  events: {
    async signIn({ user, account, profile }) {
      console.log(`User ${user.email} signed in`);
    },
    async signOut({ session, token }) {
      if (session?.user?.email) {
        console.log(`User ${session.user.email} signed out`);
      }
    }
  },

  debug: process.env.NODE_ENV === 'development'
};

// Type extensions for NextAuth
declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    role: UserRole;
    isVerified: boolean;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
      isVerified: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    role: UserRole;
    isVerified: boolean;
  }
}