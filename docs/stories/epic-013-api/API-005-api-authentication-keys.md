# API-005: API Authentication Keys

**Epic:** EPIC-013 - API & Developer Tools
**Story Points:** 3
**Priority:** High
**Status:** To Do

## User Story

**As a** developer or event organizer
**I want** to generate and manage API keys
**So that** I can securely authenticate with the Events SteppersLife API

## Description

Implement a comprehensive API key management system that allows users to generate, rotate, revoke, and monitor API keys. The system should support role-based access control, key scoping, usage tracking, and security best practices including key hashing and audit logging.

## Acceptance Criteria

### 1. API Key Generation
- [ ] Generate cryptographically secure API keys (32+ characters)
- [ ] Unique key prefix for easy identification (e.g., `esl_live_...`, `esl_test_...`)
- [ ] Generate separate keys for live and test environments
- [ ] Display key only once during creation (security best practice)
- [ ] Optional key naming/labeling for organization
- [ ] Key creation timestamp tracking

### 2. Key Scoping & Permissions
- [ ] Define granular permission scopes (read, write, admin)
- [ ] Resource-level permissions (events, tickets, orders)
- [ ] Action-based scopes (create, read, update, delete)
- [ ] Assign multiple scopes per key
- [ ] Pre-defined permission templates (read-only, full-access)
- [ ] Custom scope combinations

### 3. Key Management Interface
- [ ] List all API keys with metadata (name, created, last used)
- [ ] View key details (scopes, usage stats, status)
- [ ] Edit key name and scopes
- [ ] Revoke/delete keys immediately
- [ ] Roll/rotate keys (generate new, deprecate old)
- [ ] Filter keys by status (active, revoked)
- [ ] Search keys by name or prefix

### 4. Security Features
- [ ] Store only hashed versions of keys (bcrypt/argon2)
- [ ] Enforce HTTPS for all API key usage
- [ ] Implement key rotation policy (optional auto-expiry)
- [ ] Track key usage and last access time
- [ ] Alert on suspicious activity (unusual usage patterns)
- [ ] IP whitelist support (optional)
- [ ] Audit log for all key operations

### 5. Rate Limiting per Key
- [ ] Associate rate limits with each API key
- [ ] Different tiers (Free: 100/hr, Pro: 1000/hr, Enterprise: 10000/hr)
- [ ] Display current usage vs limit
- [ ] Temporary rate limit increase requests
- [ ] Reset rate limit counter (hourly/daily)

### 6. Usage Analytics
- [ ] Track total API calls per key
- [ ] Last used timestamp
- [ ] Most used endpoints per key
- [ ] Error rate per key
- [ ] Usage trends over time
- [ ] Export usage reports

## Technical Requirements

### API Key Format
```
Format: esl_{environment}_{random_string}
Examples:
- esl_live_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
- esl_test_9z8y7x6w5v4u3t2s1r0q9p8o7n6m5l4k

Components:
- Prefix: "esl_" (Events SteppersLife)
- Environment: "live" or "test"
- Random: 32 characters (hex or base64)
```

### Database Schema
```prisma
model ApiKey {
  id            String   @id @default(cuid())
  userId        String
  name          String?
  keyPrefix     String   @unique // esl_live_abc...
  keyHash       String   // Hashed full key
  environment   String   @default("live") // live, test
  scopes        String[] // Array of permission scopes
  status        String   @default("active") // active, revoked
  lastUsedAt    DateTime?
  expiresAt     DateTime?
  ipWhitelist   String[] // Optional IP restrictions
  rateLimit     Int      @default(100) // Requests per hour
  metadata      Json?    // Additional custom data
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User     @relation(fields: [userId], references: [id])
  usageLogs     ApiKeyUsageLog[]
  auditLogs     ApiKeyAuditLog[]

  @@index([userId])
  @@index([keyHash])
  @@index([status])
}

model ApiKeyUsageLog {
  id            String   @id @default(cuid())
  apiKeyId      String
  endpoint      String
  method        String
  statusCode    Int
  responseTime  Int      // milliseconds
  ipAddress     String?
  userAgent     String?
  errorMessage  String?
  createdAt     DateTime @default(now())

  apiKey        ApiKey   @relation(fields: [apiKeyId], references: [id])

  @@index([apiKeyId, createdAt])
  @@index([createdAt])
}

model ApiKeyAuditLog {
  id            String   @id @default(cuid())
  apiKeyId      String
  action        String   // created, updated, revoked, rotated
  performedBy   String
  changes       Json?
  ipAddress     String?
  createdAt     DateTime @default(now())

  apiKey        ApiKey   @relation(fields: [apiKeyId], references: [id])

  @@index([apiKeyId, createdAt])
}
```

