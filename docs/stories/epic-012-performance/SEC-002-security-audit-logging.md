# SEC-002: Security Audit Logging

**Epic:** EPIC-012 Performance & Security
**Story Points:** 8
**Priority:** Critical
**Status:** Ready for Development

---

## User Story

**As a** compliance officer
**I want** comprehensive audit logging of all security-relevant events
**So that** we can track user actions, detect breaches, and meet SOX/PCI DSS/GDPR requirements

---

## Acceptance Criteria

### Functional Requirements
- [ ] Log all authentication events (login, logout, failed attempts)
- [ ] Log all authorization failures and privilege escalations
- [ ] Log all financial transactions and payment events
- [ ] Log all data modifications (create, update, delete)
- [ ] Log all administrative actions
- [ ] Log all API access with request/response details
- [ ] Immutable log storage (append-only)
- [ ] Structured logging with consistent schema
- [ ] Log correlation IDs for request tracing
- [ ] Log retention policy (7 years for financial data)
- [ ] Log tampering detection mechanisms
- [ ] Automated log aggregation and analysis

### Compliance Requirements
- [ ] SOX: 7-year retention for financial records
- [ ] PCI DSS: Payment card activity logging
- [ ] GDPR: Access to personal data logging
- [ ] CCPA: Data deletion request logging
- [ ] ISO 27001: Security event logging
- [ ] Log integrity verification
- [ ] Audit trail reports available on demand

### Technical Requirements
- [ ] Centralized logging service
- [ ] Log encryption at rest and in transit
- [ ] High-performance logging (<5ms overhead)
- [ ] Log search and filtering capabilities
- [ ] Real-time alerting on suspicious patterns
- [ ] Log export functionality
- [ ] SIEM integration ready

---

## Technical Specifications

### Audit Log Schema

```typescript
// lib/audit/types.ts
export enum AuditEventType {
  // Authentication
  AUTH_LOGIN = 'auth.login',
  AUTH_LOGOUT = 'auth.logout',
  AUTH_LOGIN_FAILED = 'auth.login.failed',
  AUTH_PASSWORD_CHANGED = 'auth.password.changed',
  AUTH_PASSWORD_RESET = 'auth.password.reset',
  AUTH_2FA_ENABLED = 'auth.2fa.enabled',
  AUTH_2FA_DISABLED = 'auth.2fa.disabled',

  // Authorization
  AUTHZ_ACCESS_DENIED = 'authz.access.denied',
  AUTHZ_ROLE_ASSIGNED = 'authz.role.assigned',
  AUTHZ_PERMISSION_GRANTED = 'authz.permission.granted',

  // Financial
  PAYMENT_INITIATED = 'payment.initiated',
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',
  PAYOUT_INITIATED = 'payout.initiated',
  PAYOUT_COMPLETED = 'payout.completed',

  // Data
  DATA_CREATED = 'data.created',
  DATA_UPDATED = 'data.updated',
  DATA_DELETED = 'data.deleted',
  DATA_EXPORTED = 'data.exported',
  DATA_ACCESSED = 'data.accessed',

  // Admin
  ADMIN_USER_CREATED = 'admin.user.created',
  ADMIN_USER_DELETED = 'admin.user.deleted',
  ADMIN_SETTINGS_CHANGED = 'admin.settings.changed',
  ADMIN_BACKUP_CREATED = 'admin.backup.created',

  // Security
  SECURITY_BREACH_DETECTED = 'security.breach.detected',
  SECURITY_RATE_LIMIT_EXCEEDED = 'security.rate_limit.exceeded',
  SECURITY_SUSPICIOUS_ACTIVITY = 'security.suspicious.activity',
}

export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  severity: AuditSeverity;

  // Actor (who)
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress: string;
  userAgent: string;

  // Target (what)
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;

  // Context (where/how)
  action: string;
  outcome: 'success' | 'failure';
  method?: string;
  path?: string;
  statusCode?: number;

  // Details
  details?: Record<string, any>;
  errorMessage?: string;
  stackTrace?: string;

  // Tracing
  correlationId: string;
  sessionId?: string;

  // Integrity
  hash?: string;
  previousHash?: string;
}
```

### Audit Logger Service

