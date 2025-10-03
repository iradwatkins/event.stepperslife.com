# SEC-003: CCPA Compliance

**Epic:** EPIC-012 Performance & Security
**Story Points:** 5
**Priority:** High
**Status:** Ready for Development

---

## User Story

**As a** California resident
**I want** to exercise my privacy rights under CCPA
**So that** I can access, delete, or opt-out of the sale of my personal information

---

## Acceptance Criteria

### Functional Requirements
- [ ] Privacy policy clearly explaining data collection and use
- [ ] "Do Not Sell My Personal Information" opt-out mechanism
- [ ] Data access request portal for users
- [ ] Data deletion request workflow
- [ ] Automated data export in machine-readable format
- [ ] User consent management system
- [ ] Third-party data sharing disclosure
- [ ] Privacy rights request verification
- [ ] 45-day response time tracking
- [ ] Record of consumer requests maintained

### CCPA Rights Implementation
- [ ] **Right to Know**: Users can request what personal data is collected
- [ ] **Right to Delete**: Users can request deletion of their data
- [ ] **Right to Opt-Out**: Users can opt-out of data sales
- [ ] **Right to Non-Discrimination**: No penalties for exercising rights
- [ ] **Right to Correct**: Users can correct inaccurate data (CPRA)

### Technical Requirements
- [ ] Data inventory and mapping
- [ ] Personal information categories documented
- [ ] Data retention policies enforced
- [ ] Secure data export mechanism
- [ ] Anonymization for deleted user data
- [ ] Audit trail of privacy requests
- [ ] API for privacy rights automation

---

## Technical Specifications

### Data Inventory Schema

```typescript
// lib/privacy/data-inventory.ts
export interface PersonalInformationCategory {
  category: string;
  examples: string[];
  collected: boolean;
  disclosed: boolean;
  sold: boolean;
  purposes: string[];
  retentionPeriod: string;
}

export const dataInventory: PersonalInformationCategory[] = [
  {
    category: 'Identifiers',
    examples: ['Name', 'Email', 'Phone', 'IP Address', 'User ID'],
    collected: true,
    disclosed: true,
    sold: false,
    purposes: [
      'Account creation',
      'Communication',
      'Fraud prevention',
      'Service delivery',
    ],
    retentionPeriod: 'Account lifetime + 7 years',
  },
  {
    category: 'Commercial Information',
    examples: ['Purchase history', 'Ticket orders', 'Payment methods'],
    collected: true,
    disclosed: true,
    sold: false,
    purposes: [
      'Order fulfillment',
      'Payment processing',
      'Customer support',
      'Analytics',
    ],
    retentionPeriod: '7 years (SOX compliance)',
  },
  {
    category: 'Financial Information',
    examples: ['Payment card last 4 digits', 'Billing address'],
    collected: true,
    disclosed: true,
    sold: false,
    purposes: ['Payment processing'],
    retentionPeriod: 'Tokenized, no full card storage',
  },
  {
    category: 'Internet Activity',
    examples: ['Browsing history', 'Search queries', 'Page views'],
    collected: true,
    disclosed: false,
    sold: false,
    purposes: ['Analytics', 'User experience improvement'],
    retentionPeriod: '2 years',
  },
  {
    category: 'Geolocation Data',
    examples: ['IP-based location', 'Event check-in location'],
    collected: true,
    disclosed: false,
    sold: false,
    purposes: ['Event check-in', 'Fraud prevention', 'Analytics'],
    retentionPeriod: '1 year',
  },
];
```

### Privacy Request Service

