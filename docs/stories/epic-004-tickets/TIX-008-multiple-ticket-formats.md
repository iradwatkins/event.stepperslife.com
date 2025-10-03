# TIX-008: Multiple Ticket Formats

**Epic**: EPIC-004 - Digital Ticket System
**Story Points**: 3
**Priority**: Medium
**Status**: Ready for Development

## User Story

**As an** attendee
**I want** to access my tickets in multiple formats (email, PDF, Apple Wallet, Google Pay)
**So that** I can choose the format that works best for me and my device

## Business Value

- Improves user experience with format flexibility
- Reduces support requests for "can't access ticket"
- Apple Wallet/Google Pay integration increases convenience
- PDF format supports printing for attendees who prefer physical tickets
- Differentiation from competitors with premium features

## Acceptance Criteria

### AC1: PDF Ticket Generation
**Given** an attendee has purchased tickets
**When** they request a PDF ticket
**Then** the system must generate a PDF including:
- Event name, date, time, and venue (prominently displayed)
- QR code at scannable size (minimum 1.5" / 4cm)
- Ticket holder name and email
- Ticket tier (VIP, General, etc.)
- Order number and ticket ID
- Purchase date and price paid
- Terms and conditions (small print)
- Company logo and branding
- "Present this ticket at event entrance" instructions

**And** PDF must be print-friendly (8.5x11" or A4 format)
**And** QR code must be high resolution (300 DPI minimum)
**And** generate in < 3 seconds per ticket
**And** file size < 1MB per ticket

### AC2: Apple Wallet Pass Generation
**Given** an attendee uses an iOS device
**When** they request Apple Wallet pass
**Then** the system must generate a .pkpass file including:
- Event name as card title
- Event date and time (auto-adds to calendar)
- Venue name and address (with map link)
- QR code as primary barcode (PDF417 format)
- Ticket holder name
- Ticket tier as auxiliary field
- Order number as back field
- Relevant fields (date, location, seat)
- Background image with event branding
- Logo and icon images
- Auto-update capability for status changes

**And** pass must be signed with Apple certificate
**And** follow Apple Wallet design guidelines
**And** support location-based notifications (at venue)
**And** update if ticket status changes (refunded, etc.)

### AC3: Google Wallet Pass Generation
**Given** an attendee uses an Android device
**When** they request Google Wallet pass
**Then** the system must generate a Google Wallet pass including:
- Event name as card title
- Event date and time with calendar integration
- Venue name with Google Maps integration
- QR code as barcode (QR_CODE format)
- Ticket holder name
- Ticket tier information
- Order details
- Event image/logo
- Brand colors and styling
- Auto-update capability

**And** pass must use Google Wallet API
**And** follow Google Wallet design guidelines
**And** support location-based reminders
**And** update in real-time on status changes

### AC4: Format Selection Interface
**Given** attendees have multiple format options
**When** viewing their tickets
**Then** the interface must provide:
- Clear buttons/links for each format
- Format descriptions and device compatibility info
- Icons for each format (PDF, Apple, Google)
- One-click download/add for each format
- Preview option before downloading
- Multiple downloads allowed (no limit)
- Format recommendations based on device detection

**And** all formats available immediately after purchase
**And** work on mobile and desktop browsers
**And** no authentication required after initial login

### AC5: Format Consistency & Synchronization
**Given** same ticket available in multiple formats
**When** ticket status changes
**Then** all formats must:
- Show identical QR codes (same data)
- Reflect current ticket status
- Update wallet passes automatically
- Include latest ticket information
- Maintain consistent branding
- Display same event details

**And** wallet passes push updates within 5 minutes of status change
**And** PDFs reflect current status when regenerated
**And** all formats validate to same ticket in check-in system

### AC6: Cross-Platform Compatibility
**Given** attendees use various devices
**When** accessing ticket formats
**Then** the system must support:
- iOS Safari (Apple Wallet)
- Chrome Android (Google Wallet)
- Desktop browsers (PDF download)
- Mobile browsers (all formats)
- Email clients (inline display + attachments)
- Graceful fallback if wallet not supported

**And** detect device/browser automatically
**And** recommend best format for user's device
**And** provide clear instructions for each format

### AC7: Branding & Customization
**Given** each event may have unique branding
**When** generating tickets
**Then** the system must support:
- Custom background images per event
- Event-specific color schemes
- Organizer logo placement
- Event poster/image inclusion
- Custom fields (seat, section, etc.)
- Terms and conditions per event
- Sponsor logos (optional)

**And** maintain consistent layout across formats
**And** ensure text remains readable on all backgrounds
**And** support high-resolution images

### AC8: Accessibility & Printing
**Given** some attendees may print tickets
**When** generating PDF format
**Then** the system must ensure:
- Black and white printing works (QR code still scannable)
- Text readable when printed
- QR code size sufficient for scanning
- Clear fold lines if wallet-size
- Standard paper sizes supported (Letter, A4)
- Print-friendly layout (no dark backgrounds)
- High contrast for visibility

**And** provide printing instructions
**And** test QR scannability from printed copies
**And** support multiple tickets per page option

## Technical Specifications

### PDF Generation

**Option 1: PDFKit (Node.js)**
```typescript
// lib/services/ticket-pdf.service.ts

import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

interface TicketPDFParams {
  ticketId: string;
  orderNumber: string;
  attendeeName: string;
  attendeeEmail: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  tier: string;
  price: number;
  qrCodeBase64: string;
}

export async function generateTicketPDF(params: TicketPDFParams): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header - Company Logo
    doc.image('public/images/logo.png', 50, 45, { width: 100 });

    // Title
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text('EVENT TICKET', 200, 50);

    doc.moveDown();

    // Event Details Section
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .text(params.eventName, { align: 'center' });

    doc.fontSize(12)
       .font('Helvetica')
       .text(`${params.eventDate} at ${params.eventTime}`, { align: 'center' })
       .text(params.venue, { align: 'center' });

    doc.moveDown(2);

    // QR Code (centered, large)
    const qrImage = Buffer.from(params.qrCodeBase64, 'base64');
    const qrSize = 200;
    const centerX = (doc.page.width - qrSize) / 2;
    doc.image(qrImage, centerX, doc.y, { width: qrSize, height: qrSize });

    doc.moveDown(12);

    // Ticket Information
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Ticket Holder:', 50, doc.y)
       .font('Helvetica')
       .text(params.attendeeName, 150, doc.y);

    doc.moveDown(0.5);

    doc.font('Helvetica-Bold')
       .text('Email:', 50, doc.y)
       .font('Helvetica')
       .text(params.attendeeEmail, 150, doc.y);

    doc.moveDown(0.5);

    doc.font('Helvetica-Bold')
       .text('Ticket Tier:', 50, doc.y)
       .font('Helvetica')
       .text(params.tier, 150, doc.y);

    doc.moveDown(0.5);

    doc.font('Helvetica-Bold')
       .text('Order Number:', 50, doc.y)
       .font('Helvetica')
       .text(params.orderNumber, 150, doc.y);

    doc.moveDown(0.5);

    doc.font('Helvetica-Bold')
       .text('Ticket ID:', 50, doc.y)
       .font('Helvetica')
       .text(params.ticketId, 150, doc.y);

    doc.moveDown(0.5);

    doc.font('Helvetica-Bold')
       .text('Price Paid:', 50, doc.y)
       .font('Helvetica')
       .text(`$${params.price.toFixed(2)}`, 150, doc.y);

    doc.moveDown(2);

    // Instructions
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('ENTRANCE INSTRUCTIONS:', 50, doc.y);

    doc.fontSize(9)
       .font('Helvetica')
       .text('1. Present this QR code at the event entrance', 50, doc.y + 15)
       .text('2. QR code can be scanned from screen or printed copy', 50, doc.y + 10)
       .text('3. Arrive early to avoid long lines', 50, doc.y + 10)
       .text('4. Bring valid ID for verification', 50, doc.y + 10);

    doc.moveDown(2);

    // Footer - Terms
    doc.fontSize(7)
       .font('Helvetica')
       .text('Terms & Conditions: Ticket is non-transferable and non-refundable except as required by law. ' +
             'Entry subject to event terms and conditions. Management reserves the right to refuse admission.',
             50, 700, { width: 500, align: 'justify' });

    doc.end();
  });
}
```

**Option 2: Puppeteer (HTML to PDF)**
```typescript
// Alternative: Generate from HTML template
import puppeteer from 'puppeteer';

export async function generateTicketPDFFromHTML(params: TicketPDFParams): Promise<Buffer> {
  const html = renderTicketHTML(params); // React/template rendering

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setContent(html);
  const pdf = await page.pdf({
    format: 'Letter',
    printBackground: true,
    margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' }
  });

  await browser.close();
  return pdf;
}
```

### Apple Wallet Pass Generation

```typescript
// lib/services/apple-wallet.service.ts

import { PKPass } from 'passkit-generator';
import fs from 'fs';
import path from 'path';

interface AppleWalletPassParams {
  ticketId: string;
  orderNumber: string;
  attendeeName: string;
  eventName: string;
  eventDate: Date;
  venue: string;
  venueAddress: string;
  tier: string;
  qrData: string;
  eventImageUrl: string;
}

export async function generateAppleWalletPass(params: AppleWalletPassParams): Promise<Buffer> {
  // Load pass template
  const passTemplate = path.join(process.cwd(), 'templates/wallet/event.pass');

  // Create pass
  const pass = await PKPass.from({
    model: passTemplate,
    certificates: {
      wwdr: fs.readFileSync(process.env.APPLE_WWDR_CERT_PATH!),
      signerCert: fs.readFileSync(process.env.APPLE_SIGNER_CERT_PATH!),
      signerKey: fs.readFileSync(process.env.APPLE_SIGNER_KEY_PATH!),
      signerKeyPassphrase: process.env.APPLE_KEY_PASSPHRASE
    }
  });

  // Set pass data
  pass.type = 'eventTicket';
  pass.serialNumber = params.ticketId;
  pass.organizationName = 'SteppersLife Events';
  pass.description = `Ticket for ${params.eventName}`;

  // Primary fields (front of card)
  pass.primaryFields = [
    {
      key: 'event',
      label: 'EVENT',
      value: params.eventName
    }
  ];

  // Secondary fields
  pass.secondaryFields = [
    {
      key: 'date',
      label: 'DATE',
      value: params.eventDate.toLocaleDateString(),
      dateStyle: 'PKDateStyleMedium',
      timeStyle: 'PKDateStyleShort'
    },
    {
      key: 'venue',
      label: 'VENUE',
      value: params.venue
    }
  ];

  // Auxiliary fields
  pass.auxiliaryFields = [
    {
      key: 'tier',
      label: 'TIER',
      value: params.tier
    },
    {
      key: 'holder',
      label: 'TICKET HOLDER',
      value: params.attendeeName
    }
  ];

  // Back fields
  pass.backFields = [
    {
      key: 'order',
      label: 'Order Number',
      value: params.orderNumber
    },
    {
      key: 'ticketId',
      label: 'Ticket ID',
      value: params.ticketId
    },
    {
      key: 'terms',
      label: 'Terms & Conditions',
      value: 'This ticket is non-transferable. Entry subject to event terms.'
    }
  ];

  // Barcode (QR code)
  pass.barcodes = [
    {
      format: 'PKBarcodeFormatQR',
      message: params.qrData,
      messageEncoding: 'iso-8859-1'
    }
  ];

  // Location-based notification
  pass.locations = [
    {
      latitude: 37.7749, // Venue coordinates
      longitude: -122.4194,
      relevantText: `Welcome to ${params.eventName}!`
    }
  ];

  // Relevant date (show on lock screen)
  pass.relevantDate = params.eventDate.toISOString();

  // Colors
  pass.backgroundColor = 'rgb(0, 0, 0)';
  pass.foregroundColor = 'rgb(255, 255, 255)';
  pass.labelColor = 'rgb(180, 180, 180)';

  // Add images
  pass.addBuffer('icon.png', await downloadImage(params.eventImageUrl));
  pass.addBuffer('logo.png', fs.readFileSync('public/images/logo.png'));

  // Generate pass
  return await pass.getAsBuffer();
}
```

### Google Wallet Pass Generation

```typescript
// lib/services/google-wallet.service.ts

import { GoogleAuth } from 'google-auth-library';
import jwt from 'jsonwebtoken';

interface GoogleWalletPassParams {
  ticketId: string;
  orderNumber: string;
  attendeeName: string;
  eventName: string;
  eventDate: Date;
  venue: string;
  tier: string;
  qrData: string;
}

export async function generateGoogleWalletPass(params: GoogleWalletPassParams): Promise<string> {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID!;
  const classId = `${issuerId}.event_ticket_class`;
  const objectId = `${issuerId}.${params.ticketId}`;

  // Define event ticket class
  const eventTicketClass = {
    id: classId,
    issuerName: 'SteppersLife Events',
    reviewStatus: 'UNDER_REVIEW',
    eventName: {
      defaultValue: {
        language: 'en-US',
        value: params.eventName
      }
    },
    logo: {
      sourceUri: {
        uri: 'https://stepperslife.com/logo.png'
      }
    }
  };

  // Define event ticket object
  const eventTicketObject = {
    id: objectId,
    classId: classId,
    state: 'ACTIVE',
    ticketHolderName: params.attendeeName,
    ticketType: params.tier,
    ticketNumber: params.orderNumber,
    eventName: {
      defaultValue: {
        language: 'en-US',
        value: params.eventName
      }
    },
    seatInfo: {
      seat: {
        defaultValue: {
          language: 'en-US',
          value: params.tier
        }
      }
    },
    barcode: {
      type: 'QR_CODE',
      value: params.qrData
    },
    locations: [
      {
        latitude: 37.7749,
        longitude: -122.4194
      }
    ],
    validTimeInterval: {
      start: {
        date: params.eventDate.toISOString()
      }
    }
  };

  // Create JWT for "Add to Google Wallet" button
  const claims = {
    iss: process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL,
    aud: 'google',
    origins: ['https://stepperslife.com'],
    typ: 'savetowallet',
    payload: {
      eventTicketObjects: [eventTicketObject]
    }
  };

  const token = jwt.sign(claims, process.env.GOOGLE_WALLET_PRIVATE_KEY!, {
    algorithm: 'RS256'
  });

  // Return "Add to Google Wallet" URL
  return `https://pay.google.com/gp/v/save/${token}`;
}
```

### API Endpoints

```typescript
// app/api/tickets/[ticketId]/formats/route.ts

export async function GET(
  req: Request,
  { params }: { params: { ticketId: string } }
) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format'); // 'pdf', 'apple', 'google'

  // Fetch ticket
  const ticket = await prisma.ticket.findUnique({
    where: { id: params.ticketId },
    include: { event: true, user: true, order: true }
  });

  if (!ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }

  switch (format) {
    case 'pdf':
      const pdf = await generateTicketPDF({
        ticketId: ticket.id,
        orderNumber: ticket.order.orderNumber,
        attendeeName: ticket.user.name,
        attendeeEmail: ticket.user.email,
        eventName: ticket.event.name,
        eventDate: ticket.event.startDate.toLocaleDateString(),
        eventTime: ticket.event.startDate.toLocaleTimeString(),
        venue: ticket.event.venue,
        tier: ticket.tier,
        price: ticket.price,
        qrCodeBase64: ticket.qrCodePNG
      });

      return new Response(pdf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="Ticket-${ticket.id}.pdf"`
        }
      });

    case 'apple':
      const applePass = await generateAppleWalletPass({
        ticketId: ticket.id,
        orderNumber: ticket.order.orderNumber,
        attendeeName: ticket.user.name,
        eventName: ticket.event.name,
        eventDate: ticket.event.startDate,
        venue: ticket.event.venue,
        venueAddress: ticket.event.address,
        tier: ticket.tier,
        qrData: ticket.qrToken,
        eventImageUrl: ticket.event.imageUrl
      });

      return new Response(applePass, {
        headers: {
          'Content-Type': 'application/vnd.apple.pkpass',
          'Content-Disposition': `attachment; filename="Ticket-${ticket.id}.pkpass"`
        }
      });

    case 'google':
      const googleWalletUrl = await generateGoogleWalletPass({
        ticketId: ticket.id,
        orderNumber: ticket.order.orderNumber,
        attendeeName: ticket.user.name,
        eventName: ticket.event.name,
        eventDate: ticket.event.startDate,
        venue: ticket.event.venue,
        tier: ticket.tier,
        qrData: ticket.qrToken
      });

      return NextResponse.json({ url: googleWalletUrl });

    default:
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  }
}
```

### UI Component for Format Selection

```tsx
// components/tickets/TicketFormatSelector.tsx

export function TicketFormatSelector({ ticketId }: { ticketId: string }) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const deviceType = detectDevice(); // 'ios', 'android', 'desktop'

  const handleDownload = async (format: string) => {
    setIsLoading(format);

    try {
      const response = await fetch(`/api/tickets/${ticketId}/formats?format=${format}`);

      if (format === 'google') {
        const { url } = await response.json();
        window.open(url, '_blank');
      } else {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ticket.${format === 'apple' ? 'pkpass' : 'pdf'}`;
        a.click();
      }
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* PDF Option */}
      <button
        onClick={() => handleDownload('pdf')}
        disabled={isLoading === 'pdf'}
        className="w-full flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50"
      >
        <span className="text-2xl">📄</span>
        <div className="flex-1 text-left">
          <div className="font-semibold">Download PDF</div>
          <div className="text-sm text-gray-600">Print or save to device</div>
        </div>
        {isLoading === 'pdf' && <Spinner />}
      </button>

      {/* Apple Wallet (iOS only) */}
      {deviceType === 'ios' && (
        <button
          onClick={() => handleDownload('apple')}
          disabled={isLoading === 'apple'}
          className="w-full flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50"
        >
          <span className="text-2xl">🍎</span>
          <div className="flex-1 text-left">
            <div className="font-semibold">Add to Apple Wallet</div>
            <div className="text-sm text-gray-600">Quick access on iPhone</div>
          </div>
          {isLoading === 'apple' && <Spinner />}
        </button>
      )}

      {/* Google Wallet (Android only) */}
      {deviceType === 'android' && (
        <button
          onClick={() => handleDownload('google')}
          disabled={isLoading === 'google'}
          className="w-full flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50"
        >
          <span className="text-2xl">📱</span>
          <div className="flex-1 text-left">
            <div className="font-semibold">Add to Google Wallet</div>
            <div className="text-sm text-gray-600">Quick access on Android</div>
          </div>
          {isLoading === 'google' && <Spinner />}
        </button>
      )}
    </div>
  );
}
```

## Integration Points

### 1. Ticket Delivery (TIX-002)
- **PDF**: Attach to confirmation email
- **Timing**: Generate immediately after purchase
- **Fallback**: Always include PDF if wallet generation fails

### 2. QR Code Generation (TIX-001)
- **Dependency**: Uses same QR code across all formats
- **Consistency**: Identical QR data in PDF, Apple, Google

### 3. Status Updates (TIX-005)
- **Wallet Updates**: Push notifications on status change
- **PDF**: Regenerate with updated status on request

## Performance Requirements

- PDF generation: < 3 seconds per ticket
- Apple Wallet: < 5 seconds per pass
- Google Wallet: < 2 seconds (URL generation)
- Concurrent generation: Support 10+ simultaneous requests
- File sizes: PDF < 1MB, Wallet passes < 500KB

## Testing Requirements

### Unit Tests
- [ ] PDF generates with all required fields
- [ ] Apple Wallet pass validates with Apple
- [ ] Google Wallet URL generates correctly
- [ ] QR codes identical across formats
- [ ] Branding applies correctly

### Integration Tests
- [ ] Formats generated successfully on ticket purchase
- [ ] Downloads work on all devices
- [ ] Wallet passes open correctly
- [ ] Status updates push to wallets
- [ ] Concurrent downloads don't interfere

### Device Tests
- [ ] PDF prints correctly (QR scannable)
- [ ] Apple Wallet adds successfully on iPhone
- [ ] Google Wallet adds successfully on Android
- [ ] Desktop downloads work on all browsers
- [ ] Mobile browsers handle downloads correctly

## Environment Variables

```bash
# Apple Wallet certificates
APPLE_WWDR_CERT_PATH=/path/to/wwdr.pem
APPLE_SIGNER_CERT_PATH=/path/to/signerCert.pem
APPLE_SIGNER_KEY_PATH=/path/to/signerKey.pem
APPLE_KEY_PASSPHRASE=your-passphrase

