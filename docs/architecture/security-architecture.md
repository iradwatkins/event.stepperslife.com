# SteppersLife Events Platform - Security Architecture
## Authentication, Authorization & Security Framework
### Version 2.0

---

## Overview

This document defines the comprehensive security architecture for the SteppersLife events platform, covering authentication, authorization, data protection, and security best practices. The architecture is designed to meet industry standards for payment processing and user data protection.

---

## Security Principles

### Core Security Principles

1. **Defense in Depth**: Multiple layers of security controls
2. **Zero Trust Architecture**: Never trust, always verify
3. **Principle of Least Privilege**: Minimal access rights
4. **Security by Design**: Security built into every component
5. **Data Minimization**: Collect only necessary data
6. **Encryption Everywhere**: Data encrypted in transit and at rest
7. **Audit Everything**: Comprehensive logging and monitoring
8. **Fail Securely**: Secure defaults and graceful failure modes

### Compliance Requirements

- **PCI DSS Compliance**: Level 1 through Square integration
- **CCPA Compliance**: California Consumer Privacy Act
- **GDPR Ready**: European data protection standards
- **SOC 2 Type II**: Security and availability controls
- **OWASP Top 10**: Protection against common vulnerabilities

---

## Authentication Architecture

### Multi-Factor Authentication Framework

