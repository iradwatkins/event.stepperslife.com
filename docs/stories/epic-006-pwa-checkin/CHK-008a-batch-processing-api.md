# Story: CHK-008a - Batch Processing API

**Epic**: EPIC-006 - Mobile Check-in PWA
**Story Points**: 2
**Priority**: P2 (Medium)
**Status**: Not Started
**Parent Story**: CHK-008 (Bulk Check-in Operations - 5 pts)
**Dependencies**: TIX-003 (Ticket Validation), CHK-005 (Multi-Device Sync)

---

## Story

**As a** system processing bulk check-ins
**I want** efficient batch processing with proper error handling
**So that** large groups can be checked in quickly without overloading the system

**As an** event staff member
**I want** reliable batch operations that don't fail completely on single errors
**So that** I can process groups efficiently even if some tickets have issues

---

## Acceptance Criteria

### AC1: Bulk Check-In Endpoint
**Given** staff needs to check in multiple tickets
**When** calling the bulk endpoint
**Then** it should:
- Accept POST `/api/events/[eventId]/check-in/bulk`
- Require authentication (staff role)
- Accept array of ticket IDs (max 10 per request)
- Validate all ticket IDs format before processing
- Return immediately with operation ID (202 Accepted)
- Process asynchronously in background
- Track operation status in database
- Support idempotency (same operationId → same result)
- Rate limit: 5 bulk operations per minute per staff

**Request format**:
```typescript
{
  ticketIds: string[],          // Max 10
  staffId: string,
  deviceId: string,
  location?: string,
  operationType: 'MANUAL' | 'VIP' | 'GROUP',
  operationId?: string          // Optional for idempotency
}
```

**Response format**:
```typescript
{
  operationId: string,
  status: 'QUEUED',
  totalCount: number,
  message: 'Bulk check-in queued for processing'
}
```

### AC2: Concurrent Processing with Limits
**Given** bulk operation is processing
**When** handling multiple tickets
**Then** the system should:
- Process up to 10 tickets concurrently
- Use database transaction per ticket (atomic)
- Continue processing on individual failures
- Collect all results (success + failures)
- Track progress in real-time
- Update operation status continuously
- Complete within 3 seconds for 10 tickets
- Scale to 50+ tickets (in batches of 10)

### AC3: Transaction Handling
**Given** each ticket needs validation
**When** processing individual ticket
**Then** use database transaction:
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Lock ticket row
  const ticket = await tx.ticket.findUnique({
    where: { id: ticketId },
    // SELECT FOR UPDATE
  });

  // 2. Validate ticket status
  if (ticket.status === 'CHECKED_IN') {
    throw new Error('Already checked in');
  }

  // 3. Update ticket
  await tx.ticket.update({
    where: { id: ticketId },
    data: {
      status: 'CHECKED_IN',
      checkedInAt: new Date(),
      checkedInBy: staffId,
      checkInLocation: location,
      bulkOperationId: operationId
    }
  });

  // 4. Create check-in log
  await tx.checkInLog.create({
    data: {
      ticketId,
      eventId,
      staffId,
      bulkOperationId: operationId,
      status: 'VALID'
    }
  });
});
```

**Transaction guarantees**:
- All updates atomic per ticket
- Isolation from other operations
- Automatic rollback on error
- Consistent state always

### AC4: Progress Tracking with WebSocket
**Given** bulk operation is processing
**When** progress updates occur
**Then** broadcast via WebSocket:

**Progress Event** (every 10% or 1 second):
```typescript
{
  type: 'BULK_PROGRESS',
  operationId: string,
  processed: number,
  total: number,
  percentage: number,
  successCount: number,
  failureCount: number,
  currentBatch: number
}
```

**Completion Event**:
```typescript
{
  type: 'BULK_COMPLETE',
  operationId: string,
  results: {
    total: number,
    successful: number,
    failed: number,
    duration: number,        // milliseconds
    throughput: number       // tickets/second
  },
  failures: Array<{
    ticketId: string,
    reason: string,
    errorCode: string
  }>
}
```

### AC5: Rollback Capability
**Given** critical error during bulk operation
**When** operation needs cancellation
**Then** support rollback:
- Cancel endpoint: POST `/api/check-in/bulk/[operationId]/cancel`
- Stop processing remaining tickets
- Mark operation as CANCELLED
- Optionally undo successful check-ins (soft delete)
- Create rollback audit log
- Notify via WebSocket
- Require manager+ permission for rollback

**Soft Delete Approach**:
```typescript
// Don't actually delete, mark as deleted
await prisma.checkInLog.updateMany({
  where: { bulkOperationId: operationId },
  data: {
    deleted: true,
    deletedAt: new Date(),
    deletedBy: managerId,
    deleteReason: 'Bulk operation rollback'
  }
});

