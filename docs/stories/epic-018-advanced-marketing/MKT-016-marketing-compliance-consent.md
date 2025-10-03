# MKT-016: Marketing Compliance & Consent

**Epic:** [EPIC-018: Advanced Marketing Automation](../epics/EPIC-018-advanced-marketing.md)
**Story Points:** 5
**Priority:** E3 (Expansion)
**Status:** Not Started
**Assignee:** TBD
**Sprint:** TBD

---

## User Story

**As an** event organizer
**I want** comprehensive marketing compliance and consent management tools
**So that** I comply with GDPR, CAN-SPAM, and other regulations while maintaining trust and avoiding legal issues

---

## Acceptance Criteria

### AC1: GDPR Consent Management
**Given** I collect user data for marketing
**When** users sign up or interact with the platform
**Then** they see a clear consent request for marketing communications
**And** consent is granular (email, SMS, push notifications, profiling)
**And** consent records include timestamp, IP, and consent text
**And** users can withdraw consent at any time
**And** I can prove consent for any user

### AC2: CAN-SPAM Compliance
**Given** I send marketing emails
**When** an email is sent
**Then** it includes a clear unsubscribe link
**And** it displays my physical business address
**And** the subject line is not misleading
**And** unsubscribe requests are processed within 10 days
**And** I maintain a suppression list of unsubscribed users

### AC3: Unsubscribe Management
**Given** a user wants to unsubscribe
**When** they click the unsubscribe link
**Then** they see a preference center to choose communication types
**And** they can unsubscribe from all or specific categories
**And** unsubscribe is immediate (no login required)
**And** they receive confirmation of their preference change
**And** suppression is honored across all campaigns

### AC4: Double Opt-In System
**Given** a new user signs up for marketing
**When** they provide their email
**Then** they receive a confirmation email
**And** they must click to confirm subscription
**And** only confirmed users receive marketing emails
**And** confirmation timestamp is recorded
**And** I can resend confirmation if needed

### AC5: Data Retention Policies
**Given** I store marketing data
**When** retention periods expire
**Then** old data is automatically deleted or anonymized
**And** I can configure retention periods per data type
**And** users can request full data deletion (right to be forgotten)
**And** deletion logs are maintained for compliance
**And** backups respect retention policies

### AC6: Compliance Audit Logs
**Given** I need to prove compliance
**When** I access audit logs
**Then** I see all consent changes, emails sent, and data access
**And** logs include user ID, action, timestamp, and IP address
**And** logs are immutable and tamper-proof
**And** I can export logs for legal/regulatory review
**And** logs are retained for required periods

### AC7: Marketing Consent Dashboard
**Given** I manage marketing compliance
**When** I view the consent dashboard
**Then** I see consent rates by type and channel
**And** I see opt-out rates and trends
**And** I can view individual user consent history
**And** I receive alerts for compliance issues
**And** I can bulk export consent records

---

## Technical Specifications

### Database Schema (Prisma)

