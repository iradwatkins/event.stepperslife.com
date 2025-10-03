# MKT-001: Email Campaign Builder

**Epic:** EPIC-010: Marketing & Communications
**Story Points:** 8
**Priority:** High
**Status:** Ready for Development

---

## User Story

**As an** event organizer
**I want to** create and send professional email campaigns to my attendees
**So that** I can promote events, share updates, and engage with my audience effectively

---

## Acceptance Criteria

### Campaign Creation
- [ ] Organizer can create new email campaign from dashboard
- [ ] System provides drag-and-drop email editor for layout design
- [ ] Organizer can choose from pre-built email templates
- [ ] System supports custom HTML email import
- [ ] Organizer can preview email in desktop/mobile/tablet views
- [ ] System provides plain-text version auto-generation
- [ ] Organizer can save campaigns as drafts
- [ ] System validates email content before sending

### Email Editor Features
- [ ] Drag-and-drop components: text, images, buttons, dividers, spacers
- [ ] Rich text formatting: bold, italic, links, lists, headings
- [ ] Image upload and library management
- [ ] Button styling and CTA customization
- [ ] Merge tags for personalization (name, event details, custom fields)
- [ ] Conditional content blocks based on recipient segments
- [ ] Undo/redo functionality
- [ ] Mobile-responsive design by default

### Recipient Targeting
- [ ] Organizer can select recipient lists or segments
- [ ] System shows estimated recipient count before sending
- [ ] Organizer can exclude specific contacts or lists
- [ ] System supports filtering by: event attendance, purchase history, tags
- [ ] Organizer can send test emails to themselves or team members
- [ ] System prevents duplicate sends to same recipient
- [ ] Organizer can see recipient list preview

### Scheduling & Sending
- [ ] Organizer can send immediately or schedule for future date/time
- [ ] System supports timezone-aware scheduling
- [ ] Organizer can set send time optimization (best open time)
- [ ] System queues large campaigns for throttled sending
- [ ] Organizer receives confirmation before final send
- [ ] System shows sending progress and status
- [ ] Organizer can pause or cancel in-progress campaigns

### Templates & Branding
- [ ] System provides 15+ pre-built email templates
- [ ] Organizer can save custom templates for reuse
- [ ] Templates include: event announcements, reminders, thank you, updates
- [ ] Organizer can set organization branding (logo, colors, fonts)
- [ ] System applies consistent header/footer to all campaigns
- [ ] Templates are mobile-responsive and tested across email clients

### Campaign Analytics
- [ ] System tracks email opens and open rate
- [ ] System tracks link clicks and click-through rate
- [ ] System records bounces (hard and soft)
- [ ] System logs unsubscribes and spam complaints
- [ ] Organizer can view campaign performance dashboard
- [ ] System provides geographic and device analytics
- [ ] Organizer can export campaign reports to CSV

### Compliance & Deliverability
- [ ] System automatically includes unsubscribe link in every email
- [ ] System adds organization's physical address (CAN-SPAM requirement)
- [ ] System includes "why you received this" message
- [ ] System processes unsubscribe requests immediately
- [ ] System maintains suppression list for unsubscribed contacts
- [ ] System validates sender email domain has SPF/DKIM/DMARC
- [ ] System prevents sending to hard-bounced addresses
- [ ] System displays compliance checklist before sending

---

## Technical Requirements

### Email Service Provider Integration
```typescript
// Email Campaign Service
interface EmailCampaign {
  id: string;
  organizationId: string;
  name: string;
  subject: string;
  preheaderText?: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  htmlContent: string;
  plainTextContent: string;
  templateId?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
  scheduledAt?: Date;
  sentAt?: Date;
  recipientListIds: string[];
  recipientSegmentIds: string[];
  excludeListIds?: string[];
  totalRecipients: number;
  sentCount: number;
  openCount: number;
  clickCount: number;
  bounceCount: number;
  unsubscribeCount: number;
  spamComplaintCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Email Template
interface EmailTemplate {
  id: string;
  organizationId?: string; // null for system templates
  name: string;
  description?: string;
  category: 'announcement' | 'reminder' | 'thank-you' | 'update' | 'promotional' | 'custom';
  thumbnailUrl: string;
  htmlContent: string;
  editorJson: object; // Drag-drop editor structure
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Campaign Recipient
interface CampaignRecipient {
  id: string;
  campaignId: string;
  contactId: string;
  email: string;
  status: 'queued' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed' | 'spam';
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  firstClickedAt?: Date;
  bouncedAt?: Date;
  bounceReason?: string;
  unsubscribedAt?: Date;
  openCount: number;
  clickCount: number;
  userAgent?: string;
  ipAddress?: string;
}
```

