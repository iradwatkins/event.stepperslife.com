# Story: PAY-004 - Order Summary and Receipt

**Epic**: EPIC-003 - Payment Processing Foundation
**Story Points**: 2
**Priority**: P0 (Critical)
**Status**: Not Started
**Dependencies**: PAY-002 (Card Processing), PAY-003 (Confirmation)

---

## Story

**As a** ticket buyer
**I want to** receive a detailed receipt and order summary
**So that** I have documentation for my records and can expense the purchase

---

## Acceptance Criteria

1. GIVEN an order is completed
   WHEN customer views their receipt
   THEN it should display:
   - Business header (SteppersLife Events Platform)
   - Receipt number (same as order number)
   - Issue date and time
   - Customer information (name, email)
   - Event details (name, date, venue, address)
   - Itemized ticket breakdown
   - Subtotal, taxes, fees breakdown
   - Total amount paid
   - Payment method (last 4 digits)
   - Transaction ID
   - Refund/cancellation policy
   - Customer support contact

2. GIVEN receipt needs to be downloaded
   WHEN customer clicks "Download Receipt"
   THEN system should:
   - Generate professional PDF receipt
   - Include all order details
   - Add QR codes for tickets
   - Format for standard 8.5x11" printing
   - Include company logo and branding
   - Return PDF file for download
   - Log download for analytics

3. GIVEN receipt is sent via email
   WHEN confirmation email is sent
   THEN receipt should be:
   - Attached as PDF file
   - Named descriptively (receipt-ORDER123.pdf)
   - Professional and printable
   - Under 2MB file size
   - Compatible with all PDF readers

4. GIVEN organizer needs revenue documentation
   WHEN they view order details
   THEN they should see:
   - All order information
   - Payment status
   - Settlement status (when funds are available)
   - Net payout amount (after platform fees)
   - Tax collected
   - Processing fees
   - Refund history if applicable

5. GIVEN order needs to be reviewed
   WHEN accessing order summary page
   THEN user should be able to:
   - View complete order details
   - See all purchased tickets
   - Access ticket QR codes
   - Download receipt anytime
   - View refund status
   - Contact customer support about order

6. GIVEN business needs accounting records
   WHEN generating financial reports
   THEN receipts should:
   - Contain all required tax information
   - Include unique transaction identifiers
   - Show payment processor details
   - Be stored for 7 years minimum
   - Be searchable by order number
   - Support bulk export

---

## Tasks / Subtasks

- [ ] Design receipt PDF template (AC: 1, 2)
  - [ ] Create professional PDF layout
  - [ ] Add company branding elements
  - [ ] Design itemized breakdown section
  - [ ] Add footer with policies
  - [ ] Ensure print-friendly formatting

- [ ] Implement PDF generation service (AC: 2, 3)
  - [ ] File: `/lib/services/receipt.service.ts`
  - [ ] Install PDF generation library (pdf-lib)
  - [ ] Create generateReceipt() method
  - [ ] Add QR code embedding
  - [ ] Implement template rendering

- [ ] Build receipt download endpoint (AC: 2)
  - [ ] GET `/api/orders/[orderId]/receipt/download`
  - [ ] Verify user authorization
  - [ ] Generate PDF on-demand
  - [ ] Set proper content-type headers
  - [ ] Return PDF stream

- [ ] Create order summary page UI (AC: 5)
  - [ ] File: `/app/dashboard/orders/[orderId]/page.tsx`
  - [ ] Display all order details
  - [ ] Show ticket information
  - [ ] Add download receipt button
  - [ ] Show refund status
  - [ ] Add support contact link

- [ ] Implement receipt storage (AC: 6)
  - [ ] Store receipt URLs in database
  - [ ] Add Receipt model if needed
  - [ ] Implement file storage (S3 or local)
  - [ ] Add receipt metadata tracking
  - [ ] Ensure 7-year retention

- [ ] Add organizer payout summary view (AC: 4)
  - [ ] Show net payout calculation
  - [ ] Display platform fees
  - [ ] Show tax collected
  - [ ] Add settlement timeline
  - [ ] Link to payout records

- [ ] Build receipt email attachment (AC: 3)
  - [ ] Generate PDF before sending email
  - [ ] Attach to confirmation email
  - [ ] Use descriptive filename
  - [ ] Optimize file size
  - [ ] Test email delivery with attachment

- [ ] Create receipt data model (AC: 1, 6)
  - [ ] Add receipt fields to Order model
  - [ ] Store receipt generation timestamp
  - [ ] Track receipt downloads
  - [ ] Add receipt URL field

