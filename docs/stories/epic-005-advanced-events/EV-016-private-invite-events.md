# Story: EV-016 - Private Invite-Only Events

**Epic**: EPIC-005 - Advanced Event Features
**Story Points**: 3
**Priority**: P2 (Medium)
**Status**: Draft
**Dependencies**: EV-001 (Basic Event Creation), AUTH-001 (Authentication System)

---

## Story

**As an** event organizer
**I want to** create private events accessible only via invitation or access code
**So that** I can host exclusive events for specific groups, members, or VIP guests

**As an** invited guest
**I want to** access private events using my unique invitation link or code
**So that** I can register for exclusive events I've been invited to

---

## Context & Business Value

**Private Event Use Cases**:
1. **VIP/Member-Only Events**: Exclusive access for premium members
2. **Corporate Events**: Company parties, team building, internal conferences
3. **Wedding-Related Events**: Rehearsal dinners, bachelor/bachelorette parties
4. **Fundraising Galas**: High-end donor events with controlled guest lists
5. **Product Launches**: Invite-only previews for press/influencers
6. **Private Concerts**: Intimate performances for select audiences
7. **Beta Testing Events**: Early access for selected participants

**Business Value**:
- **Exclusivity**: Creates premium perception and demand
- **Privacy**: Protects sensitive corporate or personal events
- **Access Control**: Prevents unwanted attendees
- **Targeted Marketing**: Focus on specific audience segments
- **Security**: Maintain guest list control
- **Compliance**: Meet confidentiality requirements for business events

**Revenue Impact**:
- Private events typically command 30-50% higher ticket prices
- 100% conversion rate (invited guests are pre-qualified)
- Word-of-mouth marketing through invitation scarcity

---

## Acceptance Criteria

### AC-1: Private Event Configuration

**GIVEN** I am creating or editing an event
**WHEN** I access the event visibility settings
**THEN** I should see visibility options:
- Public (default - visible to everyone)
- Unlisted (hidden from listings but accessible via direct link)
- Private - Invitation Only (requires invitation or access code)
- Private - Access Code (requires single shared code)

**WHEN** I select "Private - Invitation Only"
**THEN** I should configure:
- Event access method (invitation links, access codes, or both)
- Guest list management approach
- RSVP requirements
- Plus-one permissions
- Waiting list for rejected/full events

**Configuration Interface**:
```
┌─────────────────────────────────────────────────┐
│ Event Visibility Settings                       │
├─────────────────────────────────────────────────┤
│ Visibility Level:                                │
│ ○ Public - Visible to everyone                  │
│ ○ Unlisted - Direct link only                   │
│ ◉ Private - Invitation Only                     │
│ ○ Private - Access Code                         │
│                                                  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Private Event Settings:                          │
│                                                  │
│ Access Method:                                   │
│ ☑ Personal invitation links                     │
│ ☐ Shared access code                            │
│ ☐ Guest list (pre-approved emails)              │
│                                                  │
│ Guest Permissions:                               │
│ ☑ Require RSVP confirmation                     │
│ ☑ Allow guests to bring +1                      │
│ Max additional guests per invite: [1]            │
│                                                  │
│ Invitation Settings:                             │
│ Invitation expiry: [7] days                      │
│ Max uses per invitation: [1] (0 = unlimited)     │
│ Auto-send on guest list upload: ☑               │
│                                                  │
│ Security:                                        │
│ ☑ Require email verification                    │
│ ☐ Require account creation                      │
│ ☐ Require approval for +1 guests                │
└─────────────────────────────────────────────────┘
```

### AC-2: Guest List Management

