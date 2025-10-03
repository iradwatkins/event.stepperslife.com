# Story: PAY-003 - Payment Confirmation Flow

**Epic**: EPIC-003 - Payment Processing Foundation
**Story Points**: 3
**Priority**: P0 (Critical)
**Status**: Not Started
**Dependencies**: PAY-001 (Square SDK), PAY-002 (Card Processing)

---

## Story

**As a** ticket buyer
**I want to** receive immediate confirmation when my payment succeeds
**So that** I know my purchase is complete and have proof of transaction

---

## Acceptance Criteria

1. GIVEN a payment is successfully processed
   WHEN Square confirms the payment
   THEN the system should:
   - Display success message immediately (<2 seconds)
   - Show order confirmation number
   - Display purchase summary with all details
   - Provide "Download Receipt" button
   - Show "View Tickets" navigation link
   - Send confirmation email within 30 seconds
   - Update order status to COMPLETED

2. GIVEN payment confirmation page is displayed
   WHEN customer views their confirmation
   THEN they should see:
   - Large success checkmark icon
   - Confirmation number prominently displayed
   - Event details (name, date, venue)
   - Ticket quantity and type
   - Price breakdown (subtotal, taxes, fees, total)
   - Payment method used (last 4 digits)
   - Order date/time
   - "What happens next" instructions
   - Customer support contact info

3. GIVEN a payment fails
   WHEN Square rejects the payment
   THEN the system should:
   - Display clear error message
   - Explain reason for failure (if provided)
   - Show "Try Again" button
   - Preserve form data (except CVV)
   - Suggest alternative payment methods
   - Provide customer support contact
   - Log failure reason for admin review
   - NOT create order or tickets

4. GIVEN payment is processing
   WHEN waiting for Square response
   THEN the customer should see:
   - Loading spinner with reassuring message
   - "Processing payment, please wait..."
   - Disabled form to prevent double-submission
   - No ability to navigate away with warning
   - Timeout after 30 seconds with error message

5. GIVEN confirmation email is sent
   WHEN payment completes
   THEN email should contain:
   - Order confirmation number
   - QR codes for each ticket
   - Event details and venue map link
   - Calendar invite attachment (.ics)
   - Receipt PDF attachment
   - "Add to Wallet" link (Apple/Google Wallet)
   - Organizer contact information
   - Customer service contact info

6. GIVEN customer wants to view confirmation later
   WHEN they navigate to order history
   THEN they should be able to:
   - See all past orders
   - View full order details
   - Download receipts anytime
   - Access tickets anytime
   - See refund status if applicable

---

## Tasks / Subtasks

- [ ] Create payment success page UI (AC: 1, 2)
  - [ ] File: `/app/events/[eventId]/purchase/success/page.tsx`
  - [ ] Design success page layout with checkmark
  - [ ] Display order confirmation number
   - [ ] Show complete purchase summary
  - [ ] Add "Download Receipt" button
  - [ ] Add "View My Tickets" link
  - [ ] Show next steps instructions

- [ ] Create payment failure page UI (AC: 3)
  - [ ] File: `/app/events/[eventId]/purchase/failed/page.tsx`
  - [ ] Design error page layout
  - [ ] Display clear error messages
  - [ ] Add "Try Again" button that preserves data
  - [ ] Show alternative payment options
  - [ ] Add support contact information

- [ ] Implement loading state during payment (AC: 4)
  - [ ] Show processing spinner
  - [ ] Display reassuring message
  - [ ] Disable form interactions
  - [ ] Add navigation warning
  - [ ] Implement 30-second timeout

- [ ] Build order confirmation email template (AC: 5)
  - [ ] Create HTML email template
  - [ ] Add text-only fallback
  - [ ] Include all order details
  - [ ] Embed QR codes as images
  - [ ] Attach calendar invite (.ics file)
  - [ ] Attach receipt PDF
  - [ ] Add "Add to Wallet" links

- [ ] Implement receipt generation (AC: 2, 5)
  - [ ] Create PDF receipt generator
  - [ ] Include all transaction details
  - [ ] Add QR codes to PDF
  - [ ] Generate downloadable link
  - [ ] Store receipt in database

- [ ] Create calendar invite generation (AC: 5)
  - [ ] Generate .ics file with event details
  - [ ] Include venue location
  - [ ] Set reminders (1 day before, 1 hour before)
  - [ ] Add organizer contact info

