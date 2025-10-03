# PAY-010: Square Terminal Box Office Integration

**Epic:** EPIC-008 - Enhanced Payment Processing
**Story Points:** 8
**Priority:** High
**Sprint:** TBD
**Status:** Ready for Development

---

## User Story

**As a** box office staff member selling tickets in person at an event
**I want to** process card-present transactions using a Square Terminal device
**So that I** can accept credit cards, print receipts, and generate tickets instantly at the venue

---

## Acceptance Criteria

### 1. Terminal Device Management
- [ ] Admin can register Square Terminal devices in system
- [ ] Each device has unique device ID and friendly name (e.g., "Main Box Office")
- [ ] Device status displays (online, offline, in-use, idle)
- [ ] Admin can assign devices to specific events/venues
- [ ] Device pairing code displayed for initial setup
- [ ] System tracks device last-seen timestamp

### 2. Box Office Interface
- [ ] Staff can access box office mode from dashboard
- [ ] Interface displays available ticket types with prices
- [ ] Staff can select multiple tickets in single transaction
- [ ] Running total displays as tickets added to cart
- [ ] Staff can apply discount codes or comp tickets
- [ ] Interface optimized for tablet use (iPad, Android tablet)

### 3. Payment Initiation
- [ ] Staff clicks "Charge Card" button to start transaction
- [ ] System sends payment request to paired Square Terminal
- [ ] Terminal displays amount and prompts for card insertion/tap
- [ ] Staff can see terminal status in real-time (waiting, processing)
- [ ] Timeout displayed (60 seconds for customer action)
- [ ] Option to cancel transaction before card presented

### 4. Card Present Processing
- [ ] Terminal accepts chip cards (EMV)
- [ ] Terminal accepts contactless payments (NFC/tap)
- [ ] Terminal accepts magnetic stripe (fallback)
- [ ] Customer sees transaction amount on terminal screen
- [ ] Customer prompted for signature if required (transactions over $25)
- [ ] Terminal captures card type and last 4 digits

### 5. Receipt Printing
- [ ] Terminal prints receipt automatically after approval
- [ ] Receipt includes event name, date, time, location
- [ ] Receipt lists all tickets purchased with ticket numbers
- [ ] Receipt shows payment method (Visa ending in 1234)
- [ ] Receipt includes QR code for ticket retrieval
- [ ] Option for email receipt instead of/in addition to printed

### 6. Ticket Generation
- [ ] Tickets generated immediately upon payment approval
- [ ] Each ticket has unique QR code for check-in
- [ ] Tickets automatically sent to customer email (if provided)
- [ ] Option to print tickets on separate printer (thermal printer)
- [ ] Tickets display seat assignments if applicable
- [ ] Staff can reprint tickets if needed

### 7. Offline Capability
- [ ] System queues transactions when internet connection lost
- [ ] Terminal continues to process payments offline
- [ ] Transactions sync when connection restored
- [ ] Warning displayed when operating offline
- [ ] Maximum offline transaction limit enforced ($500)
- [ ] Offline ticket numbers reserved in advance

### 8. Inventory Management
- [ ] Ticket inventory decremented immediately upon sale
- [ ] Real-time synchronization with online ticket sales
- [ ] Warning when ticket type running low (< 10 remaining)
- [ ] Prevent overselling when inventory depleted
- [ ] Reserved tickets (online carts) excluded from box office inventory
- [ ] Staff can view real-time inventory status

### 9. Error Handling
- [ ] Declined card displays clear message to staff
- [ ] Staff can retry payment or try different card
- [ ] Terminal connection errors handled gracefully
- [ ] Payment timeout returns terminal to idle state
- [ ] Duplicate payment prevention (idempotency)
- [ ] All errors logged with transaction ID for support

### 10. Reporting & Reconciliation
- [ ] Box office sales tracked separately from online sales
- [ ] End-of-shift reports show total sales by staff member
- [ ] Cash drawer reconciliation (if cash accepted)
- [ ] Export box office transactions to CSV
- [ ] Void/refund transactions tracked with reason codes
- [ ] Real-time dashboard shows box office activity

### 11. Security & Compliance
- [ ] Staff authentication required to access box office mode
- [ ] Role-based access control (box office staff role)
- [ ] All transactions logged with staff member ID and timestamp
- [ ] PCI compliance maintained (no card data stored)
- [ ] Terminal device encryption enabled
- [ ] Audit trail for all void/refund operations

---

## Technical Specifications

