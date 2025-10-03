# WL-006: Multi-Tenant Architecture & Data Isolation

**Epic:** EPIC-011: White-Label Features
**Story Points:** 8
**Priority:** Critical
**Status:** Not Started

---

## User Story

**As a** platform architect
**I want to** implement robust multi-tenant architecture with complete data isolation
**So that** each white-label tenant's data is secure, isolated, and performant

### Acceptance Criteria

1. **Tenant Identification & Context**
   - [ ] Identify tenant from custom domain
   - [ ] Identify tenant from subdomain
   - [ ] Identify tenant from authenticated user session
   - [ ] Establish tenant context in middleware
   - [ ] Pass tenant context through application layers
   - [ ] Log tenant context for all operations

2. **Database-Level Isolation**
   - [ ] All tables have tenantId foreign key
   - [ ] Row-level security (RLS) policies enforced
   - [ ] Tenant scoping in all queries (never query without tenant filter)
   - [ ] Database indexes optimized for tenant queries
   - [ ] Prevent cross-tenant data access at DB level
   - [ ] Audit log for all tenant data access

3. **API-Level Isolation**
   - [ ] All API routes validate tenant context
   - [ ] API responses filtered by tenant
   - [ ] Rate limiting per tenant
   - [ ] API keys scoped to tenant
   - [ ] Webhook endpoints include tenant verification
   - [ ] GraphQL (if applicable) tenant scoping

4. **Authentication & Authorization**
   - [ ] Users belong to single tenant
   - [ ] Authentication scoped to tenant
   - [ ] JWT tokens include tenant ID
   - [ ] Session management per tenant
   - [ ] Role-based access control within tenant
   - [ ] Prevent user enumeration across tenants

5. **File Storage Isolation**
   - [ ] Tenant-specific storage buckets/folders
   - [ ] File access validated by tenant
   - [ ] CDN URLs include tenant verification
   - [ ] Prevent cross-tenant file access
   - [ ] Storage quotas per tenant

6. **Cache Isolation**
   - [ ] Redis/cache keys include tenant ID
   - [ ] Cache invalidation scoped to tenant
   - [ ] Prevent cache poisoning across tenants
   - [ ] Session storage isolated by tenant

7. **Background Jobs & Queues**
   - [ ] Jobs include tenant context
   - [ ] Queue processing validates tenant
   - [ ] Cron jobs iterate tenants safely
   - [ ] Job errors isolated to tenant

8. **Performance & Scalability**
   - [ ] Database connection pooling
   - [ ] Query performance monitoring per tenant
   - [ ] Prevent noisy neighbor issues
   - [ ] Resource limits per tenant
   - [ ] Horizontal scaling support

9. **Tenant Provisioning**
   - [ ] Automated tenant creation
   - [ ] Default data seeding per tenant
   - [ ] Tenant activation workflow
   - [ ] Tenant deactivation/deletion
   - [ ] Data export on tenant deletion

10. **Monitoring & Alerting**
    - [ ] Tenant-level metrics dashboard
    - [ ] Cross-tenant access attempt alerts
    - [ ] Performance anomaly detection per tenant
    - [ ] Resource usage tracking per tenant

---

## Technical Requirements

### Tenant Context Middleware

```typescript
// middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import { getTenantByDomain } from '@/lib/services/tenant.service';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const domain = hostname.split(':')[0];

  // Determine tenant from domain
  let tenant = await getTenantByDomain(domain);

  // Fallback: Check subdomain
  if (!tenant && domain.endsWith(process.env.PLATFORM_DOMAIN!)) {
    const subdomain = domain.replace(`.${process.env.PLATFORM_DOMAIN}`, '');
    tenant = await getTenantBySubdomain(subdomain);
  }

  if (!tenant) {
    return new NextResponse('Tenant not found', { status: 404 });
  }

  // Check tenant status
  if (tenant.status === 'SUSPENDED') {
    return NextResponse.redirect(new URL('/suspended', request.url));
  }

  if (tenant.status === 'INACTIVE') {
    return NextResponse.redirect(new URL('/inactive', request.url));
  }

  // Add tenant to request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-id', tenant.id);
  requestHeaders.set('x-tenant-slug', tenant.slug);
  requestHeaders.set('x-tenant-domain', domain);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Add tenant to response headers (for debugging)
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('x-tenant-id', tenant.id);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api/public|_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};
```

