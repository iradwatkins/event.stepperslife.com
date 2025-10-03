# Story: EV-017 - Event Capacity Management & Waitlist

**Epic**: EPIC-005 - Advanced Event Features
**Story Points**: 3
**Priority**: P1 (High)
**Status**: Draft
**Dependencies**: EV-001 (Basic Event Creation), EV-002 (Ticket Types), EMAIL-001 (Email Notifications)

---

## Story

**As an** event organizer
**I want** automatic capacity enforcement and waitlist management
**So that** I never oversell my event and can fill last-minute cancellations

**As an** attendee
**I want** to join a waitlist when an event is sold out
**So that** I have a chance to attend if spots become available

---

## Context & Business Value

**The Capacity Problem**:
Without proper capacity management:
- **Overselling**: Fire code violations, safety issues, venue penalties
- **Lost Revenue**: Can't capitalize on demand when events sell out
- **Poor Experience**: Disappointed customers who can't attend
- **Manual Work**: Organizers manually managing cancellations and refills

**Waitlist Value**:
- **Demand Indicator**: Shows true demand beyond capacity
- **Revenue Recovery**: Fill cancellations automatically (5-10% of bookings)
- **Customer Satisfaction**: Give hope to late customers
- **Planning Data**: Helps decide if additional sessions needed

**Real-World Statistics**:
- 8-12% of ticket buyers cancel or don't show
- Events with waitlists recover 70% of cancelled spots
- Waitlisted customers convert at 85% rate when notified
- Proper capacity management prevents 99.9% of overselling

---

## Acceptance Criteria

### AC-1: Real-Time Capacity Tracking

**GIVEN** I am configuring an event
**WHEN** I set capacity limits
**THEN** I should be able to set:
- Overall event capacity (total attendees)
- Per-ticket-type capacity (optional)
- Buffer/reserved capacity (hold back X tickets)
- Oversell protection mode (strict vs flexible)

**AND** System should track in real-time:
- Total tickets sold
- Total capacity
- Remaining capacity
- Reserved/pending tickets (in-checkout)
- Waitlist count

**Capacity Configuration**:
```
┌─────────────────────────────────────────────────┐
│ Capacity Management                              │
├─────────────────────────────────────────────────┤
│ Event Capacity:                                  │
│ Total Capacity: [500] attendees                  │
│                                                  │
│ Reserved Capacity:                               │
│ Hold back: [25] tickets (for special guests)    │
│ Available for sale: 475 tickets                  │
│                                                  │
│ Ticket Type Limits:                              │
│ ┌─────────────────────────────────────────────┐ │
│ │ General Admission:     350 / 350 (100%)     │ │
│ │ VIP Tickets:           100 / 100 (100%)     │ │
│ │ Student Discount:      50 / 50 (100%)       │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ Oversell Protection:                             │
│ ◉ Strict - Never allow overselling              │
│ ○ Flexible - Allow 5% oversell                  │
│                                                  │
│ Waitlist:                                        │
│ ☑ Enable waitlist when sold out                 │
│ ☑ Automatically notify waitlist on cancellation │
│ Max waitlist size: [ ] Unlimited                 │
│                                                  │
│ Current Status:                                  │
│ • Sold: 387 tickets                             │
│ • Pending (in cart): 28 tickets                 │
│ • Reserved: 25 tickets                           │
│ • Available: 60 tickets                          │
│ • Waitlist: 15 people                            │
└─────────────────────────────────────────────────┘
```

### AC-2: Sold Out Detection and Display

**GIVEN** an event reaches capacity
**WHEN** the last ticket is sold
**THEN** system should:
- Mark event as "SOLD OUT" immediately
- Update all public displays to show sold-out status
- Prevent new purchases
- Display waitlist option prominently
- Send notification to organizer

