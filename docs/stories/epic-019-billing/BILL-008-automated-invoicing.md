# BILL-008: Automated Invoicing

**Epic:** EPIC-019 - Platform Billing & Revenue
**Story Points:** 3
**Priority:** P2 (Medium)
**Status:** Ready for Development

## User Story

**As a** platform administrator and organizer
**I want** the system to automatically generate and send professional invoices
**So that** financial records are accurate, compliant, and easily accessible for accounting

## Acceptance Criteria

### Primary Criteria
- [ ] Automatic invoice generation for all billable transactions
- [ ] Professional PDF invoice generation with company branding
- [ ] Sequential invoice numbering system (INV-2025-001234)
- [ ] Email delivery of invoices to customers and organizers
- [ ] Invoice storage and download portal
- [ ] Tax calculation and display on invoices
- [ ] Payment status tracking (paid, pending, overdue)
- [ ] Support for both transaction invoices and subscription invoices

### Invoice Types
- [ ] **Transaction Invoice:** For ticket purchases (buyer receives)
- [ ] **Payout Invoice:** For organizer payouts (organizer receives)
- [ ] **Subscription Invoice:** For monthly subscription billing (subscriber receives)
- [ ] **Credit Note:** For refunds and adjustments

### Invoice Content
- [ ] Company information (SteppersLife branding)
- [ ] Invoice number and date
- [ ] Bill to / Ship to information
- [ ] Itemized line items with descriptions
- [ ] Subtotal, tax breakdown, total
- [ ] Payment method and status
- [ ] Payment terms and due date
- [ ] Tax IDs (when applicable)
- [ ] Footer with legal text and contact info

### Delivery & Storage
- [ ] Email invoice as PDF attachment
- [ ] Store in database with searchable metadata
- [ ] Download portal in user dashboard
- [ ] Bulk download option (CSV export)
- [ ] Archive old invoices (retain 7 years)

### Accounting Integration
- [ ] Export to QuickBooks Online
- [ ] Export to Xero
- [ ] Export to CSV for manual import
- [ ] GAAP-compliant invoice format

## Technical Specifications

### Invoice Service

**File:** `lib/services/invoice.service.ts`

```typescript
enum InvoiceType {
  TRANSACTION = 'TRANSACTION',
  PAYOUT = 'PAYOUT',
  SUBSCRIPTION = 'SUBSCRIPTION',
  CREDIT_NOTE = 'CREDIT_NOTE'
}

enum InvoiceStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  PAID = 'PAID',
  VOID = 'VOID',
  UNCOLLECTIBLE = 'UNCOLLECTIBLE'
}

interface Invoice {
  id: string
  invoiceNumber: string // INV-2025-001234
  invoiceType: InvoiceType
  status: InvoiceStatus

  // Parties
  billFrom: {
    name: string
    address: string
    city: string
    state: string
    zip: string
    taxId?: string // EIN
  }
  billTo: {
    name: string
    email: string
    address?: string
    taxId?: string
  }

  // Line items
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    amount: number
    taxable: boolean
  }>

  // Amounts
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  amountPaid: number
  amountDue: number

  // Dates
  invoiceDate: Date
  dueDate?: Date
  paidAt?: Date

  // References
  orderId?: string
  subscriptionId?: string
  payoutId?: string

  // PDFs
  pdfUrl: string
  pdfGenerated: boolean

  // Metadata
  notes?: string
  metadata: any
  createdAt: Date
  updatedAt: Date
}

class InvoiceService {
  /**
   * Generate invoice for transaction
   */
  async generateTransactionInvoice(
    order: Order
  ): Promise<Invoice>

  /**
   * Generate invoice for subscription
   */
  async generateSubscriptionInvoice(
    subscription: Subscription,
    billingPeriodStart: Date,
    billingPeriodEnd: Date
  ): Promise<Invoice>

  /**
   * Generate invoice for payout
   */
  async generatePayoutInvoice(
    payout: PayoutRequest,
    revenueTransactions: RevenueTransaction[]
  ): Promise<Invoice>

  /**
   * Generate credit note for refund
   */
  async generateCreditNote(
    originalInvoice: Invoice,
    refundAmount: number,
    reason: string
  ): Promise<Invoice>

  /**
   * Generate PDF for invoice
   */
  async generateInvoicePDF(
    invoice: Invoice
  ): Promise<Buffer>

  /**
   * Send invoice via email
   */
  async sendInvoiceEmail(
    invoice: Invoice,
    recipientEmail: string
  ): Promise<void>

  /**
   * Mark invoice as paid
   */
  async markInvoicePaid(
    invoiceId: string,
    paidAt: Date,
    paymentMethod: string
  ): Promise<Invoice>

  /**
   * Void invoice
   */
  async voidInvoice(
    invoiceId: string,
    reason: string
  ): Promise<Invoice>

  /**
   * Get invoice by number
   */
  async getInvoiceByNumber(
    invoiceNumber: string
  ): Promise<Invoice>

  /**
   * Export invoices to accounting system
   */
  async exportToQuickBooks(
    invoices: Invoice[]
  ): Promise<void>

  async exportToXero(
    invoices: Invoice[]
  ): Promise<void>

  async exportToCSV(
    startDate: Date,
    endDate: Date
  ): Promise<string>
}
```