```typescript
// lib/auth/auth-framework.ts
import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { compare, hash } from 'bcryptjs';
import { authenticator } from 'otplib';
import { qrcode } from 'qrcode';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    // Email/Password Authentication
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        totp: { label: 'TOTP Code', type: 'text' },
        rememberMe: { label: 'Remember Me', type: 'checkbox' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
        }

        // Rate limiting for login attempts
        const rateLimitKey = `auth:${credentials.email}:${req.ip}`;
        const rateResult = await rateLimit(rateLimitKey, 5, 15 * 60); // 5 attempts per 15 minutes

        if (!rateResult.success) {
          logger.warn('Login rate limit exceeded', {
            email: credentials.email,
            ip: req.ip,
            remainingAttempts: rateResult.remaining,
          });
          throw new Error('Too many login attempts. Please try again later.');
        }

        // Find user
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: {
            organizerProfile: true,
            accounts: true,
          },
        });

        if (!user || !user.passwordHash) {
          logger.warn('Login attempt with invalid credentials', {
            email: credentials.email,
            ip: req.ip,
          });
          throw new Error('Invalid credentials');
        }

        // Check account status
        if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
          logger.warn('Login attempt with suspended/banned account', {
            userId: user.id,
            status: user.status,
            ip: req.ip,
          });
          throw new Error('Account suspended. Please contact support.');
        }

        // Verify password
        const isPasswordValid = await compare(credentials.password, user.passwordHash);

        if (!isPasswordValid) {
          logger.warn('Login attempt with invalid password', {
            userId: user.id,
            ip: req.ip,
          });
          throw new Error('Invalid credentials');
        }

        // Check 2FA if enabled
        if (user.twoFactorEnabled) {
          if (!credentials.totp) {
            throw new Error('Two-factor authentication code required');
          }

          const totpSecret = await getTotpSecret(user.id);
          const isValidTotp = authenticator.verify({
            token: credentials.totp,
            secret: totpSecret,
          });

          if (!isValidTotp) {
            logger.warn('Invalid 2FA code provided', {
              userId: user.id,
              ip: req.ip,
            });
            throw new Error('Invalid two-factor authentication code');
          }
        }

        // Log successful login
        logger.info('Successful login', {
          userId: user.id,
          email: user.email,
          ip: req.ip,
          userAgent: req.headers?.['user-agent'],
        });

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          image: user.profileImage,
          emailVerified: user.emailVerified,
          twoFactorEnabled: user.twoFactorEnabled,
          organizerProfile: user.organizerProfile,
        };
      },
    }),

    // OAuth Providers
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),

    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    encode: async ({ token, secret }) => {
      // Custom JWT encoding with additional security
      return await jwtEncode({ token, secret });
    },
    decode: async ({ token, secret }) => {
      // Custom JWT decoding with validation
      return await jwtDecode({ token, secret });
    },
  },

  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // Additional sign-in validation
      if (account?.provider === 'credentials') {
        return true; // Already validated in authorize
      }

      // OAuth provider validation
      if (account?.provider && email?.verificationRequest) {
        // Handle magic link verification
        return true;
      }

      // Social login validation
      if (account?.provider && user.email) {
        // Check if user exists and merge accounts if needed
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (existingUser && existingUser.status !== 'ACTIVE') {
          return false;
        }

        return true;
      }

      return false;
    },

    async jwt({ token, user, account, profile, isNewUser }) {
      // Add custom claims to JWT
      if (user) {
        token.userId = user.id;
        token.role = user.role;
        token.emailVerified = user.emailVerified;
        token.twoFactorEnabled = user.twoFactorEnabled;
        token.organizerProfile = user.organizerProfile;
      }

      // Rotate token periodically
      if (Date.now() - (token.iat as number) * 1000 > 24 * 60 * 60 * 1000) {
        // Token is older than 24 hours, refresh user data
        if (token.userId) {
          const user = await prisma.user.findUnique({
            where: { id: token.userId as string },
            include: { organizerProfile: true },
          });

          if (user) {
            token.role = user.role;
            token.emailVerified = user.emailVerified;
            token.twoFactorEnabled = user.twoFactorEnabled;
            token.organizerProfile = user.organizerProfile;
          }
        }
      }

      return token;
    },

    async session({ session, token, user }) {
      // Add custom fields to session
      if (token) {
        session.user.id = token.userId as string;
        session.user.role = token.role as UserRole;
        session.user.emailVerified = token.emailVerified as Date | null;
        session.user.twoFactorEnabled = token.twoFactorEnabled as boolean;
        session.user.organizerProfile = token.organizerProfile as OrganizerProfile | null;
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      // Custom redirect logic
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      } else if (new URL(url).origin === baseUrl) {
        return url;
      }
      return baseUrl;
    },
  },

  pages: {
    signIn: '/auth/login',
    signUp: '/auth/register',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/welcome',
  },

  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // Log sign-in events
      logger.info('User signed in', {
        userId: user.id,
        provider: account?.provider,
        isNewUser,
      });

      // Send welcome email for new users
      if (isNewUser) {
        await sendWelcomeEmail(user.email, user.name);
      }
    },

    async signOut({ session, token }) {
      // Log sign-out events
      logger.info('User signed out', {
        userId: session?.user?.id || token?.userId,
      });
    },

    async session({ session, token }) {
      // Update session activity
      if (session?.user?.id) {
        await updateUserActivity(session.user.id);
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',
};

// Two-Factor Authentication Functions
async function setupTwoFactor(userId: string): Promise<TwoFactorSetup> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const secret = authenticator.generateSecret();
  const service = 'SteppersLife';
  const otpauth = authenticator.keyuri(user.email, service, secret);
  const qrCodeUrl = await qrcode.toDataURL(otpauth);

  // Store secret temporarily (will be confirmed later)
  await prisma.userSecret.upsert({
    where: { userId },
    update: {
      totpSecret: secret,
      isVerified: false,
      updatedAt: new Date(),
    },
    create: {
      userId,
      totpSecret: secret,
      isVerified: false,
    },
  });

  return {
    secret,
    qrCodeUrl,
    backupCodes: generateBackupCodes(),
  };
}

async function verifyTwoFactor(userId: string, token: string): Promise<boolean> {
  const secret = await getTotpSecret(userId);

  if (!secret) {
    throw new Error('Two-factor authentication not set up');
  }

  const isValid = authenticator.verify({
    token,
    secret,
    window: 2, // Allow 2 time windows for clock drift
  });

  if (isValid) {
    // Mark as verified
    await prisma.userSecret.update({
      where: { userId },
      data: { isVerified: true },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });
  }

  return isValid;
}

async function disableTwoFactor(userId: string, password: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.passwordHash) {
    throw new Error('User not found');
  }

  // Verify password
  const isPasswordValid = await compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error('Invalid password');
  }

  // Remove 2FA
  await prisma.userSecret.delete({
    where: { userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: false },
  });

  logger.info('Two-factor authentication disabled', { userId });
}

// Helper Functions
async function getTotpSecret(userId: string): Promise<string | null> {
  const userSecret = await prisma.userSecret.findUnique({
    where: { userId },
  });

  return userSecret?.totpSecret || null;
}

function generateBackupCodes(): string[] {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push(Math.random().toString(36).substr(2, 8).toUpperCase());
  }
  return codes;
}

export { setupTwoFactor, verifyTwoFactor, disableTwoFactor };
```

