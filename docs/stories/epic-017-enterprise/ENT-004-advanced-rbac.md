# ENT-004: Advanced Role-Based Access Control (RBAC)

**Epic:** EPIC-017 Enterprise Features
**Story Points:** 5
**Priority:** E3 (Expansion)
**Status:** Not Started

---

## User Story

**As an** enterprise administrator
**I want** granular role-based access control with custom roles and permissions
**So that** I can enforce security policies and comply with regulatory requirements

---

## Acceptance Criteria

### 1. Custom Role Creation
- [ ] Create custom roles with unique names
- [ ] Define granular permissions per role
- [ ] Resource-level permission configuration
- [ ] Action-level permission specification (CRUD)
- [ ] Permission wildcards support (e.g., events.*)
- [ ] Role description and metadata
- [ ] Role status (active, inactive, archived)
- [ ] Role versioning for audit compliance

### 2. Role Templates
- [ ] Predefined Admin role template
- [ ] Predefined Manager role template
- [ ] Predefined Staff role template
- [ ] Predefined Viewer role template
- [ ] Custom template creation from existing roles
- [ ] Template library for common scenarios
- [ ] Clone roles from templates
- [ ] Export/import role templates

### 3. Department/Venue-Scoped Roles
- [ ] Assign roles at organization level
- [ ] Assign roles at department level
- [ ] Assign roles at venue level
- [ ] Assign roles at event level
- [ ] Scope inheritance (parent to child)
- [ ] Scope override capability
- [ ] Cross-scope permission handling
- [ ] Scope-based data filtering

### 4. Permission Inheritance & Cascading
- [ ] Parent-to-child permission inheritance
- [ ] Permission override at child level
- [ ] Cascading updates when parent permissions change
- [ ] Conflict resolution for conflicting permissions
- [ ] Explicit deny vs implicit allow
- [ ] Permission precedence rules
- [ ] Inheritance blocking option
- [ ] Audit trail for inheritance changes

### 5. Audit Logs for Permission Changes
- [ ] Log all permission modifications
- [ ] Log role assignments/revocations
- [ ] Log permission inheritance changes
- [ ] User who made the change tracking
- [ ] Timestamp and IP address logging
- [ ] Before/after state comparison
- [ ] Audit log retention policy (7 years for compliance)
- [ ] Audit log export (CSV, JSON)

### 6. Compliance Reporting
- [ ] SOC2 compliance report generation
- [ ] GDPR data access report
- [ ] HIPAA audit log report (if applicable)
- [ ] Access control matrix report
- [ ] Least privilege verification report
- [ ] Inactive user report
- [ ] Permission anomaly detection
- [ ] Scheduled compliance reports

### 7. Testing & Quality
- [ ] Unit tests for permission evaluation (>85% coverage)
- [ ] Integration tests for role inheritance
- [ ] Performance tests with 1000+ roles
- [ ] Security audit for privilege escalation
- [ ] Compliance validation (SOC2, GDPR)
- [ ] Documentation complete
- [ ] Migration script for existing roles
- [ ] Rollback plan documented

---

## Technical Specifications

