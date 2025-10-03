# PAY-014: Saved Payment Methods

**Epic:** EPIC-008 - Enhanced Payment Processing
**Story Points:** 3
**Priority:** High
**Sprint:** TBD
**Status:** Ready for Development

---

## User Story

**As a** returning customer purchasing event tickets
**I want to** save my payment methods securely for faster checkout
**So that I** can complete purchases quickly without re-entering card details every time

---

## Acceptance Criteria

### 1. Save Card During Checkout
- [ ] Checkbox "Save card for future purchases" displays at checkout
- [ ] Checkbox default state: unchecked (opt-in only)
- [ ] Security notice displayed: "Securely stored with Square"
- [ ] Card tokenization happens after payment approval
- [ ] Saved card linked to user account in database
- [ ] Confirmation message after successful save

### 2. Card Storage and Tokenization
- [ ] Cards stored as Square customer cards (tokens only)
- [ ] No actual card data stored on platform servers (PCI SAQ-A compliance)
- [ ] Square customer profile created on first card save
- [ ] Square customer ID linked to user account
- [ ] Card tokens encrypted in database
- [ ] Card expiration dates monitored for warnings

### 3. Payment Methods Management Page
- [ ] User can view all saved payment methods
- [ ] Display: Card brand (Visa, Mastercard), last 4 digits, expiration date
- [ ] Card status indicators: Active, Expired, Expiring Soon
- [ ] User can set one card as default payment method
- [ ] User can delete saved cards anytime
- [ ] User can add new cards without making purchase
- [ ] Empty state message when no cards saved

### 4. Faster Checkout with Saved Cards
- [ ] Saved cards display at top of checkout page
- [ ] Radio buttons to select saved card or enter new card
- [ ] Default card pre-selected (if set)
- [ ] CVV verification required for saved card transactions (security)
- [ ] "Use different card" option available
- [ ] Processing time reduced by 50% (no card entry)

### 5. CVV Verification for Saved Cards
- [ ] CVV field displayed when saved card selected
- [ ] CVV required for all transactions (not stored)
- [ ] Real-time validation: 3 digits (Visa, MC) or 4 digits (Amex)
- [ ] Error message for incorrect CVV format
- [ ] Payment fails if CVV invalid
- [ ] CVV never logged or stored anywhere

### 6. Card Expiration Management
- [ ] Email notification 30 days before card expiration
- [ ] Dashboard warning when default card expires soon
- [ ] Checkout warning if selected card expired
- [ ] Prompt to update expiration date or add new card
- [ ] Expired cards marked as inactive (not deleted)
- [ ] User can update card expiration date manually

### 7. Multiple Card Support
- [ ] Users can save up to 5 payment methods
- [ ] Each card has friendly name/label (optional, e.g., "Personal Visa")
- [ ] Cards sorted: Default first, then by date added
- [ ] Visual indicator for default card (badge/star icon)
- [ ] Ability to switch default card anytime
- [ ] Last used date displayed for each card

### 8. Security Features
- [ ] Two-factor authentication option for payment method changes
- [ ] Email notification when card added/removed
- [ ] Email notification when default card changed
- [ ] IP address logged for all card management actions
- [ ] Suspicious activity detection (rapid add/remove)
- [ ] Rate limiting: Max 5 card operations per hour

### 9. Guest Checkout (No Save Option)
- [ ] Guest users see standard checkout (card entry)
- [ ] No "save card" option for guest users
- [ ] Prompt to create account to save cards
- [ ] Post-purchase account creation saves payment method
- [ ] Security benefit: Only authenticated users can save cards

### 10. Admin Visibility (Security)
- [ ] Admin can view user has saved cards (yes/no only)
- [ ] Admin cannot view card numbers or tokens (security)
- [ ] Admin can remove saved cards (customer service)
- [ ] Admin can disable saved cards feature for user (fraud prevention)
- [ ] All admin actions logged with reason code

### 11. PCI Compliance
- [ ] Platform maintains PCI SAQ-A compliance (lowest level)
- [ ] Card data never touches platform servers
- [ ] Only Square tokens stored in database
- [ ] Annual PCI compliance attestation completed
- [ ] Security audit trail for all card operations

### 12. Error Handling
- [ ] Graceful fallback if Square Cards API unavailable
- [ ] Error message: "Saved cards temporarily unavailable"
- [ ] User redirected to manual card entry
- [ ] Card save failures logged but payment still processed
- [ ] Retry mechanism for failed card tokenization

---