---

## Authorization & Role-Based Access Control

### RBAC Implementation

```typescript
// lib/auth/rbac.ts
import { Session } from 'next-auth';
import { prisma } from '@/lib/prisma';

// Permission definitions
export const PERMISSIONS = {
  // User permissions
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',

  // Event permissions
  EVENT_CREATE: 'event:create',
  EVENT_READ: 'event:read',
  EVENT_UPDATE: 'event:update',
  EVENT_DELETE: 'event:delete',
  EVENT_PUBLISH: 'event:publish',

  // Ticket permissions
  TICKET_CREATE: 'ticket:create',
  TICKET_READ: 'ticket:read',
  TICKET_UPDATE: 'ticket:update',
  TICKET_REFUND: 'ticket:refund',

  // Order permissions
  ORDER_READ: 'order:read',
  ORDER_UPDATE: 'order:update',
  ORDER_REFUND: 'order:refund',

  // Analytics permissions
  ANALYTICS_READ: 'analytics:read',
  ANALYTICS_EXPORT: 'analytics:export',

  // Admin permissions
  ADMIN_USERS: 'admin:users',
  ADMIN_EVENTS: 'admin:events',
  ADMIN_PAYMENTS: 'admin:payments',
  ADMIN_SYSTEM: 'admin:system',

  // Team permissions
  TEAM_MANAGE: 'team:manage',
  TEAM_INVITE: 'team:invite',
} as const;

type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role definitions with permissions
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ATTENDEE: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.EVENT_READ,
    PERMISSIONS.TICKET_READ,
    PERMISSIONS.ORDER_READ,
  ],

  ORGANIZER: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.EVENT_CREATE,
    PERMISSIONS.EVENT_READ,
    PERMISSIONS.EVENT_UPDATE,
    PERMISSIONS.EVENT_DELETE,
    PERMISSIONS.EVENT_PUBLISH,
    PERMISSIONS.TICKET_CREATE,
    PERMISSIONS.TICKET_READ,
    PERMISSIONS.TICKET_UPDATE,
    PERMISSIONS.TICKET_REFUND,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.ORDER_REFUND,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.TEAM_MANAGE,
    PERMISSIONS.TEAM_INVITE,
  ],

  STAFF: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.EVENT_READ,
    PERMISSIONS.TICKET_READ,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.ANALYTICS_READ,
  ],

  ADMIN: [
    ...Object.values(PERMISSIONS),
  ],

  SUPER_ADMIN: [
    ...Object.values(PERMISSIONS),
  ],
};

// Permission checking functions
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions.includes(permission);
}

export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

// Resource-based authorization
export async function canAccessEvent(userId: string, eventId: string): Promise<boolean> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      organizer: {
        include: {
          organizerProfile: {
            include: {
              team: {
                where: { userId, isActive: true },
              },
            },
          },
        },
      },
    },
  });

  if (!event) return false;

  // Event organizer has full access
  if (event.organizerId === userId) return true;

  // Team members have access based on permissions
  const teamMember = event.organizer.organizerProfile?.team.find(t => t.userId === userId);
  if (teamMember) {
    return teamMember.permissions.includes(PERMISSIONS.EVENT_READ);
  }

  return false;
}

export async function canManageEvent(userId: string, eventId: string): Promise<boolean> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      organizer: {
        include: {
          organizerProfile: {
            include: {
              team: {
                where: { userId, isActive: true },
              },
            },
          },
        },
      },
    },
  });

  if (!event) return false;

  // Event organizer has full access
  if (event.organizerId === userId) return true;

  // Team members need update permissions
  const teamMember = event.organizer.organizerProfile?.team.find(t => t.userId === userId);
  if (teamMember) {
    return teamMember.permissions.includes(PERMISSIONS.EVENT_UPDATE);
  }

  return false;
}

export async function canAccessOrder(userId: string, orderId: string): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      event: {
        include: {
          organizer: {
            include: {
              organizerProfile: {
                include: {
                  team: {
                    where: { userId, isActive: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order) return false;

  // Order owner has access
  if (order.userId === userId) return true;

  // Event organizer has access
  if (order.event.organizerId === userId) return true;

  // Team members with order permissions
  const teamMember = order.event.organizer.organizerProfile?.team.find(t => t.userId === userId);
  if (teamMember) {
    return teamMember.permissions.includes(PERMISSIONS.ORDER_READ);
  }

  return false;
}

// Middleware for API route protection
export function requireAuth(requiredPermissions?: Permission[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (requiredPermissions) {
      const hasRequiredPermissions = hasAllPermissions(
        session.user.role,
        requiredPermissions
      );

      if (!hasRequiredPermissions) {
        logger.warn('Access denied - insufficient permissions', {
          userId: session.user.id,
          role: session.user.role,
          requiredPermissions,
        });
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
    }

    req.user = session.user;
    next();
  };
}

// tRPC middleware for authorization
export const authMiddleware = t.middleware(async ({ ctx, next }) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);

  if (!session?.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  }

  return next({
    ctx: {
      ...ctx,
      session,
      user: session.user,
    },
  });
});

export const requirePermissions = (permissions: Permission[]) => {
  return authMiddleware.unstable_pipe(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    const hasRequiredPermissions = hasAllPermissions(ctx.user.role, permissions);

    if (!hasRequiredPermissions) {
      logger.warn('tRPC access denied - insufficient permissions', {
        userId: ctx.user.id,
        role: ctx.user.role,
        requiredPermissions: permissions,
      });

      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
      });
    }

    return next();
  });
};

// Team role management
export async function inviteTeamMember(
  organizerId: string,
  inviterUserId: string,
  email: string,
  role: TeamRole,
  permissions: Permission[]
): Promise<TeamInvitation> {
  // Check if inviter has permission to invite
  const canInvite = await hasTeamPermission(inviterUserId, organizerId, PERMISSIONS.TEAM_INVITE);
  if (!canInvite) {
    throw new Error('Insufficient permissions to invite team members');
  }

  // Create invitation
  const invitation = await prisma.teamInvitation.create({
    data: {
      organizerId,
      inviterUserId,
      email: email.toLowerCase(),
      role,
      permissions,
      token: generateSecureToken(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  // Send invitation email
  await sendTeamInvitationEmail(invitation);

  logger.info('Team member invited', {
    organizerId,
    inviterUserId,
    email,
    role,
  });

  return invitation;
}

async function hasTeamPermission(
  userId: string,
  organizerId: string,
  permission: Permission
): Promise<boolean> {
  const teamMember = await prisma.teamMember.findUnique({
    where: {
      organizerId_userId: {
        organizerId,
        userId,
      },
    },
  });

  if (!teamMember || !teamMember.isActive) return false;

  return teamMember.permissions.includes(permission);
}
```