### Square Terminal API Integration

#### Terminal Service Implementation
```typescript
// lib/payments/terminal.service.ts
import { Client as SquareClient } from 'square';
import { prisma } from '@/lib/database/prisma';
import { EventEmitter } from 'events';

export interface TerminalDevice {
  id: string;
  deviceId: string;
  name: string;
  status: 'ONLINE' | 'OFFLINE' | 'IN_USE' | 'IDLE';
  locationId: string;
  lastSeen: Date;
  assignedEventId?: string;
}

export interface TerminalCheckoutRequest {
  deviceId: string;
  amountMoney: {
    amount: bigint;
    currency: string;
  };
  referenceId: string;
  note?: string;
  orderId?: string;
}

export class TerminalService extends EventEmitter {
  private squareClient: SquareClient;

  constructor() {
    super();
    this.squareClient = new SquareClient({
      accessToken: process.env.SQUARE_ACCESS_TOKEN!,
      environment: process.env.SQUARE_ENVIRONMENT as 'sandbox' | 'production',
    });
  }

  /**
   * Register a new terminal device
   */
  async registerDevice(
    deviceCode: string,
    name: string,
    locationId: string
  ): Promise<TerminalDevice> {
    try {
      // Pair device with Square
      const response = await this.squareClient.terminalApi.createTerminalCheckout({
        idempotencyKey: crypto.randomUUID(),
        checkout: {
          deviceOptions: {
            deviceId: deviceCode,
          },
          amountMoney: {
            amount: BigInt(0), // Test checkout for pairing
            currency: 'USD',
          },
          referenceId: 'PAIRING_TEST',
        },
      });

      // Store device in database
      const device = await prisma.terminalDevice.create({
        data: {
          deviceId: deviceCode,
          name,
          locationId,
          status: 'IDLE',
          lastSeen: new Date(),
        },
      });

      return {
        id: device.id,
        deviceId: device.deviceId,
        name: device.name,
        status: device.status as TerminalDevice['status'],
        locationId: device.locationId,
        lastSeen: device.lastSeen,
      };
    } catch (error) {
      console.error('Terminal registration error:', error);
      throw new Error('Failed to register terminal device');
    }
  }

  /**
   * Create terminal checkout
   */
  async createCheckout(
    request: TerminalCheckoutRequest
  ): Promise<string> {
    try {
      // Update device status to IN_USE
      await prisma.terminalDevice.update({
        where: { deviceId: request.deviceId },
        data: { status: 'IN_USE', lastSeen: new Date() },
      });

      const response = await this.squareClient.terminalApi.createTerminalCheckout({
        idempotencyKey: crypto.randomUUID(),
        checkout: {
          deviceOptions: {
            deviceId: request.deviceId,
            skipReceiptScreen: false,
            collectSignature: true,
          },
          amountMoney: {
            amount: request.amountMoney.amount,
            currency: request.amountMoney.currency,
          },
          referenceId: request.referenceId,
          note: request.note,
          paymentType: 'CARD_PRESENT',
        },
      });

      const checkoutId = response.result.checkout?.id;
      if (!checkoutId) {
        throw new Error('No checkout ID returned from Square');
      }

      // Emit event for real-time updates
      this.emit('checkout:created', {
        checkoutId,
        deviceId: request.deviceId,
        amount: request.amountMoney.amount,
      });

      return checkoutId;
    } catch (error) {
      console.error('Terminal checkout error:', error);

      // Reset device status
      await prisma.terminalDevice.update({
        where: { deviceId: request.deviceId },
        data: { status: 'IDLE' },
      });

      throw error;
    }
  }

  /**
   * Get checkout status
   */
  async getCheckoutStatus(checkoutId: string): Promise<any> {
    const response = await this.squareClient.terminalApi.getTerminalCheckout(checkoutId);
    return response.result.checkout;
  }

  /**
   * Cancel checkout
   */
  async cancelCheckout(checkoutId: string): Promise<void> {
    try {
      await this.squareClient.terminalApi.cancelTerminalCheckout(checkoutId);

      this.emit('checkout:cancelled', { checkoutId });
    } catch (error) {
      console.error('Cancel checkout error:', error);
      throw error;
    }
  }

  /**
   * Get all registered devices
   */
  async getDevices(eventId?: string): Promise<TerminalDevice[]> {
    const devices = await prisma.terminalDevice.findMany({
      where: eventId ? { assignedEventId: eventId } : undefined,
      orderBy: { name: 'asc' },
    });

    return devices.map(device => ({
      id: device.id,
      deviceId: device.deviceId,
      name: device.name,
      status: device.status as TerminalDevice['status'],
      locationId: device.locationId,
      lastSeen: device.lastSeen,
      assignedEventId: device.assignedEventId || undefined,
    }));
  }

  /**
   * Update device status
   */
  async updateDeviceStatus(
    deviceId: string,
    status: TerminalDevice['status']
  ): Promise<void> {
    await prisma.terminalDevice.update({
      where: { deviceId },
      data: { status, lastSeen: new Date() },
    });

    this.emit('device:status', { deviceId, status });
  }
}

export const terminalService = new TerminalService();
```

