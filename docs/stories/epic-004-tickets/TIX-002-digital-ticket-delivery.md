# TIX-002: Digital Ticket Delivery System

**Epic**: EPIC-004 - Digital Ticket System
**Story Points**: 3
**Priority**: Critical
**Status**: Ready for Development

## User Story

**As an** attendee who purchased tickets
**I want** to receive my tickets via email immediately after purchase
**So that** I have instant access to my tickets and can attend the event

## Business Value

- Immediate ticket delivery improves customer satisfaction
- Reduces support requests for "where's my ticket"
- Automated process eliminates manual ticket sending
- Professional email template builds brand trust
- Retry logic ensures 99%+ delivery rate

## Acceptance Criteria

### AC1: Automated Email Trigger
**Given** an order is successfully completed and payment confirmed
**When** the system processes the order
**Then** it must automatically trigger ticket email delivery within 30 seconds
**And** send one email per order (not per ticket)
**And** include all tickets for that order in a single email
**And** log the email send attempt with timestamp

### AC2: Email Content Requirements
**Given** ticket delivery email is being composed
**When** generating the email content
**Then** the email must include:
- Personalized greeting with customer name
- Order confirmation number
- Event details (name, date, time, venue)
- Total number of tickets purchased
- Individual ticket QR codes (embedded as images)
- Ticket tier/type for each ticket
- Total amount paid
- Download PDF attachment option
- Add to Calendar link (ICS file)
- Clear instructions for event entry
- Support contact information

### AC3: HTML Email Template
**Given** ticket emails need professional appearance
**When** rendering the email
**Then** the system must:
- Use responsive HTML template (mobile-friendly)
- Embed QR codes as base64 images (no external links)
- Include inline CSS for email client compatibility
- Provide plain text fallback version
- Test across major email clients (Gmail, Outlook, Apple Mail)
- Include company branding and logo
- Support dark mode where possible

### AC4: QR Code Embedding
**Given** QR codes must be scannable from email
**When** embedding QR codes
**Then** the system must:
- Use base64 PNG format from TIX-001
- Display at minimum 200x200px size
- Include alt text: "Ticket QR Code - Scan at event"
- Position QR codes prominently in email
- Ensure QR codes don't get blocked by email clients
- Test scannability from phone screens displaying email

### AC5: PDF Attachment Generation
**Given** users may want printable tickets
**When** generating PDF attachment
**Then** the system must:
- Create single PDF with all order tickets
- Include QR code for each ticket at scannable size (300x300px)
- Add event details, ticket tier, seat/section if applicable
- Include order number and purchase date
- Brand with company logo and colors
- Keep file size under 2MB for email delivery
- Name file: `Tickets-{EventName}-{OrderID}.pdf`

### AC6: Delivery Reliability & Retry Logic
**Given** email delivery can fail due to various reasons
**When** an email send attempt fails
**Then** the system must:
- Retry failed sends up to 3 times with exponential backoff (1min, 5min, 15min)
- Log all delivery attempts with status and error messages
- Alert admins after 3 failed attempts
- Store email in queue for manual review
- Track delivery status in database
- Update order status based on delivery success

### AC7: Delivery Status Tracking
**Given** we need visibility into email delivery
**When** tracking email status
**Then** the system must record:
- Queued timestamp
- Sent timestamp
- Delivered timestamp (if supported by provider)
- Opened timestamp (if supported by provider)
- Failed attempts with error codes
- Bounce notifications
- Spam reports

### AC8: Resend Capability
**Given** users may need tickets resent
**When** customer requests ticket resend
**Then** the system must:
- Allow resend from admin dashboard
- Allow user self-service resend (1 per hour limit)
- Use same email template and data
- Log resend requests with actor (admin/user)
- Include note about resend in email body

## Technical Specifications

### Email Service Provider Options

**Option 1: SendGrid (Recommended)**
```typescript
// High deliverability, robust API, good analytics
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const msg = {
  to: 'customer@example.com',
  from: 'tickets@stepperslife.com',
  subject: 'Your Tickets for {{event_name}}',
  html: htmlContent,
  text: plainTextContent,
  attachments: [
    {
      content: pdfBase64,
      filename: 'tickets.pdf',
      type: 'application/pdf',
      disposition: 'attachment'
    }
  ]
};
```