// Update tickets back to ISSUED
await prisma.ticket.updateMany({
  where: { bulkOperationId: operationId },
  data: {
    status: 'ISSUED',
    checkedInAt: null,
    checkedInBy: null,
    bulkOperationId: null
  }
});
```

### AC6: Operation Status Tracking
**Given** bulk operation exists
**When** checking status
**Then** support status query:

**Endpoint**: GET `/api/check-in/bulk/[operationId]/status`

**Response**:
```typescript
{
  operationId: string,
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED',
  progress: {
    total: number,
    processed: number,
    successful: number,
    failed: number,
    percentage: number
  },
  createdAt: string,
  startedAt?: string,
  completedAt?: string,
  duration?: number,
  staffId: string,
  eventId: string,
  operationType: string,
  failures?: Array<FailureDetail>
}
```

### AC7: Error Handling & Reporting
**Given** individual tickets fail during bulk
**When** collecting failures
**Then** categorize and report:

| Error Type | Action | Reported As |
|------------|--------|-------------|
| Already checked-in | Continue | 'DUPLICATE' |
| Ticket not found | Continue | 'NOT_FOUND' |
| Invalid ticket | Continue | 'INVALID' |
| Refunded ticket | Continue | 'REFUNDED' |
| Database error | Retry 3x | 'DB_ERROR' |
| Timeout | Skip | 'TIMEOUT' |

**Failure Report**:
```typescript
{
  ticketId: 'TKT-123',
  attendeeName: 'John Doe',
  reason: 'Ticket already checked in',
  errorCode: 'DUPLICATE',
  checkedInBy: 'Jane Smith',
  checkedInAt: '2025-09-30T14:30:00Z',
  canRetry: false,
  canOverride: true  // If manager
}
```

---

## Tasks / Subtasks

### API Endpoints
- [ ] Create bulk check-in endpoint
  - [ ] File: `/app/api/events/[eventId]/check-in/bulk/route.ts`
  - [ ] POST handler with auth
  - [ ] Validate request body
  - [ ] Generate operation ID
  - [ ] Queue for processing
  - [ ] Return 202 response

- [ ] Build operation status endpoint
  - [ ] GET `/api/check-in/bulk/[operationId]/status`
  - [ ] Query operation from database
  - [ ] Return current status
  - [ ] Include progress details

- [ ] Create cancellation endpoint
  - [ ] POST `/api/check-in/bulk/[operationId]/cancel`
  - [ ] Verify manager permission
  - [ ] Stop processing
  - [ ] Perform rollback if requested
  - [ ] Log cancellation

### Batch Processor
- [ ] Implement bulk processor service
  - [ ] File: `/lib/check-in/bulk-processor.ts`
  - [ ] Process in batches of 10
  - [ ] Handle concurrency
  - [ ] Track progress
  - [ ] Collect results
  - [ ] Handle errors

- [ ] Create transaction wrapper
  - [ ] Atomic ticket check-in
  - [ ] Lock ticket row
  - [ ] Update status
  - [ ] Create log entry
  - [ ] Rollback on error

- [ ] Build progress tracker
  - [ ] Track operation progress
  - [ ] Emit WebSocket events
  - [ ] Update database status
  - [ ] Calculate metrics

### Database Schema
- [ ] Create BulkCheckInOperation model
  - [ ] Update Prisma schema
  - [ ] Store operation metadata
  - [ ] Track status and progress
  - [ ] Link to check-ins

- [ ] Add bulkOperationId to CheckInLog
  - [ ] Foreign key to operation
  - [ ] Enable grouping
  - [ ] Support rollback

### Job Queue
- [ ] Set up job queue (BullMQ)
  - [ ] Install dependencies
  - [ ] Configure Redis connection
  - [ ] Create bulk-checkin queue
  - [ ] Define job processor

- [ ] Implement job handlers
  - [ ] Process bulk operation job
  - [ ] Handle job failures
  - [ ] Retry logic
  - [ ] Job completion

### Progress Broadcasting
- [ ] Integrate with WebSocket
  - [ ] Emit progress events
  - [ ] Broadcast completion
  - [ ] Send to specific device
  - [ ] Handle connection drops

- [ ] Create progress calculator
  - [ ] Calculate percentage
  - [ ] Track timing
  - [ ] Estimate completion
  - [ ] Measure throughput

### Error Handling
- [ ] Build error classifier
  - [ ] Categorize errors
  - [ ] Determine retry logic
  - [ ] Format error messages
  - [ ] Track error counts

- [ ] Create failure reporter
  - [ ] Collect all failures
  - [ ] Format for display
  - [ ] Generate report
  - [ ] Store in database

---

## Database Schema

```prisma
model BulkCheckInOperation {
  id              String           @id @default(cuid())
  operationId     String           @unique @default(cuid())
  eventId         String
  staffId         String
  deviceId        String

  // Operation details
  operationType   BulkOperationType
  status          BulkOperationStatus @default(QUEUED)

  // Progress tracking
  totalCount      Int
  processedCount  Int              @default(0)
  successCount    Int              @default(0)
  failureCount    Int              @default(0)

  // Timing
  createdAt       DateTime         @default(now())
  startedAt       DateTime?
  completedAt     DateTime?
  duration        Int?             // milliseconds

  // Rollback
  cancelled       Boolean          @default(false)
  cancelledAt     DateTime?
  cancelledBy     String?
  rolledBack      Boolean          @default(false)

  // Relationships
  event           Event            @relation(fields: [eventId], references: [id])
  staff           User             @relation(fields: [staffId], references: [id])
  checkIns        CheckInLog[]

  @@index([operationId])
  @@index([eventId])
  @@index([staffId])
  @@index([status])
  @@index([createdAt])
}