### API Key Generation Service
```typescript
// lib/auth/api-key.service.ts
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export class ApiKeyService {
  private readonly PREFIX = 'esl';
  private readonly KEY_LENGTH = 32;

  async generateApiKey(
    userId: string,
    name: string,
    environment: 'live' | 'test',
    scopes: string[],
    rateLimit?: number
  ): Promise<{ key: string; apiKey: ApiKey }> {
    // Generate random key
    const randomBytes = crypto.randomBytes(this.KEY_LENGTH);
    const randomString = randomBytes.toString('hex');
    const fullKey = `${this.PREFIX}_${environment}_${randomString}`;

    // Extract prefix for DB storage (first 20 chars)
    const keyPrefix = fullKey.substring(0, 20);

    // Hash the full key for secure storage
    const keyHash = await bcrypt.hash(fullKey, 12);

    // Create API key record
    const apiKey = await prisma.apiKey.create({
      data: {
        userId,
        name,
        keyPrefix,
        keyHash,
        environment,
        scopes,
        status: 'active',
        rateLimit: rateLimit || 100,
      },
    });

    // Log creation
    await this.logAudit(apiKey.id, 'created', userId);

    // Return full key (only time it's visible)
    return { key: fullKey, apiKey };
  }

  async verifyApiKey(key: string): Promise<ApiKey | null> {
    const keyPrefix = key.substring(0, 20);

    // Find API key by prefix
    const apiKey = await prisma.apiKey.findUnique({
      where: { keyPrefix, status: 'active' },
      include: { user: true },
    });

    if (!apiKey) {
      return null;
    }

    // Verify full key hash
    const isValid = await bcrypt.compare(key, apiKey.keyHash);
    if (!isValid) {
      return null;
    }

    // Check expiration
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return null;
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    return apiKey;
  }

  async hasPermission(apiKey: ApiKey, requiredScope: string): boolean {
    return apiKey.scopes.includes(requiredScope) || apiKey.scopes.includes('admin');
  }

  async revokeApiKey(apiKeyId: string, performedBy: string): Promise<void> {
    await prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { status: 'revoked' },
    });

    await this.logAudit(apiKeyId, 'revoked', performedBy);
  }

  async rotateApiKey(
    apiKeyId: string,
    performedBy: string
  ): Promise<{ key: string; apiKey: ApiKey }> {
    const oldKey = await prisma.apiKey.findUnique({
      where: { id: apiKeyId },
    });

    if (!oldKey) {
      throw new Error('API key not found');
    }

    // Create new key with same settings
    const newKeyData = await this.generateApiKey(
      oldKey.userId,
      oldKey.name || 'Rotated key',
      oldKey.environment as 'live' | 'test',
      oldKey.scopes,
      oldKey.rateLimit
    );

    // Revoke old key
    await this.revokeApiKey(apiKeyId, performedBy);

    await this.logAudit(newKeyData.apiKey.id, 'rotated', performedBy, {
      oldKeyId: apiKeyId,
    });

    return newKeyData;
  }

  async logUsage(
    apiKeyId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    ipAddress?: string,
    errorMessage?: string
  ): Promise<void> {
    await prisma.apiKeyUsageLog.create({
      data: {
        apiKeyId,
        endpoint,
        method,
        statusCode,
        responseTime,
        ipAddress,
        errorMessage,
      },
    });
  }

  private async logAudit(
    apiKeyId: string,
    action: string,
    performedBy: string,
    changes?: any
  ): Promise<void> {
    await prisma.apiKeyAuditLog.create({
      data: {
        apiKeyId,
        action,
        performedBy,
        changes,
      },
    });
  }
}
```

### API Key Middleware
```typescript
// middleware/api-auth.ts
import { NextRequest, NextResponse } from 'next/server';
import { ApiKeyService } from '@/lib/auth/api-key.service';

export async function apiKeyAuth(
  request: NextRequest,
  requiredScope?: string
): Promise<{ apiKey: ApiKey; user: User } | NextResponse> {
  const apiKeyService = new ApiKeyService();

  // Extract API key from header
  const apiKeyHeader = request.headers.get('X-API-Key') ||
                       request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!apiKeyHeader) {
    return NextResponse.json(
      { error: 'Missing API key' },
      { status: 401 }
    );
  }

  // Verify API key
  const apiKey = await apiKeyService.verifyApiKey(apiKeyHeader);

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Invalid API key' },
      { status: 401 }
    );
  }

  // Check permission scope
  if (requiredScope && !await apiKeyService.hasPermission(apiKey, requiredScope)) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  // Check rate limit
  const isRateLimited = await checkRateLimit(apiKey.id, apiKey.rateLimit);
  if (isRateLimited) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  // Log usage
  const startTime = Date.now();
  request.headers.set('x-api-key-id', apiKey.id);

  return { apiKey, user: apiKey.user };
}
```