---

## Data Protection & Encryption

### Encryption Framework

```typescript
// lib/security/encryption.ts
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 16;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

export class EncryptionService {
  private masterKey: Buffer;

  constructor() {
    const masterKeyString = process.env.ENCRYPTION_MASTER_KEY;
    if (!masterKeyString) {
      throw new Error('ENCRYPTION_MASTER_KEY environment variable is required');
    }
    this.masterKey = Buffer.from(masterKeyString, 'hex');
  }

  // Encrypt sensitive data
  encrypt(plaintext: string): EncryptedData {
    const salt = randomBytes(SALT_LENGTH);
    const iv = randomBytes(IV_LENGTH);
    const key = scryptSync(this.masterKey, salt, KEY_LENGTH);

    const cipher = createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return {
      encrypted,
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
    };
  }

  // Decrypt sensitive data
  decrypt(encryptedData: EncryptedData): string {
    const salt = Buffer.from(encryptedData.salt, 'hex');
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const tag = Buffer.from(encryptedData.tag, 'hex');
    const key = scryptSync(this.masterKey, salt, KEY_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // Hash passwords
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Verify passwords
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  // Generate secure tokens
  generateSecureToken(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }

  // Generate API keys
  generateApiKey(): string {
    const prefix = 'sl_';
    const randomPart = this.generateSecureToken(32);
    return `${prefix}${randomPart}`;
  }

  // Hash API keys for storage
  hashApiKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  // Encrypt PII data
  encryptPII(data: PersonalData): EncryptedPersonalData {
    return {
      email: data.email ? this.encrypt(data.email) : null,
      phone: data.phone ? this.encrypt(data.phone) : null,
      name: data.name ? this.encrypt(data.name) : null,
      address: data.address ? this.encrypt(data.address) : null,
    };
  }

  // Decrypt PII data
  decryptPII(encryptedData: EncryptedPersonalData): PersonalData {
    return {
      email: encryptedData.email ? this.decrypt(encryptedData.email) : null,
      phone: encryptedData.phone ? this.decrypt(encryptedData.phone) : null,
      name: encryptedData.name ? this.decrypt(encryptedData.name) : null,
      address: encryptedData.address ? this.decrypt(encryptedData.address) : null,
    };
  }
}

interface EncryptedData {
  encrypted: string;
  salt: string;
  iv: string;
  tag: string;
}

interface PersonalData {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  address?: string | null;
}

interface EncryptedPersonalData {
  email?: EncryptedData | null;
  phone?: EncryptedData | null;
  name?: EncryptedData | null;
  address?: EncryptedData | null;
}

export const encryption = new EncryptionService();
```