```typescript
// lib/privacy/privacy-request.service.ts
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/services/email';
import { AuditLogger } from '@/lib/audit/audit-logger';
import { AuditEventType, AuditSeverity } from '@/lib/audit/types';

export enum PrivacyRequestType {
  ACCESS = 'ACCESS',
  DELETE = 'DELETE',
  OPT_OUT = 'OPT_OUT',
  CORRECT = 'CORRECT',
}

export enum PrivacyRequestStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

export class PrivacyRequestService {
  private auditLogger = new AuditLogger();

  async createRequest(
    userId: string,
    type: PrivacyRequestType,
    details?: string
  ): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, lastName: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Create verification token
    const verificationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const request = await prisma.privacyRequest.create({
      data: {
        userId,
        type,
        status: PrivacyRequestStatus.PENDING,
        details,
        verificationToken,
        verificationTokenExpiresAt: expiresAt,
        dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
      },
    });

    // Send verification email
    await sendEmail({
      to: user.email,
      subject: 'Verify Your Privacy Rights Request',
      template: 'privacy-request-verification',
      data: {
        name: `${user.firstName} ${user.lastName}`,
        requestType: type,
        verificationLink: `${process.env.NEXT_PUBLIC_APP_URL}/privacy/verify?token=${verificationToken}`,
        expiresIn: '24 hours',
      },
    });

    // Audit log
    await this.auditLogger.log({
      eventType: AuditEventType.DATA_ACCESSED,
      severity: AuditSeverity.INFO,
      userId,
      userEmail: user.email,
      ipAddress: 'system',
      userAgent: 'system',
      action: `Privacy request created: ${type}`,
      outcome: 'success',
      correlationId: request.id,
      details: { requestType: type },
    });

    return request.id;
  }

  async verifyRequest(token: string): Promise<boolean> {
    const request = await prisma.privacyRequest.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExpiresAt: { gte: new Date() },
        status: PrivacyRequestStatus.PENDING,
      },
    });

    if (!request) {
      return false;
    }

    await prisma.privacyRequest.update({
      where: { id: request.id },
      data: {
        status: PrivacyRequestStatus.VERIFIED,
        verificationToken: null,
        verificationTokenExpiresAt: null,
      },
    });

    // Process the request
    await this.processRequest(request.id);

    return true;
  }

  private async processRequest(requestId: string): Promise<void> {
    const request = await prisma.privacyRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request || request.status !== PrivacyRequestStatus.VERIFIED) {
      return;
    }

    await prisma.privacyRequest.update({
      where: { id: requestId },
      data: { status: PrivacyRequestStatus.IN_PROGRESS },
    });

    try {
      switch (request.type) {
        case PrivacyRequestType.ACCESS:
          await this.handleAccessRequest(request);
          break;
        case PrivacyRequestType.DELETE:
          await this.handleDeleteRequest(request);
          break;
        case PrivacyRequestType.OPT_OUT:
          await this.handleOptOutRequest(request);
          break;
        case PrivacyRequestType.CORRECT:
          await this.handleCorrectRequest(request);
          break;
      }

      await prisma.privacyRequest.update({
        where: { id: requestId },
        data: {
          status: PrivacyRequestStatus.COMPLETED,
          completedAt: new Date(),
        },
      });
    } catch (error) {
      await prisma.privacyRequest.update({
        where: { id: requestId },
        data: {
          status: PrivacyRequestStatus.REJECTED,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  private async handleAccessRequest(request: any): Promise<void> {
    const userData = await this.exportUserData(request.userId);

    // Send data export email
    await sendEmail({
      to: request.user.email,
      subject: 'Your Personal Data Export',
      template: 'data-export',
      data: {
        name: `${request.user.firstName} ${request.user.lastName}`,
        downloadLink: await this.uploadDataExport(userData, request.userId),
        expiresIn: '7 days',
      },
    });

    // Audit log
    await this.auditLogger.log({
      eventType: AuditEventType.DATA_EXPORTED,
      severity: AuditSeverity.INFO,
      userId: request.userId,
      userEmail: request.user.email,
      ipAddress: 'system',
      userAgent: 'system',
      action: 'User data exported for CCPA access request',
      outcome: 'success',
      correlationId: request.id,
    });
  }

  private async handleDeleteRequest(request: any): Promise<void> {
    // Anonymize user data (cannot delete due to legal retention requirements)
    await prisma.user.update({
      where: { id: request.userId },
      data: {
        email: `deleted-${request.userId}@anonymized.local`,
        firstName: 'Deleted',
        lastName: 'User',
        phone: null,
        emailVerified: null,
        image: null,
        // Keep financial records for SOX compliance
      },
    });

    // Mark orders as anonymized
    await prisma.order.updateMany({
      where: { userId: request.userId },
      data: {
        customerEmail: 'anonymized@deleted.local',
        customerName: 'Deleted User',
      },
    });

    // Delete non-essential data
    await Promise.all([
      prisma.session.deleteMany({ where: { userId: request.userId } }),
      prisma.account.deleteMany({ where: { userId: request.userId } }),
    ]);

    // Send confirmation
    await sendEmail({
      to: request.user.email,
      subject: 'Your Data Deletion Request Has Been Completed',
      template: 'data-deletion-complete',
      data: {
        name: `${request.user.firstName} ${request.user.lastName}`,
      },
    });

    // Audit log
    await this.auditLogger.log({
      eventType: AuditEventType.DATA_DELETED,
      severity: AuditSeverity.WARNING,
      userId: request.userId,
      userEmail: request.user.email,
      ipAddress: 'system',
      userAgent: 'system',
      action: 'User data deleted per CCPA request',
      outcome: 'success',
      correlationId: request.id,
    });
  }

  private async handleOptOutRequest(request: any): Promise<void> {
    await prisma.user.update({
      where: { id: request.userId },
      data: {
        ccpaOptOut: true,
        ccpaOptOutDate: new Date(),
      },
    });

    // Send confirmation
    await sendEmail({
      to: request.user.email,
      subject: 'Data Sale Opt-Out Confirmed',
      template: 'opt-out-confirmation',
      data: {
        name: `${request.user.firstName} ${request.user.lastName}`,
      },
    });
  }

  private async handleCorrectRequest(request: any): Promise<void> {
    // CPRA (California Privacy Rights Act) addition
    // Manual review required - send to admin
    await sendEmail({
      to: process.env.ADMIN_EMAIL!,
      subject: 'Data Correction Request Needs Review',
      template: 'admin-correction-request',
      data: {
        userId: request.userId,
        userEmail: request.user.email,
        details: request.details,
        requestId: request.id,
      },
    });
  }

  private async exportUserData(userId: string): Promise<any> {
    const [user, orders, events, checkIns] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.order.findMany({ where: { userId } }),
      prisma.event.findMany({ where: { createdById: userId } }),
      prisma.checkIn.findMany({ where: { userId } }),
    ]);

    return {
      personalInformation: {
        id: user?.id,
        email: user?.email,
        firstName: user?.firstName,
        lastName: user?.lastName,
        phone: user?.phone,
        createdAt: user?.createdAt,
      },
      orders: orders.map((order) => ({
        id: order.id,
        eventId: order.eventId,
        amount: order.totalAmount,
        currency: order.currency,
        status: order.status,
        createdAt: order.createdAt,
      })),
      eventsCreated: events.map((event) => ({
        id: event.id,
        title: event.title,
        createdAt: event.createdAt,
      })),
      checkIns: checkIns.map((checkIn) => ({
        eventId: checkIn.eventId,
        checkedInAt: checkIn.checkedInAt,
      })),
    };
  }

  private async uploadDataExport(data: any, userId: string): Promise<string> {
    // Upload to S3 or similar with expiring link
    // Implementation here
    return `https://exports.example.com/${userId}/data.json?expires=...`;
  }
}
```

### CCPA Opt-Out Banner

```typescript
// components/privacy/CCPABanner.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function CCPABanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasAccepted = localStorage.getItem('ccpa-banner-dismissed');
    if (!hasAccepted) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('ccpa-banner-dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm">
            We collect and use your personal information as described in our{' '}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>
            . California residents have additional rights.{' '}
            <Link href="/privacy/ccpa" className="underline font-semibold">
              Do Not Sell My Personal Information
            </Link>
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="ml-4 px-4 py-2 bg-white text-gray-900 rounded hover:bg-gray-100"
        >
          Got It
        </button>
      </div>
    </div>
  );
}
```

### Privacy Portal Page

```typescript
// app/privacy/portal/page.tsx
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { PrivacyRequestType } from '@/lib/privacy/privacy-request.service';