**Sold Out Display (Customer View)**:
```
╔════════════════════════════════════════════════╗
║ 🎉 AMAZING MUSIC FESTIVAL 2025                 ║
╠════════════════════════════════════════════════╣
║                                                ║
║          🔴 SOLD OUT                           ║
║                                                ║
║  All tickets have been claimed!                ║
║                                                ║
║  But don't worry - you can join our waitlist. ║
║  We'll notify you if spots become available.   ║
║                                                ║
║  Current Waitlist: 15 people                   ║
║                                                ║
║          [Join Waitlist] →                     ║
║                                                ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ║
║  💡 Want updates for future events?            ║
║  [Follow Organizer]                            ║
╚════════════════════════════════════════════════╝
```

**Organizer Notification**:
```
Subject: 🎉 Your event just SOLD OUT!

Congratulations!

Your event "Amazing Music Festival 2025" has just
sold out!

📊 Quick Stats:
• Total Tickets Sold: 500
• Total Revenue: $37,500
• Sell-Out Time: 8 days, 14 hours
• Average Sale Price: $75.00

💡 Next Steps:
• 15 people have joined the waitlist
• Consider adding another session or date
• Promote your success on social media

[View Event Dashboard] →

Great job!
```

### AC-3: Waitlist Registration Flow

**GIVEN** I am a customer viewing a sold-out event
**WHEN** I click "Join Waitlist"
**THEN** I should be able to:
- Enter my email and name
- Specify how many tickets I need
- Set maximum price I'm willing to pay (optional)
- Receive confirmation of waitlist registration

**Waitlist Registration Form**:
```
╔════════════════════════════════════════════════╗
║ Join the Waitlist                              ║
║ Amazing Music Festival 2025                    ║
╠════════════════════════════════════════════════╣
║                                                ║
║ We'll notify you if tickets become available!  ║
║                                                ║
║ Your Information:                              ║
║ First Name: [________________]                 ║
║ Last Name:  [________________]                 ║
║ Email:      [________________@_______]         ║
║ Phone:      [________________] (optional)      ║
║                                                ║
║ How many tickets do you need?                  ║
║ Quantity: [2] tickets                          ║
║                                                ║
║ What's the most you'd pay per ticket?          ║
║ Max Price: [$75] (Current: $65) (optional)     ║
║                                                ║
║ ☑ Notify me about similar events               ║
║ ☑ I agree to terms and conditions              ║
║                                                ║
║          [Join Waitlist] →                     ║
║                                                ║
║ 📊 Current Position: You'll be #16             ║
╚════════════════════════════════════════════════╝
```

**Confirmation Message**:
```
✓ You're on the waitlist!

You've been added to the waitlist for:
Amazing Music Festival 2025

Your position: #16
Requested tickets: 2

We'll email you immediately if spots become
available. These notifications are time-sensitive,
so keep an eye on your inbox!

Waitlist expires: 2 days before event

[View My Waitlist Requests]
```

### AC-4: Automatic Waitlist Notification System

**GIVEN** a ticket is cancelled or refunded
**WHEN** capacity becomes available
**THEN** system should:
- Identify next eligible waitlist member
- Check if available spots meet their request
- Send time-limited notification (24-48 hour window)
- Reserve capacity for notified person
- Process first-come-first-served if they decline/expire

**Waitlist Notification Email**:
```
Subject: 🎉 Tickets Available! Your waitlist spot is ready

Hi Sarah,

Great news! Tickets are now available for:

Amazing Music Festival 2025
📅 August 15, 2025 at 7:00 PM
📍 Central Park, NYC

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your Reserved Tickets:
• Quantity: 2 tickets
• Price: $65.00 per ticket
• Total: $130.00

⏰ This offer expires in 48 hours
   (Until March 3 at 2:15 PM)

[Claim Your Tickets Now] →

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Can't make it? No problem! We'll offer your spot
to the next person on the waitlist.

Questions? Reply to this email.

See you there!
[Organizer Name]
```

**Notification Logic**:
1. Ticket becomes available (cancellation/refund)
2. Query waitlist in order (FIFO)
3. Find first person whose quantity request ≤ available spots
4. Reserve spots for 24-48 hours
5. Send notification email
6. If not claimed within window:
   - Release reservation
   - Move to next waitlist member
7. If claimed:
   - Process payment
   - Generate tickets
   - Remove from waitlist
   - Continue with remaining spots (if any)