#### Box Office API Routes
```typescript
// app/api/boxoffice/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { terminalService } from '@/lib/payments/terminal.service';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';

const checkoutSchema = z.object({
  deviceId: z.string(),
  eventId: z.string().uuid(),
  tickets: z.array(z.object({
    ticketTypeId: z.string().uuid(),
    quantity: z.number().int().positive(),
  })),
  customerEmail: z.string().email().optional(),
  discountCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'BOX_OFFICE'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Box office access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { deviceId, eventId, tickets, customerEmail, discountCode } =
      checkoutSchema.parse(body);

    // Verify device exists and is available
    const device = await prisma.terminalDevice.findUnique({
      where: { deviceId },
    });

    if (!device || device.status === 'IN_USE') {
      return NextResponse.json(
        { error: 'Terminal device not available' },
        { status: 400 }
      );
    }

    // Calculate total amount
    let totalAmount = 0;
    const ticketDetails: any[] = [];

    for (const ticket of tickets) {
      const ticketType = await prisma.ticketType.findUnique({
        where: { id: ticket.ticketTypeId },
        include: { event: true },
      });

      if (!ticketType || ticketType.eventId !== eventId) {
        return NextResponse.json(
          { error: `Invalid ticket type: ${ticket.ticketTypeId}` },
          { status: 400 }
        );
      }

      // Check inventory
      if (ticketType.quantitySold + ticket.quantity > ticketType.quantityAvailable) {
        return NextResponse.json(
          { error: `Insufficient inventory for ${ticketType.name}` },
          { status: 400 }
        );
      }

      const lineTotal = ticketType.price * ticket.quantity;
      totalAmount += lineTotal;

      ticketDetails.push({
        ticketTypeId: ticketType.id,
        name: ticketType.name,
        quantity: ticket.quantity,
        price: ticketType.price,
        lineTotal,
      });
    }

    // Apply discount if provided
    let discountAmount = 0;
    if (discountCode) {
      const discount = await prisma.discountCode.findUnique({
        where: { code: discountCode },
      });

      if (discount && discount.isActive) {
        discountAmount = discount.type === 'PERCENTAGE'
          ? totalAmount * (discount.value / 100)
          : discount.value;
        totalAmount -= discountAmount;
      }
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        eventId,
        totalAmount,
        discountAmount,
        status: 'PENDING',
        paymentMethod: 'CARD_PRESENT',
        source: 'BOX_OFFICE',
        customerEmail,
        items: {
          create: tickets.map(ticket => ({
            ticketTypeId: ticket.ticketTypeId,
            quantity: ticket.quantity,
            price: ticketDetails.find(t => t.ticketTypeId === ticket.ticketTypeId)!.price,
          })),
        },
      },
    });

    // Create terminal checkout
    const checkoutId = await terminalService.createCheckout({
      deviceId,
      amountMoney: {
        amount: BigInt(Math.round(totalAmount * 100)),
        currency: 'USD',
      },
      referenceId: order.id,
      note: `Event tickets - Order ${order.id.slice(0, 8)}`,
      orderId: order.id,
    });

    // Log box office transaction
    await prisma.boxOfficeTransaction.create({
      data: {
        orderId: order.id,
        staffUserId: session.user.id,
        terminalDeviceId: device.id,
        checkoutId,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      checkoutId,
      amount: totalAmount,
      ticketDetails,
    });
  } catch (error) {
    console.error('Box office checkout error:', error);
    return NextResponse.json(
      { error: 'Checkout creation failed' },
      { status: 500 }
    );
  }
}
```

### Box Office UI Component

