# TIX-001: QR Code Generation System

**Epic**: EPIC-004 - Digital Ticket System
**Story Points**: 3
**Priority**: Critical
**Status**: Ready for Development

## User Story

**As a** ticket purchaser
**I want** each ticket to have a unique, secure QR code
**So that** I can gain entry to the event and the system prevents fraud

## Business Value

- Enables secure, fast check-in process at events
- Prevents ticket fraud and unauthorized entry
- Provides audit trail for ticket validation
- Supports offline validation capability
- Industry-standard ticketing security

## Acceptance Criteria

### AC1: Unique QR Code Generation
**Given** a ticket is created after successful payment
**When** the system generates the ticket
**Then** it must create a unique QR code containing:
- Ticket UUID (v4 format)
- Event ID reference
- Purchase order ID
- Security hash (HMAC-SHA256)
- Generation timestamp
- Ticket tier/type

**And** the QR code data must be cryptographically signed
**And** no two tickets can have identical QR codes

### AC2: Secure Token Generation
**Given** QR code data needs to be tamper-proof
**When** generating the security token
**Then** the system must:
- Use HMAC-SHA256 with secret key from environment
- Include ticket UUID, event ID, and timestamp in hash
- Generate token format: `TIX-{UUID}-{HASH}`
- Store hash in database for validation
- Rotate secrets quarterly (manual process)

### AC3: QR Code Visual Generation
**Given** ticket security token is created
**When** generating the visual QR code
**Then** the system must:
- Use error correction level H (30% redundancy)
- Generate minimum 300x300px resolution
- Output as PNG and SVG formats
- Include margin of 4 modules
- Support base64 data URI for email embedding

### AC4: Offline Validation Support
**Given** check-in may occur without internet
**When** encoding QR data
**Then** the code must contain:
- Full ticket validation data (not just ID)
- Cryptographic signature for offline verification
- Event date/time for expiration checking
- Ticket tier for access level validation

### AC5: Database Storage
**Given** QR code is generated successfully
**When** storing ticket data
**Then** the system must save:
- QR code token (unique indexed)
- Security hash (indexed for fast lookup)
- Generation timestamp
- QR code PNG as base64 (for quick retrieval)
- QR code SVG as text (for print quality)
- Expiration timestamp (event end + 1 day)

### AC6: QR Code Expiration
**Given** QR codes should have limited validity
**When** validating a ticket
**Then** the system must:
- Check event end date + 1 day grace period
- Mark expired codes as invalid
- Allow manual extension by admins
- Log all expiration checks

## Technical Specifications

### QR Code Library
```typescript
// Recommended: qrcode npm package
import QRCode from 'qrcode';

// Error correction levels:
// L: 7% data recovery
// M: 15% data recovery
// Q: 25% data recovery
// H: 30% data recovery (REQUIRED for tickets)
```

### Token Format
```
Full Token Structure:
TIX-{UUID}-{EVENT_ID}-{TIMESTAMP}-{HMAC_HASH}

Example:
TIX-f47ac10b-58cc-4372-a567-0e02b2c3d479-evt_123-1735689600-a3f5b8c2d1e4f567890abcdef1234567

QR Code Contains (JSON):
{
  "ticketId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "eventId": "evt_123",
  "orderId": "ord_456",
  "tier": "VIP",
  "timestamp": 1735689600,
  "signature": "a3f5b8c2d1e4f567890abcdef1234567"
}
```

### Security Hash Generation
```typescript
import crypto from 'crypto';

function generateTicketHash(
  ticketId: string,
  eventId: string,
  orderId: string,
  timestamp: number,
  secret: string
): string {
  const data = `${ticketId}:${eventId}:${orderId}:${timestamp}`;
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex')
    .substring(0, 32); // First 32 chars for QR size optimization
}
```

