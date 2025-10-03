# MKT-002: SMS Notifications with Twilio

**Epic:** EPIC-010: Marketing & Communications
**Story Points:** 5
**Priority:** High
**Status:** Ready for Development

---

## User Story

**As an** event organizer
**I want to** send SMS notifications to my attendees
**So that** I can reach them instantly with time-sensitive updates and reminders

---

## Acceptance Criteria

### SMS Sending
- [ ] Organizer can send SMS to individual contact or contact list
- [ ] System supports bulk SMS campaigns up to 10,000 recipients
- [ ] Organizer can compose message with 160-character counter
- [ ] System shows SMS preview before sending
- [ ] Organizer can schedule SMS for future date/time
- [ ] System supports merge tags for personalization
- [ ] Organizer can send test SMS to verify content
- [ ] System queues messages for throttled delivery

### Opt-In Management
- [ ] System requires explicit opt-in before sending marketing SMS
- [ ] Organizer can enable SMS opt-in checkbox on registration forms
- [ ] System sends double opt-in confirmation message
- [ ] Contact must reply "YES" to confirm subscription
- [ ] System stores opt-in timestamp and method
- [ ] Organizer can view opt-in status for each contact
- [ ] System prevents sending to contacts without opt-in

### Opt-Out Compliance
- [ ] Every SMS includes "Reply STOP to unsubscribe" message
- [ ] System automatically processes STOP keyword replies
- [ ] System supports STOP, STOPALL, UNSUBSCRIBE, CANCEL, END, QUIT keywords
- [ ] System immediately suppresses opted-out numbers
- [ ] System sends confirmation message after opt-out
- [ ] Organizer can view opt-out list in dashboard
- [ ] System logs all opt-out events with timestamps

### Message Templates
- [ ] System provides pre-built SMS templates for common scenarios
- [ ] Templates include: Event reminder, ticket delivery, schedule change, last-minute update
- [ ] Organizer can create and save custom templates
- [ ] Templates support merge tags (name, event, date, venue)
- [ ] System enforces 160-character limit with multi-part SMS warning
- [ ] Organizer can test templates before saving

### Delivery Tracking
- [ ] System tracks message delivery status (sent, delivered, failed)
- [ ] Organizer can view delivery report for each campaign
- [ ] System logs failed messages with error reasons
- [ ] Organizer receives notifications for high failure rates
- [ ] System tracks reply messages from recipients
- [ ] Dashboard shows delivery rate, opt-out rate, reply rate

