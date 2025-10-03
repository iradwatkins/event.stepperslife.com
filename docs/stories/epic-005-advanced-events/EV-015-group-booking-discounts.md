# Story: EV-015 - Group Booking Discounts

**Epic**: EPIC-005 - Advanced Event Features
**Story Points**: 5
**Priority**: P1 (High)
**Status**: Draft
**Dependencies**: EV-002 (Ticket Types), EV-013 (Tiered Pricing Rules), PAY-001 (Payment Processing)

---

## Story

**As an** event organizer
**I want to** offer automatic volume discounts for bulk ticket purchases
**So that** I can incentivize larger groups and increase average order value

**As an** attendee buying multiple tickets
**I want to** automatically receive discounts when purchasing in bulk
**So that** I can save money when bringing friends, family, or colleagues

---

## Context & Business Value

**The Group Booking Opportunity**:
Group bookings represent 20-30% of total ticket revenue but are often underutilized due to friction:
- Manual discount code creation
- No automatic pricing incentives
- No coordinator management features
- Complicated checkout for large orders

**Revenue Impact**:
- **Average Order Value**: Increases 40-60% with group discounts
- **Conversion Rate**: 25% higher for group-priced events
- **Viral Growth**: Each group purchase brings 5-25 new customers
- **Corporate Sales**: Opens door to corporate team-building events

**Use Cases**:
1. **Corporate Team Building**: Company buying 50 tickets for team event
2. **School Field Trips**: Teacher coordinating 30 students
3. **Family Reunions**: Family buying 15 tickets together
4. **Wedding Parties**: Bride buying 10 tickets for bridesmaids
5. **Sports Teams**: Coach purchasing 25 tickets for team

---

## Acceptance Criteria

### AC-1: Group Discount Configuration

**GIVEN** I am configuring pricing for a ticket type
**WHEN** I access group discount settings
**THEN** I should see options to:
- Enable group discounts
- Configure quantity tiers and discounts
- Set minimum group size
- Choose discount type (percentage or fixed amount per ticket)
- Set maximum group size (optional)
- Enable group coordinator features

**Configuration Interface**:
```
┌─────────────────────────────────────────────────┐
│ Group Booking Discounts                         │
├─────────────────────────────────────────────────┤
│ ☑ Enable group discounts                        │
│                                                  │
│ Base Price: $100.00                              │
│                                                  │
│ Discount Tiers:                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ 5-9 tickets:   10% off → $90/ticket         │ │
│ │ 10-24 tickets: 20% off → $80/ticket         │ │
│ │ 25-49 tickets: 25% off → $75/ticket         │ │
│ │ 50+ tickets:   30% off → $70/ticket         │ │
│ │ [+ Add Tier]                                 │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ Minimum Group Size: [5] tickets                  │
│ Maximum Group Size: [ ] Unlimited                │
│                                                  │
│ Group Coordinator Features:                      │
│ ☑ Enable coordinator role (assign tickets)      │
│ ☑ Allow partial payment collection               │
│ ☐ Require all attendee names at purchase        │
│                                                  │
│ Preview Savings:                                 │
│ • 10 tickets: Save $200 (20% off)               │
│ • 25 tickets: Save $625 (25% off)               │
│ • 50 tickets: Save $1,500 (30% off)             │
└─────────────────────────────────────────────────┘
```

**Validation**:
- Each tier must have higher discount than previous tier
- Cannot have overlapping quantity ranges
- Minimum group size must be at least 2
- Maximum discount should not exceed 50% (warning, not block)

### AC-2: Dynamic Cart Pricing with Tier Incentives

**GIVEN** I am purchasing tickets with group discounts enabled
**WHEN** I adjust the quantity in my cart
**THEN** I should see:
- Current per-ticket price based on quantity
- Total savings vs individual price
- Progress to next discount tier
- Incentive messaging

**Cart Display Example**:
```
╔════════════════════════════════════════════════╗
║ General Admission Ticket                      ║
╠════════════════════════════════════════════════╣
║ Quantity: [8] [-] [+]                         ║
║                                                ║
║ Price per ticket: $90.00 (10% off)            ║
║ Base price: $100.00                            ║
║                                                ║
║ 💡 Add 2 more tickets to save 20%             ║
║    (Would be $80/ticket instead of $90)       ║
║                                                ║
║ Subtotal: $720.00                              ║
║ You Save: $80 (10% discount)                   ║
║                                                ║
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ║
║ Discount Tiers:                                ║
║ ✓ 5-9 tickets:   10% off ← YOU ARE HERE       ║
║ ○ 10-24 tickets: 20% off (add 2 more)         ║
║ ○ 25-49 tickets: 25% off (add 17 more)        ║
║ ○ 50+ tickets:   30% off (add 42 more)        ║
╚════════════════════════════════════════════════╝
```