### Tenant Context Hook

```typescript
// lib/context/tenant-context.tsx

'use client';

import { createContext, useContext } from 'react';

interface TenantContextValue {
  id: string;
  slug: string;
  name: string;
  domain?: string;
  status: string;
  settings: any;
  subscription?: any;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({
  children,
  tenant,
}: {
  children: React.ReactNode;
  tenant: TenantContextValue;
}) {
  return (
    <TenantContext.Provider value={tenant}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}

// Server-side tenant retrieval
import { headers } from 'next/headers';

export function getTenantId(): string {
  const headersList = headers();
  const tenantId = headersList.get('x-tenant-id');

  if (!tenantId) {
    throw new Error('Tenant context not found');
  }

  return tenantId;
}
```

### Database Query Helper with Tenant Scoping

```typescript
// lib/database/tenant-prisma.ts

import { PrismaClient } from '@prisma/client';
import { getTenantId } from '@/lib/context/tenant-context';

class TenantPrismaClient {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // Automatically scope all queries to current tenant
  private getTenantContext() {
    try {
      return getTenantId();
    } catch (error) {
      throw new Error('Cannot execute query without tenant context');
    }
  }

  // Scoped query methods
  async findMany<T>(
    model: string,
    args?: any
  ): Promise<T[]> {
    const tenantId = this.getTenantContext();

    return (this.prisma as any)[model].findMany({
      ...args,
      where: {
        ...args?.where,
        tenantId,
      },
    });
  }

  async findUnique<T>(
    model: string,
    args: any
  ): Promise<T | null> {
    const tenantId = this.getTenantContext();

    const result = await (this.prisma as any)[model].findUnique(args);

    // Verify tenant ownership
    if (result && result.tenantId !== tenantId) {
      throw new Error('Cross-tenant access denied');
    }

    return result;
  }

  async create<T>(
    model: string,
    args: any
  ): Promise<T> {
    const tenantId = this.getTenantContext();

    return (this.prisma as any)[model].create({
      ...args,
      data: {
        ...args.data,
        tenantId,
      },
    });
  }

  async update<T>(
    model: string,
    args: any
  ): Promise<T> {
    const tenantId = this.getTenantContext();

    // First verify ownership
    const existing = await (this.prisma as any)[model].findUnique({
      where: args.where,
    });

    if (!existing) {
      throw new Error('Record not found');
    }

    if (existing.tenantId !== tenantId) {
      throw new Error('Cross-tenant modification denied');
    }

    return (this.prisma as any)[model].update(args);
  }

  async delete<T>(
    model: string,
    args: any
  ): Promise<T> {
    const tenantId = this.getTenantContext();

    // First verify ownership
    const existing = await (this.prisma as any)[model].findUnique({
      where: args.where,
    });

    if (!existing) {
      throw new Error('Record not found');
    }

    if (existing.tenantId !== tenantId) {
      throw new Error('Cross-tenant deletion denied');
    }

    return (this.prisma as any)[model].delete(args);
  }

  // Raw Prisma client for non-tenant queries (use with caution)
  get raw() {
    console.warn('Using raw Prisma client - ensure manual tenant filtering');
    return this.prisma;
  }
}

export const db = new TenantPrismaClient();
```

### Prisma Middleware for Tenant Enforcement

```typescript
// lib/database/prisma-middleware.ts

import { Prisma } from '@prisma/client';

export function tenantMiddleware(tenantId: string): Prisma.Middleware {
  return async (params, next) => {
    // Models that should be scoped to tenant
    const tenantScopedModels = [
      'Event',
      'Order',
      'Ticket',
      'User',
      'CustomDomain',
      'Theme',
      'BrandAsset',
      // ... all tenant-scoped models
    ];

    if (tenantScopedModels.includes(params.model || '')) {
      // Read operations: Add tenant filter
      if (params.action === 'findUnique' || params.action === 'findFirst') {
        params.args.where = {
          ...params.args.where,
          tenantId,
        };
      }

      if (params.action === 'findMany') {
        if (!params.args) params.args = {};
        if (!params.args.where) params.args.where = {};
        params.args.where.tenantId = tenantId;
      }

      // Write operations: Add tenantId
      if (params.action === 'create') {
        if (!params.args) params.args = {};
        if (!params.args.data) params.args.data = {};
        params.args.data.tenantId = tenantId;
      }

      if (params.action === 'createMany') {
        if (Array.isArray(params.args.data)) {
          params.args.data = params.args.data.map((item: any) => ({
            ...item,
            tenantId,
          }));
        }
      }

      // Update/Delete: Verify tenant ownership first
      if (params.action === 'update' || params.action === 'delete') {
        const record = await prisma[params.model].findUnique({
          where: params.args.where,
          select: { tenantId: true },
        });

        if (!record || record.tenantId !== tenantId) {
          throw new Error('Cross-tenant access denied');
        }
      }
    }

    return next(params);
  };
}

// Usage
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Add middleware with tenant context
export function getPrismaWithTenant(tenantId: string) {
  const client = new PrismaClient();
  client.$use(tenantMiddleware(tenantId));
  return client;
}
```