### Database Schema Updates
```prisma
model Ticket {
  id              String   @id @default(uuid())
  orderId         String
  eventId         String
  userId          String

  // QR Code fields
  qrToken         String   @unique // Full token string
  qrHash          String   @unique @index // Security hash
  qrCodePNG       String   @db.Text // Base64 encoded PNG
  qrCodeSVG       String   @db.Text // SVG markup
  qrGeneratedAt   DateTime @default(now())
  qrExpiresAt     DateTime // Event end + 1 day

  // Ticket details
  tier            String
  price           Decimal  @db.Decimal(10, 2)
  status          TicketStatus @default(ISSUED)

  // Relationships
  order           Order    @relation(fields: [orderId], references: [id])
  event           Event    @relation(fields: [eventId], references: [id])
  user            User     @relation(fields: [userId], references: [id])

  // Audit
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([qrToken])
  @@index([qrHash])
  @@index([eventId, status])
}

enum TicketStatus {
  ISSUED
  CHECKED_IN
  TRANSFERRED
  REFUNDED
  CANCELLED
  EXPIRED
}
```

### QR Code Service Implementation
```typescript
// lib/services/qrcode-generator.service.ts

import QRCode from 'qrcode';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

interface TicketQRData {
  ticketId: string;
  eventId: string;
  orderId: string;
  tier: string;
  timestamp: number;
  signature: string;
}

export class QRCodeGeneratorService {
  private readonly SECRET_KEY: string;

  constructor() {
    this.SECRET_KEY = process.env.TICKET_QR_SECRET!;
    if (!this.SECRET_KEY) {
      throw new Error('TICKET_QR_SECRET environment variable required');
    }
  }

  async generateTicketQR(params: {
    ticketId: string;
    eventId: string;
    orderId: string;
    tier: string;
  }): Promise<{
    token: string;
    hash: string;
    png: string;
    svg: string;
    expiresAt: Date;
  }> {
    const timestamp = Math.floor(Date.now() / 1000);

    // Generate security hash
    const hash = this.generateHash(
      params.ticketId,
      params.eventId,
      params.orderId,
      timestamp
    );

    // Create QR data payload
    const qrData: TicketQRData = {
      ticketId: params.ticketId,
      eventId: params.eventId,
      orderId: params.orderId,
      tier: params.tier,
      timestamp,
      signature: hash
    };

    // Generate token
    const token = `TIX-${params.ticketId}-${params.eventId}-${timestamp}-${hash}`;

    // Generate QR codes
    const qrDataString = JSON.stringify(qrData);
    const png = await this.generatePNG(qrDataString);
    const svg = await this.generateSVG(qrDataString);

    // Calculate expiration (get from event, default 1 day after event)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default

    return { token, hash, png, svg, expiresAt };
  }

  private generateHash(
    ticketId: string,
    eventId: string,
    orderId: string,
    timestamp: number
  ): string {
    const data = `${ticketId}:${eventId}:${orderId}:${timestamp}`;
    return crypto
      .createHmac('sha256', this.SECRET_KEY)
      .update(data)
      .digest('hex')
      .substring(0, 32);
  }

  private async generatePNG(data: string): Promise<string> {
    const buffer = await QRCode.toBuffer(data, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 300,
      margin: 4,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return buffer.toString('base64');
  }

  private async generateSVG(data: string): Promise<string> {
    return await QRCode.toString(data, {
      errorCorrectionLevel: 'H',
      type: 'svg',
      width: 300,
      margin: 4
    });
  }

  validateQRHash(
    ticketId: string,
    eventId: string,
    orderId: string,
    timestamp: number,
    providedHash: string
  ): boolean {
    const expectedHash = this.generateHash(ticketId, eventId, orderId, timestamp);
    return crypto.timingSafeEqual(
      Buffer.from(expectedHash),
      Buffer.from(providedHash)
    );
  }
}
```

## Integration Points

### 1. Order Completion Flow
- **Trigger**: After successful payment confirmation
- **Action**: Generate QR code for each ticket in order
- **Endpoint**: `POST /api/orders/{orderId}/generate-tickets`

