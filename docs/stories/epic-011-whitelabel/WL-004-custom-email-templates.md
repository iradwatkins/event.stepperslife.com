# WL-004: Custom Email Template Editor

**Epic:** EPIC-011: White-Label Features
**Story Points:** 3
**Priority:** Medium
**Status:** Not Started

---

## User Story

**As a** white-label client
**I want to** customize transactional email templates with my branding and messaging
**So that** all customer communications reflect my brand identity

### Acceptance Criteria

1. **Template Editor Interface**
   - [ ] List all available email templates
   - [ ] Visual WYSIWYG editor for each template
   - [ ] HTML/text dual editor mode
   - [ ] Live preview while editing
   - [ ] Mobile preview mode
   - [ ] Syntax highlighting for merge fields
   - [ ] Undo/redo functionality

2. **Available Email Templates**
   - [ ] Welcome email (registration confirmation)
   - [ ] Email verification
   - [ ] Password reset
   - [ ] Order confirmation
   - [ ] Ticket delivery
   - [ ] Event reminder (24 hours before)
   - [ ] Check-in confirmation
   - [ ] Refund notification
   - [ ] Event cancellation
   - [ ] Generic notification template

3. **Template Customization Options**
   - [ ] Header image/logo
   - [ ] Brand colors
   - [ ] Custom greeting message
   - [ ] Footer content (contact info, social links)
   - [ ] Email signature
   - [ ] Call-to-action button styling
   - [ ] Typography (fonts, sizes)

4. **Merge Fields & Variables**
   - [ ] User fields: {{user.name}}, {{user.email}}
   - [ ] Event fields: {{event.title}}, {{event.date}}, {{event.venue}}
   - [ ] Order fields: {{order.id}}, {{order.total}}, {{order.items}}
   - [ ] Ticket fields: {{ticket.qrCode}}, {{ticket.type}}
   - [ ] System fields: {{platform.name}}, {{platform.supportEmail}}
   - [ ] Conditional blocks (if/else)
   - [ ] Loop blocks (for ticket items)

5. **Testing & Preview**
   - [ ] Send test email to any address
   - [ ] Preview with sample data
   - [ ] Mobile device preview
   - [ ] Dark mode preview (email client support)
   - [ ] Spam score checker
   - [ ] Inbox placement testing

6. **Required Elements (Non-editable)**
   - [ ] Unsubscribe link (legally required)
   - [ ] Company name and address
   - [ ] "Why you received this email" text
   - [ ] Email preferences link
   - [ ] These appear in locked footer section

7. **Version Control**
   - [ ] Save drafts without publishing
   - [ ] Publish to make live
   - [ ] Version history (last 10 versions)
   - [ ] Revert to previous version
   - [ ] Compare versions side-by-side

---

## Technical Requirements

### Database Schema

```prisma
// prisma/schema.prisma

model EmailTemplate {
  id              String   @id @default(cuid())
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  templateKey     EmailTemplateKey @unique([tenantId, templateKey])
  name            String
  description     String?

  subject         String
  preheader       String?  // Preview text

  htmlContent     String   @db.Text
  textContent     String   @db.Text

  isPublished     Boolean  @default(false)
  version         Int      @default(1)

  // Styling
  headerImageUrl  String?
  primaryColor    String   @default("#3b82f6")
  buttonColor     String   @default("#3b82f6")
  fontFamily      String   @default("Arial, sans-serif")

  // Metadata
  lastTestedAt    DateTime?
  testRecipient   String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  publishedAt     DateTime?
  publishedBy     String?

  // Version history
  previousVersionId String?
  previousVersion   EmailTemplate? @relation("TemplateVersions", fields: [previousVersionId], references: [id])
  nextVersions      EmailTemplate[] @relation("TemplateVersions")

  @@index([tenantId, templateKey])
  @@index([tenantId, isPublished])
}

enum EmailTemplateKey {
  WELCOME
  EMAIL_VERIFICATION
  PASSWORD_RESET
  ORDER_CONFIRMATION
  TICKET_DELIVERY
  EVENT_REMINDER
  CHECKIN_CONFIRMATION
  REFUND_NOTIFICATION
  EVENT_CANCELLATION
  GENERIC_NOTIFICATION
}
```

### Email Template Engine

