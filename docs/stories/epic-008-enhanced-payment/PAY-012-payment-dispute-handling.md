# PAY-012: Payment Dispute Handling

**Epic:** EPIC-008 - Enhanced Payment Processing
**Story Points:** 3
**Priority:** Medium
**Sprint:** TBD
**Status:** Ready for Development

---

## User Story

**As a** platform administrator handling customer payment disputes
**I want to** receive notifications, submit evidence, and track dispute status
**So that I** can respond to chargebacks effectively and minimize financial losses

---

## Acceptance Criteria

### 1. Dispute Notification
- [ ] System receives dispute webhook from Square API
- [ ] Admin receives email notification immediately with dispute details
- [ ] Notification includes order ID, amount, reason, and deadline
- [ ] Dashboard displays unresolved disputes prominently
- [ ] Dispute details page accessible from notification link
- [ ] Dispute status badge shown on order page

### 2. Dispute Information Display
- [ ] Dispute details page shows all relevant information
- [ ] Display: dispute ID, reason, amount, initiated date, response deadline
- [ ] Show original order details (event, tickets, customer info)
- [ ] Display payment method and transaction date
- [ ] Show customer's dispute reason/description
- [ ] Timeline showing dispute status changes

### 3. Evidence Submission
- [ ] Admin can upload supporting documents (receipts, tickets, emails)
- [ ] Text field for written evidence description (2000 characters max)
- [ ] Attach order confirmation email automatically
- [ ] Attach ticket delivery proof (email sent timestamp)
- [ ] Attach event check-in records if customer attended
- [ ] Preview all evidence before submission
- [ ] Submit evidence to Square Disputes API

### 4. Evidence Templates
- [ ] Pre-written templates for common dispute reasons
- [ ] "Customer attended event" template with check-in proof
- [ ] "Tickets delivered" template with email confirmation
- [ ] "No refund policy" template with terms link
- [ ] "Duplicate charge" template with transaction comparison
- [ ] Admin can customize templates before submission

### 5. Status Tracking
- [ ] Dispute status updates via webhook from Square
- [ ] Status indicators: Under Review, Evidence Required, Won, Lost, Accepted
- [ ] Email notifications on status changes
- [ ] Admin dashboard shows dispute statistics
- [ ] Filter disputes by status (all, pending, won, lost)
- [ ] Export dispute history to CSV

### 6. Automatic Evidence Collection
- [ ] System automatically gathers evidence from order data
- [ ] Include: order confirmation timestamp, payment receipt, ticket details
- [ ] Include: customer email delivery logs, event check-in status
- [ ] Include: refund policy acceptance (checkbox timestamp)
- [ ] Include: terms and conditions acceptance
- [ ] Package evidence into single PDF document

### 7. Chargeback Prevention
- [ ] Display clear refund policy during checkout
- [ ] Require explicit acceptance of no-refund policy
- [ ] Send immediate order confirmation email with details
- [ ] Include merchant contact information in all emails
- [ ] Provide customer support link for issues before dispute
- [ ] Log all customer service interactions

### 8. Financial Tracking
- [ ] Track dispute amounts (pending, won, lost)
- [ ] Calculate dispute rate percentage (disputes / total orders)
- [ ] Track chargeback fees deducted by Square
- [ ] Show impact on event organizer payouts
- [ ] Generate dispute cost reports by month
- [ ] Alert when dispute rate exceeds 1%

### 9. Integration with Refund System
- [ ] If dispute won by customer, mark order as refunded
- [ ] Automatically cancel tickets when chargeback finalized
- [ ] Update inventory (add tickets back to available pool)
- [ ] Notify event organizer of chargeback impact
- [ ] Deduct chargeback amount from organizer payout
- [ ] Generate reconciliation report

### 10. Compliance & Audit
- [ ] All dispute actions logged with admin user ID and timestamp
- [ ] Evidence submission history preserved
- [ ] Communication history with customer tracked
- [ ] Dispute win/loss reasons analyzed
- [ ] Annual dispute report for financial audit
- [ ] GDPR compliance for dispute data retention (7 years)

---

## Technical Specifications

### Square Disputes API Integration

