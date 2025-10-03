# PAY-013: Prepaid Credit Packages

**Epic:** EPIC-008 - Enhanced Payment Processing
**Story Points:** 5
**Priority:** Medium
**Sprint:** TBD
**Status:** Ready for Development

---

## User Story

**As a** high-volume event organizer hosting multiple events
**I want to** purchase prepaid credit packages at discounted rates
**So that I** can save on platform fees and streamline event creation billing

---

## Acceptance Criteria

### 1. Credit Package Tiers
- [ ] System offers three package tiers: Starter, Professional, Enterprise
- [ ] Starter: $100 credit for $95 (5% discount, ~10 events)
- [ ] Professional: $500 credit for $450 (10% discount, ~50 events)
- [ ] Enterprise: $2000 credit for $1700 (15% discount, ~200 events)
- [ ] Packages displayed on dedicated pricing/packages page
- [ ] Visual comparison table showing discount amounts
- [ ] Package benefits highlighted (volume discount, priority support)

### 2. Package Purchase Flow
- [ ] User navigates to "Buy Credits" from dashboard
- [ ] Package selection page displays all tiers with details
- [ ] User selects package tier and quantity (1-10 packages max)
- [ ] Shopping cart shows selected packages and total discount
- [ ] Checkout integration with Square payment processing
- [ ] Payment confirmation screen displays credit balance immediately
- [ ] Email confirmation sent with package details and invoice

### 3. Credit Wallet System
- [ ] Each user has credit wallet with current balance
- [ ] Wallet displays: Available Credits, Used Credits, Pending Credits
- [ ] Transaction history shows all credit additions and deductions
- [ ] Balance visible in dashboard header/sidebar
- [ ] Low balance warning when credits < $20 (< 2 events)
- [ ] Option to auto-reload when balance falls below threshold

### 4. Credit Usage and Deduction
- [ ] Event creation fee ($10) automatically deducted from credits
- [ ] System checks credit balance before allowing event creation
- [ ] Insufficient balance prevents event creation (displays upgrade prompt)
- [ ] Deduction transaction logged with event ID and timestamp
- [ ] User can view which events used which credits
- [ ] Partial deductions not allowed (must have full $10 available)

### 5. Package Expiration Rules
- [ ] Credits expire 12 months from purchase date
- [ ] Expiration warning email sent 30 days before expiry
- [ ] Expiration reminder email sent 7 days before expiry
- [ ] Final warning email sent 1 day before expiry
- [ ] Expired credits automatically removed from balance
- [ ] Expiration transaction logged in wallet history
- [ ] No refunds for expired credits (stated in terms)

### 6. Credit Rollover (Optional)
- [ ] Unused credits roll over to next purchase (within expiry window)
- [ ] Oldest credits used first (FIFO - First In First Out)
- [ ] Rollover clearly explained in package description
- [ ] Rollover limit: Max 2x current package value
- [ ] Example: Pro user with $200 remaining can roll over to new Pro package

### 7. Volume Discount Display
- [ ] Checkout shows "You saved $X with this package"
- [ ] Package page displays effective per-event cost
- [ ] Comparison to standard pricing ($10/event)
- [ ] Calculator tool: "How many events? Recommended package: X"
- [ ] ROI calculator showing annual savings for high-volume users

### 8. Admin Credit Management
- [ ] Admin can view all user credit balances
- [ ] Admin can manually add/remove credits with reason note
- [ ] Admin can extend expiration dates (customer service)
- [ ] Admin can issue refunds for unused credits
- [ ] Admin can apply promotional credits (bonus credits)
- [ ] All admin actions logged with admin user ID

### 9. Usage Analytics
- [ ] User dashboard shows credit usage over time (chart)
- [ ] Monthly breakdown: Credits purchased vs. used
- [ ] Projected credits needed based on historical usage
- [ ] Package utilization rate (% of credits used before expiry)
- [ ] Recommendation engine suggests appropriate package tier

### 10. Billing and Invoicing
- [ ] Invoice generated for each package purchase
- [ ] Invoice includes: Package name, credit amount, price, discount
- [ ] Invoice downloadable as PDF from transaction history
- [ ] Invoice includes tax information (if applicable)
- [ ] Invoices stored for 7 years (compliance requirement)
- [ ] Bulk invoice export for accounting purposes