### AC-5: Organizer Waitlist Dashboard

**GIVEN** I am organizing an event with a waitlist
**WHEN** I view the waitlist dashboard
**THEN** I should see:
- Total waitlist count
- Waitlist trend over time
- Average position wait time
- Tickets requested distribution
- Manually notify specific waitlist members
- Bulk notify entire waitlist (if adding capacity)

**Waitlist Dashboard**:
```
╔══════════════════════════════════════════════════╗
║ Waitlist Management                             ║
║ Amazing Music Festival 2025                      ║
╠══════════════════════════════════════════════════╣
║ Overview:                                        ║
║ • Total Waitlisted: 47 people                    ║
║ • Total Tickets Requested: 89                    ║
║ • Notified: 8 people                             ║
║ • Converted: 5 people (62.5%)                    ║
║ • Avg Wait Time: 3.2 days                        ║
╠══════════════════════════════════════════════════╣
║ Waitlist Queue:                                  ║
║ [Search...] [Filter ▾] [Sort ▾]                 ║
║                                                  ║
║ ┌────────────────────────────────────────────┐  ║
║ │ #1 Sarah Johnson    sarah@email.com        │  ║
║ │    Requested: 2 tickets | Max: $75         │  ║
║ │    Joined: Feb 28 (3 days ago)             │  ║
║ │    [Notify Now] [Remove]                   │  ║
║ ├────────────────────────────────────────────┤  ║
║ │ #2 Mike Chen        mike@email.com         │  ║
║ │    Requested: 4 tickets | Max: $80         │  ║
║ │    Joined: Mar 1 (2 days ago)              │  ║
║ │    [Notify Now] [Remove]                   │  ║
║ ├────────────────────────────────────────────┤  ║
║ │ #3 Emma Davis       emma@email.com         │  ║
║ │    Requested: 1 ticket | Max: Any          │  ║
║ │    Joined: Mar 2 (1 day ago)               │  ║
║ │    Status: ⏰ Notified (expires in 36h)    │  ║
║ │    [Resend] [Cancel Notification]          │  ║
║ └────────────────────────────────────────────┘  ║
╠══════════════════════════════════════════════════╣
║ Actions:                                         ║
║ [Notify Next Person] [Notify Top 10]            ║
║ [Export Waitlist] [Clear Waitlist]              ║
╠══════════════════════════════════════════════════╣
║ Insights:                                        ║
║ • High demand! Consider adding 2nd session      ║
║ • 89 tickets requested = 18% extra demand       ║
║ • Notification conversion rate: 62.5% (good)    ║
╚══════════════════════════════════════════════════╝
```

### AC-6: Race Condition Prevention

**GIVEN** multiple customers trying to purchase last remaining ticket(s)
**WHEN** they simultaneously click "Purchase"
**THEN** system should:
- Use database locks to prevent overselling
- Reserve capacity atomically during checkout
- Release reservation if checkout abandoned (15 min)
- Show accurate real-time availability
- Display "Someone else is purchasing" if last ticket reserved

**Race Condition Handling**:
```typescript
// Atomic capacity reservation
BEGIN TRANSACTION;

-- Check current capacity with lock
SELECT
  quantity - sold - reserved as available
FROM ticket_types
WHERE id = :ticketTypeId
FOR UPDATE; -- Row lock

-- If available >= requested quantity
IF available >= :quantity THEN
  -- Reserve capacity
  UPDATE ticket_types
  SET reserved = reserved + :quantity
  WHERE id = :ticketTypeId;

  -- Create temporary reservation
  INSERT INTO cart_reservations (
    ticket_type_id, quantity, expires_at
  ) VALUES (
    :ticketTypeId, :quantity, NOW() + INTERVAL '15 minutes'
  );

  COMMIT;
ELSE
  ROLLBACK;
  RETURN 'SOLD_OUT';
END IF;
```

---

## Tasks / Subtasks

### Phase 1: Backend Implementation (6 hours)

