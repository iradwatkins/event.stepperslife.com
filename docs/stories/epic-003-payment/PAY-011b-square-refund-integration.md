# Story: PAY-011b - Square Refund API Integration

**Epic**: EPIC-003 - Payment Processing Foundation
**Story Points**: 3
**Priority**: P1 (High)
**Status**: Not Started
**Parent Story**: PAY-011 (Refund Processing - 5 pts)
**Dependencies**: PAY-001 (Square SDK), PAY-011a (Refund Request Workflow)

---

## Story

**As an** event organizer who approved a refund
**I want** the refund to be processed automatically through Square
**So that** customers receive their money back without manual intervention

**As a** customer who was approved for a refund
**I want** my refund processed quickly and reliably
**So that** I receive my money back within the promised timeframe

---

## Acceptance Criteria

### AC1: Square Refund API Implementation
**Given** a refund request is approved (auto or manual)
**When** the system processes the refund
**Then** it should:
- Call Square Refunds API with payment ID
- Specify refund amount (full or partial)
- Include idempotency key to prevent duplicates
- Set reason for refund in Square
- Handle API response within 10 seconds
- Retry failed requests with exponential backoff
- Log all API calls and responses

### AC2: Full Refund Processing
**Given** a customer receives a full refund
**When** Square API is called
**Then** the system should:
- Refund 100% of original payment amount
- Include all fees (processing, platform)
- Update order status to REFUNDED
- Update all ticket statuses to REFUNDED
- Calculate organizer payout adjustment
- Create RefundTransaction record
- Send confirmation email to customer
- Notify organizer of completed refund

### AC3: Partial Refund Processing
**Given** only some tickets are refunded (future feature)
**When** partial refund is processed
**Then** the system should:
- Calculate prorated refund amount
- Refund only specified tickets
- Update only refunded ticket statuses
- Adjust order total accordingly
- Update order status to PARTIALLY_REFUNDED
- Log partial refund details
- Send itemized refund email

### AC4: Refund Status Tracking
**Given** a refund is processing
**When** Square responds with status
**Then** the system should track:
- PENDING: Refund initiated
- PROCESSING: Square is processing
- COMPLETED: Money returned to customer
- FAILED: Refund failed (with reason)

**And** update RefundRequest status accordingly
**And** store Square refund ID for reference
**And** log status changes with timestamps

### AC5: Webhook Handling for Refund Updates
**Given** Square sends webhook notifications
**When** refund status changes
**Then** the system should:
- Receive `refund.created` webhook
- Receive `refund.updated` webhook
- Verify webhook signature
- Update RefundTransaction status
- Notify customer of status changes
- Update financial reconciliation
- Log webhook events for audit

### AC6: Error Handling & Retries
**Given** Square API call fails
**When** processing refund
**Then** the system should:
- Retry up to 3 times with exponential backoff (1s, 2s, 4s)
- Handle specific error codes:
  - `INVALID_REQUEST_ERROR`: Log and alert admin
  - `RATE_LIMITED`: Wait and retry
  - `SERVICE_UNAVAILABLE`: Retry with backoff
  - `IDEMPOTENCY_KEY_REUSED`: Check if refund exists
  - `REFUND_ALREADY_PENDING`: Mark as duplicate
- Mark refund as FAILED after max retries
- Send failure notification to admin
- Provide manual resolution interface
- Never lose refund request data

### AC7: Financial Reconciliation
**Given** a refund is completed
**When** updating financial records
**Then** the system should:
- Deduct refund amount from organizer balance
- Adjust platform fee calculations
- Update revenue reports
- Track refund in payout calculations
- Create accounting entry
- Generate refund receipt for organizer
- Update event revenue totals
- Flag for reconciliation review if large amount

### AC8: Idempotency & Duplicate Prevention
**Given** a refund request might be retried
**When** calling Square API
**Then** the system must:
- Generate unique idempotency key per request
- Store key with RefundTransaction
- Check for existing refund before creating new
- Handle "already refunded" gracefully
- Prevent double refunds
- Log duplicate attempts
- Return existing refund if idempotent request

