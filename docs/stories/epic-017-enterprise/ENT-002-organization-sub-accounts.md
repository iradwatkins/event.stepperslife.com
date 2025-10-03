# ENT-002: Organization Accounts & Sub-Accounts

**Epic:** EPIC-017 Enterprise Features
**Story Points:** 5
**Priority:** E3 (Expansion)
**Status:** Not Started

---

## User Story

**As an** enterprise administrator
**I want** to create and manage sub-accounts within my organization
**So that** different departments can operate independently while maintaining centralized billing and oversight

---

## Acceptance Criteria

### 1. Organization Hierarchy
- [ ] Create parent organization with master account
- [ ] Support unlimited sub-account nesting
- [ ] Department-level organization structure
- [ ] Team-level organization structure
- [ ] Organization type classification (Corporate, Non-Profit, Government)
- [ ] Organization status tracking (Active, Suspended, Trial)
- [ ] Billing entity designation per organization
- [ ] Tax ID and legal entity information

### 2. Sub-Account Creation & Management
- [ ] Create sub-accounts from parent account
- [ ] Sub-account name, description, and metadata
- [ ] Automatic sub-account ID generation
- [ ] Sub-account activation workflow
- [ ] Sub-account suspension capability
- [ ] Sub-account deletion (soft delete with retention)
- [ ] Sub-account transfer between parents
- [ ] Bulk sub-account operations

### 3. Permission Inheritance
- [ ] Default permissions from parent organization
- [ ] Override permissions at sub-account level
- [ ] Permission propagation to child accounts
- [ ] Block permission inheritance option
- [ ] Role templates inherited from parent
- [ ] Custom role creation per sub-account
- [ ] Permission conflict resolution
- [ ] Audit trail for permission changes

### 4. Consolidated Billing
- [ ] Single billing entity for parent account
- [ ] Aggregate invoices across sub-accounts
- [ ] Cost allocation by sub-account
- [ ] Usage tracking per sub-account
- [ ] Chargeback reports for departments
- [ ] Budget limits per sub-account
- [ ] Billing alerts and notifications
- [ ] Payment method management at parent level

### 5. Consolidated Reporting
- [ ] Organization-wide dashboard
- [ ] Sub-account performance comparison
- [ ] Revenue rollup across sub-accounts
- [ ] Attendance and engagement metrics
- [ ] Cost center reporting
- [ ] Department-level analytics
- [ ] Export multi-account reports
- [ ] Scheduled report delivery

### 6. Department/Team Separation
- [ ] Logical separation of data between sub-accounts
- [ ] Shared resources opt-in (venues, templates, branding)
- [ ] Cross-account collaboration features
- [ ] Sub-account isolation for compliance
- [ ] Data access controls between sub-accounts
- [ ] Shared user directory option
- [ ] Single sign-on across sub-accounts
- [ ] Cross-account search and discovery

### 7. Testing & Quality
- [ ] Unit tests for organization hierarchy (>85% coverage)
- [ ] Integration tests for billing rollup
- [ ] Permission inheritance tests
- [ ] Performance tests with 500+ sub-accounts
- [ ] Security audit for account isolation
- [ ] Compliance validation (SOC2, GDPR)
- [ ] Documentation complete
- [ ] Migration scripts for existing organizations

---

## Technical Specifications

