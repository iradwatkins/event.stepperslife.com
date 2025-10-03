# MKT-006: Abandoned Cart Recovery

**Epic:** EPIC-010: Marketing & Communications
**Story Points:** 5
**Priority:** High
**Status:** Ready for Development

---

## User Story

**As an** event organizer
**I want to** automatically recover abandoned checkouts with reminder emails
**So that** I can increase conversion rates and recover lost revenue

---

## Acceptance Criteria

### Cart Abandonment Detection
- [ ] System detects when user adds tickets to cart but doesn't complete purchase
- [ ] System captures user email at cart stage (via login or email input)
- [ ] System creates abandoned cart record with timestamp
- [ ] System tracks cart contents (tickets, quantities, prices)
- [ ] System identifies cart as abandoned after 15 minutes of inactivity
- [ ] System excludes completed purchases from abandoned cart list
- [ ] System handles multiple abandoned carts per user

### Automated Email Sequence
- [ ] System sends first recovery email 1 hour after abandonment
- [ ] System sends second recovery email 24 hours after abandonment
- [ ] System sends final recovery email 3 days after abandonment
- [ ] Each email includes cart contents and "Complete Purchase" button
- [ ] System stops email sequence if user completes purchase
- [ ] System stops sequence if user clicks unsubscribe
- [ ] Organizer can customize email timing and content

### Cart Recovery Link
- [ ] System generates unique recovery link for each abandoned cart
- [ ] Link pre-fills checkout with abandoned cart contents
- [ ] Link bypasses login if user not authenticated
- [ ] Link expires after 7 days
- [ ] User can modify cart contents after clicking recovery link
- [ ] System tracks clicks on recovery links
- [ ] System attributes recovered purchases to recovery campaign

### Email Content Personalization
- [ ] Email includes user's first name
- [ ] Email displays event name, date, and image
- [ ] Email shows abandoned ticket types and quantities
- [ ] Email displays total cart value
- [ ] Email includes event organizer branding
- [ ] Email features compelling subject line variants
- [ ] Email includes urgency messaging if event is selling fast

### Incentive Integration
- [ ] Organizer can optionally add discount code to recovery emails
- [ ] System auto-generates unique discount for final email (e.g., 10% off)
- [ ] Discount code auto-applies when user clicks recovery link
- [ ] Organizer can set discount amount per recovery email
- [ ] System tracks redemption of recovery discount codes
- [ ] Incentive expires if user doesn't purchase within timeframe

### Recovery Analytics
- [ ] Dashboard displays abandoned cart count and value
- [ ] Dashboard shows recovery email performance (sent, opened, clicked)
- [ ] Dashboard displays recovery rate by email (1hr, 24hr, 3-day)
- [ ] Organizer can view total recovered revenue
- [ ] Dashboard shows abandonment reasons (if data available)
- [ ] Organizer can export abandoned cart report

### Organizer Controls
- [ ] Organizer can enable/disable recovery emails per event
- [ ] Organizer can customize email templates
- [ ] Organizer can adjust email timing (1hr, 6hr, 24hr, etc.)
- [ ] Organizer can set maximum number of recovery emails
- [ ] Organizer can exclude certain ticket types from recovery
- [ ] Organizer can A/B test email subject lines

---

## Technical Requirements