---

## Tasks / Subtasks

### Square API Integration
- [ ] Implement Square Refunds API client
  - [ ] File: `/lib/payments/square-refund.service.ts`
  - [ ] Configure Square SDK for refunds
  - [ ] Create refund API wrapper
  - [ ] Add authentication handling
  - [ ] Implement timeout configuration

- [ ] Build refund processing service
  - [ ] File: `/lib/services/refund-processor.service.ts`
  - [ ] Process approved refund requests
  - [ ] Call Square API with proper parameters
  - [ ] Handle full vs partial refunds
  - [ ] Manage idempotency keys
  - [ ] Implement retry logic

- [ ] Create refund queue system
  - [ ] Use BullMQ or similar for job queue
  - [ ] Process refunds asynchronously
  - [ ] Handle job failures
  - [ ] Implement retry policies
  - [ ] Monitor queue health

### API Endpoints
- [ ] Build refund processing endpoint
  - [ ] POST `/api/admin/refunds/[requestId]/process`
  - [ ] Validate admin permissions
  - [ ] Initiate Square refund
  - [ ] Return processing status
  - [ ] Handle errors gracefully

- [ ] Create refund status check endpoint
  - [ ] GET `/api/refunds/[requestId]/status`
  - [ ] Return current refund status
  - [ ] Include Square transaction details
  - [ ] Show timeline of status changes

- [ ] Implement webhook receiver
  - [ ] POST `/api/webhooks/square/refunds`
  - [ ] Verify Square signature
  - [ ] Parse webhook payload
  - [ ] Update refund status
  - [ ] Trigger notifications

### Database & Tracking
- [ ] Create RefundTransaction model
  - [ ] Update Prisma schema
  - [ ] Store Square refund details
  - [ ] Track status history
  - [ ] Link to RefundRequest

- [ ] Implement status tracking
  - [ ] Create status update function
  - [ ] Log all status changes
  - [ ] Store timestamps
  - [ ] Maintain audit trail

- [ ] Add financial reconciliation records
  - [ ] Create accounting entries
  - [ ] Update organizer balances
  - [ ] Adjust revenue calculations
  - [ ] Generate reports

### Error Handling & Retries
- [ ] Build retry mechanism
  - [ ] Exponential backoff strategy
  - [ ] Max retry limits
  - [ ] Error categorization
  - [ ] Dead letter queue

- [ ] Create error notification system
  - [ ] Alert admins of failures
  - [ ] Email organizers on issues
  - [ ] Provide resolution steps
  - [ ] Track error rates

- [ ] Build manual resolution interface
  - [ ] Admin page for failed refunds
  - [ ] Manual retry option
  - [ ] Override capability
  - [ ] Notes and documentation

### Notifications & Reporting
- [ ] Create refund completion email
  - [ ] Customer confirmation
  - [ ] Refund amount details
  - [ ] Expected timeline (5-10 days)
  - [ ] Reference numbers

- [ ] Build organizer notification
  - [ ] Refund processed alert
  - [ ] Financial impact summary
  - [ ] Updated payout calculation
  - [ ] Link to transaction details

- [ ] Generate refund reports
  - [ ] Daily refund summary
  - [ ] Failed refund alerts
  - [ ] Financial reconciliation report
  - [ ] Refund analytics

---

## Database Schema

```prisma
model RefundTransaction {
  id                String         @id @default(cuid())
  refundRequestId   String         @unique
  orderId           String

  // Square details
  squareRefundId    String?        @unique
  squarePaymentId   String
  idempotencyKey    String         @unique

  // Amounts
  refundAmount      Decimal        @db.Decimal(10, 2)
  processingFee     Decimal        @default(0) @db.Decimal(10, 2)
  platformFee       Decimal        @default(0) @db.Decimal(10, 2)
  totalRefunded     Decimal        @db.Decimal(10, 2)

  // Status tracking
  status            RefundTransactionStatus  @default(PENDING)
  statusHistory     Json           // Array of status changes with timestamps

  // Error handling
  errorCode         String?
  errorMessage      String?        @db.Text
  retryCount        Int            @default(0)
  lastRetryAt       DateTime?

  // Reconciliation
  reconciledAt      DateTime?
  reconciledBy      String?
  accountingEntryId String?

  // Metadata
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  completedAt       DateTime?

  // Relationships
  refundRequest     RefundRequest  @relation(fields: [refundRequestId], references: [id])
  order             Order          @relation(fields: [orderId], references: [id])

  @@index([squareRefundId])
  @@index([squarePaymentId])
  @@index([status])
  @@index([createdAt])
}

enum RefundTransactionStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}

// Add to Order model
model Order {
  // ... existing fields
  refundTransactions RefundTransaction[]
}
```

