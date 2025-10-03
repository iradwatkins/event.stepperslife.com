# MKT-004: Discount Code System

**Epic:** EPIC-010: Marketing & Communications
**Story Points:** 5
**Priority:** High
**Status:** Ready for Development

---

## User Story

**As an** event organizer
**I want to** create and manage discount codes for my events
**So that** I can run promotional campaigns and incentivize early ticket purchases

---

## Acceptance Criteria

### Code Creation
- [ ] Organizer can create discount code from event dashboard
- [ ] System generates unique alphanumeric code automatically
- [ ] Organizer can specify custom code (case-insensitive)
- [ ] System validates code uniqueness across organization
- [ ] Organizer can set discount type (percentage, fixed amount, BOGO)
- [ ] System prevents duplicate codes
- [ ] Organizer can set code expiration date/time
- [ ] Organizer can save code as draft or publish immediately

### Discount Types
- [ ] **Percentage Off:** Organizer sets discount percentage (1-100%)
- [ ] **Fixed Amount:** Organizer sets dollar amount off total
- [ ] **BOGO:** Buy one ticket, get one free (or discounted)
- [ ] **First-Time Buyer:** Discount only for users without prior purchases
- [ ] System calculates discount correctly in checkout
- [ ] System prevents stacking multiple codes (unless enabled)
- [ ] Organizer can set minimum purchase amount for code activation

### Usage Limits
- [ ] Organizer can set maximum redemption count
- [ ] Organizer can limit uses per user (single-use or multiple)
- [ ] System tracks remaining redemptions in real-time
- [ ] System disables code when limit reached
- [ ] Organizer can set code to unlimited uses
- [ ] System displays usage count to organizer
- [ ] Organizer can pause/resume code availability

### Validation Rules
- [ ] Organizer can set valid date range (start and end dates)
- [ ] Organizer can limit code to specific ticket types
- [ ] Organizer can set minimum/maximum ticket quantity
- [ ] System validates code at checkout before payment
- [ ] System displays clear error messages for invalid codes
- [ ] Organizer can set code for specific user segments
- [ ] System prevents use after expiration

### Code Management
- [ ] Organizer can view list of all discount codes
- [ ] Dashboard shows code status (active, expired, exhausted, paused)
- [ ] Organizer can edit code details before first use
- [ ] Organizer can deactivate code at any time
- [ ] System prevents editing redemption amount after first use
- [ ] Organizer can duplicate existing code with modifications
- [ ] Organizer can delete unused codes

### Reporting & Analytics
- [ ] Dashboard displays code usage statistics
- [ ] Organizer can view redemption count per code
- [ ] System tracks total revenue and discount amount per code
- [ ] Dashboard shows conversion rate (views vs. redemptions)
- [ ] Organizer can export discount code report to CSV
- [ ] System shows which users redeemed each code
- [ ] Dashboard displays most popular codes

### Customer Experience
- [ ] User can enter code during checkout
- [ ] System validates code and shows discount immediately
- [ ] User sees original price and discounted price
- [ ] System displays error message for invalid/expired codes
- [ ] User can remove code and re-enter different code
- [ ] Code appears on order confirmation and receipt
- [ ] User receives code validation feedback instantly

---

## Technical Requirements