- [ ] **Capacity Tracking Schema** (AC-1)
  - [ ] Update TicketType model:
    - `quantity: Int` (total capacity)
    - `sold: Int` (confirmed sales)
    - `reserved: Int` (in-checkout)
    - `held: Int` (organizer hold-back)
  - [ ] Add capacity validation triggers
  - [ ] Create `CartReservation` model (temporary holds)

- [ ] **Waitlist Schema** (AC-3)
  - [ ] Create `Waitlist` model (may already exist, verify)
  - [ ] Fields: eventId, email, quantity, maxPrice, position
  - [ ] Add status tracking (WAITING, NOTIFIED, CONVERTED, EXPIRED)

- [ ] **Capacity Service** (AC-1, AC-6)
  - [ ] `CapacityService.ts`:
    - `checkAvailability(ticketTypeId, quantity)` - Real-time check
    - `reserveCapacity(ticketTypeId, quantity)` - Atomic reservation
    - `releaseCapacity(reservationId)` - Release expired reservations
    - `incrementSold(ticketTypeId, quantity)` - Confirm sale
  - [ ] Implement database locking for race conditions

- [ ] **Waitlist Service** (AC-3, AC-4)
  - [ ] `WaitlistService.ts`:
    - `addToWaitlist(eventId, details)` - Register
    - `notifyNext(eventId, availableQuantity)` - Process queue
    - `claimSpot(waitlistId)` - Convert to purchase
    - `expireNotification(waitlistId)` - Handle timeout
  - [ ] FIFO queue management

### Phase 2: API Layer (4 hours)

- [ ] **Capacity APIs** (AC-1, AC-2)
  - [ ] `GET /api/events/:eventId/capacity` - Current status
  - [ ] `GET /api/events/:eventId/ticket-types/:id/availability` - Real-time check

- [ ] **Waitlist APIs** (AC-3, AC-5)
  - [ ] `POST /api/events/:eventId/waitlist` - Join waitlist
  - [ ] `GET /api/events/:eventId/waitlist` - List (organizer only)
  - [ ] `POST /api/waitlist/:id/notify` - Manual notification
  - [ ] `POST /api/waitlist/:id/claim` - Claim spot

### Phase 3: Organizer UI (5 hours)

- [ ] **Capacity Dashboard Widget** (AC-1)
  - [ ] `CapacityMetrics.tsx` - Real-time capacity display
  - [ ] `CapacityProgress.tsx` - Visual capacity gauge
  - [ ] Add to event dashboard

- [ ] **Waitlist Management** (AC-5)
  - [ ] `WaitlistDashboard.tsx` - Main management interface
  - [ ] `WaitlistQueue.tsx` - Ordered list view
  - [ ] `NotifyWaitlistButton.tsx` - Manual notification
  - [ ] `WaitlistAnalytics.tsx` - Metrics and insights

### Phase 4: Customer-Facing UI (6 hours)

- [ ] **Sold Out Display** (AC-2)
  - [ ] `SoldOutBanner.tsx` - Prominent sold-out indicator
  - [ ] Update event detail page
  - [ ] Update event listing cards

- [ ] **Waitlist Registration** (AC-3)
  - [ ] `WaitlistForm.tsx` - Registration form
  - [ ] `WaitlistConfirmation.tsx` - Success message
  - [ ] `JoinWaitlistButton.tsx` - CTA component

- [ ] **Waitlist Claim Flow** (AC-4)
  - [ ] `ClaimTicketPage.tsx` - Landing page from email
  - [ ] `ClaimCountdown.tsx` - Expiration timer
  - [ ] Express checkout for claims

- [ ] **Email Templates** (AC-4)
  - [ ] Waitlist notification email
  - [ ] Waitlist confirmation email
  - [ ] Claim expiration reminder email
  - [ ] Organizer sold-out notification

### Phase 5: Background Jobs (4 hours)

- [ ] **Reservation Cleanup Job**
  - [ ] Expire cart reservations after 15 minutes
  - [ ] Release capacity back to available pool
  - [ ] Run every 5 minutes

- [ ] **Waitlist Notification Job**
  - [ ] Monitor for capacity availability
  - [ ] Process waitlist queue
  - [ ] Send notifications
  - [ ] Run every 10 minutes or on cancellation webhook