---

## Dev Notes

### Square Refunds API Integration

```typescript
// lib/payments/square-refund.service.ts

import { Client, Environment, ApiError } from 'square';
import crypto from 'crypto';

export class SquareRefundService {
  private client: Client;

  constructor() {
    this.client = new Client({
      environment: process.env.NODE_ENV === 'production'
        ? Environment.Production
        : Environment.Sandbox,
      accessToken: process.env.SQUARE_ACCESS_TOKEN!
    });
  }

  async createRefund(params: {
    paymentId: string;
    amountMoney: { amount: number; currency: string };
    reason?: string;
    idempotencyKey: string;
  }): Promise<RefundResult> {
    try {
      const response = await this.client.refundsApi.refundPayment({
        idempotencyKey: params.idempotencyKey,
        paymentId: params.paymentId,
        amountMoney: params.amountMoney,
        reason: params.reason || 'Customer refund request'
      });

      return {
        success: true,
        refundId: response.result.refund!.id!,
        status: response.result.refund!.status!,
        amountMoney: response.result.refund!.amountMoney!
      };
    } catch (error) {
      return this.handleRefundError(error);
    }
  }

  async getRefund(refundId: string): Promise<RefundResult> {
    try {
      const response = await this.client.refundsApi.getPaymentRefund(refundId);

      return {
        success: true,
        refundId: response.result.refund!.id!,
        status: response.result.refund!.status!,
        amountMoney: response.result.refund!.amountMoney!
      };
    } catch (error) {
      return this.handleRefundError(error);
    }
  }

  private handleRefundError(error: unknown): RefundResult {
    if (error instanceof ApiError) {
      const errors = error.result.errors || [];
      const firstError = errors[0];

      return {
        success: false,
        errorCode: firstError?.code || 'UNKNOWN_ERROR',
        errorMessage: firstError?.detail || 'Refund failed',
        category: firstError?.category
      };
    }

    return {
      success: false,
      errorCode: 'UNKNOWN_ERROR',
      errorMessage: 'An unexpected error occurred'
    };
  }

  generateIdempotencyKey(refundRequestId: string): string {
    return crypto
      .createHash('sha256')
      .update(`refund-${refundRequestId}-${Date.now()}`)
      .digest('hex')
      .substring(0, 32);
  }
}
```

### Refund Processing Service with Retry Logic