**Real-Time Calculation**:
- Price updates instantly as quantity changes
- Show savings counter incrementing
- Highlight next tier threshold
- Display "Add X more to save Y%" message

### AC-3: Group Coordinator Management

**GIVEN** I am purchasing tickets for a group
**WHEN** I complete the purchase as the coordinator
**THEN** I should:
- Be designated as "Group Coordinator"
- Receive special dashboard access for my group
- Be able to manage attendee assignments
- Have ability to collect contact info from group members
- Optionally collect partial payments

**Coordinator Dashboard Features**:
```
╔══════════════════════════════════════════════════╗
║ Group Coordinator Dashboard                     ║
║ Conference 2025 - Your Group of 25              ║
╠══════════════════════════════════════════════════╣
║ Group Details:                                   ║
║ • Order: #SL-2025-1234                          ║
║ • Total Tickets: 25                              ║
║ • Price Paid: $75/ticket (25% discount)         ║
║ • Total: $1,875                                  ║
║ • Status: ✓ Confirmed                           ║
╠══════════════════════════════════════════════════╣
║ Ticket Assignment (15/25 assigned):              ║
║                                                  ║
║ [Search attendees...]                            ║
║                                                  ║
║ ┌────────────────────────────────────────────┐  ║
║ │ ✓ John Doe        john@email.com           │  ║
║ │ ✓ Jane Smith      jane@email.com           │  ║
║ │ ✓ Bob Johnson     bob@email.com            │  ║
║ │ ... (12 more assigned)                      │  ║
║ └────────────────────────────────────────────┘  ║
║                                                  ║
║ Unassigned Tickets: 10                           ║
║ [Send Assignment Invitation Link]                ║
║                                                  ║
║ Actions:                                         ║
║ [📧 Email All Attendees]                         ║
║ [📊 Download Attendee List]                      ║
║ [🔗 Share Registration Link]                     ║
║ [➕ Add More Tickets to Group]                   ║
╚══════════════════════════════════════════════════╝
```

**Coordinator Abilities**:
1. **Assign Tickets**: Manually assign tickets to specific people
2. **Send Invites**: Generate unique links for group members to claim tickets
3. **Collect Info**: Get names/emails from attendees
4. **Manage Roster**: Add/remove/transfer tickets within group
5. **Communication**: Send messages to entire group
6. **Payment Tracking**: See who paid (if partial payment enabled)

### AC-4: Ticket Assignment Flow

**GIVEN** I am a group member receiving a ticket assignment
**WHEN** the coordinator sends me an invitation
**THEN** I should:
- Receive email with unique claim link
- Be able to register my ticket with my details
- Provide my name, email, and optional info
- Receive my own QR code for check-in
- Have individual access to my ticket

**Assignment Email Template**:
```
Subject: Your ticket to Conference 2025!

Hi there!

John Doe has purchased a group ticket for you for:

Event: Conference 2025
Date: August 15-17, 2025
Location: Convention Center, NYC

Your ticket is waiting! Click below to claim it:

[Claim Your Ticket] →

You'll receive your personal QR code after completing registration.

Questions? Contact John Doe at john@email.com

See you there!
```

**Claim Process**:
1. Click claim link → Lands on registration page
2. Enter name and email
3. Accept terms (optional)
4. Submit → Ticket assigned
5. Receive confirmation email with QR code
6. Can access ticket in "My Tickets" dashboard

### AC-5: Group Purchase Analytics

**GIVEN** I am organizing an event with group discounts
**WHEN** I view analytics
**THEN** I should see:
- Total group bookings count
- Average group size
- Group discount tier distribution
- Revenue from group bookings
- Top coordinators (for recognition)
- Group vs individual sales comparison