### Abandoned Cart Detection Service
```typescript
// Abandoned Cart Model
interface AbandonedCart {
  id: string;
  userId?: string;
  email: string;
  firstName?: string;
  eventId: string;
  sessionId: string;

  // Cart Contents
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;

  // Status
  status: 'ABANDONED' | 'RECOVERED' | 'EXPIRED';
  abandonedAt: Date;
  recoveredAt?: Date;
  recoveryOrderId?: string;

  // Email Tracking
  emailsSent: number;
  lastEmailSentAt?: Date;
  emailsOpened: number;
  recoveryLinkClicked: boolean;
  recoveryToken: string; // Unique link token

  createdAt: Date;
  updatedAt: Date;
}

interface CartItem {
  ticketTypeId: string;
  ticketTypeName: string;
  quantity: number;
  pricePerTicket: number;
  subtotal: number;
}

// Cart Abandonment Detection
export class CartAbandonmentService {
  async detectAbandonment(): Promise<void> {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    // Find carts inactive for 15+ minutes
    const abandonedCarts = await prisma.cartSession.findMany({
      where: {
        updatedAt: { lte: fifteenMinutesAgo },
        status: 'ACTIVE',
        email: { not: null }, // Must have email
        items: { isEmpty: false }, // Must have items
      },
      include: {
        items: true,
        event: true,
      },
    });

    for (const cart of abandonedCarts) {
      // Check if order was completed
      const existingOrder = await prisma.order.findFirst({
        where: {
          userId: cart.userId,
          eventId: cart.eventId,
          createdAt: { gte: cart.createdAt },
          status: { in: ['COMPLETED', 'PAID'] },
        },
      });

      if (existingOrder) {
        // Mark as completed, not abandoned
        await prisma.cartSession.update({
          where: { id: cart.id },
          data: { status: 'COMPLETED' },
        });
        continue;
      }

      // Create abandoned cart record
      await this.createAbandonedCartRecord(cart);

      // Queue first recovery email
      await this.queueRecoveryEmail(cart, 'FIRST');
    }
  }

  async createAbandonedCartRecord(cart: CartSession): Promise<AbandonedCart> {
    const recoveryToken = this.generateRecoveryToken();

    return await prisma.abandonedCart.create({
      data: {
        userId: cart.userId,
        email: cart.email,
        firstName: cart.firstName,
        eventId: cart.eventId,
        sessionId: cart.sessionId,
        items: cart.items,
        subtotal: cart.subtotal,
        tax: cart.tax,
        total: cart.total,
        status: 'ABANDONED',
        abandonedAt: new Date(),
        recoveryToken,
        emailsSent: 0,
        emailsOpened: 0,
        recoveryLinkClicked: false,
      },
    });
  }

  private generateRecoveryToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async processRecoveryEmailQueue(): Promise<void> {
    const now = new Date();

    // Find carts needing recovery emails
    const cartsNeedingEmail = await prisma.abandonedCart.findMany({
      where: {
        status: 'ABANDONED',
        OR: [
          // First email: 1 hour after abandonment
          {
            emailsSent: 0,
            abandonedAt: { lte: new Date(now.getTime() - 60 * 60 * 1000) },
          },
          // Second email: 24 hours after abandonment
          {
            emailsSent: 1,
            abandonedAt: { lte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
          },
          // Third email: 3 days after abandonment
          {
            emailsSent: 2,
            abandonedAt: { lte: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
          },
        ],
      },
      include: {
        event: true,
      },
    });

    for (const cart of cartsNeedingEmail) {
      const emailType = this.getEmailType(cart.emailsSent);
      await this.sendRecoveryEmail(cart, emailType);

      await prisma.abandonedCart.update({
        where: { id: cart.id },
        data: {
          emailsSent: { increment: 1 },
          lastEmailSentAt: new Date(),
        },
      });
    }
  }

  private getEmailType(emailsSent: number): 'FIRST' | 'SECOND' | 'FINAL' {
    if (emailsSent === 0) return 'FIRST';
    if (emailsSent === 1) return 'SECOND';
    return 'FINAL';
  }

  async sendRecoveryEmail(
    cart: AbandonedCart,
    emailType: 'FIRST' | 'SECOND' | 'FINAL'
  ): Promise<void> {
    const event = await this.getEvent(cart.eventId);
    const recoveryLink = this.buildRecoveryLink(cart.recoveryToken);

    // Generate discount for final email
    let discountCode: string | undefined;
    if (emailType === 'FINAL') {
      discountCode = await this.generateRecoveryDiscount(cart);
    }

    const emailContent = this.buildRecoveryEmail(
      cart,
      event,
      recoveryLink,
      emailType,
      discountCode
    );

    await this.emailService.send({
      to: cart.email,
      subject: this.getSubjectLine(emailType, event.title),
      html: emailContent,
      trackOpens: true,
      trackClicks: true,
      metadata: {
        abandonedCartId: cart.id,
        emailType,
      },
    });
  }

  private buildRecoveryLink(token: string): string {
    return `${process.env.APP_URL}/checkout/recover/${token}`;
  }

  private async generateRecoveryDiscount(
    cart: AbandonedCart
  ): Promise<string> {
    const code = `RECOVER${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    await prisma.discountCode.create({
      data: {
        eventId: cart.eventId,
        code,
        displayCode: code,
        type: 'PERCENTAGE',
        value: 10, // 10% off
        maxRedemptions: 1,
        maxRedemptionsPerUser: 1,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        isActive: true,
      },
    });

    return code;
  }

  private getSubjectLine(emailType: string, eventTitle: string): string {
    const subjectLines = {
      FIRST: `Don't miss out on ${eventTitle}!`,
      SECOND: `Your tickets for ${eventTitle} are still available`,
      FINAL: `Last chance: 10% off ${eventTitle} tickets`,
    };

    return subjectLines[emailType];
  }

  private buildRecoveryEmail(
    cart: AbandonedCart,
    event: Event,
    recoveryLink: string,
    emailType: string,
    discountCode?: string
  ): string {
    const itemsList = cart.items
      .map(
        item =>
          `<li>${item.quantity}x ${item.ticketTypeName} - $${item.subtotal / 100}</li>`
      )
      .join('');

    const urgencyMessage =
      emailType === 'FINAL'
        ? `<p><strong>Use code ${discountCode} for 10% off!</strong></p>`
        : '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #4CAF50;
              color: white;
              text-decoration: none;
              border-radius: 5px;
            }
            .cart-items { background: #f5f5f5; padding: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Hi ${cart.firstName || 'there'},</h2>
            <p>You left tickets in your cart for <strong>${event.title}</strong>.</p>

            <img src="${event.imageUrl}" alt="${event.title}" style="max-width: 100%; height: auto;">

            <div class="cart-items">
              <h3>Your Cart:</h3>
              <ul>${itemsList}</ul>
              <p><strong>Total: $${cart.total / 100}</strong></p>
            </div>

            ${urgencyMessage}

            <p>Complete your purchase before tickets sell out!</p>

            <a href="${recoveryLink}" class="button">Complete Your Purchase</a>

            <p><small>This link expires in 7 days.</small></p>
          </div>
        </body>
      </html>
    `;
  }

  async handleRecoveryLinkClick(token: string): Promise<AbandonedCart> {
    const cart = await prisma.abandonedCart.findFirst({
      where: { recoveryToken: token, status: 'ABANDONED' },
      include: { event: true },
    });

    if (!cart) {
      throw new Error('Recovery link invalid or expired');
    }

    // Check if expired (7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (cart.abandonedAt < sevenDaysAgo) {
      await prisma.abandonedCart.update({
        where: { id: cart.id },
        data: { status: 'EXPIRED' },
      });
      throw new Error('Recovery link has expired');
    }

    // Track click
    await prisma.abandonedCart.update({
      where: { id: cart.id },
      data: { recoveryLinkClicked: true },
    });

    return cart;
  }

  async markAsRecovered(
    cartId: string,
    orderId: string
  ): Promise<void> {
    await prisma.abandonedCart.update({
      where: { id: cartId },
      data: {
        status: 'RECOVERED',
        recoveredAt: new Date(),
        recoveryOrderId: orderId,
      },
    });
  }
}
```

### Recovery Email React Component
```typescript
// React Email Template
import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Button,
  Img,
  Section,
} from '@react-email/components';

interface RecoveryEmailProps {
  firstName: string;
  eventTitle: string;
  eventImage: string;
  cartItems: CartItem[];
  total: number;
  recoveryLink: string;
  discountCode?: string;
}

export default function RecoveryEmail({
  firstName,
  eventTitle,
  eventImage,
  cartItems,
  total,
  recoveryLink,
  discountCode,
}: RecoveryEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading>Hi {firstName},</Heading>
          <Text>You left tickets in your cart for <strong>{eventTitle}</strong>.</Text>

          <Img src={eventImage} alt={eventTitle} width="600" />

          <Section style={cartSection}>
            <Heading as="h3">Your Cart:</Heading>
            {cartItems.map(item => (
              <Text key={item.ticketTypeId}>
                {item.quantity}x {item.ticketTypeName} - ${item.subtotal / 100}
              </Text>
            ))}
            <Text><strong>Total: ${total / 100}</strong></Text>
          </Section>

          {discountCode && (
            <Section style={urgencySection}>
              <Text><strong>Use code {discountCode} for 10% off!</strong></Text>
            </Section>
          )}

          <Button href={recoveryLink} style={button}>
            Complete Your Purchase
          </Button>

          <Text style={footer}>This link expires in 7 days.</Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: '#f6f9fc', padding: '20px' };
const container = { backgroundColor: '#ffffff', padding: '20px', maxWidth: '600px' };
const button = { backgroundColor: '#4CAF50', color: '#fff', padding: '12px 30px' };
const cartSection = { backgroundColor: '#f5f5f5', padding: '15px' };
const urgencySection = { backgroundColor: '#fff3cd', padding: '10px' };
const footer = { fontSize: '12px', color: '#666' };
```

---

## Database Schema

```prisma
model AbandonedCart {
  id                  String   @id @default(cuid())
  userId              String?
  user                User? @relation(fields: [userId], references: [id])
  email               String
  firstName           String?
  eventId             String
  event               Event @relation(fields: [eventId], references: [id])
  sessionId           String

  // Cart Contents
  items               Json     // Array of CartItem
  subtotal            Int      // In cents
  tax                 Int
  total               Int

  // Status
  status              AbandonedCartStatus @default(ABANDONED)
  abandonedAt         DateTime
  recoveredAt         DateTime?
  recoveryOrderId     String?
  recoveryOrder       Order? @relation(fields: [recoveryOrderId], references: [id])

  // Recovery
  recoveryToken       String   @unique
  emailsSent          Int      @default(0)
  lastEmailSentAt     DateTime?
  emailsOpened        Int      @default(0)
  recoveryLinkClicked Boolean  @default(false)

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([eventId])
  @@index([email])
  @@index([status])
  @@index([abandonedAt])
}

enum AbandonedCartStatus {
  ABANDONED
  RECOVERED
  EXPIRED
}
```

---

## API Endpoints

```typescript
// Cart Recovery
GET    /api/checkout/recover/:token        // Recover cart by token
POST   /api/checkout/recover/:token        // Complete recovered purchase

// Admin/Organizer
GET    /api/events/:eventId/abandoned-carts     // List abandoned carts
GET    /api/events/:eventId/recovery-analytics  // Get recovery statistics

// Webhooks
POST   /api/webhooks/email/open             // Track email opens
POST   /api/webhooks/email/click            // Track email clicks
```

---

## Cron Jobs

```typescript
// Schedule abandoned cart detection and recovery emails
// cron/abandoned-carts.ts

// Every 15 minutes: Detect new abandoned carts
*/15 * * * * - detectAbandonment()

// Every hour: Process recovery email queue
0 * * * * - processRecoveryEmailQueue()

// Daily: Expire old carts (7+ days)
0 0 * * * - expireOldCarts()
```

---

## UI/UX Requirements

### Abandoned Cart Dashboard
1. **Overview Cards**
   - Total abandoned carts (last 30 days)
   - Abandoned cart value
   - Recovery rate
   - Recovered revenue

2. **Abandoned Carts Table**
   - Columns: Email, Event, Abandoned Date, Cart Value, Emails Sent, Status
   - Filter by event, date range, status
   - Click to view cart details
   - Export to CSV

3. **Recovery Performance**
   - Email performance by type (1hr, 24hr, 3-day)
   - Open rate, click rate, recovery rate per email
   - Bar chart comparing email effectiveness

4. **Recovery Email Settings**
   - Enable/disable recovery emails toggle
   - Email timing sliders (1hr, 6hr, 24hr, etc.)
   - Discount amount input for final email
   - Email template editor

### Recovery Link Landing Page
1. **Cart Restoration**
   - "Welcome back! Your cart has been restored."
   - Display cart contents
   - Pre-applied discount code (if applicable)
   - "Proceed to Checkout" button

2. **Expired Link**
   - "This recovery link has expired."
   - Display event details
   - "Browse Events" button

---

## Email Best Practices

### Subject Line Optimization
- **First Email:** Focus on reminder ("You left tickets in your cart")
- **Second Email:** Emphasize scarcity ("Tickets selling fast!")
- **Third Email:** Offer incentive ("10% off your tickets")

### Send Time Optimization
- Send during peak engagement hours (10am-2pm, 6pm-8pm)
- Respect user timezone
- Avoid sending late night/early morning

### A/B Testing Ideas
- Subject line variations
- Discount amount (5% vs 10% vs 15%)
- Email timing (1hr vs 6hr for first email)
- Urgency messaging

---

## Testing Requirements

### Unit Tests
- Cart abandonment detection logic
- Recovery email generation
- Recovery token validation
- Discount code generation
- Recovery rate calculation

### Integration Tests
- Abandoned cart creation flow
- Email sending and tracking
- Recovery link click handling
- Order attribution to recovered cart
- Discount code application

### E2E Tests
- User adds items to cart and abandons
- Verify recovery email received
- Click recovery link and complete purchase
- Verify cart marked as recovered
- Check analytics updated correctly

---

## Performance Considerations

1. **Cart Detection**
   - Run detection job every 15 minutes
   - Batch process to avoid overwhelming email service
   - Index `updatedAt` and `status` columns

2. **Email Queue**
   - Queue recovery emails in background job
   - Rate limit: 10 emails per second
   - Retry failed sends with exponential backoff

3. **Recovery Link Expiration**
   - Clean up expired carts weekly
   - Archive recovered carts after 90 days

---

## Analytics Metrics

### Key Metrics
- **Abandonment Rate:** (Abandoned Carts / Total Carts Started) × 100
- **Recovery Rate:** (Recovered Carts / Abandoned Carts) × 100
- **Recovered Revenue:** Total revenue from recovered carts
- **Email Performance:** Open rate, click rate, conversion rate per email

### Benchmark Goals
- Recovery rate: 10-15% (industry average)
- Email open rate: 40-50%
- Click-through rate: 10-15%
- Conversion from click: 20-30%

---

## Dependencies
- **Requires:** Email service (SendGrid/Resend), Cart system, Checkout flow
- **Integrates With:** Discount code system (MKT-004), Email campaigns (MKT-001)
- **Blocks:** None

---

## Notes
- Start conservatively with 1-2 emails, expand to 3 based on performance
- Monitor unsubscribe rate to avoid over-emailing
- Test email deliverability to avoid spam filters
- Consider SMS recovery for high-value carts
- Future: Add browser push notifications for cart recovery
- Future: Implement dynamic pricing (lower prices for recovered carts)