### Email Editor Implementation
- **Technology:** React Email Builder or Unlayer Email Editor
- **Alternative:** GrapesJS with email plugin
- **Features:**
  - Component-based drag-and-drop interface
  - Real-time preview with responsive breakpoints
  - Template saving and loading
  - Merge tag insertion UI
  - Image upload with CDN storage
  - HTML/JSON export capabilities

### Email Sending Service
- **Primary Provider:** SendGrid (Transactional Email API)
- **Alternative:** Resend, AWS SES, Mailgun
- **Implementation:**
```typescript
// SendGrid Integration
import sgMail from '@sendgrid/mail';

export class EmailCampaignService {
  async sendCampaign(campaignId: string): Promise<void> {
    const campaign = await this.getCampaign(campaignId);
    const recipients = await this.getRecipients(campaign);

    // Queue for background processing
    await this.queueCampaignSend(campaign, recipients);
  }

  async processCampaignQueue(campaignId: string): Promise<void> {
    const batchSize = 1000; // SendGrid batch limit
    const recipients = await this.getQueuedRecipients(campaignId, batchSize);

    const personalizations = recipients.map(recipient => ({
      to: [{ email: recipient.email, name: recipient.name }],
      custom_args: {
        campaign_id: campaignId,
        recipient_id: recipient.id,
      },
      substitutions: this.buildMergeTags(recipient),
    }));

    const msg = {
      personalizations,
      from: { email: campaign.fromEmail, name: campaign.fromName },
      reply_to: { email: campaign.replyTo },
      subject: campaign.subject,
      html: campaign.htmlContent,
      text: campaign.plainTextContent,
      tracking_settings: {
        click_tracking: { enable: true },
        open_tracking: { enable: true },
      },
      custom_args: {
        campaign_id: campaignId,
      },
    };

    await sgMail.send(msg);
    await this.markRecipientsSent(recipients);
  }

  private buildMergeTags(recipient: Contact): Record<string, string> {
    return {
      first_name: recipient.firstName,
      last_name: recipient.lastName,
      email: recipient.email,
      // Add event-specific merge tags
      event_name: recipient.lastEventName,
      event_date: recipient.lastEventDate,
    };
  }
}
```

### Webhook Handler for Events
```typescript
// SendGrid Webhook Handler
export async function POST(request: Request) {
  const events = await request.json();

  for (const event of events) {
    const { event: eventType, email, campaign_id, recipient_id, timestamp } = event;

    switch (eventType) {
      case 'delivered':
        await updateRecipientStatus(recipient_id, 'delivered', new Date(timestamp * 1000));
        break;
      case 'open':
        await recordEmailOpen(recipient_id, event.useragent, event.ip);
        break;
      case 'click':
        await recordEmailClick(recipient_id, event.url);
        break;
      case 'bounce':
        await handleBounce(recipient_id, event.reason, event.type);
        break;
      case 'unsubscribe':
        await handleUnsubscribe(recipient_id);
        break;
      case 'spamreport':
        await handleSpamComplaint(recipient_id);
        break;
    }
  }

  return new Response('OK', { status: 200 });
}
```

### Compliance Implementation
```typescript
// CAN-SPAM Compliance
export class EmailComplianceService {
  validateCampaignCompliance(campaign: EmailCampaign): ValidationResult {
    const errors: string[] = [];

    // Must have unsubscribe link
    if (!campaign.htmlContent.includes('{{unsubscribe_link}}') &&
        !campaign.htmlContent.includes('unsubscribe')) {
      errors.push('Email must contain an unsubscribe link');
    }

    // Must have physical address
    if (!campaign.htmlContent.includes('{{organization_address}}')) {
      errors.push('Email must contain organization physical address');
    }

    // Subject line must not be deceptive
    if (this.isDeceptiveSubject(campaign.subject)) {
      errors.push('Subject line appears deceptive');
    }

    // From email must be valid and authenticated
    if (!this.verifyDomainAuthentication(campaign.fromEmail)) {
      errors.push('Sender domain must have SPF/DKIM/DMARC configured');
    }

    return { valid: errors.length === 0, errors };
  }

  async processUnsubscribe(email: string, campaignId: string): Promise<void> {
    // Add to suppression list immediately
    await this.addToSuppressionList(email);

    // Update contact preference
    await this.updateContactPreference(email, { emailOptIn: false });

    // Log unsubscribe event
    await this.logUnsubscribe(email, campaignId);
  }
}
```