**GIVEN** I have configured a private event
**WHEN** I access the guest list manager
**THEN** I should be able to:
- Manually add guests one-by-one (name + email)
- Bulk import guests via CSV upload
- Create invitation groups/categories
- Set per-guest ticket allocations
- Track invitation status (sent, viewed, RSVP'd, declined)
- Resend invitations
- Revoke invitations

**Guest List Manager Interface**:
```
╔══════════════════════════════════════════════════╗
║ Guest List Manager                               ║
║ VIP Product Launch Event                         ║
╠══════════════════════════════════════════════════╣
║ [+ Add Guest] [📤 Import CSV] [📧 Send All]     ║
║                                                  ║
║ Filter: [All Guests ▾] [Search...]              ║
║                                                  ║
║ ┌────────────────────────────────────────────┐  ║
║ │ Status Summary:                            │  ║
║ │ Invited: 125 │ RSVP'd: 87 │ Declined: 12  │  ║
║ │ Pending: 26  │ Attended: 0               │  ║
║ └────────────────────────────────────────────┘  ║
║                                                  ║
║ Guest List (125):                                ║
║ ┌────────────────────────────────────────────┐  ║
║ │ ✓ Sarah Johnson    sarah@email.com         │  ║
║ │   Status: ✓ RSVP'd (2 tickets)             │  ║
║ │   Invited: Jan 15 │ Opened: Jan 15         │  ║
║ │   [View] [Resend] [Revoke]                 │  ║
║ ├────────────────────────────────────────────┤  ║
║ │ ⏳ Mike Chen        mike@email.com          │  ║
║ │   Status: ⏳ Pending                        │  ║
║ │   Invited: Jan 15 │ Opened: Not yet        │  ║
║ │   [Resend] [Revoke]                        │  ║
║ ├────────────────────────────────────────────┤  ║
║ │ ✗ Emma Davis       emma@email.com          │  ║
║ │   Status: ✗ Declined                       │  ║
║ │   Invited: Jan 15 │ Declined: Jan 16       │  ║
║ │   [Resend]                                  │  ║
║ └────────────────────────────────────────────┘  ║
║                                                  ║
║ Actions:                                         ║
║ [Send Reminders to Pending] [Export Guest List]  ║
╚══════════════════════════════════════════════════╝
```

**Bulk CSV Import Format**:
```csv
firstName,lastName,email,ticketAllocation,group,notes
Sarah,Johnson,sarah@email.com,2,VIP,Plus one allowed
Mike,Chen,mike@email.com,1,Press,
Emma,Davis,emma@email.com,1,Staff,Internal team
```

### AC-3: Invitation Link Generation and Distribution

**GIVEN** I have added guests to the guest list
**WHEN** I send invitations
**THEN** system should:
- Generate unique, secure invitation tokens for each guest
- Create personalized invitation links
- Send invitation emails with guest-specific details
- Track link opens and clicks
- Log all invitation activities

**Invitation Email Template**:
```
Subject: You're Invited: VIP Product Launch Event

Hi Sarah,

You're invited to an exclusive event!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  VIP PRODUCT LAUNCH EVENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Date: March 15, 2025 at 7:00 PM
📍 Location: Downtown Gallery, NYC
👥 Your Allocation: 2 tickets (you + 1 guest)

This is a private, invitation-only event. Your
personal invitation link is below:

[Accept Your Invitation] →
https://events.site.com/invite/abc123xyz

Your invitation expires in 7 days.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RSVP by March 1st to secure your spot.

Questions? Reply to this email or contact us at
events@company.com

See you there!
[Organizer Name]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This invitation is non-transferable.
```

**Invitation Link Security**:
- Cryptographically secure random tokens (32+ characters)
- One-time use or limited use (configurable)
- Expiration dates
- Tied to specific email address
- Validation on access

### AC-4: Guest RSVP and Registration Experience

**GIVEN** I am an invited guest clicking my invitation link
**WHEN** I land on the RSVP page
**THEN** I should see:
- Personalized greeting (if name available)
- Event details
- Number of tickets allocated to me
- Option to RSVP Yes/No
- Option to add +1 guests (if allowed)
- Message to organizer field (optional)

**RSVP Page**:
```
╔════════════════════════════════════════════════╗
║                                                ║
║         YOU'RE INVITED!                        ║
║                                                ║
║  Hi Sarah Johnson,                             ║
║                                                ║
║  You've been invited to:                       ║
║  VIP PRODUCT LAUNCH EVENT                      ║
║                                                ║
╠════════════════════════════════════════════════╣
║                                                ║
║ 📅 March 15, 2025 at 7:00 PM EST              ║
║ 📍 Downtown Gallery                            ║
║    123 Main St, New York, NY                   ║
║                                                ║
║ 🎟️ Your Ticket Allocation: 2 tickets          ║
║                                                ║
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ║
║                                                ║
║ Will you attend?                               ║
║                                                ║
║ ◉ Yes, I'll be there! (2 tickets)             ║
║ ○ Sorry, I can't make it                      ║
║                                                ║
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ║
║                                                ║
║ Who's coming with you? (Optional)              ║
║                                                ║
║ Guest 1: You (Sarah Johnson)                   ║
║                                                ║
║ Guest 2: [Name__________________]              ║
║          [Email_________________]              ║
║                                                ║
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ║
║                                                ║
║ Message to organizer (optional):               ║
║ [_______________________________________]      ║
║ [_______________________________________]      ║
║                                                ║
║          [Confirm RSVP] →                      ║
║                                                ║
╚════════════════════════════════════════════════╝
```

**After RSVP**:
- Send confirmation email with tickets/QR codes
- Add to attendee list
- Update organizer's guest list status
- Add to calendar (ICS file)

### AC-5: Access Code System (Alternative Method)

**GIVEN** I want a simpler access method than individual invitations
**WHEN** I enable "Access Code" mode
**THEN** I should be able to:
- Generate a single shared access code
- Set code expiration date
- Limit total uses of the code
- Share code via any channel (email, social, print)
- Track code usage

**Access Code Configuration**:
```
┌─────────────────────────────────────────────────┐
│ Access Code Setup                                │
├─────────────────────────────────────────────────┤
│ Generate Access Code:                            │
│                                                  │
│ Code: [VIP2025LAUNCH______] [🔄 Regenerate]     │
│                                                  │
│ Settings:                                        │
│ Expires: [March 1, 2025 11:59 PM]               │
│ Max Uses: [100] (0 = unlimited)                  │
│ Uses So Far: 0                                   │
│                                                  │
│ ☑ Case-insensitive                              │
│ ☑ Allow spaces                                   │
│ ☐ Require email verification                    │
│                                                  │
│ Share this code:                                 │
│ [📋 Copy Code] [📧 Email Code] [🖨️ Print]       │
│                                                  │
│ Preview URL:                                     │
│ https://events.site.com/evt/abc123?code=VIP2025  │
│ [Copy URL]                                       │
└─────────────────────────────────────────────────┘
```

**Customer Access Code Entry**:
```
╔════════════════════════════════════════════════╗
║    🔒 Private Event                            ║
╠════════════════════════════════════════════════╣
║                                                ║
║  This event is private and requires an         ║
║  access code to view details and register.     ║
║                                                ║
║  Enter Access Code:                            ║
║  [_______________________________________]     ║
║                                                ║
║          [Submit] →                            ║
║                                                ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ║
║                                                ║
║  Have an invitation link?                      ║
║  [Click here]                                  ║
║                                                ║
╚════════════════════════════════════════════════╝
```

### AC-6: Guest List Analytics and Tracking

**GIVEN** I have sent invitations for a private event
**WHEN** I view the invitation analytics
**THEN** I should see:
- Total invitations sent
- RSVP rate (accepted vs declined vs pending)
- Email open rate
- Link click rate
- Average response time
- Guest demographics (if available)
- Plus-one usage rate

**Analytics Dashboard**:
```
╔══════════════════════════════════════════════════╗
║ Invitation Analytics                            ║
║ VIP Product Launch Event                         ║
╠══════════════════════════════════════════════════╣
║ Overview:                                        ║
║ • Total Invited: 125 guests                      ║
║ • RSVP'd Yes: 87 (69.6%)                        ║
║ • RSVP'd No: 12 (9.6%)                          ║
║ • Pending: 26 (20.8%)                            ║
║ • Expired: 0                                     ║
╠══════════════════════════════════════════════════╣
║ Engagement:                                      ║
║ • Email Open Rate: 94.4% (118/125)              ║
║ • Link Click Rate: 81.6% (102/125)              ║
║ • Avg Response Time: 2.3 days                    ║
╠══════════════════════════════════════════════════╣
║ Ticket Allocation:                               ║
║ • Total Tickets Allocated: 150                   ║
║ • Tickets Confirmed: 112 (74.7%)                 ║
║ • Plus-Ones Added: 25 (28.7% usage)             ║
╠══════════════════════════════════════════════════╣
║ Timeline:                                        ║
║ ┌────────────────────────────────────────────┐  ║
║ │ Week 1: 45 RSVPs                           │  ║
║ │ Week 2: 28 RSVPs                           │  ║
║ │ Week 3: 14 RSVPs                           │  ║
║ │ [Graph showing daily RSVP trend]           │  ║
║ └────────────────────────────────────────────┘  ║
╠══════════════════════════════════════════════════╣
║ Actions Needed:                                  ║
║ ⚠️ 26 pending invitations - send reminder?      ║
║ [Send Reminder Emails]                           ║
╚══════════════════════════════════════════════════╝
```

---

## Tasks / Subtasks

### Phase 1: Backend Implementation (8 hours)

- [ ] **Private Event Schema** (AC-1)
  - [ ] Update Event model:
    - `visibility: EventVisibility` (PUBLIC, UNLISTED, PRIVATE_INVITE, PRIVATE_CODE)
    - `accessMethod: AccessMethod` (INVITATION, CODE, GUEST_LIST)
    - `requireRSVP: Boolean`
    - `allowPlusOnes: Boolean`
    - `maxPlusOnes: Int`
  - [ ] Create `EventInvitation` model
  - [ ] Create `AccessCode` model
  - [ ] Create migration

- [ ] **Invitation Service** (AC-2, AC-3)
  - [ ] `InvitationService.ts` with methods:
    - `createInvitation(eventId, guestDetails)` - Generate invitation
    - `sendInvitation(invitationId)` - Send email
    - `validateInvitation(token)` - Check if valid
    - `processRSVP(token, response)` - Handle RSVP
    - `revokeInvitation(invitationId)` - Cancel invitation
  - [ ] Generate cryptographically secure tokens
  - [ ] Track invitation lifecycle

- [ ] **Access Code Service** (AC-5)
  - [ ] `AccessCodeService.ts` with methods:
    - `generateCode(eventId, settings)` - Create code
    - `validateCode(eventId, code)` - Check validity
    - `incrementUsage(codeId)` - Track uses
    - `checkExpiration(codeId)` - Verify still valid

### Phase 2: API Layer (5 hours)

- [ ] **Invitation Management APIs** (AC-2, AC-3)
  - [ ] `POST /api/events/:eventId/invitations` - Create invitations (bulk)
  - [ ] `GET /api/events/:eventId/invitations` - List invitations
  - [ ] `POST /api/events/:eventId/invitations/send` - Send emails
  - [ ] `PATCH /api/events/:eventId/invitations/:id` - Update invitation
  - [ ] `DELETE /api/events/:eventId/invitations/:id` - Revoke invitation

- [ ] **RSVP APIs** (AC-4)
  - [ ] `GET /api/invitations/:token` - Get invitation details
  - [ ] `POST /api/invitations/:token/rsvp` - Submit RSVP
  - [ ] `POST /api/events/:eventId/access-code/validate` - Validate code

- [ ] **Analytics APIs** (AC-6)
  - [ ] `GET /api/events/:eventId/invitations/analytics` - Get metrics

### Phase 3: Organizer UI (8 hours)

- [ ] **Private Event Configuration** (AC-1)
  - [ ] `VisibilitySettings.tsx` - Visibility selector
  - [ ] `PrivateEventSettings.tsx` - Private event options
  - [ ] Add to event creation/edit flow

- [ ] **Guest List Manager** (AC-2)
  - [ ] `GuestListManager.tsx` - Main interface
  - [ ] `AddGuestForm.tsx` - Manual guest addition
  - [ ] `BulkImportCSV.tsx` - CSV upload and parsing
  - [ ] `GuestListTable.tsx` - Sortable, filterable list
  - [ ] `GuestDetails.tsx` - Individual guest management

- [ ] **Invitation Controls** (AC-3)
  - [ ] `SendInvitationsButton.tsx` - Bulk send
  - [ ] `InvitationTemplate.tsx` - Email customization
  - [ ] `ResendControls.tsx` - Resend logic

- [ ] **Access Code Manager** (AC-5)
  - [ ] `AccessCodeSettings.tsx` - Code configuration
  - [ ] `CodeGenerator.tsx` - Generate and display code
  - [ ] `CodeUsageStats.tsx` - Usage tracking

- [ ] **Invitation Analytics** (AC-6)
  - [ ] `InvitationAnalytics.tsx` - Main dashboard
  - [ ] `RSVPChart.tsx` - Visual RSVP tracking
  - [ ] `EngagementMetrics.tsx` - Open/click rates

### Phase 4: Customer-Facing UI (7 hours)

- [ ] **RSVP Page** (AC-4)
  - [ ] `InvitationRSVPPage.tsx` - Main RSVP interface
  - [ ] `RSVPForm.tsx` - RSVP submission form
  - [ ] `PlusOneManager.tsx` - Add guest details
  - [ ] `RSVPConfirmation.tsx` - Success page

- [ ] **Access Code Entry** (AC-5)
  - [ ] `AccessCodeGate.tsx` - Code entry modal
  - [ ] `PrivateEventNotice.tsx` - Locked event display
  - [ ] Update event detail page for private events

- [ ] **Email Templates** (AC-3, AC-4)
  - [ ] Create invitation email template
  - [ ] Create RSVP confirmation template
  - [ ] Create reminder email template
  - [ ] Create declined acknowledgment template

### Phase 5: Testing (4 hours)

- [ ] Unit tests for invitation generation
- [ ] Unit tests for access code validation
- [ ] Integration test: Full invitation lifecycle
- [ ] Integration test: RSVP flow
- [ ] E2E test: Create private event
- [ ] E2E test: Send invitations
- [ ] E2E test: Guest RSVP
- [ ] E2E test: Access code entry
- [ ] Test security (token validation, expiration)
- [ ] Test edge cases (expired invitations, revoked access)

---

## Technical Design

### Database Schema

```prisma
model Event {
  // ... existing fields

  // Privacy & Access
  visibility       EventVisibility @default(PUBLIC)
  accessMethod     AccessMethod?
  requireRSVP      Boolean   @default(false)
  allowPlusOnes    Boolean   @default(false)
  maxPlusOnes      Int       @default(1)

  // Relations
  invitations      EventInvitation[]
  accessCodes      EventAccessCode[]
}

model EventInvitation {
  id               String    @id @default(uuid())
  eventId          String
  event            Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)

  // Guest Information
  firstName        String
  lastName         String
  email            String

  // Invitation Details
  token            String    @unique // Secure random token
  ticketAllocation Int       @default(1)
  allowPlusOnes    Boolean   @default(false)
  maxPlusOnes      Int       @default(0)

  // Status Tracking
  status           InvitationStatus @default(PENDING)
  sentAt           DateTime?
  openedAt         DateTime?
  clickedAt        DateTime?
  rsvpAt           DateTime?
  rsvpResponse     RSVPResponse?

  // Security
  expiresAt        DateTime
  maxUses          Int       @default(1)
  usedCount        Int       @default(0)
  isRevoked        Boolean   @default(false)
  revokedAt        DateTime?

  // Plus Ones
  plusOnes         Json?     // Array of plus-one details

  // Metadata
  notes            String?   @db.Text
  group            String?   // Group/category for organizing
  customMessage    String?   @db.Text

  // Relations
  tickets          Ticket[]

  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  @@index([eventId, status])
  @@index([token])
  @@index([email])
  @@map("event_invitations")
}

model EventAccessCode {
  id               String    @id @default(uuid())
  eventId          String
  event            Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)

  // Code Details
  code             String    @unique
  description      String?

  // Settings
  maxUses          Int?      // null = unlimited
  usedCount        Int       @default(0)
  expiresAt        DateTime?

  // Security
  isActive         Boolean   @default(true)
  requireEmail     Boolean   @default(false)

  // Tracking
  lastUsedAt       DateTime?

  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  @@index([eventId, isActive])
  @@index([code])
  @@map("event_access_codes")
}

enum EventVisibility {
  PUBLIC
  UNLISTED
  PRIVATE_INVITE
  PRIVATE_CODE
}

enum AccessMethod {
  INVITATION_LINK
  ACCESS_CODE
  GUEST_LIST
  HYBRID
}

enum InvitationStatus {
  PENDING
  SENT
  OPENED
  CLICKED
  RSVP_YES
  RSVP_NO
  EXPIRED
  REVOKED
}

enum RSVPResponse {
  YES
  NO
  MAYBE
}
```

### Invitation Service Implementation

```typescript
// lib/services/invitation.service.ts

import { randomBytes } from 'crypto';

interface CreateInvitationParams {
  eventId: string;
  firstName: string;
  lastName: string;
  email: string;
  ticketAllocation?: number;
  allowPlusOnes?: boolean;
  maxPlusOnes?: number;
  expiresInDays?: number;
  group?: string;
  customMessage?: string;
}

class InvitationService {
  /**
   * Generate secure invitation token
   */
  private generateToken(): string {
    return randomBytes(32).toString('base64url');
  }

  /**
   * Create invitation for guest
   */
  async createInvitation(params: CreateInvitationParams): Promise<EventInvitation> {
    const token = this.generateToken();
    const expiresAt = add(new Date(), { days: params.expiresInDays || 30 });

    const invitation = await prisma.eventInvitation.create({
      data: {
        eventId: params.eventId,
        firstName: params.firstName,
        lastName: params.lastName,
        email: params.email,
        token,
        ticketAllocation: params.ticketAllocation || 1,
        allowPlusOnes: params.allowPlusOnes || false,
        maxPlusOnes: params.maxPlusOnes || 0,
        expiresAt,
        group: params.group,
        customMessage: params.customMessage,
        status: 'PENDING'
      }
    });

    return invitation;
  }

  /**
   * Bulk create invitations from CSV
   */
  async createBulkInvitations(
    eventId: string,
    guests: Array<{
      firstName: string;
      lastName: string;
      email: string;
      ticketAllocation?: number;
      group?: string;
    }>
  ): Promise<EventInvitation[]> {
    const invitations = await Promise.all(
      guests.map(guest =>
        this.createInvitation({
          eventId,
          ...guest
        })
      )
    );

    return invitations;
  }

  /**
   * Send invitation email
   */
  async sendInvitation(invitationId: string): Promise<void> {
    const invitation = await prisma.eventInvitation.findUnique({
      where: { id: invitationId },
      include: { event: true }
    });

    if (!invitation) throw new Error('Invitation not found');

    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invitation.token}`;

    await emailService.sendEmail({
      to: invitation.email,
      template: 'event-invitation',
      data: {
        guestName: `${invitation.firstName} ${invitation.lastName}`,
        eventName: invitation.event.name,
        eventDate: invitation.event.startDate,
        eventLocation: invitation.event.venue,
        ticketAllocation: invitation.ticketAllocation,
        invitationUrl,
        expiresAt: invitation.expiresAt,
        customMessage: invitation.customMessage
      }
    });

    await prisma.eventInvitation.update({
      where: { id: invitationId },
      data: {
        status: 'SENT',
        sentAt: new Date()
      }
    });
  }

  /**
   * Validate invitation token
   */
  async validateInvitation(token: string): Promise<{
    valid: boolean;
    invitation?: EventInvitation;
    reason?: string;
  }> {
    const invitation = await prisma.eventInvitation.findUnique({
      where: { token },
      include: { event: true }
    });

    if (!invitation) {
      return { valid: false, reason: 'INVALID_TOKEN' };
    }

    if (invitation.isRevoked) {
      return { valid: false, reason: 'REVOKED' };
    }

    if (new Date() > invitation.expiresAt) {
      return { valid: false, reason: 'EXPIRED' };
    }

    if (invitation.maxUses > 0 && invitation.usedCount >= invitation.maxUses) {
      return { valid: false, reason: 'MAX_USES_REACHED' };
    }

    return { valid: true, invitation };
  }

  /**
   * Process RSVP response
   */
  async processRSVP(
    token: string,
    response: RSVPResponse,
    plusOnes?: Array<{ name: string; email: string }>
  ): Promise<void> {
    const validation = await this.validateInvitation(token);

    if (!validation.valid) {
      throw new Error(`Invalid invitation: ${validation.reason}`);
    }

    const invitation = validation.invitation!;

    await prisma.eventInvitation.update({
      where: { id: invitation.id },
      data: {
        status: response === 'YES' ? 'RSVP_YES' : 'RSVP_NO',
        rsvpResponse: response,
        rsvpAt: new Date(),
        usedCount: { increment: 1 },
        plusOnes: plusOnes || []
      }
    });

    // If RSVP'd yes, create tickets
    if (response === 'YES') {
      await this.generateTicketsForRSVP(invitation, plusOnes);
    }

    // Send confirmation email
    await this.sendRSVPConfirmation(invitation, response);
  }

  /**
   * Generate tickets after RSVP
   */
  private async generateTicketsForRSVP(
    invitation: EventInvitation,
    plusOnes?: Array<{ name: string; email: string }>
  ): Promise<void> {
    const totalTickets = 1 + (plusOnes?.length || 0);

    // Create order (mark as complimentary for invited guests)
    const order = await orderService.createOrder({
      eventId: invitation.eventId,
      userId: null, // May not have account yet
      email: invitation.email,
      firstName: invitation.firstName,
      lastName: invitation.lastName,
      items: [{
        ticketTypeId: invitation.event.ticketTypes[0].id, // Default ticket type
        quantity: totalTickets,
        price: 0 // Complimentary
      }],
      total: 0,
      status: 'COMPLETED',
      paymentMethod: 'INVITATION'
    });

    // Generate QR codes and send confirmation
    await ticketService.generateTickets(order.id);
  }
}
```

---

## Edge Cases & Business Rules

### 1. Expired Invitations
- **Rule**: Invitations expire after X days (configurable)
- **Behavior**: Show "Invitation Expired" message
- **Recovery**: Organizer can extend expiration or resend

### 2. Duplicate Email Invitations
- **Rule**: Cannot send multiple active invitations to same email
- **Behavior**: Warn organizer, option to replace or keep existing
- **Exception**: Can resend after RSVP decline

### 3. Plus-One Limits
- **Scenario**: Guest tries to add more plus-ones than allowed
- **Validation**: Prevent submission, show limit
- **Message**: "You can bring up to X guests"

### 4. Revoked Invitations
- **Rule**: Revoked invitations cannot be re-activated
- **Process**: Create new invitation for same guest if needed
- **Notification**: Optionally notify guest of revocation

### 5. Access Code Security
- **Protection**: Rate limit code attempts (5 per 15 min)
- **Monitoring**: Alert on suspicious patterns
- **Response**: Disable code if abuse detected

---

## Integration Points

### Integrates With:
- **EV-001 (Event Creation)**: Event visibility settings
- **AUTH-001 (Authentication)**: Optional account requirement
- **EMAIL-001 (Notifications)**: Invitation emails
- **TKT-001 (Tickets)**: Complimentary ticket generation
- **AN-001 (Analytics)**: Invitation metrics

---

## Success Metrics

- **Adoption**: 15% of events use private/invite-only mode
- **RSVP Rate**: 75%+ of invitations result in RSVP
- **Email Engagement**: 90%+ open rate for invitations
- **Plus-One Usage**: 30-40% of guests bring plus-ones
- **Security**: Zero unauthorized access incidents

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