**Option 2: Nodemailer with SMTP**
```typescript
// More control, any SMTP provider
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
```

### Email Template System

**Recommended: React Email**
```typescript
// components/emails/TicketDeliveryEmail.tsx
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Img,
  Text,
  Button,
  Hr
} from '@react-email/components';

interface TicketDeliveryEmailProps {
  customerName: string;
  orderNumber: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  tickets: Array<{
    id: string;
    tier: string;
    qrCodeBase64: string;
  }>;
  totalAmount: number;
  calendarLink: string;
}

export default function TicketDeliveryEmail(props: TicketDeliveryEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://stepperslife.com/logo.png"
            width="150"
            alt="SteppersLife"
            style={logo}
          />

          <Text style={heading}>
            Your Tickets for {props.eventName}
          </Text>

          <Text style={paragraph}>
            Hi {props.customerName},
          </Text>

          <Text style={paragraph}>
            Your tickets are ready! Show the QR code below at the event entrance.
          </Text>

          <Section style={eventDetails}>
            <Text style={detailLabel}>Event:</Text>
            <Text style={detailValue}>{props.eventName}</Text>

            <Text style={detailLabel}>Date & Time:</Text>
            <Text style={detailValue}>
              {props.eventDate} at {props.eventTime}
            </Text>

            <Text style={detailLabel}>Venue:</Text>
            <Text style={detailValue}>{props.venue}</Text>

            <Text style={detailLabel}>Order Number:</Text>
            <Text style={detailValue}>{props.orderNumber}</Text>
          </Section>

          {props.tickets.map((ticket, index) => (
            <Section key={ticket.id} style={ticketSection}>
              <Text style={ticketTitle}>
                Ticket {index + 1} - {ticket.tier}
              </Text>
              <Img
                src={`data:image/png;base64,${ticket.qrCodeBase64}`}
                width="200"
                height="200"
                alt="Ticket QR Code"
                style={qrCode}
              />
              <Text style={ticketId}>Ticket ID: {ticket.id}</Text>
            </Section>
          ))}

          <Hr style={divider} />

          <Button href={props.calendarLink} style={button}>
            Add to Calendar
          </Button>

          <Text style={footer}>
            Need help? Contact us at support@stepperslife.com
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = { backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif' };
const container = { margin: '0 auto', padding: '20px', maxWidth: '600px' };
const logo = { margin: '0 auto', marginBottom: '20px' };
// ... more styles
```

### Database Schema Updates

```prisma
model EmailDelivery {
  id              String   @id @default(uuid())
  orderId         String
  recipientEmail  String
  recipientName   String

  // Email content
  subject         String
  htmlContent     String   @db.Text
  plainContent    String   @db.Text

  // Delivery tracking
  status          EmailStatus @default(QUEUED)
  queuedAt        DateTime @default(now())
  sentAt          DateTime?
  deliveredAt     DateTime?
  openedAt        DateTime?
  failedAt        DateTime?

  // Retry logic
  attemptCount    Int      @default(0)
  maxAttempts     Int      @default(3)
  lastAttemptAt   DateTime?
  nextRetryAt     DateTime?

  // Error tracking
  errorMessage    String?  @db.Text
  errorCode       String?

  // Provider details
  provider        String   @default("sendgrid") // sendgrid, smtp, etc.
  providerMessageId String? @unique

  // Metadata
  metadata        Json?    // Additional tracking data

  // Relationships
  order           Order    @relation(fields: [orderId], references: [id])

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([orderId])
  @@index([status, nextRetryAt])
  @@index([providerMessageId])
}

enum EmailStatus {
  QUEUED
  SENDING
  SENT
  DELIVERED
  OPENED
  FAILED
  BOUNCED
}
```

### Email Service Implementation