**Analytics Dashboard**:
```
╔══════════════════════════════════════════════════╗
║ Group Booking Analytics                         ║
╠══════════════════════════════════════════════════╣
║ Overview:                                        ║
║ • Total Groups: 18                               ║
║ • Total Group Tickets: 287 (42% of sales)       ║
║ • Average Group Size: 15.9                       ║
║ • Group Revenue: $18,445 (38% of total)         ║
║ • Individual Tickets: 395 (58% of sales)        ║
╠══════════════════════════════════════════════════╣
║ Discount Tier Usage:                             ║
║ ┌────────────────────────────────────────────┐  ║
║ │ 5-9 tickets (10%):   8 groups, 62 tickets │  ║
║ │ 10-24 tickets (20%): 7 groups, 125 tickets│  ║
║ │ 25-49 tickets (25%): 2 groups, 75 tickets │  ║
║ │ 50+ tickets (30%):   1 group, 25 tickets  │  ║
║ └────────────────────────────────────────────┘  ║
╠══════════════════════════════════════════════════╣
║ Top Groups:                                      ║
║ 1. Acme Corp (Sarah J.) - 50 tickets, $3,500   ║
║ 2. Tech Startup (Mike K.) - 35 tickets, $2,625 ║
║ 3. Marketing Team (Lisa M.) - 28 tickets, $2,100║
╠══════════════════════════════════════════════════╣
║ Impact:                                          ║
║ • Group discounts given: $4,233                  ║
║ • Additional tickets sold via groups: ~120       ║
║ • Estimated net revenue gain: $8,000+            ║
║ ✓ Group strategy highly effective                ║
╚══════════════════════════════════════════════════╝
```

### AC-6: Corporate/Bulk Purchase Workflow

**GIVEN** I am making a large corporate purchase (25+ tickets)
**WHEN** I add that quantity to cart
**THEN** I should see:
- Option to request invoice payment
- Ability to enter company information
- PO number field
- Contact person details
- Special terms acknowledgment

**Corporate Checkout Flow**:
```
┌─────────────────────────────────────────────────┐
│ Large Group Purchase Detected                   │
├─────────────────────────────────────────────────┤
│ You're purchasing 50 tickets - great choice!   │
│                                                  │
│ Payment Options:                                 │
│ ○ Pay now with credit card ($3,500)            │
│ ◉ Request invoice (NET 30 terms)               │
│                                                  │
│ Company Information:                             │
│ Company Name: [Acme Corporation____________]    │
│ Department:   [Marketing___________________]    │
│ PO Number:    [PO-2025-1234________________]    │
│                                                  │
│ Billing Contact:                                 │
│ Name:  [Sarah Johnson__________________]        │
│ Email: [sarah.j@acme.com_______________]        │
│ Phone: [(555) 123-4567_________________]        │
│                                                  │
│ Special Requests:                                │
│ [____________________________________________]   │
│ [____________________________________________]   │
│                                                  │
│ ☑ I agree to NET 30 payment terms               │
│                                                  │
│ [Submit Invoice Request] →                       │
└─────────────────────────────────────────────────┘
```

---

## Tasks / Subtasks

### Phase 1: Backend Implementation (10 hours)

- [ ] **Group Discount Schema** (AC-1)
  - [ ] Add to TicketType model:
    - `groupDiscountEnabled: Boolean`
    - `groupTiers: Json` (stores tier configuration)
    - `minGroupSize: Int`
    - `maxGroupSize: Int?`
    - `enableCoordinator: Boolean`
  - [ ] Create `GroupBooking` model:
    - Order reference, coordinator info
    - Ticket assignments
    - Communication log
  - [ ] Create migration

- [ ] **Group Pricing Calculator** (AC-2)
  - [ ] `GroupPricingService.ts`
  - [ ] `calculateGroupPrice(quantity, ticketTypeId)` - Determine tier and price
  - [ ] `getNextTierIncentive(quantity, ticketTypeId)` - "Add X more to save Y%"
  - [ ] `getTierBreakdown(ticketTypeId)` - All tier info
  - [ ] Integrate with PricingEngine from EV-013

- [ ] **Group Coordinator Service** (AC-3, AC-4)
  - [ ] `GroupCoordinatorService.ts`
  - [ ] `createGroupBooking(orderId, coordinatorId)` - Set up group
  - [ ] `assignTicket(ticketId, userId, coordinatorId)` - Manual assignment
  - [ ] `generateClaimLink(ticketId)` - Create unique claim URL
  - [ ] `claimTicket(token, userDetails)` - Process ticket claim
  - [ ] `sendGroupInvitations(groupId, emails)` - Bulk invite

### Phase 2: API Layer (6 hours)