### Database Schema

**Table:** `invoices`

```sql
CREATE TYPE invoice_type AS ENUM (
  'TRANSACTION', 'PAYOUT', 'SUBSCRIPTION', 'CREDIT_NOTE'
);

CREATE TYPE invoice_status AS ENUM (
  'DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE'
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_type invoice_type NOT NULL,
  status invoice_status NOT NULL DEFAULT 'OPEN',

  -- Bill from (SteppersLife)
  bill_from_name VARCHAR(255) NOT NULL DEFAULT 'SteppersLife Inc.',
  bill_from_address TEXT,
  bill_from_tax_id VARCHAR(50), -- EIN

  -- Bill to
  bill_to_name VARCHAR(255) NOT NULL,
  bill_to_email VARCHAR(255) NOT NULL,
  bill_to_address TEXT,
  bill_to_tax_id VARCHAR(50),

  -- Amounts
  subtotal DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,4) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  amount_due DECIMAL(10,2) NOT NULL,

  -- Line items (JSONB for flexibility)
  items JSONB NOT NULL,
  /*
  [
    {
      "description": "Pro Subscription - January 2025",
      "quantity": 1,
      "unitPrice": 50.00,
      "amount": 50.00,
      "taxable": true
    }
  ]
  */

  -- Dates
  invoice_date DATE NOT NULL,
  due_date DATE,
  paid_at TIMESTAMP,

  -- References
  order_id UUID REFERENCES orders(id),
  subscription_id UUID REFERENCES subscriptions(id),
  payout_id UUID REFERENCES payout_requests(id),
  credit_note_for_invoice_id UUID REFERENCES invoices(id),

  -- PDF
  pdf_url TEXT,
  pdf_generated BOOLEAN DEFAULT FALSE,

  -- Metadata
  notes TEXT,
  payment_method VARCHAR(100),
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT positive_amounts CHECK (
    subtotal >= 0 AND
    tax_amount >= 0 AND
    total >= 0 AND
    amount_paid >= 0 AND
    amount_due >= 0
  ),
  CONSTRAINT valid_total CHECK (total = subtotal + tax_amount)
);

CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_type ON invoices(invoice_type);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_order ON invoices(order_id);
CREATE INDEX idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX idx_invoices_payout ON invoices(payout_id);
```

**Table:** `invoice_number_sequence`