### Permission Scopes
```typescript
export const API_SCOPES = {
  // Events
  'events:read': 'Read event information',
  'events:write': 'Create and update events',
  'events:delete': 'Delete events',

  // Tickets
  'tickets:read': 'Read ticket information',
  'tickets:write': 'Create and update tickets',
  'tickets:delete': 'Delete tickets',

  // Orders
  'orders:read': 'Read order information',
  'orders:write': 'Create and update orders',
  'orders:refund': 'Process refunds',

  // Analytics
  'analytics:read': 'Access analytics data',

  // Admin
  'admin': 'Full access to all resources',
};

export const SCOPE_TEMPLATES = {
  'read-only': ['events:read', 'tickets:read', 'orders:read'],
  'full-access': Object.keys(API_SCOPES),
  'event-manager': ['events:read', 'events:write', 'tickets:read', 'tickets:write'],
};
```

## Implementation Details

### Phase 1: Core Key Management (Day 1-2)
1. Create database schema
2. Implement key generation service
3. Build key verification logic
4. Add key hashing and storage
5. Test key lifecycle operations

### Phase 2: Authentication & Authorization (Day 2-3)
1. Implement API key middleware
2. Add scope-based permissions
3. Create permission checking logic
4. Test authentication flow
5. Add error handling

### Phase 3: Management UI (Day 3)
1. Build API key listing page
2. Create key generation form
3. Add key details view
4. Implement revoke/rotate functions
5. Test all UI interactions

### File Structure
```
/lib/auth/
├── api-key.service.ts
├── api-key.types.ts
└── scopes.ts

/app/api/api-keys/
├── route.ts                  # List/create keys
├── [keyId]/route.ts          # Get/update/delete key
├── [keyId]/rotate/route.ts   # Rotate key
└── [keyId]/usage/route.ts    # Key usage stats

/app/dashboard/settings/
├── api-keys/
│   ├── page.tsx
│   ├── components/
│   │   ├── ApiKeyList.tsx
│   │   ├── CreateApiKey.tsx
│   │   ├── KeyDetails.tsx
│   │   └── UsageChart.tsx

/middleware/
└── api-auth.ts
```

## Dependencies
- Blocks: API-001 (API Documentation), API-002 (Webhook System)
- Related: API-006 (Rate Limiting)

## Testing Checklist

### Key Generation
- [ ] Keys are cryptographically secure
- [ ] Keys have correct format
- [ ] Keys are unique
- [ ] Keys are hashed before storage
- [ ] Key is displayed only once

### Authentication
- [ ] Valid key authenticates successfully
- [ ] Invalid key is rejected
- [ ] Expired key is rejected
- [ ] Revoked key is rejected
- [ ] Permissions are checked correctly

### Management
- [ ] Create key works
- [ ] List keys displays correctly
- [ ] Revoke key works immediately
- [ ] Rotate key generates new key
- [ ] Usage stats are accurate

### Security
- [ ] Keys are never stored in plain text
- [ ] Only HTTPS connections accepted
- [ ] Rate limiting works per key
- [ ] Audit log captures all actions
- [ ] IP whitelist enforced (if configured)

## Performance Metrics
- Key verification time: < 100ms
- Key generation time: < 500ms
- Database query time: < 50ms

## Security Considerations
- [ ] Keys stored as hashes only
- [ ] Use bcrypt/argon2 for hashing
- [ ] Enforce HTTPS for API access
- [ ] Implement rate limiting
- [ ] Log all key operations
- [ ] Alert on suspicious activity
- [ ] Support key expiration
- [ ] Allow immediate revocation

## Success Metrics
- API key adoption: > 50% of power users
- Key rotation rate: > 10% per quarter
- Security incidents: 0
- Average keys per user: 2-3
- Key revocation time: < 1 second

## Additional Resources
- [API Key Best Practices](https://cloud.google.com/endpoints/docs/openapi/when-why-api-key)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [Stripe API Keys](https://stripe.com/docs/keys)

## Notes
- Consider adding key expiration for enhanced security
- Implement key usage anomaly detection
- Add support for API key hierarchies (parent/child keys)
- Plan for key migration tools for security updates
- Consider adding webhook signing keys (separate from API keys)