### Database Schema with Tenant Support

```prisma
// prisma/schema.prisma

model Tenant {
  id              String   @id @default(cuid())
  slug            String   @unique
  name            String
  status          TenantStatus @default(ACTIVE)

  // Domain configuration
  customDomains   CustomDomain[]
  subdomain       String   @unique

  // Billing
  subscription    Subscription?

  // Configuration
  settings        Json?
  theme           Theme?

  // Resources (all scoped to tenant)
  users           User[]
  events          Event[]
  orders          Order[]
  tickets         Ticket[]
  brandAssets     BrandAsset[]
  emailTemplates  EmailTemplate[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([slug])
  @@index([status])
}

enum TenantStatus {
  ACTIVE
  SUSPENDED
  INACTIVE
  DELETED
}

// Example tenant-scoped model
model Event {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  title       String
  description String?
  // ... other fields

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenantId])
  @@index([tenantId, createdAt])
}

// All other models follow same pattern with tenantId
```

### Tenant Service

```typescript
// lib/services/tenant.service.ts

interface CreateTenantParams {
  name: string;
  slug: string;
  email: string;
  plan?: SubscriptionPlan;
}

class TenantService {
  async createTenant(params: CreateTenantParams): Promise<Tenant> {
    const { name, slug, email, plan = 'BASIC' } = params;

    // Validate slug availability
    const existing = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new Error('Tenant slug already exists');
    }

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        subdomain: slug,
        status: 'ACTIVE',
        settings: this.getDefaultSettings(),
      },
    });

    // Seed default data
    await this.seedTenantData(tenant.id);

    // Create subscription
    await subscriptionService.createSubscription({
      tenantId: tenant.id,
      plan,
      email,
      trialDays: 14,
    });

    return tenant;
  }

  async getTenantByDomain(domain: string): Promise<Tenant | null> {
    // Check custom domains
    const customDomain = await prisma.customDomain.findUnique({
      where: { domain, isActive: true },
      include: { tenant: true },
    });

    if (customDomain) {
      return customDomain.tenant;
    }

    return null;
  }

  async getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
    return await prisma.tenant.findUnique({
      where: { subdomain },
    });
  }

  async suspendTenant(tenantId: string, reason: string): Promise<void> {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        status: 'SUSPENDED',
        settings: {
          suspensionReason: reason,
          suspendedAt: new Date(),
        },
      },
    });

    // Notify tenant admins
    await this.notifySuspension(tenantId, reason);
  }

  async deleteTenant(tenantId: string): Promise<void> {
    // Export data first (compliance)
    await this.exportTenantData(tenantId);

    // Soft delete (mark as deleted, cleanup later)
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
      },
    });

    // Schedule hard deletion after 30 days
    await this.scheduleHardDelete(tenantId, 30);
  }

  private async seedTenantData(tenantId: string): Promise<void> {
    // Create default theme
    await prisma.theme.create({
      data: {
        tenantId,
        name: 'Default Theme',
        isPublished: true,
        // ... default theme values
      },
    });

    // Create default email templates
    const templateKeys = Object.values(EmailTemplateKey);
    for (const key of templateKeys) {
      await prisma.emailTemplate.create({
        data: {
          tenantId,
          templateKey: key,
          name: key,
          subject: getDefaultSubject(key),
          htmlContent: getDefaultHtmlContent(key),
          textContent: getDefaultTextContent(key),
          isPublished: true,
        },
      });
    }
  }

  private getDefaultSettings(): any {
    return {
      features: {
        customDomain: false,
        customCss: false,
        analytics: false,
      },
      limits: {
        maxEvents: 5,
        maxUsers: 10,
        maxStorage: 1024 * 1024 * 100, // 100MB
      },
    };
  }
}

export default new TenantService();
```