```typescript
// lib/services/refund-processor.service.ts

import { SquareRefundService } from '@/lib/payments/square-refund.service';
import { prisma } from '@/lib/prisma';

export class RefundProcessorService {
  private squareService: SquareRefundService;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

  constructor() {
    this.squareService = new SquareRefundService();
  }

  async processRefund(refundRequestId: string): Promise<void> {
    const refundRequest = await prisma.refundRequest.findUnique({
      where: { id: refundRequestId },
      include: { order: true }
    });

    if (!refundRequest || refundRequest.status !== 'APPROVED') {
      throw new Error('Invalid refund request');
    }

    // Create RefundTransaction record
    const idempotencyKey = this.squareService.generateIdempotencyKey(refundRequestId);

    let transaction = await prisma.refundTransaction.create({
      data: {
        refundRequestId,
        orderId: refundRequest.orderId,
        squarePaymentId: refundRequest.order.paymentId!,
        idempotencyKey,
        refundAmount: refundRequest.requestedAmount,
        totalRefunded: refundRequest.requestedAmount,
        status: 'PENDING',
        statusHistory: [
          {
            status: 'PENDING',
            timestamp: new Date().toISOString()
          }
        ]
      }
    });

    // Process with retry logic
    let attempt = 0;
    let lastError: any;

    while (attempt < this.MAX_RETRIES) {
      try {
        const result = await this.squareService.createRefund({
          paymentId: refundRequest.order.paymentId!,
          amountMoney: {
            amount: Math.round(refundRequest.requestedAmount.toNumber() * 100), // Convert to cents
            currency: 'USD'
          },
          reason: refundRequest.reason,
          idempotencyKey
        });

        if (result.success) {
          // Update transaction with Square refund ID
          transaction = await this.updateTransactionStatus(
            transaction.id,
            'PROCESSING',
            result.refundId!
          );

          // Update refund request
          await prisma.refundRequest.update({
            where: { id: refundRequestId },
            data: {
              status: 'PROCESSING',
              processedAt: new Date()
            }
          });

          // Send confirmation email
          await this.sendRefundProcessingEmail(refundRequest);

          return;
        } else {
          lastError = result;

          // Check if we should retry
          if (this.shouldRetry(result.errorCode)) {
            attempt++;
            if (attempt < this.MAX_RETRIES) {
              await this.delay(this.RETRY_DELAYS[attempt - 1]);
              continue;
            }
          } else {
            // Non-retryable error
            break;
          }
        }
      } catch (error) {
        lastError = error;
        attempt++;
        if (attempt < this.MAX_RETRIES) {
          await this.delay(this.RETRY_DELAYS[attempt - 1]);
        }
      }
    }

    // All retries failed
    await this.handleRefundFailure(transaction.id, lastError);
  }

  private shouldRetry(errorCode?: string): boolean {
    const retryableCodes = [
      'SERVICE_UNAVAILABLE',
      'RATE_LIMITED',
      'GATEWAY_TIMEOUT',
      'NETWORK_ERROR'
    ];

    return errorCode ? retryableCodes.includes(errorCode) : false;
  }

  private async updateTransactionStatus(
    transactionId: string,
    status: string,
    squareRefundId?: string
  ): Promise<any> {
    const transaction = await prisma.refundTransaction.findUnique({
      where: { id: transactionId }
    });

    const statusHistory = [...(transaction!.statusHistory as any[]), {
      status,
      timestamp: new Date().toISOString()
    }];

    return prisma.refundTransaction.update({
      where: { id: transactionId },
      data: {
        status,
        squareRefundId,
        statusHistory,
        updatedAt: new Date()
      }
    });
  }

  private async handleRefundFailure(transactionId: string, error: any): Promise<void> {
    await prisma.refundTransaction.update({
      where: { id: transactionId },
      data: {
        status: 'FAILED',
        errorCode: error.errorCode || 'UNKNOWN',
        errorMessage: error.errorMessage || 'Refund processing failed',
        retryCount: this.MAX_RETRIES
      }
    });

    // Alert admins
    await this.alertAdminsOfFailure(transactionId, error);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## Testing

### Unit Tests
- [ ] Square API client methods
- [ ] Retry logic with exponential backoff
- [ ] Error handling for each error type
- [ ] Idempotency key generation
- [ ] Status tracking updates

### Integration Tests
- [ ] Full refund processing flow
- [ ] Partial refund calculation
- [ ] Webhook signature verification
- [ ] Database transaction consistency
- [ ] Email notification delivery

### Edge Cases
- [ ] Duplicate refund requests
- [ ] Network timeout during refund
- [ ] Square API rate limiting
- [ ] Invalid payment ID
- [ ] Refund amount exceeds original payment
- [ ] Multiple simultaneous webhooks

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-09-30 | BMAD SM Agent | Initial sharded story from PAY-011 |

---

*Sharded from PAY-011 (5 pts) - Part 2 of 2*
*Depends on: PAY-011a - Refund Request & Approval Workflow (2 pts)*
*Generated by BMAD SM Agent*