---

## Security Middleware & Headers

### Security Headers Implementation

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security Headers
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Strict Transport Security
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // Content Security Policy
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.squareup.com https://sandbox.web.squarecdn.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https: blob:;
    font-src 'self' data:;
    connect-src 'self' https://api.square.com https://api.squareup.com wss:;
    media-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);

  // Rate Limiting
  const ip = request.ip ?? '127.0.0.1';
  const pathname = request.nextUrl.pathname;

  // Different rate limits for different endpoints
  let rateLimitConfig = { limit: 100, window: 60 }; // Default: 100 requests per minute

  if (pathname.startsWith('/api/auth')) {
    rateLimitConfig = { limit: 10, window: 60 }; // Auth: 10 requests per minute
  } else if (pathname.startsWith('/api/payment')) {
    rateLimitConfig = { limit: 5, window: 60 }; // Payment: 5 requests per minute
  } else if (pathname.startsWith('/api/trpc')) {
    rateLimitConfig = { limit: 200, window: 60 }; // tRPC: 200 requests per minute
  }

  const rateLimitResult = await rateLimit(
    `rate_limit:${ip}:${pathname}`,
    rateLimitConfig.limit,
    rateLimitConfig.window
  );

  if (!rateLimitResult.success) {
    logger.warn('Rate limit exceeded', {
      ip,
      pathname,
      limit: rateLimitConfig.limit,
      window: rateLimitConfig.window,
    });

    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': rateLimitConfig.window.toString(),
        'X-RateLimit-Limit': rateLimitConfig.limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(Date.now() + rateLimitConfig.window * 1000).toISOString(),
      },
    });
  }

  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', rateLimitConfig.limit.toString());
  response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());

  // Auth Protection for API routes
  if (pathname.startsWith('/api/') && !isPublicApiRoute(pathname)) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Add user context to headers for downstream processing
    response.headers.set('X-User-ID', token.userId as string);
    response.headers.set('X-User-Role', token.role as string);
  }

  // Admin route protection
  if (pathname.startsWith('/admin')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !['ADMIN', 'SUPER_ADMIN'].includes(token.role as string)) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  // Organizer route protection
  if (pathname.startsWith('/organizer')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !['ORGANIZER', 'ADMIN', 'SUPER_ADMIN'].includes(token.role as string)) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return response;
}