- [ ] Build order history page (AC: 6)
  - [ ] File: `/app/dashboard/orders/page.tsx`
  - [ ] List all user orders
  - [ ] Show order status badges
  - [ ] Add filter/search capabilities
  - [ ] Link to order details

- [ ] Create order details page (AC: 6)
  - [ ] File: `/app/dashboard/orders/[orderId]/page.tsx`
  - [ ] Display complete order information
  - [ ] Show payment details
  - [ ] List all tickets with QR codes
  - [ ] Add receipt download button
  - [ ] Show refund status if applicable

- [ ] Implement confirmation email sending (AC: 5)
  - [ ] Trigger email after payment success
  - [ ] Use email service (existing)
  - [ ] Attach generated files (PDF, ICS)
  - [ ] Handle email failures gracefully
  - [ ] Log email delivery status

- [ ] Add Apple Wallet / Google Pay integration (AC: 5)
  - [ ] Generate Apple Wallet pass (.pkpass)
  - [ ] Generate Google Pay pass
  - [ ] Add "Add to Wallet" buttons in email
  - [ ] Store wallet pass files

- [ ] Build receipt download endpoint (AC: 2, 6)
  - [ ] GET `/api/orders/[orderId]/receipt`
  - [ ] Generate PDF on-demand
  - [ ] Verify user authorization
  - [ ] Return PDF file

- [ ] Add comprehensive error handling (AC: 3, 4)
  - [ ] Handle network errors
  - [ ] Handle Square API errors
  - [ ] Handle timeout errors
  - [ ] Display user-friendly messages
  - [ ] Log errors for debugging

- [ ] Implement analytics tracking (AC: All)
  - [ ] Track successful purchases
  - [ ] Track payment failures with reasons
  - [ ] Track email open rates
  - [ ] Track receipt downloads
  - [ ] Track "Add to Wallet" usage

---

## Dev Notes

### Architecture References
- **Email Service**: `/lib/services/email.ts`
- **PDF Generation**: Use `pdf-lib` or `puppeteer`
- **Calendar**: Use `ics` library

### Source Tree
```
app/events/[eventId]/purchase/
  ├── success/page.tsx      # NEW: Success confirmation
  └── failed/page.tsx       # NEW: Failure page
app/dashboard/orders/
  ├── page.tsx              # NEW: Order history
  └── [orderId]/page.tsx    # NEW: Order details
lib/services/
  ├── receipt.service.ts    # NEW: PDF generation
  └── calendar.service.ts   # NEW: ICS generation
app/api/orders/[orderId]/
  └── receipt/route.ts      # NEW: Receipt download
```

### Technical Implementation

**Success Page Flow**:
```typescript
// After successful payment in purchase route:
1. Create order and tickets in database
2. Generate receipt PDF
3. Generate calendar invite
4. Send confirmation email (async)
5. Redirect to /events/[eventId]/purchase/success?orderId=xxx
6. Display success page with order details
```

**Failure Page Flow**:
```typescript
// After failed payment:
1. DO NOT create order or tickets
2. Log failure reason
3. Redirect to /events/[eventId]/purchase/failed?error=xxx
4. Display error with retry option
5. Preserve form state in session storage
```

**Receipt PDF Structure**:
```
- Header: "Receipt - Order #12345"
- Event information
- Ticket details with QR codes
- Price breakdown
- Payment method
- Order date/time
- Customer support contact
```

**Email Template Variables**:
```typescript
{
  buyerName, buyerEmail,
  orderNumber, eventName, eventDate, venue,
  tickets: [{ ticketNumber, type, price, qrCode }],
  subtotal, taxes, fees, total,
  receiptPdfUrl, calendarIcsUrl,
  addToWalletUrl, viewTicketsUrl
}
```

### Dependencies
- `pdf-lib`: PDF generation
- `ics`: Calendar file generation
- `qrcode`: QR code generation for PDFs
- `nodemailer`: Email sending (already installed)

---

## Testing

### User Acceptance Testing
- Complete purchase flow and verify confirmation
- Test all links and buttons on success page
- Verify email delivery and attachments
- Test receipt PDF download
- Test calendar invite import

### Error Testing
- Trigger payment failures (insufficient funds, etc.)
- Test network timeout handling
- Verify error messages are clear
- Test "Try Again" functionality

### Email Testing
- Test HTML and text versions
- Verify all attachments included
- Test QR code rendering
- Test mobile email display

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-09-29 | BMAD SM Agent | Initial story creation |

---

*Generated by BMAD SM Agent*