#### Dispute Service Implementation
```typescript
// lib/payments/dispute.service.ts
import { Client as SquareClient } from 'square';
import { prisma } from '@/lib/database/prisma';
import { sendEmail } from '@/lib/services/email';
import { PDFDocument } from 'pdf-lib';

export interface Dispute {
  id: string;
  squareDisputeId: string;
  orderId: string;
  amount: number;
  currency: string;
  reason: string;
  state: 'INQUIRY' | 'EVIDENCE_REQUIRED' | 'PROCESSING' | 'WON' | 'LOST' | 'ACCEPTED';
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class DisputeService {
  private squareClient: SquareClient;

  constructor() {
    this.squareClient = new SquareClient({
      accessToken: process.env.SQUARE_ACCESS_TOKEN!,
      environment: process.env.SQUARE_ENVIRONMENT as 'sandbox' | 'production',
    });
  }

  /**
   * Process dispute webhook
   */
  async processDisputeWebhook(webhookData: any): Promise<void> {
    const { dispute } = webhookData;

    // Check if dispute already exists
    let existingDispute = await prisma.dispute.findUnique({
      where: { squareDisputeId: dispute.id },
    });

    if (existingDispute) {
      // Update existing dispute
      await this.updateDisputeStatus(dispute.id, dispute.state);
    } else {
      // Create new dispute
      await this.createDispute(dispute);
    }
  }

  /**
   * Create new dispute record
   */
  async createDispute(squareDispute: any): Promise<Dispute> {
    // Find associated order
    const order = await prisma.order.findFirst({
      where: { squarePaymentId: squareDispute.disputed_payment.payment_id },
      include: {
        event: true,
        user: true,
      },
    });

    if (!order) {
      throw new Error(`Order not found for payment: ${squareDispute.disputed_payment.payment_id}`);
    }

    // Create dispute record
    const dispute = await prisma.dispute.create({
      data: {
        squareDisputeId: squareDispute.id,
        orderId: order.id,
        amount: Number(squareDispute.disputed_payment.amount_money.amount) / 100,
        currency: squareDispute.disputed_payment.amount_money.currency,
        reason: squareDispute.reason,
        state: squareDispute.state,
        dueDate: new Date(squareDispute.due_at),
      },
    });

    // Send notification to admins
    await this.notifyAdmins(dispute.id);

    // Log event
    console.log(`Dispute created: ${dispute.id} for order ${order.id}`);

    return dispute as unknown as Dispute;
  }

  /**
   * Update dispute status
   */
  async updateDisputeStatus(squareDisputeId: string, newState: string): Promise<void> {
    const dispute = await prisma.dispute.update({
      where: { squareDisputeId },
      data: {
        state: newState,
        updatedAt: new Date(),
      },
    });

    // Send status update notification
    await this.notifyAdmins(dispute.id, `Dispute status changed to ${newState}`);

    // Handle final states
    if (newState === 'LOST') {
      await this.handleDisputeLost(dispute.id);
    } else if (newState === 'WON') {
      await this.handleDisputeWon(dispute.id);
    }
  }

  /**
   * Submit dispute evidence
   */
  async submitEvidence(
    disputeId: string,
    evidence: {
      text?: string;
      files?: Array<{ filename: string; data: Buffer }>;
    }
  ): Promise<void> {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { order: { include: { event: true, user: true } } },
    });

    if (!dispute) {
      throw new Error('Dispute not found');
    }

    // Collect automatic evidence
    const autoEvidence = await this.collectAutomaticEvidence(dispute.orderId);

    // Combine manual and automatic evidence
    const combinedEvidence = {
      text: [evidence.text, autoEvidence.text].filter(Boolean).join('\n\n'),
      files: [...(evidence.files || []), ...autoEvidence.files],
    };

    // Upload files to Square
    const uploadedFiles: string[] = [];
    for (const file of combinedEvidence.files) {
      const uploadResult = await this.squareClient.disputesApi.createDisputeEvidenceFile({
        disputeId: dispute.squareDisputeId,
        request: {
          idempotencyKey: crypto.randomUUID(),
          evidenceType: 'RECEIPT',
          contentType: 'application/pdf',
        },
        imageFile: file.data,
      });

      uploadedFiles.push(uploadResult.result.evidence?.id || '');
    }

    // Submit text evidence
    if (combinedEvidence.text) {
      await this.squareClient.disputesApi.createDisputeEvidenceText({
        disputeId: dispute.squareDisputeId,
        body: {
          idempotencyKey: crypto.randomUUID(),
          evidenceType: 'CUSTOMER_COMMUNICATION',
          evidenceText: combinedEvidence.text,
        },
      });
    }

    // Submit evidence package
    await this.squareClient.disputesApi.submitEvidence({
      disputeId: dispute.squareDisputeId,
    });

    // Update database
    await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        evidenceSubmitted: true,
        evidenceSubmittedAt: new Date(),
        state: 'PROCESSING',
      },
    });

    console.log(`Evidence submitted for dispute ${disputeId}`);
  }

  /**
   * Collect automatic evidence from order data
   */
  async collectAutomaticEvidence(orderId: string): Promise<{
    text: string;
    files: Array<{ filename: string; data: Buffer }>;
  }> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        event: true,
        user: true,
        tickets: true,
        items: { include: { ticketType: true } },
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Build evidence text
    const evidenceText = `