### Database Schema
```prisma
// prisma/schema.prisma

model Organization {
  id                String   @id @default(cuid())
  name              String
  slug              String   @unique
  description       String?
  type              String   // 'corporate', 'non_profit', 'government', 'education'

  // Hierarchy
  parentOrgId       String?
  parentOrg         Organization? @relation("OrgHierarchy", fields: [parentOrgId], references: [id])
  subAccounts       Organization[] @relation("OrgHierarchy")

  // Legal & Billing
  legalName         String?
  taxId             String?
  billingEntityId   String?  // For consolidated billing
  billingEntity     BillingEntity? @relation(fields: [billingEntityId], references: [id])

  // Status
  status            String   @default("active") // 'active', 'suspended', 'trial', 'cancelled'
  trialEndsAt       DateTime?

  // Permissions & Settings
  settings          Json?    // Organization-specific settings
  inheritSettings   Boolean  @default(true)
  inheritPermissions Boolean @default(true)

  // Branding
  logo              String?
  colors            Json?
  customDomain      String?  @unique

  // Metadata
  metadata          Json?
  active            Boolean  @default(true)

  // Relations
  users             OrganizationUser[]
  venues            Venue[]
  events            Event[]
  subscriptions     OrganizationSubscription[]
  usageMetrics      OrganizationUsage[]

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([parentOrgId, active])
  @@index([status, active])
  @@index([slug])
}

model OrganizationUser {
  id             String   @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  userId         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role           String   // 'admin', 'manager', 'member', 'viewer'
  permissions    Json?    // Granular permissions
  department     String?
  costCenter     String?
  active         Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([organizationId, userId])
  @@index([userId, active])
  @@index([organizationId, role])
}

model BillingEntity {
  id                String   @id @default(cuid())
  name              String
  legalName         String
  taxId             String?
  billingEmail      String
  billingAddress    Json
  paymentMethodId   String?
  stripeCustomerId  String?  @unique

  // Billing settings
  billingCycle      String   @default("monthly") // 'monthly', 'quarterly', 'annual'
  currency          String   @default("usd")
  autoPayEnabled    Boolean  @default(true)

  // Organizations
  organizations     Organization[]
  invoices          Invoice[]
  payments          Payment[]

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([stripeCustomerId])
}

model OrganizationUsage {
  id                String   @id @default(cuid())
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Usage metrics
  date              DateTime
  totalEvents       Int      @default(0)
  totalTickets      Int      @default(0)
  totalRevenue      Float    @default(0)
  apiCalls          Int      @default(0)
  storageUsed       Float    @default(0) // MB
  bandwidthUsed     Float    @default(0) // MB

  // Cost allocation
  computedCost      Float    @default(0)
  allocatedBudget   Float?

  metadata          Json?
  createdAt         DateTime @default(now())

  @@unique([organizationId, date])
  @@index([organizationId, date])
  @@index([date])
}

model Invoice {
  id                String   @id @default(cuid())
  invoiceNumber     String   @unique
  billingEntityId   String
  billingEntity     BillingEntity @relation(fields: [billingEntityId], references: [id])

  // Invoice details
  periodStart       DateTime
  periodEnd         DateTime
  dueDate           DateTime

  // Amounts
  subtotal          Float
  tax               Float    @default(0)
  total             Float
  amountPaid        Float    @default(0)
  amountDue         Float

  // Status
  status            String   // 'draft', 'pending', 'paid', 'overdue', 'void'
  paidAt            DateTime?

  // Line items
  lineItems         Json     // Array of {orgId, description, quantity, unitPrice, total}

  // Integration
  stripeInvoiceId   String?  @unique

  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([billingEntityId, status])
  @@index([status, dueDate])
}

model OrganizationSubscription {
  id                String   @id @default(cuid())
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  plan              String   // 'starter', 'professional', 'enterprise'
  billingInterval   String   // 'monthly', 'annual'
  price             Float

  // Limits
  maxEvents         Int?
  maxSubAccounts    Int?
  maxUsers          Int?
  maxApiCalls       Int?
  storageLimit      Float?   // GB

  // Status
  status            String   @default("active") // 'active', 'cancelled', 'past_due'
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  cancelAt          DateTime?

  stripeSubscriptionId String? @unique

  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([organizationId, status])
}
```