- [ ] **Group Booking APIs** (AC-3, AC-5)
  - [ ] `POST /api/orders/:orderId/group` - Create group booking
  - [ ] `GET /api/groups/:groupId` - Get group details
  - [ ] `POST /api/groups/:groupId/assign` - Assign ticket
  - [ ] `POST /api/groups/:groupId/invite` - Send invitations
  - [ ] `GET /api/groups/:groupId/analytics` - Group metrics
  - [ ] `POST /api/tickets/:ticketId/claim` - Claim ticket with token

- [ ] **Pricing Calculation APIs** (AC-2)
  - [ ] `GET /api/events/:eventId/group-pricing/calculate?quantity=X` - Get price
  - [ ] `GET /api/events/:eventId/group-pricing/tiers` - All tier info

### Phase 3: Organizer UI (8 hours)

- [ ] **Group Discount Configuration** (AC-1)
  - [ ] `GroupDiscountSettings.tsx` - Configuration interface
  - [ ] `TierBuilder.tsx` - Add/edit/reorder discount tiers
  - [ ] `TierPreview.tsx` - Visual savings preview
  - [ ] Add to ticket type creation flow

- [ ] **Group Analytics Dashboard** (AC-5)
  - [ ] `GroupBookingAnalytics.tsx` - Main analytics view
  - [ ] `GroupTierDistribution.tsx` - Tier usage chart
  - [ ] `TopGroupsList.tsx` - Leaderboard of top groups
  - [ ] Add to event dashboard

### Phase 4: Customer-Facing UI (10 hours)

- [ ] **Dynamic Cart with Tier Incentives** (AC-2)
  - [ ] `GroupPricingCart.tsx` - Enhanced cart with tier info
  - [ ] `TierProgress.tsx` - Visual progress to next tier
  - [ ] `NextTierIncentive.tsx` - "Add X more" messaging
  - [ ] `SavingsDisplay.tsx` - Total savings counter
  - [ ] Real-time price recalculation

- [ ] **Coordinator Dashboard** (AC-3)
  - [ ] `CoordinatorDashboard.tsx` - Main coordinator interface
  - [ ] `TicketAssignment.tsx` - Manual assignment UI
  - [ ] `GroupRoster.tsx` - List of assigned/unassigned tickets
  - [ ] `InvitationManager.tsx` - Send bulk invitations
  - [ ] `GroupCommunication.tsx` - Message group members

- [ ] **Ticket Claim Flow** (AC-4)
  - [ ] `TicketClaimPage.tsx` - Landing page for claim links
  - [ ] `ClaimRegistration.tsx` - User details form
  - [ ] `ClaimConfirmation.tsx` - Success page with QR code
  - [ ] Email templates for invitations

- [ ] **Corporate Checkout** (AC-6)
  - [ ] `CorporateCheckout.tsx` - Invoice request form
  - [ ] `CompanyInfoForm.tsx` - Company details collection
  - [ ] Add to checkout flow (auto-detect large orders)

### Phase 5: Testing (8 hours)

- [ ] Unit tests for group pricing calculation
- [ ] Unit tests for tier progression logic
- [ ] Integration test: Group purchase end-to-end
- [ ] Integration test: Ticket assignment and claim
- [ ] E2E test: Configure group discounts
- [ ] E2E test: Purchase with group discount
- [ ] E2E test: Coordinator assigns tickets
- [ ] E2E test: Member claims ticket
- [ ] Test concurrent claims (race conditions)
- [ ] Test edge cases (tier boundaries, max quantities)

---

## Technical Design

### Database Schema