### 11. Auto-Reload Feature
- [ ] User can enable auto-reload when balance < threshold
- [ ] User sets threshold ($20, $50, $100) and reload package
- [ ] Auto-reload triggers purchase automatically
- [ ] Email notification sent when auto-reload executes
- [ ] User can disable auto-reload anytime
- [ ] Failed auto-reload sends alert (payment method issue)

### 12. Gift Credits (Future Enhancement)
- [ ] User can gift credits to another user
- [ ] Gift credits transferred with optional message
- [ ] Recipient receives email notification
- [ ] Gift transactions tracked separately
- [ ] Non-refundable and non-transferable once gifted

---

## Technical Specifications

### Credit Wallet Service Implementation

```typescript
// lib/services/credit-wallet.service.ts
import { prisma } from '@/lib/database/prisma';
import { sendEmail } from '@/lib/services/email';

export interface CreditPackage {
  id: string;
  name: string;
  creditAmount: number;
  price: number;
  discount: number;
  description: string;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter Package',
    creditAmount: 100,
    price: 95,
    discount: 5,
    description: '~10 events, 5% savings',
  },
  {
    id: 'professional',
    name: 'Professional Package',
    creditAmount: 500,
    price: 450,
    discount: 10,
    description: '~50 events, 10% savings',
  },
  {
    id: 'enterprise',
    name: 'Enterprise Package',
    creditAmount: 2000,
    price: 1700,
    discount: 15,
    description: '~200 events, 15% savings + Priority Support',
  },
];

export class CreditWalletService {
  /**
   * Get user's current credit balance
   */
  async getBalance(userId: string): Promise<number> {
    const wallet = await prisma.creditWallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          where: {
            expiresAt: { gt: new Date() }, // Only non-expired credits
          },
        },
      },
    });

    if (!wallet) {
      // Create wallet if doesn't exist
      await prisma.creditWallet.create({
        data: { userId, balance: 0 },
      });
      return 0;
    }

    return wallet.balance;
  }

  /**
   * Purchase credit package
   */
  async purchasePackage(
    userId: string,
    packageId: string,
    paymentId: string
  ): Promise<void> {
    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!pkg) {
      throw new Error('Invalid package ID');
    }

    // Calculate expiration date (12 months from now)
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 12);

    // Create transaction
    await prisma.creditTransaction.create({
      data: {
        userId,
        amount: pkg.creditAmount,
        type: 'PURCHASE',
        description: `Purchased ${pkg.name}`,
        paymentId,
        expiresAt,
      },
    });

    // Update wallet balance
    await prisma.creditWallet.upsert({
      where: { userId },
      create: {
        userId,
        balance: pkg.creditAmount,
      },
      update: {
        balance: { increment: pkg.creditAmount },
      },
    });

    // Send confirmation email
    await this.sendPurchaseConfirmation(userId, pkg, expiresAt);

    console.log(`User ${userId} purchased ${pkg.name} for $${pkg.price}`);
  }

  /**
   * Deduct credits for event creation
   */
  async deductCredits(
    userId: string,
    amount: number,
    eventId: string
  ): Promise<void> {
    const balance = await this.getBalance(userId);

    if (balance < amount) {
      throw new Error('Insufficient credits');
    }

    // Get oldest non-expired transactions (FIFO)
    const transactions = await prisma.creditTransaction.findMany({
      where: {
        userId,
        type: 'PURCHASE',
        expiresAt: { gt: new Date() },
        remainingAmount: { gt: 0 },
      },
      orderBy: { createdAt: 'asc' },
    });

    let remaining = amount;

    for (const transaction of transactions) {
      if (remaining <= 0) break;

      const deductAmount = Math.min(remaining, transaction.remainingAmount || 0);

      await prisma.creditTransaction.update({
        where: { id: transaction.id },
        data: {
          remainingAmount: { decrement: deductAmount },
        },
      });

      remaining -= deductAmount;
    }

    // Create deduction transaction
    await prisma.creditTransaction.create({
      data: {
        userId,
        amount: -amount,
        type: 'DEDUCTION',
        description: `Event creation fee`,
        eventId,
      },
    });

    // Update wallet balance
    await prisma.creditWallet.update({
      where: { userId },
      data: { balance: { decrement: amount } },
    });

    console.log(`Deducted $${amount} from user ${userId} for event ${eventId}`);
  }

  /**
   * Check for expiring credits and send warnings
   */
  async checkExpiringCredits(): Promise<void> {
    const now = new Date();

    // 30 days warning
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringTransactions = await prisma.creditTransaction.findMany({
      where: {
        expiresAt: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
        remainingAmount: { gt: 0 },
        expirationWarningsSent: 0,
      },
      include: { user: true },
    });

    for (const transaction of expiringTransactions) {
      await this.sendExpirationWarning(transaction);
      await prisma.creditTransaction.update({
        where: { id: transaction.id },
        data: { expirationWarningsSent: 1 },
      });
    }
  }

  /**
   * Expire old credits
   */
  async expireCredits(): Promise<void> {
    const now = new Date();

    const expiredTransactions = await prisma.creditTransaction.findMany({
      where: {
        expiresAt: { lt: now },
        remainingAmount: { gt: 0 },
      },
    });

    for (const transaction of expiredTransactions) {
      const expiredAmount = transaction.remainingAmount || 0;

      // Update transaction
      await prisma.creditTransaction.update({
        where: { id: transaction.id },
        data: { remainingAmount: 0 },
      });

      // Deduct from wallet
      await prisma.creditWallet.update({
        where: { userId: transaction.userId },
        data: { balance: { decrement: expiredAmount } },
      });

      // Create expiration transaction
      await prisma.creditTransaction.create({
        data: {
          userId: transaction.userId,
          amount: -expiredAmount,
          type: 'EXPIRATION',
          description: `Credits expired from purchase on ${transaction.createdAt.toLocaleDateString()}`,
        },
      });

      console.log(`Expired $${expiredAmount} for user ${transaction.userId}`);
    }
  }

  /**
   * Send purchase confirmation email
   */
  private async sendPurchaseConfirmation(
    userId: string,
    pkg: CreditPackage,
    expiresAt: Date
  ): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    await sendEmail({
      to: user.email,
      subject: `Credit Package Purchased: ${pkg.name}`,
      template: 'credit-purchase-confirmation',
      data: {
        userName: user.name,
        packageName: pkg.name,
        creditAmount: pkg.creditAmount,
        pricePaid: pkg.price,
        savings: pkg.creditAmount - pkg.price,
        expiresAt: expiresAt.toLocaleDateString(),
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      },
    });
  }

  /**
   * Send expiration warning email
   */
  private async sendExpirationWarning(transaction: any): Promise<void> {
    const daysUntilExpiry = Math.ceil(
      (transaction.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    await sendEmail({
      to: transaction.user.email,
      subject: `Credits Expiring Soon: $${transaction.remainingAmount}`,
      template: 'credit-expiration-warning',
      data: {
        userName: transaction.user.name,
        creditAmount: transaction.remainingAmount,
        daysUntilExpiry,
        expiresAt: transaction.expiresAt.toLocaleDateString(),
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      },
    });
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(
    userId: string,
    limit: number = 50
  ): Promise<any[]> {
    return prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        event: { select: { title: true } },
      },
    });
  }

  /**
   * Admin: Add credits manually
   */
  async addCreditsManual(
    userId: string,
    amount: number,
    adminId: string,
    reason: string
  ): Promise<void> {
    await prisma.creditTransaction.create({
      data: {
        userId,
        amount,
        type: 'ADMIN_CREDIT',
        description: reason,
      },
    });

    await prisma.creditWallet.upsert({
      where: { userId },
      create: { userId, balance: amount },
      update: { balance: { increment: amount } },
    });

    console.log(`Admin ${adminId} added $${amount} to user ${userId}: ${reason}`);
  }
}

export const creditWalletService = new CreditWalletService();
```