### Database Schema
```prisma
// prisma/schema.prisma

model Role {
  id                String   @id @default(cuid())
  name              String
  slug              String
  description       String?
  type              String   // 'system', 'custom', 'template'
  organizationId    String?
  organization      Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Permissions
  permissions       Permission[]

  // Scope
  scope             String   @default("organization") // 'organization', 'department', 'venue', 'event'
  scopeId           String?  // ID of department/venue/event

  // Status
  active            Boolean  @default(true)
  version           Int      @default(1)

  // Relations
  userRoles         UserRole[]
  roleAuditLogs     RoleAuditLog[]

  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([organizationId, slug])
  @@index([organizationId, active])
  @@index([type, active])
}

model Permission {
  id                String   @id @default(cuid())
  roleId            String
  role              Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)

  // Resource and action
  resource          String   // 'events', 'users', 'venues', 'analytics', 'billing'
  action            String   // 'create', 'read', 'update', 'delete', 'export', 'manage'
  scope             String?  // Additional scope constraint
  effect            String   @default("allow") // 'allow', 'deny'

  // Conditions
  conditions        Json?    // {department: "marketing", venue: "venue-123"}

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([roleId, resource, action, scope])
  @@index([roleId])
}

model UserRole {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  roleId            String
  role              Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)

  // Scope where this role applies
  scope             String   @default("organization") // 'organization', 'department', 'venue', 'event'
  scopeId           String?  // ID of scope entity

  // Assignment details
  assignedBy        String?
  assignedByUser    User?    @relation("RoleAssigner", fields: [assignedBy], references: [id])
  assignedAt        DateTime @default(now())
  expiresAt         DateTime?

  // Status
  active            Boolean  @default(true)

  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([userId, roleId, scope, scopeId])
  @@index([userId, active])
  @@index([roleId, active])
}

model RoleAuditLog {
  id                String   @id @default(cuid())
  roleId            String?
  role              Role?    @relation(fields: [roleId], references: [id])
  userId            String?
  user              User?    @relation(fields: [userId], references: [id])
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id])

  // Event details
  action            String   // 'role_created', 'role_updated', 'role_deleted', 'permission_added', 'permission_removed', 'role_assigned', 'role_revoked'
  actorUserId       String   // User who performed the action
  actorUser         User     @relation("RoleAuditActor", fields: [actorUserId], references: [id])

  // Change tracking
  beforeState       Json?
  afterState        Json?
  changedFields     Json?

  // Metadata
  ipAddress         String?
  userAgent         String?
  metadata          Json?

  createdAt         DateTime @default(now())

  @@index([organizationId, action, createdAt])
  @@index([userId, createdAt])
  @@index([roleId, createdAt])
}

model ComplianceReport {
  id                String   @id @default(cuid())
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id])

  // Report details
  reportType        String   // 'soc2', 'gdpr', 'hipaa', 'access_control'
  periodStart       DateTime
  periodEnd         DateTime
  generatedBy       String
  generatedByUser   User     @relation(fields: [generatedBy], references: [id])

  // Report data
  reportData        Json
  summary           Json?
  findings          Json?    // Issues or anomalies found

  // Status
  status            String   @default("completed") // 'pending', 'completed', 'failed'

  // Storage
  fileUrl           String?

  metadata          Json?
  createdAt         DateTime @default(now())

  @@index([organizationId, reportType, createdAt])
}

// Update User model
model User {
  // ... existing fields
  userRoles         UserRole[]
  assignedRoles     UserRole[] @relation("RoleAssigner")
  roleAuditLogs     RoleAuditLog[]
  auditLogsActor    RoleAuditLog[] @relation("RoleAuditActor")
  complianceReports ComplianceReport[]
  // ... rest of fields
}
```