## Technical Specifications

### Square Customer Cards Integration

```typescript
// lib/payments/saved-cards.service.ts
import { Client as SquareClient } from 'square';
import { prisma } from '@/lib/database/prisma';
import { sendEmail } from '@/lib/services/email';
import { encrypt, decrypt } from '@/lib/utils/encryption';

export interface SavedCard {
  id: string;
  cardBrand: string;
  last4: string;
  expirationMonth: number;
  expirationYear: number;
  isDefault: boolean;
  label?: string;
  lastUsedAt?: Date;
  createdAt: Date;
}

export class SavedCardsService {
  private squareClient: SquareClient;

  constructor() {
    this.squareClient = new SquareClient({
      accessToken: process.env.SQUARE_ACCESS_TOKEN!,
      environment: process.env.SQUARE_ENVIRONMENT as 'sandbox' | 'production',
    });
  }

  /**
   * Create or get Square customer for user
   */
  async getOrCreateSquareCustomer(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if customer already exists
    if (user.squareCustomerId) {
      return user.squareCustomerId;
    }

    // Create new Square customer
    const customerResult = await this.squareClient.customersApi.createCustomer({
      emailAddress: user.email,
      givenName: user.name?.split(' ')[0],
      familyName: user.name?.split(' ').slice(1).join(' '),
      referenceId: userId,
    });

    const customerId = customerResult.result.customer?.id;
    if (!customerId) {
      throw new Error('Failed to create Square customer');
    }

    // Update user with Square customer ID
    await prisma.user.update({
      where: { id: userId },
      data: { squareCustomerId: customerId },
    });

    return customerId;
  }

  /**
   * Save card for user
   */
  async saveCard(
    userId: string,
    cardToken: string,
    label?: string
  ): Promise<SavedCard> {
    try {
      // Get or create Square customer
      const customerId = await this.getOrCreateSquareCustomer(userId);

      // Create card on file with Square
      const cardResult = await this.squareClient.cardsApi.createCard({
        idempotencyKey: crypto.randomUUID(),
        sourceId: cardToken,
        card: {
          customerId,
        },
      });

      const card = cardResult.result.card;
      if (!card) {
        throw new Error('Failed to create card');
      }

      // Count existing cards
      const existingCardsCount = await prisma.savedPaymentMethod.count({
        where: { userId },
      });

      if (existingCardsCount >= 5) {
        throw new Error('Maximum 5 cards allowed');
      }

      // Save card reference in database (encrypted token)
      const savedCard = await prisma.savedPaymentMethod.create({
        data: {
          userId,
          squareCardId: encrypt(card.id!),
          cardBrand: card.cardBrand!,
          last4: card.last4!,
          expirationMonth: card.expMonth!,
          expirationYear: card.expYear!,
          isDefault: existingCardsCount === 0, // First card is default
          label,
        },
      });

      // Send notification email
      await this.sendCardAddedNotification(userId, card.cardBrand!, card.last4!);

      return this.mapToSavedCard(savedCard);
    } catch (error) {
      console.error('Save card error:', error);
      throw error;
    }
  }

  /**
   * Get user's saved cards
   */
  async getSavedCards(userId: string): Promise<SavedCard[]> {
    const cards = await prisma.savedPaymentMethod.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return cards.map(this.mapToSavedCard);
  }

  /**
   * Get single saved card
   */
  async getCard(userId: string, cardId: string): Promise<SavedCard | null> {
    const card = await prisma.savedPaymentMethod.findFirst({
      where: {
        id: cardId,
        userId,
      },
    });

    return card ? this.mapToSavedCard(card) : null;
  }

  /**
   * Delete saved card
   */
  async deleteCard(userId: string, cardId: string): Promise<void> {
    const card = await prisma.savedPaymentMethod.findFirst({
      where: { id: cardId, userId },
    });

    if (!card) {
      throw new Error('Card not found');
    }

    // Decrypt Square card ID
    const squareCardId = decrypt(card.squareCardId);

    try {
      // Delete from Square
      await this.squareClient.cardsApi.disableCard(squareCardId);
    } catch (error) {
      console.error('Error deleting card from Square:', error);
      // Continue with local deletion even if Square delete fails
    }

    // Delete from database
    await prisma.savedPaymentMethod.delete({
      where: { id: cardId },
    });

    // If deleted card was default, make another card default
    if (card.isDefault) {
      const remainingCards = await prisma.savedPaymentMethod.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (remainingCards) {
        await prisma.savedPaymentMethod.update({
          where: { id: remainingCards.id },
          data: { isDefault: true },
        });
      }
    }

    // Send notification
    await this.sendCardRemovedNotification(userId, card.cardBrand, card.last4);
  }

  /**
   * Set default card
   */
  async setDefaultCard(userId: string, cardId: string): Promise<void> {
    // Unset current default
    await prisma.savedPaymentMethod.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    // Set new default
    await prisma.savedPaymentMethod.update({
      where: { id: cardId },
      data: { isDefault: true },
    });

    // Send notification
    const card = await prisma.savedPaymentMethod.findUnique({
      where: { id: cardId },
    });

    if (card) {
      await this.sendDefaultCardChangedNotification(
        userId,
        card.cardBrand,
        card.last4
      );
    }
  }

  /**
   * Update card label
   */
  async updateCardLabel(
    userId: string,
    cardId: string,
    label: string
  ): Promise<void> {
    await prisma.savedPaymentMethod.updateMany({
      where: { id: cardId, userId },
      data: { label },
    });
  }

  /**
   * Process payment with saved card
   */
  async processPaymentWithSavedCard(
    userId: string,
    cardId: string,
    amount: number,
    cvv: string,
    orderId: string
  ): Promise<string> {
    const card = await prisma.savedPaymentMethod.findFirst({
      where: { id: cardId, userId },
    });

    if (!card) {
      throw new Error('Card not found');
    }

    // Check if card expired
    const now = new Date();
    const expYear = card.expirationYear;
    const expMonth = card.expirationMonth;
    const isExpired =
      expYear < now.getFullYear() ||
      (expYear === now.getFullYear() && expMonth < now.getMonth() + 1);

    if (isExpired) {
      throw new Error('Card has expired');
    }

    // Decrypt Square card ID
    const squareCardId = decrypt(card.squareCardId);

    // Create payment with Square
    const paymentResult = await this.squareClient.paymentsApi.createPayment({
      sourceId: squareCardId,
      idempotencyKey: crypto.randomUUID(),
      amountMoney: {
        amount: BigInt(Math.round(amount * 100)),
        currency: 'USD',
      },
      referenceId: orderId,
      verificationToken: cvv, // CVV verification
      customerId: (await prisma.user.findUnique({ where: { id: userId } }))?.squareCustomerId,
    });

    if (paymentResult.result.payment?.status !== 'APPROVED') {
      throw new Error('Payment declined');
    }

    // Update last used date
    await prisma.savedPaymentMethod.update({
      where: { id: cardId },
      data: { lastUsedAt: new Date() },
    });

    return paymentResult.result.payment.id!;
  }

  /**
   * Check for expiring cards and send notifications
   */
  async notifyExpiringCards(): Promise<void> {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringCards = await prisma.savedPaymentMethod.findMany({
      where: {
        OR: [
          {
            expirationYear: thirtyDaysFromNow.getFullYear(),
            expirationMonth: {
              lte: thirtyDaysFromNow.getMonth() + 1,
              gte: now.getMonth() + 1,
            },
          },
        ],
        expirationNotificationSent: false,
      },
      include: { user: true },
    });

    for (const card of expiringCards) {
      await this.sendExpirationWarning(
        card.userId,
        card.cardBrand,
        card.last4,
        new Date(card.expirationYear, card.expirationMonth - 1)
      );

      await prisma.savedPaymentMethod.update({
        where: { id: card.id },
        data: { expirationNotificationSent: true },
      });
    }
  }

  /**
   * Helper: Map database record to SavedCard interface
   */
  private mapToSavedCard(record: any): SavedCard {
    return {
      id: record.id,
      cardBrand: record.cardBrand,
      last4: record.last4,
      expirationMonth: record.expirationMonth,
      expirationYear: record.expirationYear,
      isDefault: record.isDefault,
      label: record.label,
      lastUsedAt: record.lastUsedAt,
      createdAt: record.createdAt,
    };
  }

  /**
   * Send card added notification
   */
  private async sendCardAddedNotification(
    userId: string,
    cardBrand: string,
    last4: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    await sendEmail({
      to: user.email,
      subject: 'Payment Method Added',
      template: 'card-added',
      data: {
        userName: user.name,
        cardBrand,
        last4,
        manageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
      },
    });
  }

  /**
   * Send card removed notification
   */
  private async sendCardRemovedNotification(
    userId: string,
    cardBrand: string,
    last4: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    await sendEmail({
      to: user.email,
      subject: 'Payment Method Removed',
      template: 'card-removed',
      data: {
        userName: user.name,
        cardBrand,
        last4,
      },
    });
  }

  /**
   * Send default card changed notification
   */
  private async sendDefaultCardChangedNotification(
    userId: string,
    cardBrand: string,
    last4: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    await sendEmail({
      to: user.email,
      subject: 'Default Payment Method Changed',
      template: 'default-card-changed',
      data: {
        userName: user.name,
        cardBrand,
        last4,
      },
    });
  }

  /**
   * Send expiration warning
   */
  private async sendExpirationWarning(
    userId: string,
    cardBrand: string,
    last4: string,
    expirationDate: Date
  ): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    await sendEmail({
      to: user.email,
      subject: 'Payment Method Expiring Soon',
      template: 'card-expiring',
      data: {
        userName: user.name,
        cardBrand,
        last4,
        expirationDate: expirationDate.toLocaleDateString(),
        updateUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
      },
    });
  }
}

export const savedCardsService = new SavedCardsService();
```