### Organization Service
```typescript
// lib/services/organization.service.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class OrganizationService {
  // Get organization hierarchy
  async getOrganizationHierarchy(orgId: string): Promise<Organization> {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        subAccounts: {
          include: {
            subAccounts: true, // Nested sub-accounts
            users: true,
            _count: {
              select: { events: true, users: true, venues: true },
            },
          },
        },
        users: true,
        billingEntity: true,
      },
    });

    if (!org) {
      throw new Error('Organization not found');
    }

    return org;
  }

  // Create sub-account
  async createSubAccount(
    parentOrgId: string,
    data: CreateSubAccountInput
  ): Promise<Organization> {
    const parentOrg = await prisma.organization.findUnique({
      where: { id: parentOrgId },
      include: { billingEntity: true },
    });

    if (!parentOrg) {
      throw new Error('Parent organization not found');
    }

    // Create sub-account
    const subAccount = await prisma.organization.create({
      data: {
        name: data.name,
        slug: this.generateSlug(data.name),
        description: data.description,
        type: parentOrg.type,
        parentOrgId,
        billingEntityId: parentOrg.billingEntityId, // Inherit billing
        inheritSettings: data.inheritSettings ?? true,
        inheritPermissions: data.inheritPermissions ?? true,
        settings: data.inheritSettings ? parentOrg.settings : data.settings,
        metadata: data.metadata,
      },
      include: {
        parentOrg: true,
        billingEntity: true,
      },
    });

    // Create default admin user for sub-account
    if (data.adminUserId) {
      await prisma.organizationUser.create({
        data: {
          organizationId: subAccount.id,
          userId: data.adminUserId,
          role: 'admin',
          department: data.department,
        },
      });
    }

    return subAccount;
  }

  // Get consolidated billing report
  async getConsolidatedBillingReport(
    billingEntityId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ConsolidatedBillingReport> {
    const organizations = await prisma.organization.findMany({
      where: { billingEntityId },
      include: {
        usageMetrics: {
          where: {
            date: { gte: startDate, lte: endDate },
          },
        },
      },
    });

    const report = {
      billingEntityId,
      periodStart: startDate,
      periodEnd: endDate,
      organizations: organizations.map((org) => {
        const totalRevenue = org.usageMetrics.reduce(
          (sum, m) => sum + m.totalRevenue,
          0
        );
        const totalEvents = org.usageMetrics.reduce(
          (sum, m) => sum + m.totalEvents,
          0
        );
        const totalCost = org.usageMetrics.reduce(
          (sum, m) => sum + m.computedCost,
          0
        );

        return {
          organizationId: org.id,
          organizationName: org.name,
          totalRevenue,
          totalEvents,
          totalCost,
          usageMetrics: org.usageMetrics,
        };
      }),
      grandTotalRevenue: 0,
      grandTotalCost: 0,
    };

    report.grandTotalRevenue = report.organizations.reduce(
      (sum, o) => sum + o.totalRevenue,
      0
    );
    report.grandTotalCost = report.organizations.reduce(
      (sum, o) => sum + o.totalCost,
      0
    );

    return report;
  }

  // Check organization permissions with inheritance
  async checkOrganizationPermission(
    userId: string,
    orgId: string,
    permission: string
  ): Promise<boolean> {
    const orgUser = await prisma.organizationUser.findUnique({
      where: {
        organizationId_userId: { organizationId: orgId, userId },
      },
      include: {
        organization: {
          include: { parentOrg: true },
        },
      },
    });

    if (!orgUser || !orgUser.active) {
      // Check parent organization if permission inheritance is enabled
      if (orgUser?.organization?.inheritPermissions && orgUser.organization.parentOrgId) {
        return this.checkOrganizationPermission(
          userId,
          orgUser.organization.parentOrgId,
          permission
        );
      }
      return false;
    }

    // Check role-based permissions
    const rolePermissions: Record<string, string[]> = {
      admin: ['*'],
      manager: ['create_events', 'manage_users', 'view_reports'],
      member: ['create_events', 'view_reports'],
      viewer: ['view_reports'],
    };

    const userPermissions = rolePermissions[orgUser.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  }

  // Track organization usage
  async trackOrganizationUsage(
    orgId: string,
    date: Date,
    metrics: UsageMetrics
  ): Promise<void> {
    await prisma.organizationUsage.upsert({
      where: {
        organizationId_date: { organizationId: orgId, date },
      },
      update: {
        totalEvents: { increment: metrics.events || 0 },
        totalTickets: { increment: metrics.tickets || 0 },
        totalRevenue: { increment: metrics.revenue || 0 },
        apiCalls: { increment: metrics.apiCalls || 0 },
        storageUsed: metrics.storageUsed || 0,
        bandwidthUsed: { increment: metrics.bandwidth || 0 },
      },
      create: {
        organizationId: orgId,
        date,
        ...metrics,
      },
    });
  }

  // Generate consolidated invoice
  async generateConsolidatedInvoice(
    billingEntityId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<Invoice> {
    const report = await this.getConsolidatedBillingReport(
      billingEntityId,
      periodStart,
      periodEnd
    );

    const lineItems = report.organizations.map((org) => ({
      organizationId: org.organizationId,
      organizationName: org.organizationName,
      description: `Services for ${org.organizationName}`,
      quantity: 1,
      unitPrice: org.totalCost,
      total: org.totalCost,
    }));

    const subtotal = report.grandTotalCost;
    const tax = subtotal * 0.08; // 8% tax example
    const total = subtotal + tax;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: this.generateInvoiceNumber(),
        billingEntityId,
        periodStart,
        periodEnd,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        subtotal,
        tax,
        total,
        amountDue: total,
        status: 'pending',
        lineItems,
      },
    });

    return invoice;
  }

  // Helper methods
  private generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  private generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000);
    return `INV-${year}${month}-${random}`;
  }
}

interface CreateSubAccountInput {
  name: string;
  description?: string;
  adminUserId?: string;
  department?: string;
  inheritSettings?: boolean;
  inheritPermissions?: boolean;
  settings?: any;
  metadata?: any;
}

interface UsageMetrics {
  events?: number;
  tickets?: number;
  revenue?: number;
  apiCalls?: number;
  storageUsed?: number;
  bandwidth?: number;
}
```