```typescript
// lib/services/ticket-email.service.ts

import { render } from '@react-email/render';
import sgMail from '@sendgrid/mail';
import TicketDeliveryEmail from '@/components/emails/TicketDeliveryEmail';
import { prisma } from '@/lib/prisma';
import { generateTicketPDF } from './ticket-pdf.service';

interface SendTicketEmailParams {
  orderId: string;
  recipientEmail: string;
  recipientName: string;
  tickets: Array<{
    id: string;
    tier: string;
    qrCodeBase64: string;
  }>;
  event: {
    name: string;
    date: string;
    time: string;
    venue: string;
  };
  totalAmount: number;
}

export class TicketEmailService {
  private readonly FROM_EMAIL = 'tickets@stepperslife.com';
  private readonly FROM_NAME = 'SteppersLife Events';

  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  }

  async sendTicketEmail(params: SendTicketEmailParams): Promise<void> {
    // Create email delivery record
    const delivery = await prisma.emailDelivery.create({
      data: {
        orderId: params.orderId,
        recipientEmail: params.recipientEmail,
        recipientName: params.recipientName,
        subject: `Your Tickets for ${params.event.name}`,
        status: 'QUEUED',
        provider: 'sendgrid'
      }
    });

    try {
      // Generate HTML and plain text versions
      const htmlContent = await this.generateHTMLContent(params);
      const plainContent = this.generatePlainTextContent(params);

      // Generate PDF attachment
      const pdfBuffer = await generateTicketPDF({
        orderNumber: params.orderId,
        tickets: params.tickets,
        event: params.event
      });

      // Update delivery record with content
      await prisma.emailDelivery.update({
        where: { id: delivery.id },
        data: {
          htmlContent,
          plainContent,
          status: 'SENDING',
          attemptCount: { increment: 1 },
          lastAttemptAt: new Date()
        }
      });

      // Send email via SendGrid
      const msg = {
        to: params.recipientEmail,
        from: {
          email: this.FROM_EMAIL,
          name: this.FROM_NAME
        },
        subject: `Your Tickets for ${params.event.name}`,
        html: htmlContent,
        text: plainContent,
        attachments: [
          {
            content: pdfBuffer.toString('base64'),
            filename: `Tickets-${params.event.name}-${params.orderId}.pdf`,
            type: 'application/pdf',
            disposition: 'attachment'
          }
        ],
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true }
        }
      };

      const response = await sgMail.send(msg);

      // Update delivery status
      await prisma.emailDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          providerMessageId: response[0].headers['x-message-id']
        }
      });

      console.log(`✓ Ticket email sent for order ${params.orderId}`);
    } catch (error) {
      await this.handleEmailFailure(delivery.id, error);
    }
  }

  private async generateHTMLContent(params: SendTicketEmailParams): Promise<string> {
    const calendarLink = this.generateCalendarLink(params.event);

    return render(
      TicketDeliveryEmail({
        customerName: params.recipientName,
        orderNumber: params.orderId,
        eventName: params.event.name,
        eventDate: params.event.date,
        eventTime: params.event.time,
        venue: params.event.venue,
        tickets: params.tickets,
        totalAmount: params.totalAmount,
        calendarLink
      })
    );
  }

  private generatePlainTextContent(params: SendTicketEmailParams): string {
    return `
Hi ${params.recipientName},

Your tickets for ${params.event.name} are ready!

EVENT DETAILS:
Date: ${params.event.date}
Time: ${params.event.time}
Venue: ${params.event.venue}
Order Number: ${params.orderId}

TICKETS:
${params.tickets.map((t, i) => `${i + 1}. ${t.tier} - Ticket ID: ${t.id}`).join('\n')}

Your tickets are attached as a PDF. You can also show the QR codes from this email at the event entrance.

Need help? Contact us at support@stepperslife.com

Best regards,
SteppersLife Events Team
    `.trim();
  }

  private generateCalendarLink(event: any): string {
    // Generate ICS calendar file URL
    return `/api/calendar/${event.id}.ics`;
  }

  private async handleEmailFailure(deliveryId: string, error: any): Promise<void> {
    const delivery = await prisma.emailDelivery.findUnique({
      where: { id: deliveryId }
    });

    if (!delivery) return;

    const shouldRetry = delivery.attemptCount < delivery.maxAttempts;
    const nextRetry = shouldRetry
      ? this.calculateNextRetry(delivery.attemptCount)
      : null;

    await prisma.emailDelivery.update({
      where: { id: deliveryId },
      data: {
        status: shouldRetry ? 'QUEUED' : 'FAILED',
        failedAt: shouldRetry ? undefined : new Date(),
        errorMessage: error.message,
        errorCode: error.code,
        nextRetryAt: nextRetry
      }
    });

    if (!shouldRetry) {
      // Alert admin after max retries
      await this.alertAdminOfFailure(deliveryId);
    }
  }

  private calculateNextRetry(attemptCount: number): Date {
    const delays = [60, 300, 900]; // 1min, 5min, 15min in seconds
    const delay = delays[attemptCount] || 900;
    return new Date(Date.now() + delay * 1000);
  }

  private async alertAdminOfFailure(deliveryId: string): Promise<void> {
    // TODO: Implement admin alert (email, Slack, etc.)
    console.error(`⚠ Email delivery failed after retries: ${deliveryId}`);
  }
}
```