```prisma
model MarketingConsent {
  id              String              @id @default(cuid())
  userId          String
  consentType     ConsentType
  status          ConsentStatus       @default(PENDING)
  grantedAt       DateTime?
  revokedAt       DateTime?
  ipAddress       String?
  userAgent       String?
  consentText     String              @db.Text // Exact text user agreed to
  consentVersion  String              // Version of consent form
  method          ConsentMethod       // How consent was obtained
  expiresAt       DateTime?
  lastUpdated     DateTime            @updatedAt

  user            User                @relation(fields: [userId], references: [id])
  history         ConsentHistory[]

  @@unique([userId, consentType])
  @@index([userId, status])
  @@index([consentType, status])
}

model ConsentHistory {
  id              String              @id @default(cuid())
  consentId       String
  previousStatus  ConsentStatus
  newStatus       ConsentStatus
  reason          String?
  ipAddress       String?
  userAgent       String?
  timestamp       DateTime            @default(now())

  consent         MarketingConsent    @relation(fields: [consentId], references: [id], onDelete: Cascade)

  @@index([consentId, timestamp])
}

model EmailSuppressionList {
  id              String              @id @default(cuid())
  email           String              @unique
  reason          SuppressionReason
  source          String?             // Campaign that triggered suppression
  suppressedAt    DateTime            @default(now())
  expiresAt       DateTime?
  notes           String?

  @@index([email])
  @@index([reason])
}

model UnsubscribeRequest {
  id              String              @id @default(cuid())
  userId          String?
  email           String
  token           String              @unique
  consentTypes    String[]            // Types being unsubscribed
  reason          String?
  feedback        String?             @db.Text
  ipAddress       String?
  processedAt     DateTime?
  expiresAt       DateTime
  createdAt       DateTime            @default(now())

  user            User?               @relation(fields: [userId], references: [id])

  @@index([email])
  @@index([token])
}

model DataRetentionPolicy {
  id              String              @id @default(cuid())
  organizerId     String
  dataType        DataType
  retentionDays   Int
  isActive        Boolean             @default(true)
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  organizer       User                @relation(fields: [organizerId], references: [id])

  @@unique([organizerId, dataType])
  @@index([organizerId])
}

model DataDeletionRequest {
  id              String              @id @default(cuid())
  userId          String
  requestType     DeletionType
  status          DeletionStatus      @default(PENDING)
  requestedAt     DateTime            @default(now())
  processedAt     DateTime?
  completedAt     DateTime?
  verification    Json?               // Verification data
  notes           String?             @db.Text

  user            User                @relation(fields: [userId], references: [id])

  @@index([userId, status])
}

model ComplianceAuditLog {
  id              String              @id @default(cuid())
  userId          String?
  action          AuditAction
  entityType      String              // User, Campaign, Consent, etc.
  entityId        String
  details         Json
  ipAddress       String?
  userAgent       String?
  timestamp       DateTime            @default(now())
  organizerId     String?

  user            User?               @relation(fields: [userId], references: [id])
  organizer       User?               @relation("OrganizerAuditLogs", fields: [organizerId], references: [id])

  @@index([userId, timestamp])
  @@index([organizerId, timestamp])
  @@index([action, timestamp])
}

model DoubleOptIn {
  id              String              @id @default(cuid())
  email           String
  token           String              @unique
  consentTypes    String[]
  status          OptInStatus         @default(PENDING)
  sentAt          DateTime            @default(now())
  confirmedAt     DateTime?
  expiresAt       DateTime
  ipAddress       String?
  remindersSent   Int                 @default(0)
  lastReminderAt  DateTime?

  @@index([email, status])
  @@index([token])
}

model ConsentPreferenceCenter {
  id              String              @id @default(cuid())
  userId          String              @unique
  emailMarketing  Boolean             @default(false)
  smsMarketing    Boolean             @default(false)
  pushNotifications Boolean           @default(false)
  eventReminders  Boolean             @default(true)
  newsletters     Boolean             @default(false)
  promotions      Boolean             @default(false)
  surveys         Boolean             @default(false)
  profiling       Boolean             @default(false)
  thirdPartySharing Boolean           @default(false)
  frequency       NotificationFrequency @default(WEEKLY)
  categories      String[]            // Event categories of interest
  updatedAt       DateTime            @updatedAt

  user            User                @relation(fields: [userId], references: [id])

  @@index([userId])
}

enum ConsentType {
  EMAIL_MARKETING
  SMS_MARKETING
  PUSH_NOTIFICATIONS
  PROFILING
  THIRD_PARTY_SHARING
  DATA_PROCESSING
  COOKIES
}

enum ConsentStatus {
  PENDING
  GRANTED
  REVOKED
  EXPIRED
}

enum ConsentMethod {
  WEB_FORM
  EMAIL_CONFIRMATION
  CHECKBOX
  IMPLICIT
  API
  IMPORT
}

enum SuppressionReason {
  UNSUBSCRIBE
  BOUNCE
  COMPLAINT
  MANUAL
  GDPR_REQUEST
}

enum DataType {
  USER_PROFILE
  ORDER_HISTORY
  EMAIL_ENGAGEMENT
  BROWSING_DATA
  ANALYTICS
  MARKETING_PREFERENCES
}

enum DeletionType {
  ACCOUNT_DELETION
  DATA_ERASURE
  ANONYMIZATION
}

enum DeletionStatus {
  PENDING
  VERIFIED
  PROCESSING
  COMPLETED
  FAILED
}

enum AuditAction {
  CONSENT_GRANTED
  CONSENT_REVOKED
  EMAIL_SENT
  DATA_ACCESSED
  DATA_EXPORTED
  DATA_DELETED
  PREFERENCE_UPDATED
  UNSUBSCRIBE
}

enum OptInStatus {
  PENDING
  CONFIRMED
  EXPIRED
  FAILED
}

enum NotificationFrequency {
  DAILY
  WEEKLY
  MONTHLY
  NEVER
}
```