```typescript
// components/boxoffice/TerminalCheckout.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Printer, XCircle, CheckCircle, Loader2 } from 'lucide-react';

interface TerminalCheckoutProps {
  eventId: string;
  ticketTypes: Array<{
    id: string;
    name: string;
    price: number;
    available: number;
  }>;
  deviceId: string;
  deviceName: string;
}

export function TerminalCheckout({
  eventId,
  ticketTypes,
  deviceId,
  deviceName,
}: TerminalCheckoutProps) {
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<string>('idle');
  const [error, setError] = useState<string | null>(null);

  const addToCart = (ticketTypeId: string) => {
    const newCart = new Map(cart);
    const current = newCart.get(ticketTypeId) || 0;
    newCart.set(ticketTypeId, current + 1);
    setCart(newCart);
  };

  const removeFromCart = (ticketTypeId: string) => {
    const newCart = new Map(cart);
    const current = newCart.get(ticketTypeId) || 0;
    if (current > 1) {
      newCart.set(ticketTypeId, current - 1);
    } else {
      newCart.delete(ticketTypeId);
    }
    setCart(newCart);
  };

  const calculateTotal = (): number => {
    let total = 0;
    cart.forEach((quantity, ticketTypeId) => {
      const ticketType = ticketTypes.find(tt => tt.id === ticketTypeId);
      if (ticketType) {
        total += ticketType.price * quantity;
      }
    });
    return total;
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    setError(null);
    setCheckoutStatus('initializing');

    try {
      // Convert cart to tickets array
      const tickets = Array.from(cart.entries()).map(([ticketTypeId, quantity]) => ({
        ticketTypeId,
        quantity,
      }));

      // Create checkout
      const response = await fetch('/api/boxoffice/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          eventId,
          tickets,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Checkout failed');
      }

      // Poll for checkout status
      setCheckoutStatus('waiting_for_card');
      await pollCheckoutStatus(result.checkoutId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Checkout failed';
      setError(errorMessage);
      setCheckoutStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const pollCheckoutStatus = async (checkoutId: string) => {
    const maxAttempts = 60; // 60 seconds timeout
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        throw new Error('Checkout timed out');
      }

      const response = await fetch(`/api/boxoffice/checkout/${checkoutId}`);
      const data = await response.json();

      if (data.status === 'COMPLETED') {
        setCheckoutStatus('completed');
        setCart(new Map()); // Clear cart
        return;
      } else if (data.status === 'CANCELED') {
        throw new Error('Checkout was canceled');
      } else if (data.status === 'PENDING') {
        attempts++;
        setTimeout(poll, 1000);
      }
    };

    await poll();
  };

  const getStatusBadge = () => {
    switch (checkoutStatus) {
      case 'initializing':
        return <Badge variant="secondary">Initializing...</Badge>;
      case 'waiting_for_card':
        return <Badge variant="default">Waiting for card</Badge>;
      case 'completed':
        return <Badge variant="success">Payment approved</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6 p-6">
      {/* Ticket Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Tickets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ticketTypes.map(ticketType => (
            <div key={ticketType.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-semibold">{ticketType.name}</h3>
                <p className="text-sm text-muted-foreground">
                  ${ticketType.price.toFixed(2)} • {ticketType.available} available
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeFromCart(ticketType.id)}
                  disabled={!cart.has(ticketType.id)}
                >
                  -
                </Button>
                <span className="w-8 text-center font-semibold">
                  {cart.get(ticketType.id) || 0}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addToCart(ticketType.id)}
                  disabled={cart.get(ticketType.id) >= ticketType.available}
                >
                  +
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Checkout Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Checkout</span>
            {getStatusBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Device Info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            <span>Terminal: {deviceName}</span>
          </div>

          {/* Cart Items */}
          <div className="space-y-2">
            {Array.from(cart.entries()).map(([ticketTypeId, quantity]) => {
              const ticketType = ticketTypes.find(tt => tt.id === ticketTypeId);
              if (!ticketType) return null;

              return (
                <div key={ticketTypeId} className="flex justify-between text-sm">
                  <span>{quantity}x {ticketType.name}</span>
                  <span>${(ticketType.price * quantity).toFixed(2)}</span>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="pt-4 border-t">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
              <XCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={handleCheckout}
              disabled={isProcessing || cart.size === 0}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Charge Card
                </>
              )}
            </Button>

            {checkoutStatus === 'completed' && (
              <Button
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Printer className="mr-2 h-5 w-5" />
                Print Tickets
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Database Schema

```prisma
// prisma/schema.prisma additions