## Integration Points

### 1. Order Completion Flow
- **Trigger**: Payment webhook confirms successful payment
- **Action**: Call `TicketEmailService.sendTicketEmail()`
- **Timing**: Within 30 seconds of payment confirmation

### 2. QR Code Generation (TIX-001)
- **Dependency**: Requires QR codes generated first
- **Data**: Uses base64 PNG QR codes from ticket records

### 3. PDF Generation Service
- **Consumer**: Creates PDF attachment
- **Library**: PDFKit or Puppeteer
- **Story**: TIX-008 (Multiple Formats)

### 4. Retry Job Queue
- **System**: Bull Queue or similar
- **Cron**: Check for failed emails every 5 minutes
- **Retry**: Process emails with nextRetryAt < now

## Performance Requirements

- Email generation: < 2 seconds per order
- Email sending: < 5 seconds via SendGrid API
- PDF generation: < 3 seconds for up to 10 tickets
- Queue processing: Handle 100+ emails per minute
- Retry jobs: Process within 1 minute of scheduled retry

## Testing Requirements

### Unit Tests
- [ ] HTML email renders correctly with all data
- [ ] Plain text version includes all key information
- [ ] QR codes embed properly as base64
- [ ] PDF attachment generates successfully
- [ ] Calendar link generates correct ICS format
- [ ] Retry logic calculates correct delays
- [ ] Error handling updates database correctly

### Integration Tests
- [ ] Email sends successfully via SendGrid
- [ ] Email delivery records created and updated
- [ ] Failed emails retry automatically
- [ ] Maximum retry limit respected
- [ ] Admin alerts sent after max retries
- [ ] Resend functionality works correctly

### Email Client Tests
- [ ] Gmail renders email correctly
- [ ] Outlook renders email correctly
- [ ] Apple Mail renders email correctly
- [ ] Mobile email clients display properly
- [ ] QR codes are scannable from email
- [ ] PDF attachment opens correctly

## Environment Variables

```bash
# SendGrid configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=tickets@stepperslife.com
SENDGRID_FROM_NAME="SteppersLife Events"

# Email tracking
EMAIL_TRACK_OPENS=true
EMAIL_TRACK_CLICKS=true

# Retry configuration
EMAIL_MAX_RETRIES=3
EMAIL_RETRY_DELAYS=60,300,900

# PDF generation
PDF_GENERATION_TIMEOUT=10000
```

## Dependencies

```json
{
  "dependencies": {
    "@sendgrid/mail": "^7.7.0",
    "@react-email/components": "^0.0.7",
    "@react-email/render": "^0.0.7",
    "bull": "^4.11.5"
  }
}
```

## Definition of Done

- [ ] Email service implemented with SendGrid
- [ ] React Email template created and styled
- [ ] Database schema for email tracking deployed
- [ ] QR codes embed correctly in emails
- [ ] PDF attachment generation working
- [ ] Retry logic implemented and tested
- [ ] Email tracking configured
- [ ] Unit tests achieve >90% coverage
- [ ] Integration tests with SendGrid pass
- [ ] Email client testing completed
- [ ] Performance meets <5 second send time
- [ ] Admin alerts configured
- [ ] Documentation completed
- [ ] Code review completed
- [ ] QA testing completed
- [ ] Deployed to staging and validated

## Related Stories

- **TIX-001**: QR Code Generation (provides QR data)
- **TIX-008**: Multiple Ticket Formats (PDF generation)
- **PAY-003**: Payment Confirmation (triggers email)
- **TIX-005**: Ticket Status Tracking (updates delivery status)

## Notes

- Test email deliverability across major providers
- Monitor bounce rates and spam reports
- Consider rate limiting for resend requests
- Plan for email template versioning
- Document GDPR compliance for email tracking
- Consider internationalization for multi-language support