```typescript
// lib/audit/audit-logger.ts
import { prisma } from '@/lib/db';
import { Logger } from '@/lib/monitoring/logger';
import crypto from 'crypto';

export class AuditLogger {
  private logger = new Logger('AuditLogger');
  private previousHash: string | null = null;

  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'hash' | 'previousHash'>): Promise<void> {
    try {
      const timestamp = new Date();
      const id = crypto.randomUUID();

      // Calculate hash for integrity
      const hash = this.calculateHash({
        ...entry,
        id,
        timestamp,
        previousHash: this.previousHash,
      });

      const auditLog = await prisma.auditLog.create({
        data: {
          id,
          timestamp,
          eventType: entry.eventType,
          severity: entry.severity,
          userId: entry.userId,
          userEmail: entry.userEmail,
          userRole: entry.userRole,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId,
          resourceName: entry.resourceName,
          action: entry.action,
          outcome: entry.outcome,
          method: entry.method,
          path: entry.path,
          statusCode: entry.statusCode,
          details: entry.details ? JSON.stringify(entry.details) : null,
          errorMessage: entry.errorMessage,
          stackTrace: entry.stackTrace,
          correlationId: entry.correlationId,
          sessionId: entry.sessionId,
          hash,
          previousHash: this.previousHash,
        },
      });

      this.previousHash = hash;

      // Log critical events to monitoring
      if (entry.severity === AuditSeverity.CRITICAL) {
        this.logger.error('Critical audit event', { entry });
      }

      // Send to external SIEM if configured
      await this.sendToSIEM(auditLog);
    } catch (error) {
      this.logger.error('Failed to write audit log', error);
      // Never throw - logging failures should not break the app
    }
  }

  private calculateHash(entry: Partial<AuditLogEntry>): string {
    const data = JSON.stringify({
      id: entry.id,
      timestamp: entry.timestamp,
      eventType: entry.eventType,
      userId: entry.userId,
      action: entry.action,
      resourceId: entry.resourceId,
      previousHash: entry.previousHash,
    });

    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private async sendToSIEM(entry: any): Promise<void> {
    // Integration with external SIEM systems
    // e.g., Splunk, ELK, DataDog
    if (process.env.SIEM_ENDPOINT) {
      // Implementation here
    }
  }

  async verifyIntegrity(fromId?: string, toId?: string): Promise<boolean> {
    const logs = await prisma.auditLog.findMany({
      where: {
        ...(fromId && { id: { gte: fromId } }),
        ...(toId && { id: { lte: toId } }),
      },
      orderBy: { timestamp: 'asc' },
    });

    let previousHash: string | null = null;

    for (const log of logs) {
      const expectedPreviousHash = previousHash;
      if (log.previousHash !== expectedPreviousHash) {
        this.logger.error('Audit log integrity violation detected', {
          logId: log.id,
          expected: expectedPreviousHash,
          actual: log.previousHash,
        });
        return false;
      }

      const calculatedHash = this.calculateHash(log);
      if (log.hash !== calculatedHash) {
        this.logger.error('Audit log hash mismatch', {
          logId: log.id,
          expected: calculatedHash,
          actual: log.hash,
        });
        return false;
      }

      previousHash = log.hash;
    }

    return true;
  }
}
```

### Audit Middleware

```typescript
// lib/middleware/audit.middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { AuditLogger } from '@/lib/audit/audit-logger';
import { AuditEventType, AuditSeverity } from '@/lib/audit/types';
import { getServerSession } from 'next-auth';

export async function auditMiddleware(
  request: NextRequest,
  handler: Function
): Promise<NextResponse> {
  const correlationId = crypto.randomUUID();
  const startTime = Date.now();

  const session = await getServerSession();
  const auditLogger = new AuditLogger();

  try {
    // Execute the request
    const response = await handler(request);

    // Log successful request
    await auditLogger.log({
      eventType: AuditEventType.DATA_ACCESSED,
      severity: AuditSeverity.INFO,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userRole: session?.user?.role,
      ipAddress: request.headers.get('x-forwarded-for') || request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      action: `${request.method} ${request.nextUrl.pathname}`,
      outcome: 'success',
      method: request.method,
      path: request.nextUrl.pathname,
      statusCode: response.status,
      correlationId,
      sessionId: session?.user?.id,
      details: {
        duration: Date.now() - startTime,
        query: Object.fromEntries(request.nextUrl.searchParams),
      },
    });

    return response;
  } catch (error) {
    // Log failed request
    await auditLogger.log({
      eventType: AuditEventType.SECURITY_BREACH_DETECTED,
      severity: AuditSeverity.ERROR,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userRole: session?.user?.role,
      ipAddress: request.headers.get('x-forwarded-for') || request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      action: `${request.method} ${request.nextUrl.pathname}`,
      outcome: 'failure',
      method: request.method,
      path: request.nextUrl.pathname,
      correlationId,
      sessionId: session?.user?.id,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      stackTrace: error instanceof Error ? error.stack : undefined,
      details: {
        duration: Date.now() - startTime,
      },
    });

    throw error;
  }
}
```