```typescript
// lib/services/email-template.service.ts

import Handlebars from 'handlebars';
import { render } from '@react-email/render';
import { EmailTemplate as ReactEmailTemplate } from '@/emails/base-template';

interface TemplateData {
  user?: {
    name: string;
    email: string;
    firstName?: string;
  };
  event?: {
    id: string;
    title: string;
    date: string;
    venue: string;
    address: string;
  };
  order?: {
    id: string;
    total: string;
    items: Array<{ name: string; quantity: number; price: string }>;
  };
  ticket?: {
    qrCode: string;
    type: string;
    number: string;
  };
  platform: {
    name: string;
    supportEmail: string;
    logo: string;
    website: string;
  };
  [key: string]: any;
}

class EmailTemplateService {
  // Register Handlebars helpers
  constructor() {
    this.registerHelpers();
  }

  private registerHelpers() {
    // Date formatting
    Handlebars.registerHelper('formatDate', (date: string, format: string) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    });

    // Currency formatting
    Handlebars.registerHelper('formatCurrency', (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    });

    // Conditional helpers
    Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });
  }

  async getTemplate(
    tenantId: string,
    templateKey: EmailTemplateKey
  ): Promise<EmailTemplate | null> {
    const template = await prisma.emailTemplate.findFirst({
      where: {
        tenantId,
        templateKey,
        isPublished: true,
      },
      orderBy: { version: 'desc' },
    });

    // Fallback to default platform template if none exists
    if (!template) {
      return this.getDefaultTemplate(templateKey);
    }

    return template;
  }

  async renderTemplate(
    tenantId: string,
    templateKey: EmailTemplateKey,
    data: TemplateData
  ): Promise<{ html: string; text: string; subject: string }> {
    const template = await this.getTemplate(tenantId, templateKey);

    if (!template) {
      throw new Error(`Template ${templateKey} not found`);
    }

    // Compile Handlebars templates
    const subjectTemplate = Handlebars.compile(template.subject);
    const htmlTemplate = Handlebars.compile(template.htmlContent);
    const textTemplate = Handlebars.compile(template.textContent);

    // Add required footer content
    const enrichedData = {
      ...data,
      _footer: this.generateFooter(tenantId),
    };

    // Render
    const html = htmlTemplate(enrichedData);
    const text = textTemplate(enrichedData);
    const subject = subjectTemplate(enrichedData);

    return { html, text, subject };
  }

  async saveTemplate(
    tenantId: string,
    templateKey: EmailTemplateKey,
    updates: Partial<EmailTemplate>
  ): Promise<EmailTemplate> {
    const currentTemplate = await this.getTemplate(tenantId, templateKey);

    // Archive current version if exists
    if (currentTemplate) {
      await prisma.emailTemplate.update({
        where: { id: currentTemplate.id },
        data: { isPublished: false },
      });
    }

    // Create new version
    const newTemplate = await prisma.emailTemplate.create({
      data: {
        tenantId,
        templateKey,
        ...updates,
        version: (currentTemplate?.version || 0) + 1,
        previousVersionId: currentTemplate?.id,
      },
    });

    return newTemplate;
  }

  async publishTemplate(templateId: string): Promise<void> {
    await prisma.emailTemplate.update({
      where: { id: templateId },
      data: {
        isPublished: true,
        publishedAt: new Date(),
      },
    });
  }

  async sendTestEmail(
    templateId: string,
    recipientEmail: string,
    sampleData: TemplateData
  ): Promise<void> {
    const template = await prisma.emailTemplate.findUnique({
      where: { id: templateId },
      include: { tenant: true },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    const rendered = await this.renderTemplate(
      template.tenantId,
      template.templateKey,
      sampleData
    );

    await emailService.send({
      to: recipientEmail,
      subject: `[TEST] ${rendered.subject}`,
      html: rendered.html,
      text: rendered.text,
    });

    await prisma.emailTemplate.update({
      where: { id: templateId },
      data: {
        lastTestedAt: new Date(),
        testRecipient: recipientEmail,
      },
    });
  }

  private generateFooter(tenantId: string): string {
    const tenant = getTenant(tenantId);

    return `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
        <p>You received this email because you have an account with ${tenant.name}.</p>
        <p>
          ${tenant.companyName}<br>
          ${tenant.address}<br>
          ${tenant.city}, ${tenant.state} ${tenant.zipCode}
        </p>
        <p>
          <a href="{{unsubscribeUrl}}" style="color: #6b7280;">Unsubscribe</a> |
          <a href="{{preferencesUrl}}" style="color: #6b7280;">Email Preferences</a>
        </p>
      </div>
    `;
  }

  private getDefaultTemplate(key: EmailTemplateKey): EmailTemplate {
    // Return default platform templates
    // These would be predefined in the system
    const defaults = {
      WELCOME: {
        subject: 'Welcome to {{platform.name}}!',
        htmlContent: '<html>...</html>',
        textContent: 'Welcome...',
      },
      // ... other defaults
    };

    return defaults[key];
  }
}

export default new EmailTemplateService();
```

### React Email Base Template

```tsx
// emails/base-template.tsx

import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Img,
  Heading,
  Text,
  Button,
  Hr,
} from '@react-email/components';

interface EmailTemplateProps {
  headerImage?: string;
  primaryColor?: string;
  buttonColor?: string;
  content: React.ReactNode;
  footerContent: string;
}

export function EmailTemplate({
  headerImage,
  primaryColor = '#3b82f6',
  buttonColor = '#3b82f6',
  content,
  footerContent,
}: EmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {headerImage && (
            <Section style={headerSection}>
              <Img src={headerImage} alt="Logo" style={logo} />
            </Section>
          )}

          <Section style={contentSection}>
            {content}
          </Section>

          <Hr style={hr} />

          <Section
            style={footerSection}
            dangerouslySetInnerHTML={{ __html: footerContent }}
          />
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const headerSection = {
  padding: '20px 30px',
};

const logo = {
  height: '50px',
  width: 'auto',
};

const contentSection = {
  padding: '0 30px 40px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footerSection = {
  padding: '0 30px',
  fontSize: '12px',
  color: '#8898aa',
};
```