### RBAC Service
```typescript
// lib/services/rbac.service.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class RBACService {
  // Create custom role
  async createRole(data: CreateRoleInput): Promise<Role> {
    const role = await prisma.role.create({
      data: {
        name: data.name,
        slug: this.generateSlug(data.name),
        description: data.description,
        type: 'custom',
        organizationId: data.organizationId,
        scope: data.scope || 'organization',
        scopeId: data.scopeId,
        permissions: {
          create: data.permissions.map((p) => ({
            resource: p.resource,
            action: p.action,
            scope: p.scope,
            effect: p.effect || 'allow',
            conditions: p.conditions,
          })),
        },
      },
      include: { permissions: true },
    });

    await this.logRoleChange(
      data.organizationId,
      role.id,
      'role_created',
      data.createdBy,
      null,
      role
    );

    return role;
  }

  // Check if user has permission
  async checkPermission(
    userId: string,
    resource: string,
    action: string,
    context?: PermissionContext
  ): Promise<boolean> {
    // Get all active roles for user
    const userRoles = await prisma.userRole.findMany({
      where: {
        userId,
        active: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } },
        ],
      },
      include: {
        role: {
          include: { permissions: true },
        },
      },
    });

    if (userRoles.length === 0) {
      return false;
    }

    // Evaluate permissions with inheritance and precedence
    let hasPermission = false;
    let hasDeny = false;

    for (const userRole of userRoles) {
      // Check scope match
      if (context?.scope && userRole.scope !== context.scope) {
        continue;
      }

      if (context?.scopeId && userRole.scopeId !== context.scopeId) {
        continue;
      }

      // Check permissions
      for (const permission of userRole.role.permissions) {
        // Match resource and action (support wildcards)
        if (
          this.matchResource(permission.resource, resource) &&
          this.matchAction(permission.action, action)
        ) {
          // Check conditions
          if (permission.conditions && context) {
            if (!this.evaluateConditions(permission.conditions, context)) {
              continue;
            }
          }

          // Explicit deny takes precedence
          if (permission.effect === 'deny') {
            hasDeny = true;
            break;
          }

          hasPermission = true;
        }
      }

      if (hasDeny) break;
    }

    return hasPermission && !hasDeny;
  }

  // Assign role to user
  async assignRole(
    userId: string,
    roleId: string,
    scope: string,
    scopeId: string | null,
    assignedBy: string,
    expiresAt?: Date
  ): Promise<UserRole> {
    const userRole = await prisma.userRole.create({
      data: {
        userId,
        roleId,
        scope,
        scopeId,
        assignedBy,
        expiresAt,
      },
      include: {
        role: { include: { permissions: true } },
        user: true,
      },
    });

    await this.logRoleChange(
      userRole.role.organizationId!,
      roleId,
      'role_assigned',
      assignedBy,
      null,
      { userId, roleId, scope, scopeId }
    );

    return userRole;
  }

  // Revoke role from user
  async revokeRole(
    userId: string,
    roleId: string,
    scope: string,
    scopeId: string | null,
    revokedBy: string
  ): Promise<void> {
    const userRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId_scope_scopeId: { userId, roleId, scope, scopeId },
      },
      include: { role: true },
    });

    if (!userRole) {
      throw new Error('User role not found');
    }

    await prisma.userRole.update({
      where: { id: userRole.id },
      data: { active: false },
    });

    await this.logRoleChange(
      userRole.role.organizationId!,
      roleId,
      'role_revoked',
      revokedBy,
      { userId, roleId, scope, scopeId },
      null
    );
  }

  // Update role permissions
  async updateRolePermissions(
    roleId: string,
    permissions: PermissionInput[],
    updatedBy: string
  ): Promise<Role> {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: true },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    const beforeState = role.permissions;

    // Delete existing permissions
    await prisma.permission.deleteMany({ where: { roleId } });

    // Create new permissions
    await prisma.permission.createMany({
      data: permissions.map((p) => ({
        roleId,
        resource: p.resource,
        action: p.action,
        scope: p.scope,
        effect: p.effect || 'allow',
        conditions: p.conditions,
      })),
    });

    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: { version: { increment: 1 } },
      include: { permissions: true },
    });

    await this.logRoleChange(
      role.organizationId!,
      roleId,
      'role_updated',
      updatedBy,
      beforeState,
      updatedRole.permissions
    );

    return updatedRole;
  }

  // Generate compliance report
  async generateComplianceReport(
    organizationId: string,
    reportType: string,
    periodStart: Date,
    periodEnd: Date,
    generatedBy: string
  ): Promise<ComplianceReport> {
    const auditLogs = await prisma.roleAuditLog.findMany({
      where: {
        organizationId,
        createdAt: { gte: periodStart, lte: periodEnd },
      },
      include: {
        user: true,
        actorUser: true,
        role: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const userRoles = await prisma.userRole.findMany({
      where: {
        role: { organizationId },
        active: true,
      },
      include: {
        user: true,
        role: { include: { permissions: true } },
      },
    });

    const reportData = {
      totalAuditLogs: auditLogs.length,
      roleChanges: auditLogs.filter((l) => l.action.includes('role_')).length,
      permissionChanges: auditLogs.filter((l) => l.action.includes('permission_')).length,
      activeUsers: new Set(userRoles.map((ur) => ur.userId)).size,
      activeRoles: new Set(userRoles.map((ur) => ur.roleId)).size,
      auditLogs,
      userRoles,
    };

    const report = await prisma.complianceReport.create({
      data: {
        organizationId,
        reportType,
        periodStart,
        periodEnd,
        generatedBy,
        reportData,
        summary: this.generateReportSummary(reportData, reportType),
        status: 'completed',
      },
    });

    return report;
  }

  // Helper: Log role changes
  private async logRoleChange(
    organizationId: string,
    roleId: string | null,
    action: string,
    actorUserId: string,
    beforeState: any,
    afterState: any
  ): Promise<void> {
    await prisma.roleAuditLog.create({
      data: {
        organizationId,
        roleId,
        action,
        actorUserId,
        beforeState,
        afterState,
      },
    });
  }

  // Helper: Match resource with wildcards
  private matchResource(pattern: string, resource: string): boolean {
    if (pattern === '*') return true;
    if (pattern.endsWith('.*')) {
      const prefix = pattern.slice(0, -2);
      return resource.startsWith(prefix);
    }
    return pattern === resource;
  }

  // Helper: Match action with wildcards
  private matchAction(pattern: string, action: string): boolean {
    if (pattern === '*') return true;
    return pattern === action;
  }

  // Helper: Evaluate conditions
  private evaluateConditions(conditions: any, context: PermissionContext): boolean {
    for (const [key, value] of Object.entries(conditions)) {
      if (context[key] !== value) {
        return false;
      }
    }
    return true;
  }

  // Helper: Generate slug
  private generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  // Helper: Generate report summary
  private generateReportSummary(reportData: any, reportType: string): any {
    return {
      reportType,
      totalUsers: reportData.activeUsers,
      totalRoles: reportData.activeRoles,
      totalAuditEvents: reportData.totalAuditLogs,
      complianceStatus: 'compliant',
    };
  }
}

interface CreateRoleInput {
  name: string;
  description?: string;
  organizationId: string;
  scope?: string;
  scopeId?: string;
  permissions: PermissionInput[];
  createdBy: string;
}

interface PermissionInput {
  resource: string;
  action: string;
  scope?: string;
  effect?: string;
  conditions?: any;
}

interface PermissionContext {
  scope?: string;
  scopeId?: string;
  [key: string]: any;
}
```