---

## Database Schema

```prisma
model EmailCampaign {
  id                  String   @id @default(cuid())
  organizationId      String
  organization        Organization @relation(fields: [organizationId], references: [id])

  name                String
  subject             String
  preheaderText       String?
  fromName            String
  fromEmail           String
  replyTo             String?

  htmlContent         String   @db.Text
  plainTextContent    String   @db.Text
  templateId          String?
  template            EmailTemplate? @relation(fields: [templateId], references: [id])

  status              EmailCampaignStatus @default(DRAFT)
  scheduledAt         DateTime?
  sentAt              DateTime?

  totalRecipients     Int      @default(0)
  sentCount           Int      @default(0)
  deliveredCount      Int      @default(0)
  openCount           Int      @default(0)
  uniqueOpenCount     Int      @default(0)
  clickCount          Int      @default(0)
  uniqueClickCount    Int      @default(0)
  bounceCount         Int      @default(0)
  unsubscribeCount    Int      @default(0)
  spamComplaintCount  Int      @default(0)

  recipients          CampaignRecipient[]
  lists               CampaignList[]

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([organizationId])
  @@index([status])
}

model EmailTemplate {
  id              String   @id @default(cuid())
  organizationId  String?
  organization    Organization? @relation(fields: [organizationId], references: [id])

  name            String
  description     String?
  category        TemplateCategory
  thumbnailUrl    String
  htmlContent     String   @db.Text
  editorJson      Json
  isPublic        Boolean  @default(false)

  campaigns       EmailCampaign[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([organizationId])
  @@index([category])
}

model CampaignRecipient {
  id              String   @id @default(cuid())
  campaignId      String
  campaign        EmailCampaign @relation(fields: [campaignId], references: [id])
  contactId       String
  contact         Contact @relation(fields: [contactId], references: [id])

  email           String
  status          RecipientStatus @default(QUEUED)

  sentAt          DateTime?
  deliveredAt     DateTime?
  firstOpenedAt   DateTime?
  firstClickedAt  DateTime?
  bouncedAt       DateTime?
  bounceReason    String?
  unsubscribedAt  DateTime?

  openCount       Int      @default(0)
  clickCount      Int      @default(0)
  userAgent       String?
  ipAddress       String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([campaignId, contactId])
  @@index([campaignId])
  @@index([status])
}

model EmailSuppressionList {
  id              String   @id @default(cuid())
  email           String   @unique
  reason          SuppressionReason
  source          String? // campaign_id or 'manual'
  suppressedAt    DateTime @default(now())

  @@index([email])
}

enum EmailCampaignStatus {
  DRAFT
  SCHEDULED
  SENDING
  SENT
  PAUSED
  CANCELLED
}

enum RecipientStatus {
  QUEUED
  SENT
  DELIVERED
  OPENED
  CLICKED
  BOUNCED
  UNSUBSCRIBED
  SPAM
}

enum TemplateCategory {
  ANNOUNCEMENT
  REMINDER
  THANK_YOU
  UPDATE
  PROMOTIONAL
  CUSTOM
}

enum SuppressionReason {
  UNSUBSCRIBE
  BOUNCE
  SPAM_COMPLAINT
  MANUAL
}
```

---

## API Endpoints

