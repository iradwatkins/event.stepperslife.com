# Story: TIX-006 - Ticket Transfer System

**Epic**: EPIC-004 - Digital Ticket System
**Story Points**: 5
**Priority**: P1 (High)
**Status**: Not Started
**Dependencies**: TIX-001 (QR Generation), TIX-003 (Validation)

---

## Story

**As a** ticket holder
**I want to** transfer my ticket to another person
**So that** someone else can attend if I'm unable to go

---

## Acceptance Criteria

1. GIVEN I own a valid ticket
   WHEN I initiate a ticket transfer
   THEN I should be able to:
   - View "Transfer Ticket" option in my tickets
   - Enter recipient's email address
   - Add optional personal message
   - Confirm transfer action
   - Receive transfer confirmation
   - See ticket removed from my account

2. GIVEN a ticket transfer is initiated
   WHEN recipient receives transfer notification
   THEN they should:
   - Receive email with transfer details
   - See who transferred the ticket
   - View event details
   - Accept or decline transfer
   - Create account if needed (to accept)
   - Have 48 hours to respond

3. GIVEN recipient accepts the transfer
   WHEN transfer is completed
   THEN system should:
   - Deactivate original QR code
   - Generate new QR code for recipient
   - Update ticket holder information
   - Send confirmation to both parties
   - Update ticket status to TRANSFERRED
   - Create audit log entry
   - Notify event organizer

4. GIVEN a ticket is non-transferrable
   WHEN attempting to transfer
   THEN system should:
   - Check ticket transfer policy
   - Display "Transfer not allowed" message
   - Explain transfer restrictions
   - Show organizer contact for exceptions
   - Prevent transfer action

5. GIVEN ticket transfer is cancelled or declined
   WHEN recipient declines or time expires
   THEN system should:
   - Return ticket to original owner
   - Keep original QR code valid
   - Notify original owner
   - Log cancellation reason
   - Allow retry with different recipient

6. GIVEN transfer involves payment
   WHEN ticket has monetary value
   THEN system should:
   - Support optional payment collection (future)
   - Track transfer for tax purposes
   - Update order ownership
   - Maintain original purchase record
   - Handle refund implications

---

## Tasks / Subtasks

- [ ] Design ticket transfer database schema (AC: 3)
  - [ ] Create TicketTransfer model
  - [ ] Add transfer status tracking
  - [ ] Link to original/new owners
  - [ ] Store transfer metadata
  - [ ] Add timestamps for audit

- [ ] Build transfer initiation UI (AC: 1)
  - [ ] File: `/app/dashboard/tickets/[ticketId]/transfer/page.tsx`
  - [ ] "Transfer Ticket" button on ticket details
  - [ ] Transfer form with email input
  - [ ] Message field (optional)
  - [ ] Confirmation dialog
  - [ ] Transfer success notification

- [ ] Implement transfer service (AC: 1, 3, 5)
  - [ ] File: `/lib/services/ticket-transfer.service.ts`
  - [ ] `initiateTransfer()` method
  - [ ] `acceptTransfer()` method
  - [ ] `declineTransfer()` method
  - [ ] `cancelTransfer()` method
  - [ ] Generate new QR codes
  - [ ] Update ticket ownership

- [ ] Create transfer API endpoints (AC: All)
  - [ ] POST `/api/tickets/[ticketId]/transfer/initiate`
  - [ ] POST `/api/tickets/transfer/[transferId]/accept`
  - [ ] POST `/api/tickets/transfer/[transferId]/decline`
  - [ ] DELETE `/api/tickets/transfer/[transferId]/cancel`
  - [ ] GET `/api/tickets/transfer/[transferId]/status`

- [ ] Build transfer notification system (AC: 2, 3)
  - [ ] Transfer initiation email to recipient
  - [ ] Transfer acceptance email to sender
  - [ ] Transfer completion emails to both
  - [ ] Transfer declined email to sender
  - [ ] Include event details in all emails

- [ ] Implement transfer acceptance page (AC: 2)
  - [ ] File: `/app/tickets/transfer/accept/page.tsx`
  - [ ] Display transfer details
  - [ ] Show sender information
  - [ ] Event details preview
  - [ ] Accept/Decline buttons
  - [ ] Login/signup flow if needed

- [ ] Add transferrability rules (AC: 4)
  - [ ] Check ticket type transferrability
  - [ ] Check event transfer policy
  - [ ] Check time restrictions (e.g., no transfer 24h before)
  - [ ] Validate transfer limits (max transfers per ticket)
  - [ ] Organizer override capabilities

- [ ] Implement QR code regeneration (AC: 3)
  - [ ] Deactivate old QR code
  - [ ] Generate new unique QR code
  - [ ] Update validation database
  - [ ] Ensure old code rejected at check-in
  - [ ] Log QR code changes

- [ ] Build transfer history tracking (AC: 3, 5)
  - [ ] Store complete transfer chain
  - [ ] Track all transfer attempts
  - [ ] Record decline reasons
  - [ ] Audit trail for fraud prevention
  - [ ] Admin view of transfer history

- [ ] Add transfer expiration system (AC: 5)
  - [ ] 48-hour expiration timer
  - [ ] Automatic return to sender on expiry
  - [ ] Expiration notifications
  - [ ] Cron job for expired transfers