enum BulkOperationType {
  MANUAL
  VIP_FAST_TRACK
  GROUP
}

enum BulkOperationStatus {
  QUEUED
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}

// Add to CheckInLog
model CheckInLog {
  // ... existing fields
  bulkOperationId String?
  bulkOperation   BulkCheckInOperation? @relation(fields: [bulkOperationId], references: [id])

  @@index([bulkOperationId])
}
```

---

## Dev Notes

### Bulk Processor Implementation

```typescript
// lib/check-in/bulk-processor.ts

import { prisma } from '@/lib/prisma';
import { WebSocketServer } from '@/server/websocket/socket-server';

interface BulkCheckInParams {
  ticketIds: string[];
  eventId: string;
  staffId: string;
  deviceId: string;
  location?: string;
  operationType: BulkOperationType;
}

export class BulkCheckInProcessor {
  private readonly BATCH_SIZE = 10;
  private ws: WebSocketServer;

  constructor(websocket: WebSocketServer) {
    this.ws = websocket;
  }

  async process(params: BulkCheckInParams): Promise<BulkResult> {
    const operationId = this.generateOperationId();

    // Create operation record
    const operation = await prisma.bulkCheckInOperation.create({
      data: {
        operationId,
        eventId: params.eventId,
        staffId: params.staffId,
        deviceId: params.deviceId,
        operationType: params.operationType,
        totalCount: params.ticketIds.length,
        status: 'PROCESSING',
        startedAt: new Date()
      }
    });

    const results: CheckInResult[] = [];
    const ticketIds = params.ticketIds;

    // Process in batches
    for (let i = 0; i < ticketIds.length; i += this.BATCH_SIZE) {
      const batch = ticketIds.slice(i, i + this.BATCH_SIZE);

      // Process batch concurrently
      const batchResults = await Promise.allSettled(
        batch.map(ticketId =>
          this.checkInTicket({
            ticketId,
            eventId: params.eventId,
            staffId: params.staffId,
            deviceId: params.deviceId,
            location: params.location,
            operationId
          })
        )
      );

      // Collect results
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            error: result.reason
          });
        }
      }

      // Update progress
      await this.updateProgress(operation.id, results);

      // Broadcast progress
      this.broadcastProgress(params.eventId, operationId, results.length, ticketIds.length);
    }

    // Complete operation
    const summary = this.summarizeResults(results);
    await this.completeOperation(operation.id, summary);

    // Broadcast completion
    this.broadcastCompletion(params.eventId, operationId, summary);

    return {
      operationId,
      ...summary
    };
  }

  private async checkInTicket(params: {
    ticketId: string;
    eventId: string;
    staffId: string;
    deviceId: string;
    location?: string;
    operationId: string;
  }): Promise<CheckInResult> {
    try {
      return await prisma.$transaction(async (tx) => {
        // Lock and fetch ticket
        const ticket = await tx.ticket.findUnique({
          where: { id: params.ticketId },
          include: { user: true }
        });

        if (!ticket) {
          return {
            success: false,
            ticketId: params.ticketId,
            error: 'Ticket not found',
            errorCode: 'NOT_FOUND'
          };
        }

        if (ticket.status === 'CHECKED_IN') {
          return {
            success: false,
            ticketId: params.ticketId,
            error: 'Already checked in',
            errorCode: 'DUPLICATE'
          };
        }

        // Update ticket
        await tx.ticket.update({
          where: { id: params.ticketId },
          data: {
            status: 'CHECKED_IN',
            checkedInAt: new Date(),
            checkedInBy: params.staffId,
            checkInLocation: params.location
          }
        });

        // Create check-in log
        await tx.checkInLog.create({
          data: {
            ticketId: params.ticketId,
            eventId: params.eventId,
            orderId: ticket.orderId,
            staffMemberId: params.staffId,
            deviceId: params.deviceId,
            location: params.location,
            status: 'VALID',
            bulkOperationId: params.operationId,
            attendeeName: ticket.user.name,
            attendeeEmail: ticket.user.email,
            ticketTier: ticket.tier,
            qrData: '',
            signatureValid: true,
            online: true
          }
        });

        return {
          success: true,
          ticketId: params.ticketId,
          attendeeName: ticket.user.name
        };
      }, {
        timeout: 10000,
        isolationLevel: 'ReadCommitted'
      });
    } catch (error: any) {
      return {
        success: false,
        ticketId: params.ticketId,
        error: error.message,
        errorCode: 'DB_ERROR'
      };
    }
  }

  private async updateProgress(
    operationId: string,
    results: CheckInResult[]
  ): Promise<void> {
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    await prisma.bulkCheckInOperation.update({
      where: { id: operationId },
      data: {
        processedCount: results.length,
        successCount,
        failureCount
      }
    });
  }

  private broadcastProgress(
    eventId: string,
    operationId: string,
    processed: number,
    total: number
  ): void {
    this.ws.broadcastToRoom(`event:${eventId}`, 'bulk_progress', {
      operationId,
      processed,
      total,
      percentage: Math.round((processed / total) * 100)
    });
  }

  private summarizeResults(results: CheckInResult[]): BulkSummary {
    return {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      failures: results
        .filter(r => !r.success)
        .map(r => ({
          ticketId: r.ticketId!,
          reason: r.error!,
          errorCode: r.errorCode!
        }))
    };
  }

  private async completeOperation(
    operationId: string,
    summary: BulkSummary
  ): Promise<void> {
    await prisma.bulkCheckInOperation.update({
      where: { id: operationId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        successCount: summary.successful,
        failureCount: summary.failed
      }
    });
  }
}
```

---

## Testing

### Unit Tests
- [ ] Batch processing logic
- [ ] Transaction handling
- [ ] Error categorization
- [ ] Progress calculation
- [ ] Result summarization

### Integration Tests
- [ ] End-to-end bulk check-in
- [ ] Concurrent batch processing
- [ ] Transaction isolation
- [ ] Progress broadcasting
- [ ] Error handling flows

### Performance Tests
- [ ] 10 tickets < 3 seconds
- [ ] 50 tickets < 15 seconds
- [ ] Concurrent operations (5x)
- [ ] Database connection pool
- [ ] Memory usage stable

### Edge Cases
- [ ] All tickets fail
- [ ] All tickets succeed
- [ ] Mixed success/failure
- [ ] Duplicate ticket IDs
- [ ] Invalid ticket IDs
- [ ] Operation cancelled mid-process

---

## Environment Variables

```bash
# Bulk processing configuration
BULK_CHECKIN_BATCH_SIZE=10
BULK_CHECKIN_MAX_TICKETS=50
BULK_CHECKIN_TIMEOUT=30000
BULK_CHECKIN_RATE_LIMIT=5

# Redis for job queue
REDIS_URL=redis://localhost:6379
```

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-09-30 | BMAD SM Agent | Initial sharded story from CHK-008 |

---

*Sharded from CHK-008 (5 pts) - Part 1 of 2*
*Next: CHK-008b - Bulk UI & Progress Display (3 pts)*
*Generated by BMAD SM Agent*