### API Routes

```typescript
// app/api/payment-methods/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { savedCardsService } from '@/lib/payments/saved-cards.service';
import { z } from 'zod';

const saveCardSchema = z.object({
  cardToken: z.string(),
  label: z.string().optional(),
});

// GET /api/payment-methods - Get all saved cards
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cards = await savedCardsService.getSavedCards(session.user.id);

    return NextResponse.json({ cards });
  } catch (error) {
    console.error('Get cards error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cards' },
      { status: 500 }
    );
  }
}

// POST /api/payment-methods - Save new card
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { cardToken, label } = saveCardSchema.parse(body);

    const card = await savedCardsService.saveCard(
      session.user.id,
      cardToken,
      label
    );

    return NextResponse.json({ success: true, card });
  } catch (error) {
    console.error('Save card error:', error);
    return NextResponse.json(
      { error: 'Failed to save card' },
      { status: 500 }
    );
  }
}

// DELETE /api/payment-methods/[cardId] - Delete card
export async function DELETE(
  req: NextRequest,
  { params }: { params: { cardId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await savedCardsService.deleteCard(session.user.id, params.cardId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete card error:', error);
    return NextResponse.json(
      { error: 'Failed to delete card' },
      { status: 500 }
    );
  }
}
```

---

## Database Schema