### Authentication Audit Hooks

```typescript
// lib/auth/audit-hooks.ts
import { AuditLogger } from '@/lib/audit/audit-logger';
import { AuditEventType, AuditSeverity } from '@/lib/audit/types';

export async function auditLoginSuccess(
  userId: string,
  email: string,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  const logger = new AuditLogger();
  await logger.log({
    eventType: AuditEventType.AUTH_LOGIN,
    severity: AuditSeverity.INFO,
    userId,
    userEmail: email,
    ipAddress,
    userAgent,
    action: 'User logged in',
    outcome: 'success',
    correlationId: crypto.randomUUID(),
  });
}

export async function auditLoginFailure(
  email: string,
  ipAddress: string,
  userAgent: string,
  reason: string
): Promise<void> {
  const logger = new AuditLogger();
  await logger.log({
    eventType: AuditEventType.AUTH_LOGIN_FAILED,
    severity: AuditSeverity.WARNING,
    userEmail: email,
    ipAddress,
    userAgent,
    action: 'Login attempt failed',
    outcome: 'failure',
    errorMessage: reason,
    correlationId: crypto.randomUUID(),
  });
}

export async function auditPasswordChange(
  userId: string,
  email: string,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  const logger = new AuditLogger();
  await logger.log({
    eventType: AuditEventType.AUTH_PASSWORD_CHANGED,
    severity: AuditSeverity.INFO,
    userId,
    userEmail: email,
    ipAddress,
    userAgent,
    action: 'Password changed',
    outcome: 'success',
    correlationId: crypto.randomUUID(),
  });
}

export async function auditAccessDenied(
  userId: string | undefined,
  email: string | undefined,
  resource: string,
  requiredPermission: string,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  const logger = new AuditLogger();
  await logger.log({
    eventType: AuditEventType.AUTHZ_ACCESS_DENIED,
    severity: AuditSeverity.WARNING,
    userId,
    userEmail: email,
    ipAddress,
    userAgent,
    resourceType: resource,
    action: 'Access denied',
    outcome: 'failure',
    details: {
      requiredPermission,
    },
    correlationId: crypto.randomUUID(),
  });
}
```

### Financial Transaction Audit

```typescript
// lib/payments/audit.ts
import { AuditLogger } from '@/lib/audit/audit-logger';
import { AuditEventType, AuditSeverity } from '@/lib/audit/types';

export async function auditPaymentInitiated(
  userId: string,
  orderId: string,
  amount: number,
  currency: string,
  ipAddress: string
): Promise<void> {
  const logger = new AuditLogger();
  await logger.log({
    eventType: AuditEventType.PAYMENT_INITIATED,
    severity: AuditSeverity.INFO,
    userId,
    resourceType: 'Order',
    resourceId: orderId,
    action: 'Payment initiated',
    outcome: 'success',
    ipAddress,
    userAgent: 'system',
    details: {
      amount,
      currency,
    },
    correlationId: crypto.randomUUID(),
  });
}

export async function auditPaymentCompleted(
  userId: string,
  orderId: string,
  paymentId: string,
  amount: number,
  currency: string,
  ipAddress: string
): Promise<void> {
  const logger = new AuditLogger();
  await logger.log({
    eventType: AuditEventType.PAYMENT_COMPLETED,
    severity: AuditSeverity.INFO,
    userId,
    resourceType: 'Payment',
    resourceId: paymentId,
    resourceName: orderId,
    action: 'Payment completed',
    outcome: 'success',
    ipAddress,
    userAgent: 'system',
    details: {
      amount,
      currency,
      orderId,
    },
    correlationId: crypto.randomUUID(),
  });
}

export async function auditRefundIssued(
  userId: string,
  orderId: string,
  refundId: string,
  amount: number,
  reason: string,
  ipAddress: string
): Promise<void> {
  const logger = new AuditLogger();
  await logger.log({
    eventType: AuditEventType.PAYMENT_REFUNDED,
    severity: AuditSeverity.WARNING,
    userId,
    resourceType: 'Refund',
    resourceId: refundId,
    resourceName: orderId,
    action: 'Refund issued',
    outcome: 'success',
    ipAddress,
    userAgent: 'system',
    details: {
      amount,
      reason,
      orderId,
    },
    correlationId: crypto.randomUUID(),
  });
}
```