export default function PrivacyPortalPage() {
  const { data: session } = useSession();
  const [selectedRequest, setSelectedRequest] = useState<PrivacyRequestType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitRequest = async () => {
    if (!selectedRequest) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/privacy/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selectedRequest }),
      });

      if (response.ok) {
        alert('Your request has been submitted. Please check your email to verify.');
      } else {
        alert('Failed to submit request. Please try again.');
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Your Privacy Rights</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Right to Know</h2>
          <p className="text-gray-600 mb-4">
            Request a copy of the personal information we have collected about you.
          </p>
          <button
            onClick={() => setSelectedRequest(PrivacyRequestType.ACCESS)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Request My Data
          </button>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Right to Delete</h2>
          <p className="text-gray-600 mb-4">
            Request deletion of your personal information (subject to legal exceptions).
          </p>
          <button
            onClick={() => setSelectedRequest(PrivacyRequestType.DELETE)}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Delete My Data
          </button>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Right to Opt-Out</h2>
          <p className="text-gray-600 mb-4">
            Opt-out of the sale of your personal information to third parties.
          </p>
          <button
            onClick={() => setSelectedRequest(PrivacyRequestType.OPT_OUT)}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Opt-Out of Data Sales
          </button>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Right to Correct</h2>
          <p className="text-gray-600 mb-4">
            Request correction of inaccurate personal information.
          </p>
          <button
            onClick={() => setSelectedRequest(PrivacyRequestType.CORRECT)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Correct My Data
          </button>
        </div>
      </div>

      {selectedRequest && (
        <div className="mt-8 border rounded-lg p-6 bg-blue-50">
          <h3 className="text-lg font-semibold mb-4">Confirm Your Request</h3>
          <p className="mb-4">
            You are about to submit a {selectedRequest.toLowerCase()} request.
            We will send a verification email to {session?.user?.email}.
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleSubmitRequest}
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Confirm Request'}
            </button>
            <button
              onClick={() => setSelectedRequest(null)}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Implementation Details

### Database Schema

```prisma
model User {
  // ... existing fields
  ccpaOptOut        Boolean?  @default(false)
  ccpaOptOutDate    DateTime?
  privacyRequests   PrivacyRequest[]
}

model PrivacyRequest {
  id                          String   @id @default(cuid())
  userId                      String
  user                        User     @relation(fields: [userId], references: [id])

  type                        String   // ACCESS, DELETE, OPT_OUT, CORRECT
  status                      String   // PENDING, VERIFIED, IN_PROGRESS, COMPLETED, REJECTED
  details                     String?
  errorMessage                String?

  verificationToken           String?  @unique
  verificationTokenExpiresAt  DateTime?

  dueDate                     DateTime
  completedAt                 DateTime?

  createdAt                   DateTime @default(now())
  updatedAt                   DateTime @updatedAt

  @@index([userId])
  @@index([status])
}
```

---

## Testing Requirements

```typescript
describe('CCPA Compliance', () => {
  it('should allow user to submit access request', async () => {
    const service = new PrivacyRequestService();
    const requestId = await service.createRequest('user-123', PrivacyRequestType.ACCESS);

    expect(requestId).toBeDefined();
  });

  it('should export all user data', async () => {
    const service = new PrivacyRequestService();
    const data = await service['exportUserData']('user-123');

    expect(data.personalInformation).toBeDefined();
    expect(data.orders).toBeDefined();
  });

  it('should anonymize user on deletion request', async () => {
    const service = new PrivacyRequestService();
    await service['handleDeleteRequest']({ userId: 'user-123', user: { email: 'test@test.com' } });

    const user = await prisma.user.findUnique({ where: { id: 'user-123' } });
    expect(user?.email).toContain('deleted-');
  });
});
```

---

## Monitoring and Alerting

### Key Metrics
- Privacy requests by type
- Average response time
- Requests overdue (>45 days)
- Opt-out rate

### Alerts
- Critical: Privacy request overdue
- Warning: High volume of deletion requests

---

## Dependencies
- prisma
- nodemailer or similar

## Related Stories
- SEC-002: Security Audit Logging
- SEC-005: PCI Compliance

---

**Notes:**
- CCPA applies to California residents only
- Financial records must be retained for SOX compliance
- Verify user identity before processing requests
- Maintain audit trail of all privacy requests