```prisma
// prisma/schema.prisma additions

model SavedPaymentMethod {
  id                         String    @id @default(uuid())
  userId                     String
  squareCardId               String    @unique // Encrypted Square card ID
  cardBrand                  String    // VISA, MASTERCARD, AMEX, DISCOVER
  last4                      String    // Last 4 digits
  expirationMonth            Int
  expirationYear             Int
  isDefault                  Boolean   @default(false)
  label                      String?   // User-friendly name
  lastUsedAt                 DateTime?
  expirationNotificationSent Boolean   @default(false)
  createdAt                  DateTime  @default(now())
  updatedAt                  DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([isDefault])
}

// Add to User model
model User {
  // ... existing fields
  squareCustomerId     String? @unique
  savedPaymentMethods  SavedPaymentMethod[]
}
```

---

## Dependencies

### Technical Dependencies
- Square Cards API
- Square Customers API
- Encryption library (crypto)
- Next.js 14+
- Prisma ORM

### Story Dependencies
- PAY-001: Square Payments Setup (prerequisite)
- AUTH-001: User authentication (prerequisite)

---

## Testing Requirements

### Unit Tests
- Test card tokenization and storage
- Test default card selection
- Test card deletion and reassignment
- Test expiration date validation
- Test CVV validation

### Integration Tests
- Test complete save card flow
- Test payment with saved card
- Test card expiration notifications
- Test maximum card limit enforcement

### Security Tests
- Verify no card data stored locally
- Verify encryption of Square tokens
- Verify CVV never logged/stored
- Test PCI SAQ-A compliance

---

## Security Considerations

### PCI Compliance
- Maintain SAQ-A compliance (card data never touches servers)
- Only Square tokens stored (encrypted)
- CVV required but never stored
- Annual compliance attestation

### Fraud Prevention
- Rate limit card operations
- Email notifications on changes
- IP logging for suspicious activity
- 2FA option for high-value accounts

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests with 90%+ coverage
- [ ] Integration tests passing
- [ ] Security review completed
- [ ] PCI compliance verified
- [ ] Email notifications tested
- [ ] Documentation complete
- [ ] Product owner approval