function isPublicApiRoute(pathname: string): boolean {
  const publicRoutes = [
    '/api/auth/',
    '/api/health',
    '/api/webhooks/',
    '/api/trpc/public.',
  ];

  return publicRoutes.some(route => pathname.startsWith(route));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

---

## Input Validation & Sanitization

### Validation Framework

```typescript
// lib/validation/security-validation.ts
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

// Custom validation schemas
export const secureStringSchema = z
  .string()
  .min(1)
  .refine(
    (val) => !containsSqlInjection(val),
    'Invalid characters detected'
  )
  .refine(
    (val) => !containsXSS(val),
    'Potentially unsafe content detected'
  );

export const emailSchema = z
  .string()
  .email('Invalid email format')
  .transform(val => val.toLowerCase().trim())
  .refine(
    (val) => validator.isEmail(val),
    'Invalid email format'
  );

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .refine(
    (val) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(val),
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  );

export const phoneSchema = z
  .string()
  .optional()
  .refine(
    (val) => !val || validator.isMobilePhone(val, 'en-US'),
    'Invalid phone number format'
  );

export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .refine(
    (val) => validator.isURL(val, { protocols: ['http', 'https'] }),
    'URL must use HTTP or HTTPS protocol'
  );

// Content sanitization
export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
  });
}

export function sanitizeText(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

// SQL injection detection
function containsSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(select|insert|update|delete|drop|create|alter|exec|execute|union|script)\b)/gi,
    /(\b(or|and)\s+\d+\s*=\s*\d+)/gi,
    /(;|\-\-|\/\*|\*\/)/gi,
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
}

// XSS detection
function containsXSS(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b/gi,
    /<object\b/gi,
    /<embed\b/gi,
  ];

  return xssPatterns.some(pattern => pattern.test(input));
}

// File upload validation
export const fileUploadSchema = z.object({
  filename: z.string().refine(
    (val) => validator.isLength(val, { min: 1, max: 255 }),
    'Filename must be between 1 and 255 characters'
  ),
  mimetype: z.string().refine(
    (val) => ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(val),
    'Invalid file type'
  ),
  size: z.number().max(10 * 1024 * 1024, 'File size must not exceed 10MB'),
});

// API input validation middleware
export function validateInput<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        logger.warn('Input validation failed', {
          errors: result.error.errors,
          url: req.url,
          method: req.method,
        });

        return res.status(400).json({
          error: 'Validation failed',
          details: result.error.errors,
        });
      }

      req.body = result.data;
      next();
    } catch (error) {
      logger.error('Validation middleware error', { error });
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}
```

---

## Audit Logging & Monitoring

### Security Monitoring Framework

```typescript
// lib/security/audit-logging.ts
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export enum AuditAction {
  // Authentication
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  TWO_FACTOR_ENABLED = 'TWO_FACTOR_ENABLED',
  TWO_FACTOR_DISABLED = 'TWO_FACTOR_DISABLED',

  // Authorization
  ACCESS_GRANTED = 'ACCESS_GRANTED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  PERMISSION_ESCALATION = 'PERMISSION_ESCALATION',

  // Data Access
  DATA_ACCESSED = 'DATA_ACCESSED',
  DATA_EXPORTED = 'DATA_EXPORTED',
  PII_ACCESSED = 'PII_ACCESSED',

  // Data Modification
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  EVENT_CREATED = 'EVENT_CREATED',
  EVENT_UPDATED = 'EVENT_UPDATED',
  EVENT_DELETED = 'EVENT_DELETED',

  // Financial
  PAYMENT_PROCESSED = 'PAYMENT_PROCESSED',
  REFUND_PROCESSED = 'REFUND_PROCESSED',
  PAYOUT_REQUESTED = 'PAYOUT_REQUESTED',

  // Security Events
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  FAILED_AUTHORIZATION = 'FAILED_AUTHORIZATION',
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',

  // System Events
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  CONFIG_CHANGED = 'CONFIG_CHANGED',
  BACKUP_CREATED = 'BACKUP_CREATED',
}

interface AuditLogEntry {
  action: AuditAction;
  userId?: string;
  entityType?: string;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  success: boolean;
  errorMessage?: string;
}

export class AuditLogger {
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      // Log to database
      await prisma.auditLog.create({
        data: {
          action: entry.action,
          userId: entry.userId,
          entityType: entry.entityType,
          entityId: entry.entityId,
          oldValues: entry.oldValues ? JSON.stringify(entry.oldValues) : null,
          newValues: entry.newValues ? JSON.stringify(entry.newValues) : null,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
          success: entry.success,
          errorMessage: entry.errorMessage,
          createdAt: new Date(),
        },
      });

      // Log to application logger
      const logLevel = entry.success ? 'info' : 'warn';
      logger[logLevel]('Audit event', {
        action: entry.action,
        userId: entry.userId,
        entityType: entry.entityType,
        entityId: entry.entityId,
        success: entry.success,
        metadata: entry.metadata,
      });

      // Send critical events to security monitoring
      if (this.isCriticalEvent(entry.action)) {
        await this.sendSecurityAlert(entry);
      }

    } catch (error) {
      logger.error('Failed to log audit event', { error, entry });
    }
  }

  private isCriticalEvent(action: AuditAction): boolean {
    const criticalEvents = [
      AuditAction.LOGIN_FAILED,
      AuditAction.ACCESS_DENIED,
      AuditAction.PERMISSION_ESCALATION,
      AuditAction.SUSPICIOUS_ACTIVITY,
      AuditAction.SECURITY_VIOLATION,
      AuditAction.FAILED_AUTHORIZATION,
    ];

    return criticalEvents.includes(action);
  }

  private async sendSecurityAlert(entry: AuditLogEntry): Promise<void> {
    // Implementation for sending alerts to security team
    // Could integrate with Slack, email, or security monitoring tools

    const alertData = {
      severity: 'HIGH',
      event: entry.action,
      timestamp: new Date().toISOString(),
      userId: entry.userId,
      ipAddress: entry.ipAddress,
      details: entry.metadata,
    };

    // Send to monitoring service
    await this.sendToMonitoringService(alertData);
  }

  private async sendToMonitoringService(alert: any): Promise<void> {
    // Integration with external monitoring service
    // Example: Datadog, New Relic, or custom monitoring

    if (process.env.SECURITY_WEBHOOK_URL) {
      try {
        await fetch(process.env.SECURITY_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SECURITY_WEBHOOK_TOKEN}`,
          },
          body: JSON.stringify(alert),
        });
      } catch (error) {
        logger.error('Failed to send security alert', { error, alert });
      }
    }
  }
}