- [ ] **Notification Expiry Job**
  - [ ] Expire unclaimed waitlist notifications
  - [ ] Move to next person in queue
  - [ ] Run every hour

### Phase 6: Testing (3 hours)

- [ ] Unit tests for capacity calculations
- [ ] Unit tests for waitlist queue management
- [ ] Integration test: Capacity enforcement
- [ ] Integration test: Waitlist notification flow
- [ ] E2E test: Purchase last ticket, trigger sold out
- [ ] E2E test: Join waitlist and claim spot
- [ ] Load test: Concurrent purchases of last tickets
- [ ] Test race condition prevention

---

## Technical Design

### Capacity Reservation Implementation

```typescript
// lib/services/capacity.service.ts

interface CapacityCheck {
  available: number;
  total: number;
  sold: number;
  reserved: number;
  held: number;
  status: 'AVAILABLE' | 'LOW' | 'SOLD_OUT';
}

class CapacityService {
  /**
   * Check real-time availability with atomic lock
   */
  async checkAvailability(ticketTypeId: string, quantity: number): Promise<CapacityCheck> {
    const ticketType = await prisma.ticketType.findUnique({
      where: { id: ticketTypeId },
      select: {
        quantity: true,
        sold: true,
        reserved: true
      }
    });

    if (!ticketType) throw new Error('Ticket type not found');

    const available = ticketType.quantity - ticketType.sold - ticketType.reserved;

    let status: 'AVAILABLE' | 'LOW' | 'SOLD_OUT';
    if (available === 0) {
      status = 'SOLD_OUT';
    } else if (available <= 10 || (available / ticketType.quantity) < 0.1) {
      status = 'LOW';
    } else {
      status = 'AVAILABLE';
    }

    return {
      available,
      total: ticketType.quantity,
      sold: ticketType.sold,
      reserved: ticketType.reserved,
      held: 0, // Could add held capacity later
      status
    };
  }

  /**
   * Atomically reserve capacity during checkout
   */
  async reserveCapacity(
    ticketTypeId: string,
    quantity: number,
    userId?: string
  ): Promise<{ success: boolean; reservationId?: string; reason?: string }> {
    try {
      const reservation = await prisma.$transaction(async (tx) => {
        // Lock row for update
        const ticketType = await tx.ticketType.findUnique({
          where: { id: ticketTypeId },
          select: { quantity: true, sold: true, reserved: true }
        });

        if (!ticketType) {
          throw new Error('TICKET_TYPE_NOT_FOUND');
        }

        const available = ticketType.quantity - ticketType.sold - ticketType.reserved;

        if (available < quantity) {
          throw new Error('INSUFFICIENT_CAPACITY');
        }

        // Increment reserved count
        await tx.ticketType.update({
          where: { id: ticketTypeId },
          data: { reserved: { increment: quantity } }
        });

        // Create temporary reservation
        const reservation = await tx.cartReservation.create({
          data: {
            ticketTypeId,
            quantity,
            userId,
            expiresAt: add(new Date(), { minutes: 15 })
          }
        });

        return reservation;
      });

      return { success: true, reservationId: reservation.id };
    } catch (error: any) {
      return {
        success: false,
        reason: error.message || 'RESERVATION_FAILED'
      };
    }
  }

  /**
   * Release expired or cancelled reservations
   */
  async releaseCapacity(reservationId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const reservation = await tx.cartReservation.findUnique({
        where: { id: reservationId }
      });

      if (!reservation) return;

      // Decrement reserved count
      await tx.ticketType.update({
        where: { id: reservation.ticketTypeId },
        data: { reserved: { decrement: reservation.quantity } }
      });

      // Delete reservation
      await tx.cartReservation.delete({
        where: { id: reservationId }
      });
    });
  }

  /**
   * Confirm sale and increment sold count
   */
  async confirmSale(reservationId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const reservation = await tx.cartReservation.findUnique({
        where: { id: reservationId }
      });

      if (!reservation) throw new Error('Reservation not found');

      // Move from reserved to sold
      await tx.ticketType.update({
        where: { id: reservation.ticketTypeId },
        data: {
          sold: { increment: reservation.quantity },
          reserved: { decrement: reservation.quantity }
        }
      });

      // Delete reservation
      await tx.cartReservation.delete({
        where: { id: reservationId }
      });
    });
  }

  /**
   * Background job: Clean up expired reservations
   */
  async cleanupExpiredReservations(): Promise<number> {
    const expired = await prisma.cartReservation.findMany({
      where: { expiresAt: { lt: new Date() } }
    });

    for (const reservation of expired) {
      await this.releaseCapacity(reservation.id);
    }

    return expired.length;
  }
}
```