# Google Wallet
GOOGLE_WALLET_ISSUER_ID=your-issuer-id
GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL=service@project.iam.gserviceaccount.com
GOOGLE_WALLET_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
```

## Dependencies

```json
{
  "dependencies": {
    "pdfkit": "^0.14.0",
    "passkit-generator": "^3.2.0",
    "google-auth-library": "^9.0.0",
    "jsonwebtoken": "^9.0.2",
    "puppeteer": "^21.0.0"
  },
  "devDependencies": {
    "@types/pdfkit": "^0.13.0",
    "@types/jsonwebtoken": "^9.0.0"
  }
}
```

## Definition of Done

- [ ] PDF generation service implemented
- [ ] Apple Wallet pass generation working
- [ ] Google Wallet pass generation working
- [ ] Format selection UI component created
- [ ] API endpoints for all formats deployed
- [ ] Apple certificates configured and validated
- [ ] Google Wallet account setup and tested
- [ ] Unit tests achieve >90% coverage
- [ ] Device testing on iOS/Android completed
- [ ] Print testing validates QR scannability
- [ ] Performance meets <3 second requirement
- [ ] Documentation completed
- [ ] Code review completed
- [ ] QA testing completed
- [ ] Deployed to staging and validated

## Related Stories

- **TIX-001**: QR Code Generation (provides QR data)
- **TIX-002**: Digital Delivery (includes PDF attachment)
- **TIX-005**: Status Tracking (updates wallet passes)
- **TIX-003**: Validation System (scans all formats)

## Notes

- Apple Wallet requires annual developer account ($99)
- Google Wallet API requires Google Pay API access
- Test wallet passes with actual devices, not emulators
- Monitor pass generation errors and fallback to PDF
- Consider rate limiting for format downloads
- Plan for wallet pass design customization per event
- Document certificate renewal procedures
- Consider progressive enhancement (PDF first, wallets optional)