```sql
CREATE TABLE invoice_number_sequence (
  year INTEGER PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0
);

-- Function to generate next invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS VARCHAR(50) AS $$
DECLARE
  current_year INTEGER;
  next_number INTEGER;
  invoice_num VARCHAR(50);
BEGIN
  current_year := EXTRACT(YEAR FROM NOW());

  -- Get or create sequence for current year
  INSERT INTO invoice_number_sequence (year, last_number)
  VALUES (current_year, 1)
  ON CONFLICT (year) DO UPDATE
  SET last_number = invoice_number_sequence.last_number + 1
  RETURNING last_number INTO next_number;

  -- Format: INV-2025-001234
  invoice_num := 'INV-' || current_year || '-' || LPAD(next_number::TEXT, 6, '0');

  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;
```

### PDF Generation

**File:** `lib/utils/pdf-generator.ts`

```typescript
import puppeteer from 'puppeteer'
import Handlebars from 'handlebars'
import { readFileSync } from 'fs'
import { join } from 'path'

class PDFGenerator {
  private template: HandlebarsTemplateDelegate

  constructor() {
    const templatePath = join(__dirname, '../templates/invoice.hbs')
    const templateSource = readFileSync(templatePath, 'utf-8')
    this.template = Handlebars.compile(templateSource)
  }

  async generateInvoicePDF(invoice: Invoice): Promise<Buffer> {
    // Render HTML from template
    const html = this.template({
      invoice,
      currentYear: new Date().getFullYear(),
      formattedDate: format(invoice.invoiceDate, 'MMMM dd, yyyy')
    })

    // Launch headless browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    try {
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'networkidle0' })

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      })

      return pdfBuffer
    } finally {
      await browser.close()
    }
  }

  async uploadPDFToStorage(
    pdfBuffer: Buffer,
    invoiceNumber: string
  ): Promise<string> {
    // Upload to S3 or similar storage
    const key = `invoices/${invoiceNumber}.pdf`
    await s3.upload({
      Bucket: process.env.INVOICES_BUCKET,
      Key: key,
      Body: pdfBuffer,
      ContentType: 'application/pdf'
    })

    return `https://${process.env.INVOICES_BUCKET}.s3.amazonaws.com/${key}`
  }
}
```

### Invoice HTML Template

**File:** `lib/templates/invoice.hbs`

```handlebars
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice {{invoice.invoiceNumber}}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      font-size: 12pt;
      color: #333;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #000;
    }
    .company-info { text-align: left; }
    .invoice-info { text-align: right; }
    .logo { font-size: 24pt; font-weight: bold; color: #6B46C1; }
    .invoice-number { font-size: 18pt; font-weight: bold; }
    .billing-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th {
      background-color: #f0f0f0;
      padding: 10px;
      text-align: left;
      border-bottom: 2px solid #000;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #ddd;
    }
    .text-right { text-align: right; }
    .totals {
      float: right;
      width: 300px;
    }
    .totals table { margin-bottom: 0; }
    .totals td { border: none; padding: 5px 10px; }
    .total-row {
      font-weight: bold;
      font-size: 14pt;
      background-color: #f0f0f0;
    }
    .footer {
      clear: both;
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 10pt;
      color: #666;
    }
    .paid-stamp {
      color: green;
      font-size: 24pt;
      font-weight: bold;
      text-align: center;
      margin: 20px 0;
      padding: 10px;
      border: 3px solid green;
      display: inline-block;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <div class="logo">SteppersLife</div>
      <p>{{invoice.billFrom.address}}</p>
      <p>{{invoice.billFrom.city}}, {{invoice.billFrom.state}} {{invoice.billFrom.zip}}</p>
      {{#if invoice.billFrom.taxId}}
      <p>Tax ID: {{invoice.billFrom.taxId}}</p>
      {{/if}}
    </div>
    <div class="invoice-info">
      <div class="invoice-number">{{invoice.invoiceNumber}}</div>
      <p><strong>Date:</strong> {{formattedDate}}</p>
      {{#if invoice.dueDate}}
      <p><strong>Due Date:</strong> {{formatDate invoice.dueDate}}</p>
      {{/if}}
      <p><strong>Status:</strong> {{invoice.status}}</p>
    </div>
  </div>

  {{#if invoice.paidAt}}
  <div class="paid-stamp">PAID</div>
  {{/if}}

  <div class="billing-info">
    <div>
      <h3>Bill To:</h3>
      <p><strong>{{invoice.billTo.name}}</strong></p>
      <p>{{invoice.billTo.email}}</p>
      {{#if invoice.billTo.address}}
      <p>{{invoice.billTo.address}}</p>
      {{/if}}
      {{#if invoice.billTo.taxId}}
      <p>Tax ID: {{invoice.billTo.taxId}}</p>
      {{/if}}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="text-right">Quantity</th>
        <th class="text-right">Unit Price</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      {{#each invoice.items}}
      <tr>
        <td>{{this.description}}</td>
        <td class="text-right">{{this.quantity}}</td>
        <td class="text-right">${{formatMoney this.unitPrice}}</td>
        <td class="text-right">${{formatMoney this.amount}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>

  <div class="totals">
    <table>
      <tr>
        <td>Subtotal:</td>
        <td class="text-right">${{formatMoney invoice.subtotal}}</td>
      </tr>
      {{#if invoice.taxAmount}}
      <tr>
        <td>Tax ({{multiply invoice.taxRate 100}}%):</td>
        <td class="text-right">${{formatMoney invoice.taxAmount}}</td>
      </tr>
      {{/if}}
      <tr class="total-row">
        <td>Total:</td>
        <td class="text-right">${{formatMoney invoice.total}}</td>
      </tr>
      {{#if invoice.amountPaid}}
      <tr>
        <td>Amount Paid:</td>
        <td class="text-right">-${{formatMoney invoice.amountPaid}}</td>
      </tr>
      <tr class="total-row">
        <td>Amount Due:</td>
        <td class="text-right">${{formatMoney invoice.amountDue}}</td>
      </tr>
      {{/if}}
    </table>
  </div>

  {{#if invoice.notes}}
  <div style="clear: both; margin-top: 40px;">
    <h3>Notes:</h3>
    <p>{{invoice.notes}}</p>
  </div>
  {{/if}}

  <div class="footer">
    <p>Thank you for your business!</p>
    <p>SteppersLife Inc. | support@stepperslife.com | (555) 123-4567</p>
    <p>&copy; {{currentYear}} SteppersLife Inc. All rights reserved.</p>
  </div>
</body>
</html>
```

### API Endpoints

**POST /api/invoices/generate**
```typescript
// Generate invoice manually (admin only)
Request: {
  type: InvoiceType
  orderId?: string
  subscriptionId?: string
  payoutId?: string
}

Response: {
  invoice: Invoice
  pdfUrl: string
}
```

**GET /api/invoices/:id**
```typescript
// Get invoice by ID
Response: {
  invoice: Invoice
}
```

**GET /api/invoices/:id/pdf**
```typescript
// Download invoice PDF
Response: Binary PDF file
```

**GET /api/invoices**
```typescript
// List invoices (for user)
Query: {
  type?: InvoiceType
  status?: InvoiceStatus
  startDate?: string
  endDate?: string
  page: number
  limit: number
}

Response: {
  invoices: Invoice[]
  total: number
  page: number
  totalPages: number
}
```

**POST /api/invoices/:id/send**
```typescript
// Resend invoice email
Request: {
  recipientEmail?: string // Override recipient
}

Response: {
  success: boolean
  sentAt: string
}
```

**POST /api/invoices/export**
```typescript
// Export invoices to accounting system
Request: {
  format: 'quickbooks' | 'xero' | 'csv'
  startDate: string
  endDate: string
}

Response: {
  exportUrl: string
  recordCount: number
}
```

## Integration Points

### 1. Transaction Processing (PAY-005)
- Generate invoice immediately after successful order
- Send invoice email to buyer
- Store invoice reference in order record

### 2. Subscription Billing (BILL-002)
- Generate invoice monthly for subscriptions
- Send invoice email to subscriber
- Link invoice to subscription record

### 3. Payout Management (BILL-004)
- Generate payout statement/invoice for organizers
- Detail revenue transactions included in payout
- Send to organizer for records

### 4. Email Service
- Send invoice PDF as attachment
- Professional email template
- Retry logic for failed sends

### 5. Storage (S3/Cloud Storage)
- Upload generated PDFs
- Secure access with signed URLs
- Retain for 7 years minimum

## Business Rules

### Invoice Numbering
- **Format:** INV-{YEAR}-{SEQUENCE}
- **Example:** INV-2025-001234
- **Sequence:** Resets each year, starts at 000001
- **Uniqueness:** Globally unique across all invoice types

### Invoice Generation Timing
- **Transaction:** Immediately after payment success
- **Subscription:** On subscription renewal date
- **Payout:** When payout is initiated
- **Credit Note:** When refund is processed

### Invoice Status Lifecycle
1. **DRAFT:** Invoice created but not finalized
2. **OPEN:** Invoice finalized and sent, awaiting payment
3. **PAID:** Payment received, invoice closed
4. **VOID:** Invoice canceled (never paid)
5. **UNCOLLECTIBLE:** Unable to collect (write-off)

### Tax Display
- Show tax rate and tax amount separately
- Display "Tax Exempt" if no tax applied
- Include tax jurisdiction if required by law

### Retention Policy
- Store all invoices for 7 years minimum (IRS requirement)
- Archive old invoices to cold storage after 2 years
- Never delete invoice records (GAAP compliance)

## Testing Requirements

### Unit Tests
- Invoice number generation uniqueness
- PDF generation output validity
- Tax calculation accuracy
- Total calculation correctness

### Integration Tests
- End-to-end invoice generation and email
- PDF upload to storage
- QuickBooks/Xero export format
- Invoice retrieval by number

### Compliance Tests
- GAAP-compliant invoice format
- Sequential numbering validation
- Tax display requirements
- Retention policy enforcement

## Performance Requirements

- Invoice generation: < 2 seconds
- PDF generation: < 5 seconds
- Email delivery: < 10 seconds
- Invoice list query: < 1 second
- Bulk export: < 30 seconds for 1,000 invoices

## Security Considerations

- Restrict invoice access to owner and admins
- Use signed URLs for PDF downloads (expiring links)
- Encrypt invoice data at rest
- Audit log all invoice access
- Prevent invoice number tampering

## Monitoring & Alerts

### Real-Time Alerts
- Invoice generation failure
- PDF generation failure
- Email delivery failure
- Invoice number sequence gap detected

### Daily Reports
- Invoices generated today
- Failed invoice generation attempts
- Unpaid invoices > 30 days old

## Documentation Requirements

- [ ] Invoice template customization guide
- [ ] Accounting export format documentation
- [ ] API documentation for invoice endpoints
- [ ] User guide for accessing invoices

## Dependencies

- PAY-005: Order and Receipt Management
- BILL-002: White-Label Subscription Billing
- BILL-004: Organizer Payout Management
- Puppeteer (for PDF generation)
- S3 or cloud storage for PDF storage
- Email service (SendGrid/AWS SES)

## Definition of Done

- [ ] Invoice service implemented
- [ ] Database schema created
- [ ] Invoice numbering system operational
- [ ] PDF generation working with template
- [ ] Email delivery configured
- [ ] Storage integration complete
- [ ] All API endpoints deployed
- [ ] QuickBooks/Xero export working
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Monitoring configured
- [ ] Documentation published

## Notes

**PDF Generation:** Puppeteer is resource-intensive. Consider using a dedicated service (DocRaptor, PDFShift) for production at scale.

**Invoice Template:** Make template customizable for white-label clients (future enhancement).

**Compliance:** Consult with accountant to ensure invoice format meets all legal requirements for your jurisdiction.

**Storage:** Use S3 Glacier for long-term archival (7+ years) to reduce storage costs.

**Email:** Include "View Invoice Online" link in email as backup if PDF attachment fails to deliver.