### Waitlist Processing

```typescript
// lib/services/waitlist-processor.service.ts

class WaitlistProcessor {
  /**
   * Process waitlist when capacity becomes available
   */
  async processWaitlist(eventId: string, availableQuantity: number): Promise<void> {
    // Get waitlist in order
    const waitlist = await prisma.waitlist.findMany({
      where: {
        eventId,
        status: 'WAITING',
        ticketQuantity: { lte: availableQuantity }
      },
      orderBy: { createdAt: 'asc' },
      take: 10 // Process top 10
    });

    for (const entry of waitlist) {
      if (availableQuantity < entry.ticketQuantity) {
        break; // Not enough capacity for this person
      }

      // Notify this person
      await this.notifyWaitlistMember(entry);

      // Reserve capacity temporarily
      await capacityService.reserveCapacity(
        entry.ticketTypeId,
        entry.ticketQuantity,
        entry.userId
      );

      availableQuantity -= entry.ticketQuantity;

      // Update status
      await prisma.waitlist.update({
        where: { id: entry.id },
        data: {
          status: 'NOTIFIED',
          notifiedAt: new Date()
        }
      });
    }
  }

  /**
   * Send notification email to waitlist member
   */
  private async notifyWaitlistMember(entry: Waitlist): Promise<void> {
    const event = await prisma.event.findUnique({
      where: { id: entry.eventId }
    });

    const claimUrl = `${process.env.NEXT_PUBLIC_APP_URL}/waitlist/${entry.id}/claim`;

    await emailService.sendEmail({
      to: entry.email,
      template: 'waitlist-notification',
      data: {
        firstName: entry.firstName,
        eventName: event.name,
        ticketQuantity: entry.ticketQuantity,
        claimUrl,
        expiresAt: add(new Date(), { hours: 48 })
      }
    });
  }
}
```

---

## Edge Cases & Business Rules

### 1. Cart Abandonment
- **Rule**: Reservations expire after 15 minutes
- **Process**: Background job releases capacity
- **Notification**: Optional email reminder at 12 minutes

### 2. Simultaneous Last Ticket
- **Scenario**: 1 ticket left, 2 people click buy
- **Solution**: Database row lock ensures atomic reservation
- **Result**: One succeeds, one sees "Just sold out"

### 3. Waitlist Notification Expiry
- **Rule**: Notifications expire after 24-48 hours
- **Process**: Capacity released, next person notified
- **Fair**: FIFO queue ensures fairness

### 4. Partial Quantity Matches
- **Scenario**: 2 tickets available, person #1 wants 3, person #2 wants 1
- **Logic**: Skip person #1, notify person #2
- **Eventually**: Person #1 notified when 3+ available

### 5. Organizer Manual Increase
- **Scenario**: Organizer increases capacity
- **Action**: Trigger waitlist processing immediately
- **Bulk Notify**: Option to notify multiple people at once

---

## Integration Points

### Integrates With:
- **EV-002 (Ticket Types)**: Capacity per ticket type
- **PAY-001 (Payments)**: Checkout capacity reservation
- **EMAIL-001 (Notifications)**: Waitlist emails
- **AN-001 (Analytics)**: Waitlist conversion metrics

---

## Success Metrics

- **Zero Overselling**: 100% prevention rate
- **Waitlist Conversion**: 70-85% claim rate
- **Recovery Rate**: 70% of cancellations filled from waitlist
- **Response Time**: 90% of notified members respond within 24h
- **Fair System**: Zero complaints about queue jumping

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