```prisma
model GroupBooking {
  id               String    @id @default(uuid())
  orderId          String    @unique
  order            Order     @relation(fields: [orderId], references: [id])

  // Coordinator Info
  coordinatorId    String
  coordinator      User      @relation(fields: [coordinatorId], references: [id])
  coordinatorName  String
  coordinatorEmail String
  coordinatorPhone String?

  // Group Details
  groupName        String?   // Optional group identifier
  groupSize        Int
  assignedCount    Int       @default(0)

  // Corporate Info (optional)
  companyName      String?
  department       String?
  poNumber         String?

  // Settings
  allowPartialPayment Boolean @default(false)
  requireAllNames     Boolean @default(false)

  // Relations
  assignments      TicketAssignment[]

  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  @@index([coordinatorId])
  @@index([orderId])
  @@map("group_bookings")
}

model TicketAssignment {
  id               String    @id @default(uuid())
  groupBookingId   String
  groupBooking     GroupBooking @relation(fields: [groupBookingId], references: [id])
  ticketId         String    @unique
  ticket           Ticket    @relation(fields: [ticketId], references: [id])

  // Assignment Details
  assignedTo       String?   // User ID if registered user
  assignedName     String?
  assignedEmail    String?

  // Claim Link
  claimToken       String?   @unique
  claimTokenExpiry DateTime?
  claimedAt        DateTime?

  // Status
  status           AssignmentStatus @default(UNASSIGNED)

  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  @@index([groupBookingId])
  @@index([ticketId])
  @@index([claimToken])
  @@map("ticket_assignments")
}

enum AssignmentStatus {
  UNASSIGNED
  INVITED
  CLAIMED
  REASSIGNED
}

// Update TicketType for group discounts
model TicketType {
  // ... existing fields

  // Group Discount Config
  groupDiscountEnabled Boolean @default(false)
  groupTiers           Json?   // Array of tier objects
  minGroupSize         Int?
  maxGroupSize         Int?
  enableCoordinator    Boolean @default(true)
}

// Update Ticket to support assignments
model Ticket {
  // ... existing fields
  assignment       TicketAssignment?
}

// Update Order to support group bookings
model Order {
  // ... existing fields
  groupBooking     GroupBooking?
}
```

### Group Pricing Service

```typescript
// lib/services/group-pricing.service.ts

interface GroupTier {
  minQuantity: number;
  maxQuantity: number | null;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  pricePerTicket: number;
}

interface GroupPriceCalculation {
  quantity: number;
  pricePerTicket: number;
  subtotal: number;
  savings: number;
  savingsPercentage: number;
  appliedTier: GroupTier | null;
  nextTier: NextTierInfo | null;
}

interface NextTierInfo {
  minQuantity: number;
  discountValue: number;
  pricePerTicket: number;
  ticketsNeeded: number;
  additionalSavings: number;
  incentiveMessage: string;
}

class GroupPricingService {
  /**
   * Calculate group pricing for given quantity
   */
  async calculatePrice(
    ticketTypeId: string,
    quantity: number
  ): Promise<GroupPriceCalculation> {
    const ticketType = await prisma.ticketType.findUnique({
      where: { id: ticketTypeId }
    });

    if (!ticketType || !ticketType.groupDiscountEnabled) {
      return this.regularPricing(ticketType!, quantity);
    }

    const tiers = this.parseTiers(ticketType.groupTiers);
    const applicableTier = this.findApplicableTier(tiers, quantity);

    let pricePerTicket = Number(ticketType.price);
    let savings = 0;

    if (applicableTier) {
      pricePerTicket = applicableTier.pricePerTicket;
      savings = (Number(ticketType.price) - pricePerTicket) * quantity;
    }

    const subtotal = pricePerTicket * quantity;
    const savingsPercentage = (savings / (Number(ticketType.price) * quantity)) * 100;

    const nextTier = this.getNextTier(tiers, quantity);

    return {
      quantity,
      pricePerTicket,
      subtotal,
      savings,
      savingsPercentage,
      appliedTier: applicableTier,
      nextTier: nextTier ? this.buildNextTierInfo(
        nextTier,
        quantity,
        Number(ticketType.price),
        pricePerTicket
      ) : null
    };
  }

  /**
   * Find which tier applies to given quantity
   */
  private findApplicableTier(tiers: GroupTier[], quantity: number): GroupTier | null {
    return tiers.find(tier =>
      quantity >= tier.minQuantity &&
      (tier.maxQuantity === null || quantity <= tier.maxQuantity)
    ) || null;
  }

  /**
   * Get next tier that customer could reach
   */
  private getNextTier(tiers: GroupTier[], currentQuantity: number): GroupTier | null {
    return tiers.find(tier => tier.minQuantity > currentQuantity) || null;
  }

  /**
   * Build incentive messaging for next tier
   */
  private buildNextTierInfo(
    nextTier: GroupTier,
    currentQuantity: number,
    basePrice: number,
    currentPrice: number
  ): NextTierInfo {
    const ticketsNeeded = nextTier.minQuantity - currentQuantity;
    const additionalSavings = (currentPrice - nextTier.pricePerTicket) * nextTier.minQuantity;

    let incentiveMessage: string;
    if (ticketsNeeded === 1) {
      incentiveMessage = `Add 1 more ticket to save ${nextTier.discountValue}%`;
    } else {
      incentiveMessage = `Add ${ticketsNeeded} more tickets to save ${nextTier.discountValue}%`;
    }

    return {
      minQuantity: nextTier.minQuantity,
      discountValue: nextTier.discountValue,
      pricePerTicket: nextTier.pricePerTicket,
      ticketsNeeded,
      additionalSavings,
      incentiveMessage
    };
  }
}
```