---

## Implementation Details

### Database Schema

```prisma
model AuditLog {
  id            String   @id
  timestamp     DateTime @default(now())
  eventType     String
  severity      String

  // Actor
  userId        String?
  userEmail     String?
  userRole      String?
  ipAddress     String
  userAgent     String

  // Target
  resourceType  String?
  resourceId    String?
  resourceName  String?

  // Context
  action        String
  outcome       String
  method        String?
  path          String?
  statusCode    Int?

  // Details
  details       String?  // JSON
  errorMessage  String?
  stackTrace    String?  @db.Text

  // Tracing
  correlationId String
  sessionId     String?

  // Integrity
  hash          String
  previousHash  String?

  @@index([userId])
  @@index([timestamp])
  @@index([eventType])
  @@index([correlationId])
  @@index([severity])
}
```

### Audit Log Search API

```typescript
// app/api/admin/audit-logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  await requireAdmin(request);

  const { searchParams } = request.nextUrl;
  const userId = searchParams.get('userId');
  const eventType = searchParams.get('eventType');
  const severity = searchParams.get('severity');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');

  const where = {
    ...(userId && { userId }),
    ...(eventType && { eventType }),
    ...(severity && { severity }),
    ...(from && to && {
      timestamp: {
        gte: new Date(from),
        lte: new Date(to),
      },
    }),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}
```

---

## Testing Requirements

### Audit Logging Tests

```typescript
describe('Audit Logger', () => {
  it('should log authentication events', async () => {
    await auditLoginSuccess('user-123', 'user@example.com', '1.2.3.4', 'Mozilla/5.0');

    const log = await prisma.auditLog.findFirst({
      where: { userId: 'user-123', eventType: 'auth.login' },
    });

    expect(log).toBeDefined();
    expect(log?.outcome).toBe('success');
  });

  it('should maintain hash chain integrity', async () => {
    const logger = new AuditLogger();

    await logger.log({ /* entry 1 */ });
    await logger.log({ /* entry 2 */ });
    await logger.log({ /* entry 3 */ });

    const isValid = await logger.verifyIntegrity();
    expect(isValid).toBe(true);
  });

  it('should detect hash tampering', async () => {
    // Create logs
    const logger = new AuditLogger();
    await logger.log({ /* entry */ });

    // Tamper with a log
    await prisma.auditLog.update({
      where: { /* ... */ },
      data: { action: 'TAMPERED' },
    });

    const isValid = await logger.verifyIntegrity();
    expect(isValid).toBe(false);
  });
});
```

---

## Compliance Reporting

### SOX Report Generator

```typescript
// lib/audit/reports/sox-report.ts
export async function generateSOXReport(from: Date, to: Date) {
  const financialLogs = await prisma.auditLog.findMany({
    where: {
      eventType: {
        in: [
          'payment.completed',
          'payment.refunded',
          'payout.completed',
        ],
      },
      timestamp: { gte: from, lte: to },
    },
    orderBy: { timestamp: 'asc' },
  });

  return {
    reportPeriod: { from, to },
    totalTransactions: financialLogs.length,
    transactions: financialLogs.map(log => ({
      timestamp: log.timestamp,
      user: log.userEmail,
      action: log.action,
      amount: JSON.parse(log.details || '{}').amount,
      orderId: log.resourceId,
    })),
  };
}
```

---

## Monitoring and Alerting

### Key Metrics
- Audit logs per second
- Failed authentication attempts
- Access denied events
- Critical security events
- Log integrity verification status

### Alerts
- Critical: 5+ failed login attempts in 5 minutes
- Critical: Access denied for admin resources
- Critical: Payment fraud detected
- Warning: Hash chain integrity failure
- Info: Daily audit log summary

---

## Dependencies
- prisma
- crypto (Node.js built-in)

## Related Stories
- SEC-001: Security Hardening
- SEC-003: CCPA Compliance
- SEC-005: PCI Compliance Validation

---

**Notes:**
- Never log sensitive data (passwords, full card numbers)
- Ensure logs are encrypted at rest
- Implement log rotation and archival
- Test audit logging performance under load
- Verify 7-year retention for SOX compliance