---

## API Endpoints

### GET /api/admin/email-templates
Get all email templates for tenant

**Response:**
```json
{
  "templates": [
    {
      "id": "tpl_abc123",
      "templateKey": "ORDER_CONFIRMATION",
      "name": "Order Confirmation",
      "description": "Sent when customer completes purchase",
      "subject": "Your order #{{order.id}} is confirmed",
      "isPublished": true,
      "version": 3,
      "lastTestedAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-14T15:20:00Z"
    }
  ]
}
```

### GET /api/admin/email-templates/:key
Get specific template by key

### PATCH /api/admin/email-templates/:key
Update template (saves as draft)

**Request:**
```json
{
  "subject": "Your tickets for {{event.title}}",
  "htmlContent": "<html>...</html>",
  "textContent": "Plain text version...",
  "headerImageUrl": "https://cdn.example.com/header.png",
  "primaryColor": "#ff0000"
}
```

### POST /api/admin/email-templates/:key/publish
Publish current draft

### POST /api/admin/email-templates/:key/test
Send test email

**Request:**
```json
{
  "recipientEmail": "test@example.com",
  "sampleData": {
    "user": { "name": "John Doe", "email": "john@example.com" },
    "event": { "title": "Sample Event", "date": "2025-02-15" }
  }
}
```

### GET /api/admin/email-templates/:key/preview
Get rendered preview with sample data

### GET /api/admin/email-templates/:key/history
Get version history

---

## UI Components

### Email Template Editor

```tsx
// app/dashboard/settings/email-templates.tsx

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Eye, Save } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';

export default function EmailTemplateEditor() {
  const [selectedTemplate, setSelectedTemplate] = useState('ORDER_CONFIRMATION');
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [textContent, setTextContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const handleSave = async () => {
    await fetch(`/api/admin/email-templates/${selectedTemplate}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, htmlContent, textContent }),
    });
  };

  const handleSendTest = async () => {
    const email = prompt('Enter test email address:');
    if (!email) return;

    await fetch(`/api/admin/email-templates/${selectedTemplate}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientEmail: email,
        sampleData: getSampleData(selectedTemplate),
      }),
    });

    alert('Test email sent!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Email Templates</h2>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" onClick={handleSendTest}>
            <Send className="w-4 h-4 mr-2" />
            Send Test
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Template List */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Templates</h3>
          <div className="space-y-2">
            {EMAIL_TEMPLATES.map((template) => (
              <button
                key={template.key}
                className={`w-full text-left px-3 py-2 rounded ${
                  selectedTemplate === template.key
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedTemplate(template.key)}
              >
                {template.name}
              </button>
            ))}
          </div>
        </Card>

        {/* Editor */}
        <div className="lg:col-span-3">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Use {{variables}} for dynamic content"
                />
              </div>

              <Tabs defaultValue="html">
                <TabsList>
                  <TabsTrigger value="html">HTML</TabsTrigger>
                  <TabsTrigger value="text">Plain Text</TabsTrigger>
                  <TabsTrigger value="variables">Variables</TabsTrigger>
                </TabsList>

                <TabsContent value="html">
                  <CodeMirror
                    value={htmlContent}
                    height="500px"
                    extensions={[html()]}
                    onChange={(value) => setHtmlContent(value)}
                  />
                </TabsContent>

                <TabsContent value="text">
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    className="w-full h-[500px] px-3 py-2 border rounded font-mono text-sm"
                    placeholder="Plain text version for email clients that don't support HTML"
                  />
                </TabsContent>

                <TabsContent value="variables">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Available Variables</h4>
                    <VariableReference />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </Card>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <EmailPreviewModal
          template={selectedTemplate}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
```

---

## Testing Requirements

### Unit Tests
- Template rendering with merge fields
- Handlebars helpers
- Footer generation
- Variable substitution

### Integration Tests
- Full email sending flow
- Test email delivery
- Preview generation
- Version management

### Manual Tests
- Test in multiple email clients (Gmail, Outlook, Apple Mail)
- Mobile email rendering
- Dark mode support
- Spam filter testing

---

## Security Considerations

1. **Template Injection Prevention**
   - Sanitize all HTML input
   - Escape user-provided content
   - No JavaScript execution in emails

2. **Required Legal Elements**
   - Unsubscribe link (CAN-SPAM compliance)
   - Physical address
   - Non-editable footer section

3. **Access Control**
   - Only admins can edit templates
   - Version control for audit trail

---

## Dependencies

- **Handlebars**: Template engine
- **React Email**: Email component framework
- **CodeMirror**: Code editor
- **Email service**: SendGrid/Postmark/AWS SES

---

## Success Metrics

- Template customization rate > 60%
- Email delivery rate > 99%
- Open rate improvement after customization
- Zero spam complaints
- Customer satisfaction > 4.5/5

---

## Notes

- Consider WYSIWYG editor (e.g., GrapeJS) for non-technical users
- Add email A/B testing capability
- Implement email analytics (opens, clicks)
- Consider translation/localization support