### API Routes

```typescript
// app/api/credits/purchase/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { creditWalletService, CREDIT_PACKAGES } from '@/lib/services/credit-wallet.service';
import { squareClient } from '@/lib/payments/square.config';
import { z } from 'zod';

const purchaseSchema = z.object({
  packageId: z.string(),
  quantity: z.number().int().min(1).max(10),
  paymentToken: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { packageId, quantity, paymentToken } = purchaseSchema.parse(body);

    // Get package details
    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!pkg) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    }

    const totalPrice = pkg.price * quantity;
    const totalCredits = pkg.creditAmount * quantity;

    // Process payment with Square
    const paymentResult = await squareClient.paymentsApi.createPayment({
      sourceId: paymentToken,
      idempotencyKey: crypto.randomUUID(),
      amountMoney: {
        amount: BigInt(Math.round(totalPrice * 100)),
        currency: 'USD',
      },
      note: `Credit Package: ${pkg.name} x${quantity}`,
      customerId: session.user.squareCustomerId,
    });

    if (paymentResult.result.payment?.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Payment failed' },
        { status: 400 }
      );
    }

    // Add credits to wallet
    for (let i = 0; i < quantity; i++) {
      await creditWalletService.purchasePackage(
        session.user.id,
        packageId,
        paymentResult.result.payment.id!
      );
    }

    return NextResponse.json({
      success: true,
      creditsAdded: totalCredits,
      totalPaid: totalPrice,
      totalSavings: (pkg.creditAmount - pkg.price) * quantity,
    });
  } catch (error) {
    console.error('Credit purchase error:', error);
    return NextResponse.json(
      { error: 'Purchase failed' },
      { status: 500 }
    );
  }
}

// GET /api/credits/balance
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const balance = await creditWalletService.getBalance(session.user.id);
    const history = await creditWalletService.getTransactionHistory(session.user.id, 10);

    return NextResponse.json({
      balance,
      history,
    });
  } catch (error) {
    console.error('Balance fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}
```