### 2. Email Delivery System
- **Consumer**: TIX-002 Email Delivery
- **Data Needed**: PNG base64 for inline display, PDF attachment
- **Format**: Both formats generated during creation

### 3. Ticket Validation System
- **Consumer**: TIX-003 Validation System
- **Data Needed**: QR hash, token, expiration
- **Performance**: Indexed lookups on qrHash and qrToken

### 4. Admin Management
- **Use Case**: Manual ticket regeneration, expiration extension
- **Endpoint**: `POST /api/admin/tickets/{ticketId}/regenerate-qr`

## Security Considerations

### Fraud Prevention
1. **Unique Identifiers**: UUID v4 ensures no collisions
2. **Cryptographic Signing**: HMAC-SHA256 prevents tampering
3. **Timestamp Inclusion**: Prevents replay attacks with old QR codes
4. **Secret Key Management**: Environment variable, rotate quarterly
5. **Database Uniqueness**: Unique constraints on qrToken and qrHash

### Attack Vectors Mitigated
- **QR Code Cloning**: Signature validation prevents fake codes
- **Replay Attacks**: Timestamp and single-use validation
- **Brute Force**: 128-bit UUID + 256-bit hash space
- **Man-in-the-Middle**: HTTPS required for all API calls
- **Database Breach**: Hashes cannot be reverse-engineered without secret

### Offline Security
- QR contains full validation data
- Signature can be verified without server
- Timestamp prevents expired ticket use
- Device stores event-specific validation rules

## Performance Requirements

- QR generation: < 500ms per ticket
- Batch generation: Support 100+ tickets in single request
- Database writes: Batch insert for multiple tickets
- Image encoding: Optimize base64 size (target < 5KB per QR)
- Caching: Redis cache for frequently accessed tickets

## Testing Requirements

### Unit Tests
- [ ] Hash generation produces consistent results
- [ ] Hash validation accepts correct hashes
- [ ] Hash validation rejects tampered hashes
- [ ] PNG generation creates valid base64
- [ ] SVG generation creates valid markup
- [ ] Token format matches specification
- [ ] Expiration calculation is correct

### Integration Tests
- [ ] QR generation integrated with order completion
- [ ] Database storage saves all fields correctly
- [ ] Unique constraints prevent duplicates
- [ ] QR codes can be retrieved and validated
- [ ] Batch generation handles 100+ tickets

### Security Tests
- [ ] Cannot generate QR without secret key
- [ ] Tampered QR data fails validation
- [ ] Old timestamps are rejected
- [ ] QR codes expire after event + 1 day
- [ ] Secret key rotation works correctly

## Environment Variables

```bash
# Required for QR code generation
TICKET_QR_SECRET=your-256-bit-secret-key-here

# Optional: QR code settings
QR_ERROR_CORRECTION=H
QR_SIZE=300
QR_MARGIN=4
```

## Dependencies

```json
{
  "dependencies": {
    "qrcode": "^1.5.3",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/qrcode": "^1.5.0",
    "@types/uuid": "^9.0.0"
  }
}
```

## Definition of Done

- [ ] QR code service implemented with full security
- [ ] Database schema updated with QR fields
- [ ] Integration with order completion flow
- [ ] Unit tests achieve >90% coverage
- [ ] Security tests pass all scenarios
- [ ] Performance meets <500ms requirement
- [ ] Documentation updated with API specs
- [ ] Environment variables documented
- [ ] Secret key rotation procedure documented
- [ ] Code review completed
- [ ] QA testing completed
- [ ] Deployed to staging and validated

## Related Stories

- **TIX-002**: Digital Ticket Delivery (consumes QR codes)
- **TIX-003**: Ticket Validation System (validates QR codes)
- **TIX-004**: Check-in Interface (scans QR codes)
- **PAY-003**: Payment Confirmation (triggers QR generation)

## Notes

- QR code regeneration should be restricted to admin users
- Consider adding watermark or logo to QR codes for branding
- Monitor QR generation performance in production
- Plan for secret key rotation every quarter
- Document offline validation process for event staff