### Tenant Isolation Tests

```typescript
// tests/tenant-isolation.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { createTestTenant, createTestEvent } from './helpers';

describe('Tenant Isolation', () => {
  let tenant1: Tenant;
  let tenant2: Tenant;

  beforeEach(async () => {
    tenant1 = await createTestTenant('tenant1');
    tenant2 = await createTestTenant('tenant2');
  });

  it('should prevent cross-tenant data access', async () => {
    const event1 = await createTestEvent(tenant1.id);

    // Try to access tenant1 event from tenant2 context
    await expect(async () => {
      await db.findUnique('event', {
        where: { id: event1.id },
        context: { tenantId: tenant2.id },
      });
    }).rejects.toThrow('Cross-tenant access denied');
  });

  it('should isolate queries to tenant', async () => {
    await createTestEvent(tenant1.id, { title: 'Tenant 1 Event' });
    await createTestEvent(tenant2.id, { title: 'Tenant 2 Event' });

    const tenant1Events = await db.findMany('event', {
      context: { tenantId: tenant1.id },
    });

    expect(tenant1Events).toHaveLength(1);
    expect(tenant1Events[0].title).toBe('Tenant 1 Event');
  });

  it('should prevent update of other tenant data', async () => {
    const event1 = await createTestEvent(tenant1.id);

    await expect(async () => {
      await db.update('event', {
        where: { id: event1.id },
        data: { title: 'Hacked' },
        context: { tenantId: tenant2.id },
      });
    }).rejects.toThrow('Cross-tenant modification denied');
  });
});
```

---

## Security Considerations

1. **Defense in Depth**
   - Multiple layers of tenant validation
   - Database-level RLS policies
   - Application-level checks
   - API gateway validation

2. **Audit Logging**
   - Log all tenant context switches
   - Alert on cross-tenant access attempts
   - Track data access patterns

3. **Rate Limiting**
   - Per-tenant rate limits
   - Prevent resource exhaustion
   - Fair usage policies

4. **Data Encryption**
   - Encrypt sensitive tenant data
   - Tenant-specific encryption keys (optional)

---

## Performance Optimization

1. **Database Indexing**
   ```sql
   CREATE INDEX idx_events_tenant_created ON events(tenant_id, created_at);
   CREATE INDEX idx_orders_tenant_status ON orders(tenant_id, status);
   ```

2. **Connection Pooling**
   - Prisma connection pooling
   - Separate pools for different tenant tiers

3. **Caching Strategy**
   - Redis cache with tenant-scoped keys
   - Cache invalidation per tenant

4. **Query Optimization**
   - Avoid N+1 queries
   - Use `select` and `include` judiciously
   - Monitor slow queries per tenant

---

## Monitoring & Alerts

### Key Metrics
- Cross-tenant access attempts (should be 0)
- Query performance per tenant
- Resource usage per tenant
- API latency by tenant

### Alerts
- Cross-tenant access attempt
- Tenant exceeding resource limits
- Slow queries affecting tenant
- Unusual activity patterns

---

## Testing Requirements

### Unit Tests
- Tenant context establishment
- Query scoping
- Access control enforcement

### Integration Tests
- Full tenant isolation
- Multi-tenant API flows
- Tenant provisioning/deprovisioning

### Load Tests
- Multi-tenant concurrent access
- Resource limits under load
- Performance degradation testing

---

## Dependencies

- **Prisma**: ORM with middleware support
- **Redis**: Caching with tenant scoping
- **Monitoring**: Sentry, DataDog, or similar

---

## Success Metrics

- Zero cross-tenant data breaches
- Query performance < 100ms p95 per tenant
- Successful tenant isolation audits
- 99.9% uptime per tenant
- Scalability to 1000+ tenants

---

## Notes

- Consider separate databases for enterprise tenants
- Implement tenant data export for GDPR compliance
- Plan for tenant migration tools
- Document tenant onboarding/offboarding procedures
- Consider tenant-level feature flags