---

## Database Schema

```prisma
// prisma/schema.prisma additions

model CreditWallet {
  id        String   @id @default(uuid())
  userId    String   @unique
  balance   Float    @default(0) // Current available credits
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user         User                @relation(fields: [userId], references: [id])
  transactions CreditTransaction[]

  @@index([userId])
}

model CreditTransaction {
  id                     String    @id @default(uuid())
  userId                 String
  amount                 Float     // Positive for credits added, negative for deductions
  type                   String    // PURCHASE, DEDUCTION, EXPIRATION, ADMIN_CREDIT, GIFT
  description            String
  paymentId              String?   // Square payment ID for purchases
  eventId                String?   // Event ID for deductions
  expiresAt              DateTime? // Expiration date for purchased credits
  remainingAmount        Float?    // Track remaining balance for FIFO
  expirationWarningsSent Int       @default(0) // Track warning emails sent
  createdAt              DateTime  @default(now())

  user  User          @relation(fields: [userId], references: [id])
  event Event?        @relation(fields: [eventId], references: [id])
  wallet CreditWallet @relation(fields: [userId], references: [userId])

  @@index([userId])
  @@index([type])
  @@index([expiresAt])
  @@index([createdAt])
}
```

---

## Dependencies

### Technical Dependencies
- Square Payments API
- Next.js 14+ (App Router)
- Prisma ORM
- Email service (SendGrid/Resend)
- PDF generation (for invoices)

### Story Dependencies
- PAY-001: Square Payments Setup (prerequisite)
- EVENT-001: Event creation flow (prerequisite)

---

## Testing Requirements

### Unit Tests
- Test credit balance calculations
- Test FIFO credit deduction logic
- Test expiration date calculations
- Test package discount calculations
- Test transaction history retrieval

### Integration Tests
- Test complete purchase flow (payment → credit addition)
- Test event creation with credit deduction
- Test insufficient balance prevention
- Test expiration warning cron job
- Test auto-reload functionality

### Edge Cases
- Purchase multiple packages simultaneously
- Deduct credits across multiple expiration batches
- Handle expired credits during deduction
- Test rollover limits
- Test concurrent event creation (race condition)

---

## Security Considerations

### Payment Security
- PCI compliance maintained (Square handles card data)
- Payment tokens single-use only
- Transaction idempotency to prevent duplicate charges

### Credit Fraud Prevention
- Limit package quantity per purchase (max 10)
- Monitor unusual purchase patterns
- Track admin credit additions with reason codes
- Prevent negative balance manipulation

---

## Monitoring & Analytics

### Key Metrics
- Total credits sold (by package tier)
- Average credits per user
- Credit utilization rate (% used before expiry)
- Package conversion rate (visitors → purchasers)
- Revenue from credit packages

### Alerts
- Alert when user balance falls below $10
- Alert on failed auto-reload attempts
- Alert 24 hours before bulk credit expiration
- Alert on unusual admin credit additions

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests with 90%+ coverage
- [ ] Integration tests passing
- [ ] Package purchase flow tested end-to-end
- [ ] Expiration cron job tested
- [ ] Email notifications tested
- [ ] Security review completed
- [ ] Documentation complete
- [ ] Product owner approval

---

## Notes

### Pricing Strategy
- Discounts incentivize bulk purchases
- 12-month expiration encourages regular platform use
- Volume tiers target different organizer segments

### Future Enhancements
- Annual subscription packages (unlimited events)
- Team/organization shared credit pools
- Credit marketplace (sell unused credits)
- Loyalty program (bonus credits for high-volume users)