- [ ] Implement receipt branding (AC: 2)
  - [ ] Add SteppersLife logo
  - [ ] Use brand colors
  - [ ] Include company address
  - [ ] Add tax ID if applicable
  - [ ] Professional typography

- [ ] Add accounting export features (AC: 6)
  - [ ] Export orders to CSV
  - [ ] Export orders to QuickBooks format
  - [ ] Bulk receipt download (ZIP)
  - [ ] Filter by date range
  - [ ] Include all financial details

- [ ] Build order search functionality (AC: 6)
  - [ ] Search by order number
  - [ ] Search by customer email
  - [ ] Search by date range
  - [ ] Search by event
  - [ ] Filter by status

- [ ] Add receipt versioning (AC: 6)
  - [ ] Track receipt regeneration
  - [ ] Maintain original receipt
  - [ ] Log any modifications
  - [ ] Audit trail for changes

---

## Dev Notes

### Architecture References
- **Order Model**: `/prisma/schema.prisma`
- **Email Service**: `/lib/services/email.ts`
- **File Storage**: Configure S3 or local storage

### Source Tree
```
lib/services/
  └── receipt.service.ts       # NEW: Receipt generation
app/api/orders/[orderId]/
  └── receipt/
      └── download/route.ts    # NEW: Receipt download
app/dashboard/orders/
  └── [orderId]/page.tsx       # MODIFY: Add receipt features
public/receipts/               # NEW: Store generated PDFs (or use S3)
```

### Receipt PDF Template Structure

```typescript
// Receipt Layout
{
  header: {
    companyName: "SteppersLife Events Platform",
    logo: "/images/logo.png",
    address: "123 Event St, Austin, TX 78701",
    taxId: "XX-XXXXXXX"
  },
  receiptInfo: {
    receiptNumber: "RCT-12345",
    orderNumber: "ORD-12345",
    issueDate: "2025-09-29 14:30 CST",
    paymentMethod: "Visa •••• 4242"
  },
  customer: {
    name: "John Doe",
    email: "john@example.com"
  },
  event: {
    name: "Summer Music Festival",
    date: "July 15, 2025 at 7:00 PM",
    venue: "Austin Convention Center",
    address: "500 E Cesar Chavez St, Austin, TX 78701"
  },
  items: [
    { description: "General Admission", qty: 2, price: 50.00, total: 100.00 },
    { description: "VIP Pass", qty: 1, price: 150.00, total: 150.00 }
  ],
  breakdown: {
    subtotal: 250.00,
    tax: 20.63,
    platformFee: 0.75,
    processingFee: 8.40,
    total: 279.78
  },
  tickets: [
    { ticketNumber: "TKT-001", type: "GA", qrCode: "<QR>" },
    { ticketNumber: "TKT-002", type: "GA", qrCode: "<QR>" },
    { ticketNumber: "TKT-003", type: "VIP", qrCode: "<QR>" }
  ],
  footer: {
    refundPolicy: "Refunds available up to 24 hours before event",
    support: "support@events.stepperslife.com | (555) 123-4567",
    thankYou: "Thank you for your purchase!"
  }
}
```

### PDF Generation Libraries

**Option 1: pdf-lib** (Recommended)
- Lightweight and fast
- Good for template-based generation
- Easy embedding of QR codes

**Option 2: Puppeteer**
- Generate from HTML template
- More flexible styling
- Heavier dependency

**Option 3: PDFKit**
- Programmatic PDF creation
- Full control over layout
- More code required

### File Storage Strategy

**Development**: Local file system
- Store in `/public/receipts/`
- Access via `/receipts/[filename].pdf`

**Production**: AWS S3
- Store in S3 bucket
- Generate signed URLs for downloads
- Automatic 7-year retention policy
- Backup and versioning enabled

### Accounting Integration

Receipts should be compatible with:
- QuickBooks Online
- Xero
- FreshBooks
- Excel/CSV imports

Export format should include:
- Transaction date
- Customer name
- Order number
- Line items with categories
- Tax amounts
- Payment method
- Transaction fees

---

## Testing

### Receipt Generation Testing
- Generate receipts for various order types
- Test QR code embedding
- Verify all data appears correctly
- Test PDF rendering across devices
- Validate file size (<2MB)

### Download Testing
- Test authorized access only
- Verify PDF downloads correctly
- Test filename generation
- Test concurrent downloads

### Email Attachment Testing
- Verify PDF attaches to emails
- Test file size limits
- Test delivery to various email providers
- Verify attachment opens correctly

### Accounting Export Testing
- Export 100+ orders to CSV
- Verify data integrity
- Test QuickBooks format
- Validate totals and calculations

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-09-29 | BMAD SM Agent | Initial story creation |

---

*Generated by BMAD SM Agent*