### Discount Code Service
```typescript
// Discount Code Model
interface DiscountCode {
  id: string;
  eventId: string;
  code: string; // Normalized uppercase
  displayCode: string; // Original casing
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BOGO' | 'FIRST_TIME';
  value: number; // Percentage (0-100) or amount in cents
  description?: string;

  // Validity
  startsAt?: Date;
  expiresAt?: Date;
  isActive: boolean;

  // Limits
  maxRedemptions?: number; // null = unlimited
  maxRedemptionsPerUser: number; // default 1
  redemptionCount: number;

  // Rules
  minPurchaseAmount?: number; // In cents
  maxDiscountAmount?: number; // Cap for percentage discounts
  applicableTicketTypeIds?: string[]; // null = all tickets
  minQuantity?: number;
  maxQuantity?: number;

  // Tracking
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

// Discount Code Redemption
interface DiscountRedemption {
  id: string;
  discountCodeId: string;
  orderId: string;
  userId: string;
  discountAmount: number; // In cents
  originalAmount: number;
  finalAmount: number;
  redeemedAt: Date;
}

// Discount Code Validation Service
export class DiscountCodeService {
  async validateCode(
    code: string,
    eventId: string,
    userId: string,
    cart: CartItem[]
  ): Promise<ValidationResult> {
    // Normalize code (case-insensitive)
    const normalizedCode = code.toUpperCase().trim();

    // Find discount code
    const discount = await prisma.discountCode.findFirst({
      where: {
        code: normalizedCode,
        eventId,
        isActive: true,
      },
    });

    if (!discount) {
      return { valid: false, error: 'Invalid discount code' };
    }

    // Check expiration
    const now = new Date();
    if (discount.startsAt && now < discount.startsAt) {
      return { valid: false, error: 'Discount code not yet active' };
    }
    if (discount.expiresAt && now > discount.expiresAt) {
      return { valid: false, error: 'Discount code has expired' };
    }

    // Check max redemptions
    if (discount.maxRedemptions && discount.redemptionCount >= discount.maxRedemptions) {
      return { valid: false, error: 'Discount code has been fully redeemed' };
    }

    // Check per-user limit
    const userRedemptionCount = await this.getUserRedemptionCount(
      discount.id,
      userId
    );
    if (userRedemptionCount >= discount.maxRedemptionsPerUser) {
      return { valid: false, error: 'You have already used this discount code' };
    }

    // Check first-time buyer requirement
    if (discount.type === 'FIRST_TIME') {
      const hasPreviousPurchases = await this.userHasPreviousPurchases(userId);
      if (hasPreviousPurchases) {
        return { valid: false, error: 'This code is only for first-time buyers' };
      }
    }

    // Check minimum purchase amount
    const cartTotal = this.calculateCartTotal(cart);
    if (discount.minPurchaseAmount && cartTotal < discount.minPurchaseAmount) {
      return {
        valid: false,
        error: `Minimum purchase of $${discount.minPurchaseAmount / 100} required`,
      };
    }

    // Check applicable ticket types
    if (discount.applicableTicketTypeIds && discount.applicableTicketTypeIds.length > 0) {
      const hasApplicableTicket = cart.some(item =>
        discount.applicableTicketTypeIds.includes(item.ticketTypeId)
      );
      if (!hasApplicableTicket) {
        return { valid: false, error: 'Code not applicable to selected tickets' };
      }
    }

    // Check quantity limits
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (discount.minQuantity && totalQuantity < discount.minQuantity) {
      return { valid: false, error: `Minimum ${discount.minQuantity} tickets required` };
    }
    if (discount.maxQuantity && totalQuantity > discount.maxQuantity) {
      return { valid: false, error: `Maximum ${discount.maxQuantity} tickets allowed` };
    }

    return { valid: true, discount };
  }

  calculateDiscount(
    discount: DiscountCode,
    cart: CartItem[]
  ): DiscountCalculation {
    let discountAmount = 0;
    const applicableItems = this.getApplicableItems(cart, discount);
    const subtotal = this.calculateItemsTotal(applicableItems);

    switch (discount.type) {
      case 'PERCENTAGE':
        discountAmount = Math.round(subtotal * (discount.value / 100));

        // Apply max discount cap if set
        if (discount.maxDiscountAmount) {
          discountAmount = Math.min(discountAmount, discount.maxDiscountAmount);
        }
        break;

      case 'FIXED_AMOUNT':
        discountAmount = Math.min(discount.value, subtotal);
        break;

      case 'BOGO':
        // Buy one get one free logic
        discountAmount = this.calculateBogoDiscount(applicableItems);
        break;

      case 'FIRST_TIME':
        // Treat as percentage for first-time buyers
        discountAmount = Math.round(subtotal * (discount.value / 100));
        break;
    }

    return {
      discountAmount,
      originalAmount: subtotal,
      finalAmount: subtotal - discountAmount,
    };
  }

  private calculateBogoDiscount(items: CartItem[]): number {
    // Sort by price descending
    const sorted = [...items].sort((a, b) => b.price - a.price);

    let discount = 0;
    let freeTicketsRemaining = Math.floor(
      sorted.reduce((sum, item) => sum + item.quantity, 0) / 2
    );

    // Apply discount to cheaper tickets
    for (let i = sorted.length - 1; i >= 0 && freeTicketsRemaining > 0; i--) {
      const item = sorted[i];
      const freeTickets = Math.min(item.quantity, freeTicketsRemaining);
      discount += item.price * freeTickets;
      freeTicketsRemaining -= freeTickets;
    }

    return discount;
  }

  async applyDiscount(
    orderId: string,
    discountCodeId: string,
    userId: string,
    discountAmount: number,
    originalAmount: number
  ): Promise<void> {
    // Create redemption record
    await prisma.discountRedemption.create({
      data: {
        discountCodeId,
        orderId,
        userId,
        discountAmount,
        originalAmount,
        finalAmount: originalAmount - discountAmount,
        redeemedAt: new Date(),
      },
    });

    // Increment redemption count
    await prisma.discountCode.update({
      where: { id: discountCodeId },
      data: {
        redemptionCount: { increment: 1 },
      },
    });

    // Update order with discount
    await prisma.order.update({
      where: { id: orderId },
      data: {
        discountCodeId,
        discountAmount,
        totalAmount: originalAmount - discountAmount,
      },
    });
  }
}
```