### TypeScript Interfaces

```typescript
// types/compliance.ts

export interface ConsentRequest {
  userId: string;
  consentTypes: ConsentType[];
  method: ConsentMethod;
  ipAddress?: string;
  userAgent?: string;
  consentText: string;
  consentVersion: string;
}

export interface ConsentRecord {
  userId: string;
  consentType: ConsentType;
  status: ConsentStatus;
  grantedAt?: Date;
  revokedAt?: Date;
  ipAddress?: string;
  consentText: string;
  method: ConsentMethod;
}

export interface UnsubscribePreferences {
  email: string;
  unsubscribeAll: boolean;
  consentTypes: ConsentType[];
  reason?: string;
  feedback?: string;
}

export interface ComplianceReport {
  period: { start: Date; end: Date };
  consentRates: Record<ConsentType, number>;
  optOutRates: Record<ConsentType, number>;
  emailsSent: number;
  unsubscribes: number;
  complaints: number;
  bounces: number;
  complianceScore: number;
  issues: ComplianceIssue[];
}

export interface ComplianceIssue {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: string;
  description: string;
  affectedUsers?: number;
  recommendedAction: string;
}

export interface DataExportRequest {
  userId: string;
  dataTypes: DataType[];
  format: 'JSON' | 'CSV' | 'PDF';
}

export interface RetentionPolicyConfig {
  dataType: DataType;
  retentionDays: number;
  autoDelete: boolean;
  anonymizeInstead: boolean;
}
```

### API Routes

```typescript
// app/api/compliance/consent/grant/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { ComplianceService } from '@/lib/services/compliance.service';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const ipAddress = request.headers.get('x-forwarded-for') || request.ip;
  const userAgent = request.headers.get('user-agent');

  const consent = await ComplianceService.grantConsent({
    userId: session.user.id,
    consentTypes: body.consentTypes,
    method: body.method || 'WEB_FORM',
    ipAddress,
    userAgent,
    consentText: body.consentText,
    consentVersion: body.consentVersion || '1.0',
  });

  return NextResponse.json(consent);
}

// app/api/compliance/consent/revoke/route.ts

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const ipAddress = request.headers.get('x-forwarded-for') || request.ip;

  await ComplianceService.revokeConsent({
    userId: session.user.id,
    consentTypes: body.consentTypes,
    ipAddress,
    reason: body.reason,
  });

  return NextResponse.json({ success: true });
}

// app/api/compliance/unsubscribe/route.ts

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }

  const unsubRequest = await ComplianceService.getUnsubscribeRequest(token);
  return NextResponse.json(unsubRequest);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const ipAddress = request.headers.get('x-forwarded-for') || request.ip;

  await ComplianceService.processUnsubscribe({
    token: body.token,
    preferences: body.preferences,
    ipAddress,
  });

  return NextResponse.json({ success: true });
}

// app/api/compliance/preferences/route.ts

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const preferences = await ComplianceService.getPreferences(session.user.id);
  return NextResponse.json(preferences);
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const preferences = await ComplianceService.updatePreferences({
    userId: session.user.id,
    ...body,
  });

  return NextResponse.json(preferences);
}

// app/api/compliance/double-opt-in/send/route.ts

export async function POST(request: NextRequest) {
  const body = await request.json();

  const optIn = await ComplianceService.sendDoubleOptIn({
    email: body.email,
    consentTypes: body.consentTypes,
  });

  return NextResponse.json(optIn, { status: 201 });
}

// app/api/compliance/double-opt-in/confirm/route.ts

export async function POST(request: NextRequest) {
  const body = await request.json();
  const ipAddress = request.headers.get('x-forwarded-for') || request.ip;

  await ComplianceService.confirmDoubleOptIn({
    token: body.token,
    ipAddress,
  });

  return NextResponse.json({ success: true });
}

// app/api/compliance/data-export/route.ts

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const exportData = await ComplianceService.exportUserData({
    userId: session.user.id,
    dataTypes: body.dataTypes,
    format: body.format || 'JSON',
  });

  return NextResponse.json(exportData);
}

// app/api/compliance/data-deletion/route.ts

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const deletion = await ComplianceService.requestDataDeletion({
    userId: session.user.id,
    requestType: body.requestType,
  });

  return NextResponse.json(deletion, { status: 201 });
}

// app/api/compliance/audit-logs/route.ts

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const action = searchParams.get('action');

  const logs = await ComplianceService.getAuditLogs({
    organizerId: session.user.id,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    action: action as any,
  });

  return NextResponse.json(logs);
}

// app/api/compliance/report/route.ts

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const report = await ComplianceService.generateComplianceReport({
    organizerId: session.user.id,
    startDate: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: endDate ? new Date(endDate) : new Date(),
  });

  return NextResponse.json(report);
}
```