export const auditLogger = new AuditLogger();

// Audit decorator for automatic logging
export function Audit(action: AuditAction, entityType?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      let success = true;
      let errorMessage: string | undefined;
      let result: any;

      try {
        result = await originalMethod.apply(this, args);
        return result;
      } catch (error) {
        success = false;
        errorMessage = error.message;
        throw error;
      } finally {
        // Extract context from request or arguments
        const context = this.extractAuditContext?.(args) || {};

        await auditLogger.log({
          action,
          entityType,
          userId: context.userId,
          entityId: context.entityId,
          oldValues: context.oldValues,
          newValues: result || context.newValues,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          metadata: {
            method: propertyKey,
            duration: Date.now() - startTime,
            ...context.metadata,
          },
          success,
          errorMessage,
        });
      }
    };
  };
}

// Security metrics tracking
export class SecurityMetrics {
  private static metrics = new Map<string, number>();

  static increment(metric: string, value: number = 1): void {
    const current = this.metrics.get(metric) || 0;
    this.metrics.set(metric, current + value);
  }

  static getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  static reset(): void {
    this.metrics.clear();
  }

  // Track failed login attempts
  static trackFailedLogin(email: string, ip: string): void {
    this.increment('failed_logins_total');
    this.increment(`failed_logins_by_email:${email}`);
    this.increment(`failed_logins_by_ip:${ip}`);
  }

  // Track suspicious activity
  static trackSuspiciousActivity(type: string, severity: 'low' | 'medium' | 'high'): void {
    this.increment('suspicious_activity_total');
    this.increment(`suspicious_activity_${severity}`);
    this.increment(`suspicious_activity_type:${type}`);
  }

  // Track security violations
  static trackSecurityViolation(violation: string): void {
    this.increment('security_violations_total');
    this.increment(`security_violation:${violation}`);
  }
}
```

This comprehensive security architecture provides:

1. **Multi-factor Authentication** with TOTP support
2. **Role-based Access Control** with granular permissions
3. **Data Encryption** for sensitive information
4. **Security Headers** and middleware protection
5. **Input Validation** and sanitization
6. **Audit Logging** for compliance and monitoring
7. **Rate Limiting** and DDoS protection
8. **Security Metrics** tracking and alerting
9. **OAuth Integration** for social login
10. **Team Management** with role delegation

The security framework is designed to be compliant with industry standards while providing a secure foundation for the events platform.