- [ ] Implement organizer notifications (AC: 3)
  - [ ] Notify organizer of transfers
  - [ ] Provide transfer reports
  - [ ] Alert on suspicious patterns
  - [ ] Transfer analytics

- [ ] Add fraud prevention (AC: All)
  - [ ] Rate limit transfers
  - [ ] Detect suspicious patterns
  - [ ] Block after multiple declines
  - [ ] Validate recipient email
  - [ ] Prevent circular transfers

- [ ] Build transfer UI components (AC: 1, 2, 5)
  - [ ] Transfer button component
  - [ ] Transfer status badge
  - [ ] Transfer history list
  - [ ] Transfer confirmation modal
  - [ ] Transfer success/error toasts

---

## Dev Notes

### Architecture References
- **Ticket Model**: `/prisma/schema.prisma`
- **Email Service**: `/lib/services/email.ts`

### Source Tree
```
lib/services/
  └── ticket-transfer.service.ts    # NEW
app/api/tickets/
  ├── [ticketId]/transfer/
  │   └── initiate/route.ts         # NEW
  └── transfer/
      ├── [transferId]/
      │   ├── accept/route.ts       # NEW
      │   ├── decline/route.ts      # NEW
      │   └── status/route.ts       # NEW
      └── cancel/route.ts           # NEW
app/dashboard/tickets/
  └── [ticketId]/transfer/
      └── page.tsx                  # NEW
app/tickets/transfer/
  └── accept/page.tsx               # NEW
prisma/
  └── schema.prisma                 # MODIFY: Add TicketTransfer
```

### Database Schema

```prisma
model TicketTransfer {
  id                String    @id @default(uuid())
  ticketId          String
  fromUserId        String
  toEmail           String
  toUserId          String?

  status            TransferStatus @default(PENDING)
  message           String?

  initiatedAt       DateTime  @default(now())
  acceptedAt        DateTime?
  declinedAt        DateTime?
  expiresAt         DateTime

  oldQrCode         String
  newQrCode         String?

  ticket            Ticket    @relation(fields: [ticketId], references: [id])
  fromUser          User      @relation("TransferFrom", fields: [fromUserId], references: [id])
  toUser            User?     @relation("TransferTo", fields: [toUserId], references: [id])

  @@index([ticketId])
  @@index([status])
  @@map("ticket_transfers")
}

enum TransferStatus {
  PENDING
  ACCEPTED
  DECLINED
  EXPIRED
  CANCELLED
}
```

### Transfer Flow

```typescript
// 1. Initiate Transfer
POST /api/tickets/{ticketId}/transfer/initiate
{
  toEmail: "recipient@example.com",
  message: "Can't make it, hope you can go!"
}

// 2. Send Email to Recipient
Email contains:
- Link: /tickets/transfer/accept?token=xxx
- Sender name and message
- Event details
- Accept/Decline buttons

// 3. Recipient Accepts
POST /api/tickets/transfer/{transferId}/accept
- Deactivate old QR: ticket.qrCode = 'TRANSFERRED'
- Generate new QR: newQrCode = generateQR()
- Update ticket: ticket.userId = recipientId
- Update transfer: status = 'ACCEPTED'

// 4. Both Parties Notified
- Sender: "Your ticket was accepted by..."
- Recipient: "Ticket transferred to you. Here's your QR..."
```

### Transfer Restrictions

**Time Restrictions**:
- No transfers within 24 hours of event
- No transfers after event starts
- Maximum 48 hours for recipient to respond

**Policy Restrictions**:
- Check `ticket.transferrable` flag
- Check `ticketType.allowTransfer` setting
- Check `event.transferPolicy`
- Organizer can disable transfers

**Fraud Prevention**:
- Maximum 3 transfers per ticket
- Rate limit: 5 transfers per user per hour
- Email verification required
- Flag suspicious patterns (rapid transfers, new accounts)

### Email Templates

**Transfer Initiation Email** (to recipient):
```
Subject: {SenderName} sent you a ticket to {EventName}

Hi!

{SenderName} ({SenderEmail}) has transferred a ticket to you
for the event:

{EventName}
{EventDate} at {EventTime}
{VenueName}

Personal message: "{Message}"

You have 48 hours to accept this ticket.

[Accept Ticket] [Decline]

Questions? Contact support@events.stepperslife.com
```

**Transfer Accepted Email** (to sender):
```
Subject: Your ticket transfer was accepted

Good news! {RecipientName} accepted your ticket transfer
for {EventName}.

The ticket has been removed from your account and transferred to:
{RecipientEmail}

Your original QR code is no longer valid.

Thanks for using SteppersLife Events!
```

---

## Testing

### Transfer Flow Testing
- Complete end-to-end transfer
- Test accept/decline flows
- Verify QR code deactivation
- Test expiration handling
- Verify email delivery

### Security Testing
- Unauthorized transfer attempts
- Invalid transfer tokens
- Expired transfer links
- Transfer of already-transferred tickets
- Double-acceptance prevention

### Edge Cases
- Transfer to self (should prevent)
- Transfer non-existent ticket
- Transfer checked-in ticket
- Transfer refunded ticket
- Multiple concurrent transfers

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-09-29 | BMAD SM Agent | Initial story creation |

---

*Generated by BMAD SM Agent*