### Campaign Management
```typescript
POST   /api/campaigns               // Create campaign
GET    /api/campaigns               // List campaigns
GET    /api/campaigns/:id           // Get campaign details
PUT    /api/campaigns/:id           // Update campaign
DELETE /api/campaigns/:id           // Delete campaign
POST   /api/campaigns/:id/duplicate // Duplicate campaign
POST   /api/campaigns/:id/send      // Send campaign
POST   /api/campaigns/:id/schedule  // Schedule campaign
POST   /api/campaigns/:id/test      // Send test email
POST   /api/campaigns/:id/pause     // Pause sending
GET    /api/campaigns/:id/analytics // Get campaign analytics

// Templates
GET    /api/campaigns/templates     // List templates
POST   /api/campaigns/templates     // Create template
GET    /api/campaigns/templates/:id // Get template
PUT    /api/campaigns/templates/:id // Update template
DELETE /api/campaigns/templates/:id // Delete template

// Webhooks
POST   /api/webhooks/sendgrid       // SendGrid event webhook
POST   /api/webhooks/resend         // Resend event webhook
```

---

## UI/UX Requirements

### Campaign Builder Interface
1. **Campaign List View**
   - Table with columns: Name, Subject, Status, Recipients, Open Rate, Sent Date
   - Filter by status, date range, template
   - Search by name or subject
   - Quick actions: Edit, Duplicate, View Analytics, Delete
   - "Create Campaign" primary CTA button

2. **Campaign Editor**
   - Three-step wizard: Design → Recipients → Review & Send
   - Left sidebar: Component palette (text, image, button, etc.)
   - Center canvas: Drag-and-drop email builder
   - Right sidebar: Component properties and settings
   - Top toolbar: Preview, Save Draft, Test Email, Schedule, Send
   - Bottom: Progress indicator, Back/Next navigation

3. **Recipient Selection**
   - List selector with checkboxes
   - Segment builder with filters
   - Exclude list selector
   - Recipient count estimate
   - Preview recipient list (first 10)
   - Test email recipients input

4. **Review & Send**
   - Email preview (desktop/mobile tabs)
   - Campaign summary: Recipients, Subject, From
   - Compliance checklist with green checks
   - Schedule selector or "Send Now" button
   - Final confirmation modal before sending

---

## Testing Requirements

### Unit Tests
- Email template rendering with merge tags
- Recipient list deduplication
- Bounce handling and suppression list updates
- Campaign status transitions
- Compliance validation logic

### Integration Tests
- SendGrid API integration (send, webhooks)
- Campaign creation and sending flow
- Template management CRUD operations
- Analytics data aggregation
- Unsubscribe workflow

### Email Client Testing
- Gmail (desktop, mobile)
- Outlook (desktop, web, mobile)
- Apple Mail (macOS, iOS)
- Yahoo Mail
- Mobile email clients (iOS Mail, Android Gmail)

---

## Third-Party Documentation

### SendGrid
- **API Docs:** https://docs.sendgrid.com/api-reference/mail-send/mail-send
- **Webhooks:** https://docs.sendgrid.com/for-developers/tracking-events/event
- **Best Practices:** https://docs.sendgrid.com/ui/sending-email/deliverability

### React Email
- **Docs:** https://react.email/docs/introduction
- **Components:** https://react.email/docs/components/html

### Unlayer Email Editor
- **Docs:** https://docs.unlayer.com/
- **React Integration:** https://github.com/unlayer/react-email-editor

---

## Deliverability Best Practices

1. **Domain Authentication**
   - Configure SPF record
   - Set up DKIM signing
   - Implement DMARC policy
   - Use dedicated sending domain

2. **Content Best Practices**
   - Avoid spam trigger words
   - Balance text-to-image ratio (60/40)
   - Include plain text version
   - Use descriptive subject lines
   - Keep email size under 102KB

3. **List Hygiene**
   - Remove hard bounces immediately
   - Monitor engagement metrics
   - Implement re-engagement campaigns
   - Maintain suppression list

4. **Sending Reputation**
   - Warm up new IP addresses gradually
   - Monitor sender score
   - Handle complaints promptly
   - Maintain low bounce rate (<5%)

---

## Dependencies
- **Blocks:** Contact list management (MKT-008)
- **Blocks:** Email service provider account setup
- **Integrates With:** Event management, analytics dashboard

---

## Notes
- Consider rate limits: SendGrid allows 100 emails/second on Pro plan
- Implement email preview testing service (Litmus/Email on Acid)
- Plan for A/B testing in future iteration
- Monitor deliverability metrics closely after launch