### API Routes
```typescript
// app/api/organizations/[orgId]/sub-accounts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { OrganizationService } from '@/lib/services/organization.service';

const orgService = new OrganizationService();

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hierarchy = await orgService.getOrganizationHierarchy(params.orgId);
  return NextResponse.json({ organization: hierarchy });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();
  const subAccount = await orgService.createSubAccount(params.orgId, data);

  return NextResponse.json({ subAccount }, { status: 201 });
}
```

---

## Testing Requirements

### Unit Tests
```typescript
describe('OrganizationService', () => {
  it('should create sub-account with parent relationship', async () => {
    const subAccount = await orgService.createSubAccount(parentOrgId, {
      name: 'Marketing Department',
    });
    expect(subAccount.parentOrgId).toBe(parentOrgId);
  });

  it('should inherit settings from parent organization', async () => {
    const subAccount = await orgService.createSubAccount(parentOrgId, {
      name: 'Sales Department',
      inheritSettings: true,
    });
    expect(subAccount.settings).toEqual(parentOrg.settings);
  });

  it('should generate consolidated billing report', async () => {
    const report = await orgService.getConsolidatedBillingReport(
      billingEntityId,
      startDate,
      endDate
    );
    expect(report.organizations.length).toBeGreaterThan(0);
  });

  it('should check permissions with inheritance', async () => {
    const hasPermission = await orgService.checkOrganizationPermission(
      userId,
      subAccountId,
      'create_events'
    );
    expect(hasPermission).toBe(true);
  });
});
```

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Database schema deployed
- [ ] Sub-account creation functional
- [ ] Permission inheritance working
- [ ] Consolidated billing operational
- [ ] Multi-account reporting functional
- [ ] Unit tests passing (>85% coverage)
- [ ] Integration tests passing
- [ ] API documentation complete
- [ ] User documentation complete

---

## Dependencies

- US-001: User authentication (prerequisite)
- US-005: RBAC system (prerequisite)
- BILL-001: Billing system (prerequisite)

---

## Estimated Timeline

**Total Duration:** 3-4 weeks
**Story Points:** 5