DISPUTE EVIDENCE FOR ORDER ${order.id}

ORDER DETAILS:
- Order Date: ${order.createdAt.toISOString()}
- Event: ${order.event.title}
- Event Date: ${order.event.startDate.toISOString()}
- Total Amount: $${order.totalAmount.toFixed(2)}
- Payment Status: ${order.status}

CUSTOMER INFORMATION:
- Email: ${order.user.email}
- Order Confirmation Sent: ${order.createdAt.toISOString()}

TICKETS DELIVERED:
${order.tickets.map(ticket => `- Ticket ${ticket.ticketNumber} (${ticket.status})`).join('\n')}

EVENT ATTENDANCE:
${order.tickets.filter(t => t.checkedInAt).length > 0
  ? `Customer checked in at: ${order.tickets.find(t => t.checkedInAt)?.checkedInAt?.toISOString()}`
  : 'Customer did not attend event'
}

TERMS ACCEPTED:
- Refund Policy Accepted: Yes (at checkout)
- Terms URL: ${process.env.NEXT_PUBLIC_APP_URL}/terms

MERCHANT CONTACT:
- Support Email: support@stepperslife.com
- No refund requests received prior to dispute
    `.trim();

    // Generate PDF evidence package
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Letter size
    page.drawText(evidenceText, {
      x: 50,
      y: 742,
      size: 10,
    });

    const pdfBytes = await pdfDoc.save();

    return {
      text: evidenceText,
      files: [
        {
          filename: `dispute-evidence-${orderId}.pdf`,
          data: Buffer.from(pdfBytes),
        },
      ],
    };
  }

  /**
   * Handle dispute lost
   */
  async handleDisputeLost(disputeId: string): Promise<void> {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { order: true },
    });

    if (!dispute) return;

    // Mark order as refunded
    await prisma.order.update({
      where: { id: dispute.orderId },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
      },
    });

    // Cancel tickets
    await prisma.ticket.updateMany({
      where: { orderId: dispute.orderId },
      data: { status: 'CANCELLED' },
    });

    // Update inventory
    const order = await prisma.order.findUnique({
      where: { id: dispute.orderId },
      include: { items: true },
    });

    if (order) {
      for (const item of order.items) {
        await prisma.ticketType.update({
          where: { id: item.ticketTypeId },
          data: {
            quantitySold: { decrement: item.quantity },
          },
        });
      }
    }

    console.log(`Dispute lost: ${disputeId}, order refunded`);
  }

  /**
   * Handle dispute won
   */
  async handleDisputeWon(disputeId: string): Promise<void> {
    console.log(`Dispute won: ${disputeId}, no action needed`);
    // Dispute won - payment retained, no action needed
  }

  /**
   * Notify admins of new dispute
   */
  async notifyAdmins(disputeId: string, message?: string): Promise<void> {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        order: {
          include: { event: true, user: true },
        },
      },
    });

    if (!dispute) return;

    // Get all admin users
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
    });

    // Send email to each admin
    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: message || `New Payment Dispute: Order ${dispute.order.id.slice(0, 8)}`,
        template: 'dispute-notification',
        data: {
          disputeId: dispute.id,
          orderId: dispute.order.id,
          eventTitle: dispute.order.event.title,
          amount: dispute.amount,
          reason: dispute.reason,
          dueDate: dispute.dueDate,
          customerEmail: dispute.order.user.email,
          disputeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/disputes/${dispute.id}`,
        },
      });
    }
  }

  /**
   * Get dispute statistics
   */
  async getDisputeStats(startDate?: Date, endDate?: Date): Promise<any> {
    const where = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    const [total, won, lost, pending] = await Promise.all([
      prisma.dispute.count({ where }),
      prisma.dispute.count({ where: { ...where, state: 'WON' } }),
      prisma.dispute.count({ where: { ...where, state: 'LOST' } }),
      prisma.dispute.count({
        where: {
          ...where,
          state: { in: ['INQUIRY', 'EVIDENCE_REQUIRED', 'PROCESSING'] },
        },
      }),
    ]);

    const totalOrders = await prisma.order.count({
      where: {
        createdAt: where.createdAt,
        status: 'PAID',
      },
    });

    const disputeRate = totalOrders > 0 ? (total / totalOrders) * 100 : 0;

    return {
      total,
      won,
      lost,
      pending,
      disputeRate: disputeRate.toFixed(2),
      winRate: total > 0 ? ((won / total) * 100).toFixed(2) : 0,
    };
  }
}