### Coordinator Dashboard Component

```typescript
// components/groups/CoordinatorDashboard.tsx

export function CoordinatorDashboard({ groupBookingId }: Props) {
  const { data: groupBooking, refetch } = useQuery(
    ['groupBooking', groupBookingId],
    () => fetchGroupBooking(groupBookingId)
  );

  const { mutate: assignTicket } = useMutation(
    (data: { ticketId: string; email: string; name: string }) =>
      assignTicketToMember(groupBookingId, data),
    { onSuccess: () => refetch() }
  );

  const { mutate: sendInvitations } = useMutation(
    (emails: string[]) => sendGroupInvitations(groupBookingId, emails),
    { onSuccess: () => toast.success('Invitations sent!') }
  );

  return (
    <div className="space-y-6">
      {/* Group Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Your Group of {groupBooking.groupSize}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Order Number</Label>
              <p className="font-mono">{groupBooking.order.orderNumber}</p>
            </div>
            <div>
              <Label>Total Paid</Label>
              <p className="text-2xl font-bold">
                ${groupBooking.order.total.toFixed(2)}
              </p>
            </div>
            <div>
              <Label>Assigned</Label>
              <Progress
                value={(groupBooking.assignedCount / groupBooking.groupSize) * 100}
              />
              <p className="text-sm text-gray-600">
                {groupBooking.assignedCount} of {groupBooking.groupSize}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ticket Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Ticket Assignments</CardTitle>
          <Button onClick={() => setShowBulkInvite(true)}>
            Send Invitations
          </Button>
        </CardHeader>
        <CardContent>
          <TicketAssignmentList
            assignments={groupBooking.assignments}
            onAssign={assignTicket}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button onClick={() => downloadAttendeeList(groupBookingId)}>
          Download Attendee List
        </Button>
        <Button variant="outline" onClick={() => emailAllAttendees(groupBookingId)}>
          Email All Attendees
        </Button>
      </div>
    </div>
  );
}
```

---

## Edge Cases & Business Rules

### 1. Tier Boundary Purchases
- **Scenario**: Customer has 9 tickets (10% off), adds 1 more
- **Behavior**: Entire order recalculates to 20% off (10 tickets)
- **Display**: Show "You just saved an extra $X!" confirmation

### 2. Removing Tickets from Cart
- **Scenario**: Customer removes tickets, drops below tier threshold
- **Behavior**: Price increases back to lower tier
- **Warning**: Show modal "You'll lose your group discount. Continue?"

### 3. Partial Coordinator Assignments
- **Rule**: Order is valid even if not all tickets assigned
- **Coordinator View**: Show warning if approaching event date with unassigned tickets
- **Option**: Allow coordinator to reassign or transfer unassigned tickets

### 4. Ticket Claim Expiration
- **Rule**: Claim links expire after 30 days
- **Process**: After expiration, coordinator must generate new link
- **Protection**: Prevents old links from being shared indefinitely

### 5. Multiple Claims on Same Link
- **Rule**: Claim token is single-use only
- **Protection**: Token invalidated after first successful claim
- **Error**: "This ticket has already been claimed"

---

## Integration Points

### Integrates With:
- **EV-013 (Tiered Pricing)**: Uses pricing rule engine
- **PAY-001 (Payments)**: Bulk purchase processing
- **TKT-001 (Tickets)**: Individual ticket generation
- **EMAIL-001 (Notifications)**: Invitation and assignment emails
- **CHK-001 (Check-In)**: Individual check-in per assigned ticket
- **AN-001 (Analytics)**: Group booking metrics

---

## Success Metrics

- **Adoption**: 25% of events enable group discounts
- **Group Sales**: 30% of ticket revenue from group bookings
- **Average Group Size**: 12-18 tickets per group order
- **Coordinator Usage**: 70% of coordinators use assignment features
- **Claim Rate**: 85% of invited members claim their tickets
- **AOV Increase**: 50% higher average order value vs individual sales

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-09-30 | 1.0 | Initial story creation | BMAD SM Agent |

---

## Dev Agent Record
*To be populated by dev agent*

---

## QA Results
*To be populated by QA agent*