model TerminalDevice {
  id              String   @id @default(uuid())
  deviceId        String   @unique // Square device ID
  name            String   // Friendly name (e.g., "Main Box Office")
  locationId      String   // Square location ID
  status          String   @default("IDLE") // ONLINE, OFFLINE, IN_USE, IDLE
  lastSeen        DateTime @default(now())
  assignedEventId String?  // Optional event assignment
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  assignedEvent   Event?   @relation(fields: [assignedEventId], references: [id])
  transactions    BoxOfficeTransaction[]

  @@index([deviceId])
  @@index([status])
}

model BoxOfficeTransaction {
  id               String   @id @default(uuid())
  orderId          String   @unique
  staffUserId      String   // User who processed the sale
  terminalDeviceId String   // Terminal used
  checkoutId       String   @unique // Square checkout ID
  status           String   @default("PENDING") // PENDING, COMPLETED, FAILED, CANCELED
  cardBrand        String?  // Visa, Mastercard, etc.
  cardLast4        String?  // Last 4 digits
  receiptPrinted   Boolean  @default(false)
  ticketsPrinted   Boolean  @default(false)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  order            Order    @relation(fields: [orderId], references: [id])
  staffUser        User     @relation(fields: [staffUserId], references: [id])
  terminalDevice   TerminalDevice @relation(fields: [terminalDeviceId], references: [id])

  @@index([staffUserId])
  @@index([terminalDeviceId])
  @@index([createdAt])
}
```

---

## Dependencies

### Technical Dependencies
- Square Terminal API
- Square Payments API
- Next.js 14+ (App Router)
- Prisma ORM
- TypeScript 5.0+
- React 18+

### Hardware Dependencies
- Square Terminal device(s)
- Stable internet connection (WiFi or Ethernet)
- Thermal receipt printer (optional)
- Thermal ticket printer (optional)
- Tablet for staff interface (iPad or Android tablet recommended)

### Story Dependencies
- PAY-001: Square Payments Setup (prerequisite)
- TIX-001: Ticket generation system (prerequisite)
- ORD-001: Order management (prerequisite)

---

## Testing Requirements

### Unit Tests
- Test terminal service initialization
- Test checkout creation and validation
- Test inventory checks before sale
- Test discount code application
- Test offline queue functionality

### Integration Tests
- Test complete checkout flow from cart to payment
- Test webhook payment confirmation
- Test ticket generation after payment
- Test receipt printing flow
- Test concurrent terminal usage

### Hardware Testing
- Test on actual Square Terminal devices
- Test EMV chip card payments
- Test contactless/NFC payments
- Test signature capture
- Test receipt printing quality
- Test terminal timeout scenarios
- Test terminal cancellation flow

### Sandbox Testing
- Use Square Sandbox environment
- Test with Square test cards
- Test various decline scenarios
- Test timeout handling
- Test offline mode

---

## Security Considerations

### PCI Compliance
- Card data never touches platform servers (PCI Level 1 via Square)
- Terminal handles all card data securely (P2PE encryption)
- Staff cannot view full card numbers (last 4 only)
- Transaction logs encrypted at rest

### Access Control
- Box office mode requires special role (BOX_OFFICE or ADMIN)
- All transactions logged with staff member ID
- Void/refund operations require manager approval
- Device pairing requires admin privileges

### Fraud Prevention
- Monitor for unusual transaction patterns
- Alert on high-value transactions (>$1000)
- Require signature for transactions over $25
- Daily transaction limits per staff member

---

## Monitoring & Analytics

### Key Metrics
- Box office sales volume vs. online sales
- Average transaction time (cart to payment)
- Terminal uptime percentage
- Payment decline rate
- Staff productivity (transactions per shift)

### Alerts
- Alert when terminal goes offline
- Alert when terminal checkout times out
- Alert on payment processing errors
- Alert on inventory discrepancies

---

## Definition of Done

- [ ] All acceptance criteria met and verified
- [ ] Unit tests written with 90%+ coverage
- [ ] Integration tests passing
- [ ] Hardware testing completed with real terminals
- [ ] Staff training materials created
- [ ] Security review completed
- [ ] Product owner approval received
- [ ] Deployed and tested in production

---

## Notes

### Box Office Best Practices
- Keep terminals charged (6+ hour battery life)
- Test connectivity before event starts
- Have backup terminal available
- Train multiple staff members
- Reconcile cash drawer at end of shift

### Future Enhancements
- Cash payment tracking
- Split payment support (part card, part cash)
- Tip collection for gratuity events
- Multiple terminal coordination
- Advanced reporting and analytics