### Code Generation Utility
```typescript
// Auto-generate unique discount codes
export function generateDiscountCode(length: number = 8): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';

  for (let i = 0; i < length; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return code;
}

// Generate themed codes
export function generateThemedCode(theme: string): string {
  const themes = {
    early_bird: ['EARLY', 'BIRD', 'DAWN', 'RISE'],
    holiday: ['FEST', 'JOY', 'CHEER', 'MERRY'],
    vip: ['VIP', 'ELITE', 'PREMIUM', 'EXCLUSIVE'],
    seasonal: ['SPRING', 'SUMMER', 'FALL', 'WINTER'],
  };

  const words = themes[theme] || ['SAVE', 'DEAL', 'PROMO'];
  const randomWord = words[Math.floor(Math.random() * words.length)];
  const randomNum = Math.floor(Math.random() * 1000);

  return `${randomWord}${randomNum}`;
}
```

---

## Database Schema

```prisma
model DiscountCode {
  id                      String   @id @default(cuid())
  eventId                 String
  event                   Event @relation(fields: [eventId], references: [id])
  organizationId          String
  organization            Organization @relation(fields: [organizationId], references: [id])

  code                    String   // Normalized uppercase
  displayCode             String   // Original casing for display
  description             String?
  type                    DiscountType
  value                   Int      // Percentage or cents

  startsAt                DateTime?
  expiresAt               DateTime?
  isActive                Boolean  @default(true)

  maxRedemptions          Int?     // null = unlimited
  maxRedemptionsPerUser   Int      @default(1)
  redemptionCount         Int      @default(0)

  minPurchaseAmount       Int?     // In cents
  maxDiscountAmount       Int?     // Cap for percentage
  applicableTicketTypeIds String[] // Empty = all tickets
  minQuantity             Int?
  maxQuantity             Int?

  redemptions             DiscountRedemption[]
  orders                  Order[]

  createdById             String
  createdBy               User @relation(fields: [createdById], references: [id])
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt

  @@unique([eventId, code])
  @@index([eventId])
  @@index([code])
  @@index([organizationId])
}

model DiscountRedemption {
  id                String   @id @default(cuid())
  discountCodeId    String
  discountCode      DiscountCode @relation(fields: [discountCodeId], references: [id])
  orderId           String
  order             Order @relation(fields: [orderId], references: [id])
  userId            String
  user              User @relation(fields: [userId], references: [id])

  discountAmount    Int      // In cents
  originalAmount    Int
  finalAmount       Int

  redeemedAt        DateTime @default(now())

  @@index([discountCodeId])
  @@index([orderId])
  @@index([userId])
}

enum DiscountType {
  PERCENTAGE
  FIXED_AMOUNT
  BOGO
  FIRST_TIME
}
```

---

## API Endpoints

```typescript
// Discount Code Management
POST   /api/events/:eventId/discounts        // Create discount code
GET    /api/events/:eventId/discounts        // List discount codes
GET    /api/events/:eventId/discounts/:id    // Get discount details
PUT    /api/events/:eventId/discounts/:id    // Update discount code
DELETE /api/events/:eventId/discounts/:id    // Delete discount code
POST   /api/events/:eventId/discounts/:id/duplicate // Duplicate code

// Code Validation (Public)
POST   /api/events/:eventId/discounts/validate // Validate discount code

// Analytics
GET    /api/events/:eventId/discounts/:id/analytics // Get code analytics
GET    /api/events/:eventId/discounts/:id/redemptions // List redemptions
```

---

## UI/UX Requirements