### TCPA Compliance
- [ ] System maintains audit log of all opt-ins with timestamps
- [ ] System includes sender identification in every message
- [ ] SMS sent only during permitted hours (8am-9pm recipient's timezone)
- [ ] System prevents sending to landline numbers
- [ ] Organizer must provide business relationship justification
- [ ] System displays compliance checklist before sending

---

## Technical Requirements

### Twilio Integration
```typescript
// SMS Service Implementation
import twilio from 'twilio';

interface SMSCampaign {
  id: string;
  organizationId: string;
  name: string;
  message: string;
  fromNumber: string; // Twilio phone number
  recipientCount: number;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredCount: number;
  failedCount: number;
  optOutCount: number;
  replyCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface SMSRecipient {
  id: string;
  campaignId: string;
  contactId: string;
  phoneNumber: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'undelivered';
  messageSid: string; // Twilio message ID
  errorCode?: string;
  errorMessage?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  cost?: number; // In cents
}

interface SMSOptIn {
  id: string;
  phoneNumber: string;
  contactId?: string;
  status: 'pending' | 'confirmed' | 'opted_out';
  optInMethod: 'web_form' | 'sms_keyword' | 'manual' | 'api';
  optInTimestamp?: Date;
  optOutTimestamp?: Date;
  confirmationMessageSid?: string;
  ipAddress?: string;
}

export class TwilioSMSService {
  private client: twilio.Twilio;

  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  async sendSMS(
    to: string,
    message: string,
    fromNumber: string
  ): Promise<string> {
    // Check opt-in status
    const optIn = await this.checkOptInStatus(to);
    if (optIn.status !== 'confirmed') {
      throw new Error('Recipient has not opted in to SMS');
    }

    // Check time restrictions (8am-9pm)
    if (!this.isWithinAllowedHours(to)) {
      throw new Error('Cannot send SMS outside 8am-9pm recipient timezone');
    }

    // Send via Twilio
    const twilioMessage = await this.client.messages.create({
      body: message,
      to,
      from: fromNumber,
      statusCallback: `${process.env.APP_URL}/api/webhooks/twilio`,
    });

    return twilioMessage.sid;
  }

  async sendBulkSMS(campaign: SMSCampaign): Promise<void> {
    const recipients = await this.getCampaignRecipients(campaign.id);

    for (const recipient of recipients) {
      try {
        const messageSid = await this.sendSMS(
          recipient.phoneNumber,
          this.buildMessage(campaign.message, recipient),
          campaign.fromNumber
        );

        await this.updateRecipientStatus(recipient.id, 'sent', messageSid);
      } catch (error) {
        await this.logSMSError(recipient.id, error);
      }

      // Throttle: 1 message per second (Twilio limit)
      await this.sleep(1000);
    }
  }

  async handleIncomingMessage(
    from: string,
    body: string,
    messageSid: string
  ): Promise<void> {
    const normalizedBody = body.trim().toUpperCase();

    // Handle opt-out keywords
    const optOutKeywords = ['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'];
    if (optOutKeywords.includes(normalizedBody)) {
      await this.processOptOut(from);
      await this.sendOptOutConfirmation(from);
      return;
    }

    // Handle opt-in confirmation
    if (normalizedBody === 'YES' || normalizedBody === 'Y') {
      await this.confirmOptIn(from);
      await this.sendOptInConfirmation(from);
      return;
    }

    // Handle HELP keyword
    if (normalizedBody === 'HELP' || normalizedBody === 'INFO') {
      await this.sendHelpMessage(from);
      return;
    }

    // Log as general reply
    await this.logIncomingMessage(from, body, messageSid);
  }

  private async processOptOut(phoneNumber: string): Promise<void> {
    await prisma.sMSOptIn.updateMany({
      where: { phoneNumber },
      data: {
        status: 'opted_out',
        optOutTimestamp: new Date(),
      },
    });

    // Add to suppression list
    await prisma.sMSSuppressionList.create({
      data: {
        phoneNumber,
        reason: 'USER_REQUEST',
        suppressedAt: new Date(),
      },
    });
  }

  private async confirmOptIn(phoneNumber: string): Promise<void> {
    await prisma.sMSOptIn.updateMany({
      where: { phoneNumber, status: 'pending' },
      data: {
        status: 'confirmed',
        optInTimestamp: new Date(),
      },
    });
  }

  private async sendOptOutConfirmation(phoneNumber: string): Promise<void> {
    const message = 'You have been unsubscribed from SMS notifications. ' +
                   'Reply START to resubscribe. Msg&Data rates may apply.';

    await this.client.messages.create({
      body: message,
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
    });
  }

  private isWithinAllowedHours(phoneNumber: string): boolean {
    // Get recipient timezone (from contact record)
    const timezone = this.getRecipientTimezone(phoneNumber);
    const now = new Date();
    const localHour = new Date(now.toLocaleString('en-US', { timeZone: timezone })).getHours();

    return localHour >= 8 && localHour < 21; // 8am-9pm
  }

  private buildMessage(template: string, recipient: SMSRecipient): string {
    const contact = await this.getContact(recipient.contactId);

    return template
      .replace('{{first_name}}', contact.firstName)
      .replace('{{last_name}}', contact.lastName)
      .replace('{{event_name}}', contact.lastEventName || '')
      .replace('{{event_date}}', contact.lastEventDate || '');
  }
}
```

### Twilio Webhook Handler
```typescript
// /api/webhooks/twilio/route.ts
import twilio from 'twilio';

export async function POST(request: Request) {
  const formData = await request.formData();
  const body = Object.fromEntries(formData);

  // Verify webhook signature
  const signature = request.headers.get('x-twilio-signature');
  const isValid = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN,
    signature,
    process.env.APP_URL + '/api/webhooks/twilio',
    body
  );

  if (!isValid) {
    return new Response('Forbidden', { status: 403 });
  }

  const {
    MessageSid,
    MessageStatus,
    From,
    To,
    Body,
    ErrorCode,
    ErrorMessage,
  } = body;

  // Handle status updates
  if (MessageStatus) {
    await updateMessageStatus(MessageSid, MessageStatus, ErrorCode);
  }

  // Handle incoming messages
  if (Body) {
    const smsService = new TwilioSMSService();
    await smsService.handleIncomingMessage(From, Body, MessageSid);
  }

  return new Response('OK', { status: 200 });
}

async function updateMessageStatus(
  messageSid: string,
  status: string,
  errorCode?: string
): Promise<void> {
  const recipient = await prisma.sMSRecipient.findFirst({
    where: { messageSid },
  });

  if (!recipient) return;

  const updateData: any = { status };

  if (status === 'delivered') {
    updateData.deliveredAt = new Date();
  } else if (status === 'failed' || status === 'undelivered') {
    updateData.errorCode = errorCode;
  }

  await prisma.sMSRecipient.update({
    where: { id: recipient.id },
    data: updateData,
  });
}
```

### Opt-In Form Component
```typescript
// components/SMSOptInForm.tsx
'use client';

import { useState } from 'react';

export function SMSOptInForm({ eventId }: { eventId: string }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState<'idle' | 'pending' | 'success'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreed) {
      alert('Please agree to receive SMS notifications');
      return;
    }

    setStatus('pending');

    const response = await fetch('/api/sms/opt-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, eventId }),
    });

    if (response.ok) {
      setStatus('success');
    }
  };

  if (status === 'success') {
    return (
      <div className="success-message">
        <p>A confirmation message has been sent to {phoneNumber}</p>
        <p>Reply YES to complete your subscription.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Phone Number
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="+1 (555) 123-4567"
          required
        />
      </label>

      <label>
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
        />
        I agree to receive SMS notifications from this event organizer.
        Message and data rates may apply. Reply STOP to unsubscribe.
      </label>

      <button type="submit" disabled={status === 'pending'}>
        {status === 'pending' ? 'Sending...' : 'Subscribe to SMS Updates'}
      </button>

      <p className="disclaimer">
        By subscribing, you agree to receive event reminders and updates via SMS.
        Up to 5 messages per event. Reply STOP to unsubscribe at any time.
        Reply HELP for help. Message and data rates may apply.
      </p>
    </form>
  );
}
```

---

## Database Schema

```prisma
model SMSCampaign {
  id                String   @id @default(cuid())
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id])

  name              String
  message           String   @db.Text
  fromNumber        String   // Twilio phone number

  status            SMSCampaignStatus @default(DRAFT)
  scheduledAt       DateTime?
  sentAt            DateTime?

  recipientCount    Int      @default(0)
  sentCount         Int      @default(0)
  deliveredCount    Int      @default(0)
  failedCount       Int      @default(0)
  optOutCount       Int      @default(0)
  replyCount        Int      @default(0)

  totalCost         Float    @default(0) // In cents

  recipients        SMSRecipient[]

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([organizationId])
  @@index([status])
}

model SMSRecipient {
  id              String   @id @default(cuid())
  campaignId      String
  campaign        SMSCampaign @relation(fields: [campaignId], references: [id])
  contactId       String
  contact         Contact @relation(fields: [contactId], references: [id])

  phoneNumber     String
  status          SMSRecipientStatus @default(QUEUED)
  messageSid      String?  // Twilio message ID
  errorCode       String?
  errorMessage    String?

  sentAt          DateTime?
  deliveredAt     DateTime?
  cost            Float?   // In cents

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([campaignId])
  @@index([status])
}

model SMSOptIn {
  id                    String   @id @default(cuid())
  phoneNumber           String   @unique
  contactId             String?
  contact               Contact? @relation(fields: [contactId], references: [id])

  status                OptInStatus @default(PENDING)
  optInMethod           OptInMethod
  optInTimestamp        DateTime?
  optOutTimestamp       DateTime?
  confirmationMessageSid String?
  ipAddress             String?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([phoneNumber])
  @@index([status])
}

model SMSSuppressionList {
  id              String   @id @default(cuid())
  phoneNumber     String   @unique
  reason          SuppressionReason
  suppressedAt    DateTime @default(now())

  @@index([phoneNumber])
}

model SMSIncomingMessage {
  id              String   @id @default(cuid())
  fromNumber      String
  toNumber        String
  body            String   @db.Text
  messageSid      String   @unique
  receivedAt      DateTime @default(now())

  @@index([fromNumber])
}

enum SMSCampaignStatus {
  DRAFT
  SCHEDULED
  SENDING
  SENT
  CANCELLED
}

enum SMSRecipientStatus {
  QUEUED
  SENT
  DELIVERED
  FAILED
  UNDELIVERED
}

enum OptInStatus {
  PENDING
  CONFIRMED
  OPTED_OUT
}

enum OptInMethod {
  WEB_FORM
  SMS_KEYWORD
  MANUAL
  API
}
```

---

## API Endpoints

```typescript
POST   /api/sms/campaigns           // Create SMS campaign
GET    /api/sms/campaigns           // List campaigns
GET    /api/sms/campaigns/:id       // Get campaign details
PUT    /api/sms/campaigns/:id       // Update campaign
DELETE /api/sms/campaigns/:id       // Delete campaign
POST   /api/sms/campaigns/:id/send  // Send campaign
POST   /api/sms/campaigns/:id/test  // Send test SMS

POST   /api/sms/opt-in              // Process opt-in request
POST   /api/sms/opt-out             // Process opt-out request
GET    /api/sms/opt-ins             // List opt-in records

POST   /api/webhooks/twilio         // Twilio webhook handler
GET    /api/sms/analytics/:campaignId // Get campaign analytics
```

---

## TCPA Compliance Checklist

### Required Elements
1. **Prior Express Written Consent**
   - [ ] Obtain clear opt-in before sending marketing SMS
   - [ ] Store timestamp and method of consent
   - [ ] Maintain audit trail of opt-in records

2. **Message Content Requirements**
   - [ ] Include sender identification in every message
   - [ ] Add opt-out instructions (Reply STOP)
   - [ ] Disclose message frequency
   - [ ] Mention data rates may apply

3. **Time Restrictions**
   - [ ] Only send between 8am-9pm in recipient's timezone
   - [ ] No SMS on federal holidays (optional best practice)

4. **Opt-Out Processing**
   - [ ] Honor opt-out requests immediately
   - [ ] Support standard opt-out keywords
   - [ ] Send confirmation after opt-out
   - [ ] Maintain opt-out records for 5+ years

5. **Record Keeping**
   - [ ] Document business relationship with recipient
   - [ ] Log all consent records with timestamps
   - [ ] Store opt-out records indefinitely
   - [ ] Track delivery confirmations

---

## Third-Party Documentation

### Twilio SMS API
- **API Docs:** https://www.twilio.com/docs/sms/api
- **Send SMS:** https://www.twilio.com/docs/sms/api/message-resource#create-a-message-resource
- **Webhooks:** https://www.twilio.com/docs/usage/webhooks/sms-webhooks
- **Opt-Out:** https://www.twilio.com/docs/sms/opt-out-management

### Compliance Resources
- **TCPA Overview:** https://www.fcc.gov/general/telemarketing-and-robocalls
- **Twilio Compliance Guide:** https://www.twilio.com/docs/glossary/what-is-tcpa-compliance

---

## Testing Requirements

### Unit Tests
- Phone number validation and formatting
- Opt-in/opt-out processing
- Message merge tag replacement
- Time restriction validation
- Character count and multi-part SMS detection

### Integration Tests
- Twilio API integration (send, status callbacks)
- Webhook signature verification
- Opt-in confirmation flow
- Opt-out keyword processing
- Campaign sending and throttling

---

## Cost Considerations

### Twilio Pricing (as of 2024)
- **SMS (USA):** $0.0079 per message segment
- **Phone Number:** $1.15/month per number
- **10,000 messages/month:** ~$79 + phone rental

### Cost Tracking
- Record cost per message in database
- Display estimated campaign cost before sending
- Monthly SMS spending report for organizers
- Alert when approaching budget limits

---

## Dependencies
- **Requires:** Twilio account with verified phone number
- **Integrates With:** Contact list management (MKT-008), Event reminders
- **Blocks:** SMS campaign analytics dashboard

---

## Notes
- Twilio free trial includes $15 credit for testing
- Consider shortcode vs. long-code (10DLC) for high-volume sending
- Implement A2P 10DLC registration for USA messaging
- Test opt-in/opt-out flow thoroughly before launch