### Service Layer

```typescript
// lib/services/compliance.service.ts

import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { EmailService } from './email.service';
import { ConsentRequest, ComplianceReport } from '@/types/compliance';

export class ComplianceService {
  static async grantConsent(request: ConsentRequest) {
    const consents = await Promise.all(
      request.consentTypes.map(async type => {
        const consent = await prisma.marketingConsent.upsert({
          where: {
            userId_consentType: {
              userId: request.userId,
              consentType: type,
            },
          },
          update: {
            status: 'GRANTED',
            grantedAt: new Date(),
            revokedAt: null,
            ipAddress: request.ipAddress,
            userAgent: request.userAgent,
            method: request.method,
          },
          create: {
            userId: request.userId,
            consentType: type,
            status: 'GRANTED',
            grantedAt: new Date(),
            ipAddress: request.ipAddress,
            userAgent: request.userAgent,
            consentText: request.consentText,
            consentVersion: request.consentVersion,
            method: request.method,
          },
        });

        // Log consent grant
        await this.logAudit({
          userId: request.userId,
          action: 'CONSENT_GRANTED',
          entityType: 'MarketingConsent',
          entityId: consent.id,
          details: { consentType: type, method: request.method },
          ipAddress: request.ipAddress,
        });

        return consent;
      })
    );

    return consents;
  }

  static async revokeConsent(params: {
    userId: string;
    consentTypes: string[];
    ipAddress?: string;
    reason?: string;
  }) {
    for (const type of params.consentTypes) {
      const consent = await prisma.marketingConsent.update({
        where: {
          userId_consentType: {
            userId: params.userId,
            consentType: type as any,
          },
        },
        data: {
          status: 'REVOKED',
          revokedAt: new Date(),
        },
      });

      // Create consent history
      await prisma.consentHistory.create({
        data: {
          consentId: consent.id,
          previousStatus: 'GRANTED',
          newStatus: 'REVOKED',
          reason: params.reason,
          ipAddress: params.ipAddress,
        },
      });

      // Log revocation
      await this.logAudit({
        userId: params.userId,
        action: 'CONSENT_REVOKED',
        entityType: 'MarketingConsent',
        entityId: consent.id,
        details: { consentType: type, reason: params.reason },
        ipAddress: params.ipAddress,
      });
    }
  }

  static async sendDoubleOptIn(params: { email: string; consentTypes: string[] }) {
    const token = nanoid(32);

    const optIn = await prisma.doubleOptIn.create({
      data: {
        email: params.email,
        token,
        consentTypes: params.consentTypes,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/confirm-subscription?token=${token}`;

    await EmailService.sendDoubleOptInEmail({
      to: params.email,
      confirmUrl,
    });

    return optIn;
  }

  static async confirmDoubleOptIn(params: { token: string; ipAddress?: string }) {
    const optIn = await prisma.doubleOptIn.findUnique({
      where: { token: params.token },
    });

    if (!optIn || optIn.status !== 'PENDING') {
      throw new Error('Invalid or expired confirmation token');
    }

    if (optIn.expiresAt < new Date()) {
      await prisma.doubleOptIn.update({
        where: { id: optIn.id },
        data: { status: 'EXPIRED' },
      });
      throw new Error('Confirmation link expired');
    }

    await prisma.doubleOptIn.update({
      where: { id: optIn.id },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        ipAddress: params.ipAddress,
      },
    });

    // Grant consents
    const user = await prisma.user.findUnique({
      where: { email: optIn.email },
    });

    if (user) {
      await this.grantConsent({
        userId: user.id,
        consentTypes: optIn.consentTypes as any[],
        method: 'EMAIL_CONFIRMATION',
        ipAddress: params.ipAddress,
        consentText: 'Confirmed via email',
        consentVersion: '1.0',
      });
    }
  }

  static async getUnsubscribeRequest(token: string) {
    return prisma.unsubscribeRequest.findUnique({
      where: { token },
    });
  }

  static async processUnsubscribe(params: {
    token: string;
    preferences: any;
    ipAddress?: string;
  }) {
    const request = await prisma.unsubscribeRequest.findUnique({
      where: { token: params.token },
    });

    if (!request) {
      throw new Error('Invalid unsubscribe token');
    }

    if (request.processedAt) {
      throw new Error('Unsubscribe already processed');
    }

    // Add to suppression list
    await prisma.emailSuppressionList.create({
      data: {
        email: request.email,
        reason: 'UNSUBSCRIBE',
        source: 'user_request',
      },
    });

    // Revoke consents
    if (request.userId) {
      await this.revokeConsent({
        userId: request.userId,
        consentTypes: params.preferences.consentTypes,
        ipAddress: params.ipAddress,
        reason: params.preferences.reason,
      });
    }

    await prisma.unsubscribeRequest.update({
      where: { id: request.id },
      data: {
        processedAt: new Date(),
        reason: params.preferences.reason,
        feedback: params.preferences.feedback,
      },
    });
  }

  static async getPreferences(userId: string) {
    return prisma.consentPreferenceCenter.findUnique({
      where: { userId },
    });
  }

  static async updatePreferences(data: any) {
    const preferences = await prisma.consentPreferenceCenter.upsert({
      where: { userId: data.userId },
      update: data,
      create: data,
    });

    await this.logAudit({
      userId: data.userId,
      action: 'PREFERENCE_UPDATED',
      entityType: 'ConsentPreferenceCenter',
      entityId: preferences.id,
      details: data,
    });

    return preferences;
  }

  static async exportUserData(params: {
    userId: string;
    dataTypes: string[];
    format: string;
  }) {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      include: {
        orders: true,
        ticketHolders: true,
        consents: true,
        events: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const exportData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      orders: user.orders,
      tickets: user.ticketHolders,
      consents: user.consents,
      events: user.events,
    };

    await this.logAudit({
      userId: params.userId,
      action: 'DATA_EXPORTED',
      entityType: 'User',
      entityId: params.userId,
      details: { dataTypes: params.dataTypes, format: params.format },
    });

    return exportData;
  }

  static async requestDataDeletion(params: {
    userId: string;
    requestType: string;
  }) {
    const deletion = await prisma.dataDeletionRequest.create({
      data: {
        userId: params.userId,
        requestType: params.requestType as any,
        status: 'PENDING',
      },
    });

    await this.logAudit({
      userId: params.userId,
      action: 'DATA_DELETED',
      entityType: 'DataDeletionRequest',
      entityId: deletion.id,
      details: { requestType: params.requestType },
    });

    return deletion;
  }

  static async getAuditLogs(params: {
    organizerId: string;
    startDate?: Date;
    endDate?: Date;
    action?: string;
  }) {
    return prisma.complianceAuditLog.findMany({
      where: {
        organizerId: params.organizerId,
        action: params.action as any,
        timestamp: {
          gte: params.startDate,
          lte: params.endDate,
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
  }

  static async generateComplianceReport(params: {
    organizerId: string;
    startDate: Date;
    endDate: Date;
  }): Promise<ComplianceReport> {
    // Get consent stats
    const consents = await prisma.marketingConsent.findMany({
      where: {
        user: {
          events: {
            some: { organizerId: params.organizerId },
          },
        },
        grantedAt: {
          gte: params.startDate,
          lte: params.endDate,
        },
      },
    });

    const consentsByType = consents.reduce((acc: any, c) => {
      acc[c.consentType] = (acc[c.consentType] || 0) + 1;
      return acc;
    }, {});

    const totalUsers = await prisma.user.count({
      where: {
        events: {
          some: { organizerId: params.organizerId },
        },
      },
    });

    const consentRates: any = {};
    Object.keys(consentsByType).forEach(type => {
      consentRates[type] = (consentsByType[type] / totalUsers) * 100;
    });

    // Get unsubscribe stats
    const unsubscribes = await prisma.unsubscribeRequest.count({
      where: {
        processedAt: {
          gte: params.startDate,
          lte: params.endDate,
        },
      },
    });

    // Calculate compliance score (0-100)
    const complianceScore = this.calculateComplianceScore({
      consentRates,
      unsubscribes,
      totalUsers,
    });

    return {
      period: { start: params.startDate, end: params.endDate },
      consentRates,
      optOutRates: {},
      emailsSent: 0, // Calculate from email logs
      unsubscribes,
      complaints: 0,
      bounces: 0,
      complianceScore,
      issues: [],
    };
  }

  private static async logAudit(data: any) {
    return prisma.complianceAuditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        details: data.details,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        organizerId: data.organizerId,
      },
    });
  }

  private static calculateComplianceScore(data: any): number {
    let score = 100;

    // Deduct for low consent rates
    const avgConsentRate = Object.values(data.consentRates).reduce(
      (sum: any, rate: any) => sum + rate,
      0
    ) / Object.keys(data.consentRates).length;

    if (avgConsentRate < 50) score -= 20;
    else if (avgConsentRate < 70) score -= 10;

    // Deduct for high unsubscribe rate
    const unsubRate = (data.unsubscribes / data.totalUsers) * 100;
    if (unsubRate > 5) score -= 20;
    else if (unsubRate > 2) score -= 10;

    return Math.max(score, 0);
  }
}
```

---

## Testing Requirements

### Unit Tests
- Consent grant and revoke logic
- Double opt-in flow
- Unsubscribe processing
- Data retention calculation
- Compliance score algorithm

### Integration Tests
- Complete consent lifecycle
- Double opt-in confirmation
- Unsubscribe with preference center
- Data export generation
- Audit log creation

### E2E Tests
- User grants marketing consent
- User updates preference center
- User unsubscribes via email link
- User confirms double opt-in
- Admin views compliance dashboard

---

## Dependencies

### Before
- [AUTH-001: User Authentication](../epic-001-auth/AUTH-001-user-authentication.md)
- MKT-001: Email Campaign Management

### After
- None (final compliance story)

---

## Definition of Done

- [ ] Prisma schema includes all compliance models
- [ ] GDPR consent management
- [ ] CAN-SPAM compliance features
- [ ] Unsubscribe management with preference center
- [ ] Double opt-in system
- [ ] Data retention policies
- [ ] Compliance audit logs
- [ ] Marketing consent dashboard
- [ ] Data export functionality
- [ ] Data deletion requests
- [ ] API routes tested and documented
- [ ] Unit tests achieve >80% coverage
- [ ] Integration tests pass
- [ ] E2E tests verify flows
- [ ] Legal review completed
- [ ] Code reviewed and approved
- [ ] Documentation complete

---

## Notes

- Consult legal counsel for compliance requirements
- Support multiple jurisdictions (GDPR, CCPA, etc.)
- Implement consent banners for website
- Store consent records for 7 years minimum
- Use encrypted storage for audit logs
- Provide compliance certification documents
- Regular compliance audits recommended
- Consider third-party compliance tools integration