### API Routes
```typescript
// app/api/rbac/roles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { RBACService } from '@/lib/services/rbac.service';

const rbacService = new RBACService();

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();
  const role = await rbacService.createRole({
    ...data,
    createdBy: session.user.id,
  });

  return NextResponse.json({ role }, { status: 201 });
}

// app/api/rbac/check-permission/route.ts
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { resource, action, context } = await req.json();
  const hasPermission = await rbacService.checkPermission(
    session.user.id,
    resource,
    action,
    context
  );

  return NextResponse.json({ hasPermission });
}
```

---

## Testing Requirements

### Unit Tests
```typescript
describe('RBACService', () => {
  it('should create custom role with permissions', async () => {
    const role = await rbacService.createRole({
      name: 'Event Manager',
      permissions: [{ resource: 'events', action: 'create' }],
      ...
    });
    expect(role.permissions).toHaveLength(1);
  });

  it('should check permissions correctly with wildcards', async () => {
    const hasPermission = await rbacService.checkPermission(
      userId,
      'events.manage',
      'update'
    );
    expect(hasPermission).toBe(true);
  });

  it('should deny access with explicit deny permission', async () => {
    const hasPermission = await rbacService.checkPermission(userId, 'billing', 'delete');
    expect(hasPermission).toBe(false);
  });

  it('should generate compliance report', async () => {
    const report = await rbacService.generateComplianceReport(
      orgId, 'soc2', startDate, endDate, userId
    );
    expect(report.status).toBe('completed');
  });
});
```

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Custom role creation functional
- [ ] Permission evaluation working correctly
- [ ] Scope-based access control operational
- [ ] Audit logging complete
- [ ] Compliance reporting functional
- [ ] Unit tests passing (>85% coverage)
- [ ] Security audit completed
- [ ] API documentation complete
- [ ] User documentation complete

---

## Dependencies

- US-005: Basic RBAC (prerequisite)
- ENT-002: Organization management (prerequisite)
- ENT-001: Venue management (prerequisite)

---

## Estimated Timeline

**Total Duration:** 4-5 weeks
**Story Points:** 5