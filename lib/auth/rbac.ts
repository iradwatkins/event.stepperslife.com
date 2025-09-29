import { UserRole } from '@prisma/client';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { authOptions } from './auth.config';

// Define permissions for each role
export const PERMISSIONS = {
  // Attendee permissions
  ATTENDEE: [
    'events.browse',
    'events.view',
    'tickets.purchase',
    'tickets.view_own',
    'profile.edit_own'
  ],

  // Organizer permissions (includes all attendee permissions)
  ORGANIZER: [
    'events.browse',
    'events.view',
    'tickets.purchase',
    'tickets.view_own',
    'profile.edit_own',
    'events.create',
    'events.edit_own',
    'events.delete_own',
    'events.publish_own',
    'tickets.validate',
    'reports.view_own',
    'team.manage_own',
    'venues.create_own',
    'venues.edit_own'
  ],

  // Staff permissions (includes organizer permissions for assigned events)
  STAFF: [
    'events.browse',
    'events.view',
    'tickets.purchase',
    'tickets.view_own',
    'profile.edit_own',
    'tickets.validate',
    'events.checkin',
    'reports.view_assigned'
  ],

  // Admin permissions (includes all organizer permissions + admin functions)
  ADMIN: [
    'events.browse',
    'events.view',
    'tickets.purchase',
    'tickets.view_own',
    'profile.edit_own',
    'events.create',
    'events.edit_own',
    'events.delete_own',
    'events.publish_own',
    'tickets.validate',
    'reports.view_own',
    'team.manage_own',
    'venues.create_own',
    'venues.edit_own',
    'events.edit_any',
    'events.delete_any',
    'users.view',
    'users.edit',
    'users.suspend',
    'reports.view_all',
    'platform.configure'
  ],

  // Super Admin permissions (all permissions)
  SUPER_ADMIN: [
    'events.browse',
    'events.view',
    'tickets.purchase',
    'tickets.view_own',
    'profile.edit_own',
    'events.create',
    'events.edit_own',
    'events.delete_own',
    'events.publish_own',
    'tickets.validate',
    'reports.view_own',
    'team.manage_own',
    'venues.create_own',
    'venues.edit_own',
    'events.edit_any',
    'events.delete_any',
    'users.view',
    'users.edit',
    'users.suspend',
    'reports.view_all',
    'platform.configure',
    'users.delete',
    'platform.admin',
    'database.access',
    'system.configure'
  ]
} as const;

export type Permission = typeof PERMISSIONS[UserRole][number];

/**
 * Check if a user role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return PERMISSIONS[role].includes(permission);
}

/**
 * Check if a user role has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a user role has all of the specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Middleware to check if the current user has required permissions
 */
export async function requirePermission(
  permission: Permission | Permission[],
  request?: NextRequest
): Promise<{ authorized: boolean; user: any; reason?: string }> {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return {
        authorized: false,
        user: null,
        reason: 'Not authenticated'
      };
    }

    const userRole = session.user.role;
    const permissions = Array.isArray(permission) ? permission : [permission];

    const authorized = hasAnyPermission(userRole, permissions);

    return {
      authorized,
      user: session.user,
      reason: authorized ? undefined : `Missing required permissions: ${permissions.join(', ')}`
    };
  } catch (error) {
    console.error('Permission check error:', error);
    return {
      authorized: false,
      user: null,
      reason: 'Permission check failed'
    };
  }
}

/**
 * Higher-order function to create protected API routes
 */
export function withAuth(
  handler: (req: NextRequest, context: any) => Promise<Response>,
  options: {
    permissions?: Permission | Permission[];
    allowUnverified?: boolean;
  } = {}
) {
  return async (req: NextRequest, context: any = {}) => {
    const { permissions, allowUnverified = false } = options;

    try {
      const session = await auth();

      if (!session || !session.user) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check email verification
      if (!allowUnverified && !session.user.isVerified) {
        return new Response(
          JSON.stringify({ error: 'Email verification required' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check permissions if specified
      if (permissions) {
        const permissionCheck = await requirePermission(permissions, req);
        if (!permissionCheck.authorized) {
          return new Response(
            JSON.stringify({
              error: 'Insufficient permissions',
              reason: permissionCheck.reason
            }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      // Add user to context
      context.user = session.user;
      context.session = session;

      return handler(req, context);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
}

/**
 * Client-side permission checker hook
 */
export function createPermissionChecker(userRole: UserRole) {
  return {
    can: (permission: Permission) => hasPermission(userRole, permission),
    canAny: (permissions: Permission[]) => hasAnyPermission(userRole, permissions),
    canAll: (permissions: Permission[]) => hasAllPermissions(userRole, permissions),
    is: (role: UserRole) => userRole === role,
    isAtLeast: (role: UserRole) => {
      const roleHierarchy = {
        ATTENDEE: 0,
        STAFF: 1,
        ORGANIZER: 2,
        ADMIN: 3,
        SUPER_ADMIN: 4
      };
      return roleHierarchy[userRole] >= roleHierarchy[role];
    }
  };
}

/**
 * Resource ownership checker
 */
export function canAccessResource(
  userRole: UserRole,
  userId: string,
  resourceOwnerId: string,
  permission: Permission
): boolean {
  // Super admin and admin can access anything
  if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
    return true;
  }

  // If user owns the resource and has the permission
  if (userId === resourceOwnerId && hasPermission(userRole, permission)) {
    return true;
  }

  // Check if user has 'any' version of the permission
  const anyPermission = permission.replace('_own', '_any') as Permission;
  return hasPermission(userRole, anyPermission);
}

/**
 * Route protection levels
 */
export const ROUTE_PROTECTION = {
  PUBLIC: [],
  AUTHENTICATED: ['profile.edit_own'],
  ORGANIZER: ['events.create'],
  ADMIN: ['users.view'],
  SUPER_ADMIN: ['platform.admin']
} as const;