### Discount Code List Page
1. **Code Table**
   - Columns: Code, Type, Value, Status, Uses, Expires, Actions
   - Status badges: Active (green), Expired (red), Exhausted (gray), Paused (yellow)
   - Filter by status, type, date range
   - Search by code
   - Sort by redemptions, date created, expiration
   - Quick actions: Edit, Duplicate, Deactivate, Delete

2. **Create Code Button**
   - Primary CTA: "Create Discount Code"
   - Opens modal or new page

### Discount Code Form
1. **Code Configuration**
   - Code input with "Generate" button
   - Description (internal use)
   - Discount type selector (radio buttons)
   - Value input (percentage slider or dollar amount)
   - Active/Inactive toggle

2. **Validity Settings**
   - Start date/time picker (optional)
   - End date/time picker (optional)
   - "Never expires" checkbox

3. **Usage Limits**
   - Max redemptions input (blank = unlimited)
   - Max uses per user dropdown (1, 2, 5, unlimited)
   - Minimum purchase amount input

4. **Advanced Rules** (Collapsible)
   - Applicable ticket types (multi-select)
   - Min/max ticket quantity
   - Max discount cap (for percentage discounts)

5. **Preview**
   - Shows example calculation
   - "Test this code" link to checkout preview

### Checkout Integration
1. **Promo Code Section**
   - "Have a promo code?" expandable section
   - Code input field
   - "Apply" button
   - Instant validation with loading spinner
   - Success message: "Code {CODE} applied! You saved ${amount}"
   - Error message in red below input
   - Remove code link (X icon)

2. **Order Summary with Discount**
   ```
   Subtotal:        $100.00
   Discount (CODE): -$20.00
   Tax:             $8.00
   Total:           $88.00
   ```

### Analytics Dashboard
1. **Code Performance Metrics**
   - Total redemptions
   - Revenue with discount
   - Total discount given
   - Average discount per order
   - Conversion rate (views vs uses)

2. **Redemptions Timeline**
   - Line chart showing daily redemptions
   - Filter by date range

3. **Top Codes Table**
   - Ranked by redemptions
   - Shows revenue impact

---

## Validation & Error Messages

### Code Creation Errors
- "Code must be 3-20 characters"
- "Code already exists for this event"
- "Percentage must be between 1 and 100"
- "Fixed amount must be greater than 0"
- "Expiration date must be in the future"
- "Max redemptions must be greater than 0"

### Checkout Validation Errors
- "Invalid discount code" (code not found)
- "This code has expired" (past expiration date)
- "This code is not yet active" (before start date)
- "This code has reached its usage limit"
- "You've already used this code"
- "Minimum purchase of ${amount} required"
- "This code is not applicable to your selected tickets"
- "You must purchase at least {N} tickets to use this code"

---

## Testing Requirements

### Unit Tests
- Code generation and uniqueness
- Discount calculation for each type (percentage, fixed, BOGO)
- Validation logic for all rules
- Expiration date checking
- Usage limit enforcement
- Per-user redemption tracking

### Integration Tests
- Create discount code API
- Validate code at checkout
- Apply discount to order
- Increment redemption count
- Prevent duplicate redemptions
- Export analytics report

### E2E Tests
- Complete checkout flow with valid code
- Attempt checkout with expired code
- Attempt checkout with exhausted code
- Apply and remove code multiple times
- Verify order total calculation with discount

---

## Edge Cases

1. **Multiple Users Redeeming Simultaneously**
   - Use database transactions to prevent race conditions
   - Lock discount code row during validation

2. **Code Expiring During Checkout**
   - Validate code again before payment processing
   - Show error if expired between validation and payment

3. **Partial Refund with Discount**
   - Recalculate discount proportionally
   - Update redemption record

4. **Deleted Event**
   - Cascade delete or mark codes as inactive
   - Preserve redemption history

5. **BOGO with Odd Quantities**
   - Buy 3, get 1 free (round down)
   - Buy 5, get 2 free

---

## Dependencies
- **Integrates With:** Checkout flow, Order processing, Analytics
- **Requires:** Event management system
- **Optional:** Email integration for code distribution

---

## Notes
- Consider adding bulk code generation for unique per-user codes
- Future: Implement code stacking (multiple codes per order)
- Future: Add automatic code generation for abandoned carts
- Consider A/B testing different discount amounts
- Monitor discount ROI to prevent over-discounting