export const disputeService = new DisputeService();
```

#### Webhook Handler
```typescript
// app/api/webhooks/square/disputes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { disputeService } from '@/lib/payments/dispute.service';
import { verifySquareWebhook } from '@/lib/payments/square.config';

export async function POST(req: NextRequest) {
  try {
    // Verify webhook signature
    const body = await req.text();
    const signature = req.headers.get('x-square-signature');

    if (!verifySquareWebhook(body, signature)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const webhookData = JSON.parse(body);
    const { type, data } = webhookData;

    // Handle different dispute events
    switch (type) {
      case 'dispute.created':
        await disputeService.processDisputeWebhook(data);
        break;

      case 'dispute.state.updated':
        await disputeService.processDisputeWebhook(data);
        break;

      case 'dispute.evidence.created':
        console.log('Dispute evidence created:', data.dispute.id);
        break;

      default:
        console.log('Unhandled dispute webhook type:', type);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Dispute webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
```

---

## Database Schema

```prisma
// prisma/schema.prisma additions

model Dispute {
  id                  String   @id @default(uuid())
  squareDisputeId     String   @unique
  orderId             String   @unique
  amount              Float
  currency            String   @default("USD")
  reason              String   // CUSTOMER_INITIATED, FRAUDULENT, etc.
  state               String   // INQUIRY, EVIDENCE_REQUIRED, PROCESSING, WON, LOST, ACCEPTED
  dueDate             DateTime // Response deadline
  evidenceSubmitted   Boolean  @default(false)
  evidenceSubmittedAt DateTime?
  resolvedAt          DateTime?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  order               Order    @relation(fields: [orderId], references: [id])

  @@index([state])
  @@index([dueDate])
  @@index([createdAt])
}
```

---

## Dependencies

### Technical Dependencies
- Square Disputes API
- Square Webhooks
- PDF generation library (pdf-lib)
- Email service (SendGrid/Resend)
- Next.js 14+ (App Router)
- Prisma ORM

### Story Dependencies
- PAY-001: Square Payments Setup (prerequisite)
- ORD-001: Order management (prerequisite)
- TIX-001: Ticket system (prerequisite)

---

## Testing Requirements

### Unit Tests
- Test dispute webhook processing
- Test evidence collection logic
- Test dispute status updates
- Test admin notifications
- Test dispute statistics calculation

### Integration Tests
- Test complete dispute flow (webhook → notification → evidence → resolution)
- Test dispute lost scenario (refund, ticket cancellation)
- Test evidence submission to Square API
- Test webhook signature verification

### Sandbox Testing
- Create test disputes in Square Sandbox
- Submit evidence and verify acceptance
- Test all dispute states and transitions
- Verify webhook delivery and processing

---

## Security Considerations

### Data Protection
- Encrypt dispute evidence files at rest
- Restrict dispute access to admins only
- Mask sensitive customer data in logs
- GDPR compliance for dispute records (7-year retention)

### Webhook Security
- Verify Square webhook signatures
- Rate limit webhook endpoints
- Log all webhook events
- Alert on webhook verification failures

---

## Monitoring & Analytics

### Key Metrics
- Total disputes (monthly, quarterly, annual)
- Dispute rate (disputes / total orders)
- Dispute win rate (won / total disputes)
- Average response time (creation to evidence submission)
- Financial impact (chargeback fees, lost revenue)

### Alerts
- Alert when dispute rate exceeds 1%
- Alert on new disputes (immediate admin notification)
- Alert 24 hours before evidence deadline
- Alert on evidence submission failures

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests with 90%+ coverage
- [ ] Integration tests passing
- [ ] Sandbox testing completed
- [ ] Admin notification emails working
- [ ] Evidence submission tested
- [ ] Security review completed
- [ ] Documentation complete
- [ ] Product owner approval

---

## Notes

### Chargeback Prevention Best Practices
- Clear refund policy at checkout
- Immediate order confirmations
- Detailed receipts with merchant info
- Responsive customer service
- Event attendance tracking

### Evidence Best Practices
- Submit evidence as early as possible
- Include all relevant documentation
- Be concise and factual
- Attach proof of delivery/attendance
- Reference specific policy clauses