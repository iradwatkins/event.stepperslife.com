# Story: SEAT-006 - VIP and Premium Sections

**Epic**: EPIC-009 - Reserved Seating System
**Story Points**: 3
**Priority**: E2 (Medium)
**Status**: Draft
**Dependencies**: SEAT-001 (Seating Chart Creator), Pricing system, PAY-001 (Payment Integration)

---

## Story

**As an** event organizer
**I want to** create VIP and premium seating sections with enhanced pricing and benefits
**So that** I can maximize revenue and offer tiered experiences to attendees

---

## Acceptance Criteria

1. GIVEN I'm creating a seating chart
   WHEN I designate sections
   THEN I should be able to:
   - Mark sections as VIP, Premium, or Standard
   - Set different pricing tiers per section
   - Define section-specific benefits and amenities
   - Create visual distinction (colors, icons) for each tier
   - Set capacity limits per tier
   - Order sections by price (highest to lowest)

2. GIVEN I create a VIP section
   WHEN I configure section details
   THEN I should be able to:
   - Set VIP pricing (higher than standard)
   - List VIP benefits (meet & greet, backstage access, merch, etc.)
   - Add VIP-only perks (early entry, dedicated entrance, lounge access)
   - Include complimentary items (drinks, parking, coat check)
   - Upload VIP section image or icon
   - Set minimum/maximum tickets per VIP purchase

3. GIVEN I create multiple premium tiers
   WHEN customers view the seating chart
   THEN they should see:
   - Clear visual distinction between tiers (colors, badges)
   - VIP badge or icon on premium sections
   - Pricing differences clearly displayed
   - List of benefits for each tier
   - "Premium" or "VIP" labels on sections
   - Tooltip showing tier benefits on hover

4. GIVEN I'm a customer browsing an event
   WHEN I compare seating options
   THEN I should see:
   - Side-by-side comparison of tier benefits
   - "What's included" breakdown per tier
   - Price difference justification
   - Availability count per tier
   - Ability to filter by price tier
   - "Upgrade to VIP" suggestion if viewing standard

5. GIVEN I select seats in a VIP section
   WHEN I proceed to checkout
   THEN the system should:
   - Display VIP badge in cart
   - Show itemized VIP benefits
   - Calculate VIP pricing correctly
   - Include any complimentary add-ons
   - Highlight premium experience messaging
   - Send VIP-specific confirmation email

6. GIVEN I purchase VIP tickets
   WHEN I receive my tickets
   THEN I should get:
   - VIP designation on ticket/QR code
   - Special instructions for VIP entrance
   - VIP benefit vouchers (if applicable)
   - Contact info for VIP concierge
   - Premium ticket design
   - Access credentials for exclusive areas

---

## Tasks / Subtasks

- [ ] Add section tier data model (AC: 1, 2)
  - [ ] Add tier enum (STANDARD, PREMIUM, VIP)
  - [ ] Add benefits JSON field to Section
  - [ ] Add amenities list
  - [ ] Add tier-specific metadata

- [ ] Create VIP section designation UI for organizers (AC: 1, 2)
  - [ ] Tier selection dropdown
  - [ ] Benefits editor (rich text)
  - [ ] Amenities checklist
  - [ ] Pricing input per tier
  - [ ] Visual customization (color, icon)

- [ ] Build section tier pricing system (AC: 1, 2)
  - [ ] Define pricing per section
  - [ ] Validate price ordering
  - [ ] Calculate tier premiums
  - [ ] Apply pricing to all seats in section

- [ ] Implement visual distinction for tiers (AC: 3, 4)
  - [ ] Color-code sections by tier
  - [ ] Add VIP/Premium badges
  - [ ] Display tier labels
  - [ ] Create tier legend

- [ ] Create benefits display for customers (AC: 3, 4)
  - [ ] Benefits tooltip on hover
  - [ ] Benefits modal for detailed view
  - [ ] Side-by-side tier comparison
  - [ ] "What's included" section

- [ ] Add tier filtering and sorting (AC: 4)
  - [ ] Filter by price tier
  - [ ] Sort sections by price
  - [ ] "Show VIP only" toggle
  - [ ] "Upgrade options" suggestions

- [ ] Implement VIP checkout experience (AC: 5)
  - [ ] VIP badge in cart
  - [ ] Itemized benefits display
  - [ ] Premium messaging
  - [ ] Highlight VIP advantages

- [ ] Create VIP ticket generation (AC: 6)
  - [ ] VIP ticket design template
  - [ ] Add VIP designation to ticket
  - [ ] Include benefit vouchers
  - [ ] Generate VIP instructions PDF

- [ ] Build VIP confirmation email template (AC: 5, 6)
  - [ ] Premium email design
  - [ ] VIP benefits summary
  - [ ] Special instructions
  - [ ] Concierge contact info

- [ ] Add complimentary add-ons for VIP (AC: 2, 5)
  - [ ] Auto-add complimentary items to order
  - [ ] Show "$0.00" for included items
  - [ ] Generate vouchers for redemption
  - [ ] Track redemption status

- [ ] Implement VIP check-in features (AC: 6)
  - [ ] VIP credential validation at check-in
  - [ ] Dedicated VIP check-in flow
  - [ ] Access control for VIP areas
  - [ ] VIP guest list management

- [ ] Create tier analytics for organizers (AC: 1, 2)
  - [ ] Track sales by tier
  - [ ] Calculate tier revenue
  - [ ] Compare tier performance
  - [ ] Suggest optimal pricing

---

## Dev Notes

### Architecture References

**Tiered Pricing Architecture** (`docs/architecture/pricing.md`):
- Section-based pricing tiers
- Benefits and amenities defined per section
- Automatic tier pricing application to all seats
- Support for complimentary add-ons
- VIP-specific email templates

**Section Tier System** (`docs/architecture/seating-architecture.md`):
- Three tiers: STANDARD, PREMIUM, VIP
- Each section assigned one tier
- Pricing set at section level
- Benefits and amenities customizable per section
- Visual distinction via color and badges

**Database Schema Extension**:
```prisma
model Section {
  id              String   @id @default(cuid())
  chartId         String
  chart           SeatingChart @relation(fields: [chartId], references: [id])
  name            String
  tier            SectionTier @default(STANDARD)
  basePrice       Decimal  @db.Decimal(10, 2)
  color           String?
  icon            String?
  benefits        Json?    // Array of benefits
  amenities       Json?    // Array of amenities
  complimentaryItems Json? // Auto-added items
  seats           Seat[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([chartId, tier])
}

enum SectionTier {
  STANDARD
  PREMIUM
  VIP
}
```

**Section Benefits JSON Structure**:
```typescript
interface SectionBenefits {
  tier: 'STANDARD' | 'PREMIUM' | 'VIP';
  benefits: string[]; // List of benefits
  amenities: {
    earlyEntry?: boolean;
    dedicatedEntrance?: boolean;
    loungeAccess?: boolean;
    meetAndGreet?: boolean;
    backstageAccess?: boolean;
    parkingIncluded?: boolean;
    merchandiseIncluded?: boolean;
    foodAndBeverageVoucher?: number; // Dollar amount
    coatCheck?: boolean;
    conciergeService?: boolean;
  };
  complimentaryItems: {
    itemName: string;
    quantity: number;
    value: number;
  }[];
  specialInstructions?: string;
}
```

**VIP Benefits Example**:
```typescript
const vipBenefits: SectionBenefits = {
  tier: 'VIP',
  benefits: [
    'Front row seating with best view',
    'Meet & greet with performers',
    'Exclusive VIP lounge access',
    'Complimentary premium bar',
    'Dedicated VIP entrance',
    'Free parking pass',
    'Event merchandise package',
    'Commemorative VIP laminate',
  ],
  amenities: {
    earlyEntry: true,
    dedicatedEntrance: true,
    loungeAccess: true,
    meetAndGreet: true,
    backstageAccess: false,
    parkingIncluded: true,
    merchandiseIncluded: true,
    foodAndBeverageVoucher: 50,
    coatCheck: true,
    conciergeService: true,
  },
  complimentaryItems: [
    { itemName: 'Premium Bar Access', quantity: 1, value: 50 },
    { itemName: 'Parking Pass', quantity: 1, value: 20 },
    { itemName: 'Merchandise Bundle', quantity: 1, value: 75 },
  ],
  specialInstructions: 'Check in at VIP entrance on west side. Present VIP credential for lounge access.',
};
```

**Tier Comparison Component**:
```typescript
// components/seating/TierComparison.tsx
export function TierComparison({ sections }: Props) {
  const tiers = ['STANDARD', 'PREMIUM', 'VIP'];
  const tierSections = groupBy(sections, 'tier');

  return (
    <div className="tier-comparison">
      <h3>Compare Seating Tiers</h3>
      <div className="grid grid-cols-3 gap-4">
        {tiers.map(tier => {
          const section = tierSections[tier]?.[0];
          if (!section) return null;

          return (
            <div key={tier} className="tier-card">
              <div className="tier-badge">{tier}</div>
              <div className="tier-price">
                ${section.basePrice}
              </div>
              <div className="tier-benefits">
                <h4>What's Included:</h4>
                <ul>
                  {section.benefits.map(benefit => (
                    <li key={benefit}>
                      <CheckIcon /> {benefit}
                    </li>
                  ))}
                </ul>
              </div>
              {section.complimentaryItems?.length > 0 && (
                <div className="complimentary">
                  <h4>Complimentary:</h4>
                  <ul>
                    {section.complimentaryItems.map(item => (
                      <li key={item.itemName}>
                        {item.itemName} (${item.value} value)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**VIP Badge Component**:
```typescript
// components/seating/VIPBadge.tsx
export function VIPBadge({ tier }: { tier: SectionTier }) {
  const badges = {
    STANDARD: null,
    PREMIUM: {
      label: 'Premium',
      color: 'bg-blue-500',
      icon: <StarIcon />,
    },
    VIP: {
      label: 'VIP',
      color: 'bg-gold-500',
      icon: <CrownIcon />,
    },
  };

  const badge = badges[tier];
  if (!badge) return null;

  return (
    <span className={`tier-badge ${badge.color}`}>
      {badge.icon}
      {badge.label}
    </span>
  );
}
```

**VIP Checkout Experience**:
```typescript
// components/checkout/VIPCheckoutSummary.tsx
export function VIPCheckoutSummary({ order }: Props) {
  const vipSeats = order.tickets.filter(t => t.section.tier === 'VIP');

  if (vipSeats.length === 0) return null;

  return (
    <div className="vip-checkout-summary">
      <div className="vip-header">
        <CrownIcon />
        <h3>VIP Experience</h3>
      </div>

      <p>You're purchasing VIP tickets! Here's what's included:</p>

      <div className="vip-benefits">
        {vipSeats[0].section.benefits.map(benefit => (
          <div key={benefit} className="benefit-item">
            <CheckIcon /> {benefit}
          </div>
        ))}
      </div>

      <div className="complimentary-items">
        <h4>Complimentary Items (included):</h4>
        {vipSeats[0].section.complimentaryItems.map(item => (
          <div key={item.itemName} className="complimentary-item">
            {item.itemName}
            <span className="value">${item.value} value - FREE</span>
          </div>
        ))}
      </div>

      <div className="vip-instructions">
        <h4>Special Instructions:</h4>
        <p>{vipSeats[0].section.specialInstructions}</p>
      </div>
    </div>
  );
}
```

**VIP Ticket Template**:
```typescript
// lib/tickets/vip-ticket.ts
export function generateVIPTicket(ticket: Ticket): TicketData {
  const standardTicket = generateStandardTicket(ticket);

  return {
    ...standardTicket,
    design: 'vip-gold', // Premium design template
    badge: 'VIP',
    benefits: ticket.section.benefits,
    specialInstructions: ticket.section.specialInstructions,
    vipCredential: generateVIPCredential(ticket),
    vouchers: generateVouchers(ticket.section.complimentaryItems),
  };
}

function generateVIPCredential(ticket: Ticket): string {
  // Generate special VIP credential code
  return `VIP-${ticket.eventId}-${ticket.id}`;
}

function generateVouchers(items: ComplimentaryItem[]): Voucher[] {
  return items.map(item => ({
    code: generateVoucherCode(),
    itemName: item.itemName,
    value: item.value,
    instructions: `Present this voucher to redeem ${item.itemName}`,
  }));
}
```

**VIP Email Template**:
```html
<!-- lib/email/templates/vip-confirmation.html -->
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px;">
  <h1 style="color: gold;">🎉 Your VIP Experience Awaits!</h1>

  <p>Thank you for purchasing VIP tickets to [Event Name]!</p>

  <div class="vip-credential">
    <h2>VIP Credential: [VIP-CODE]</h2>
    <p>Present this at check-in for VIP access</p>
  </div>

  <div class="benefits-section">
    <h3>Your VIP Benefits:</h3>
    <ul>
      <!-- List benefits -->
    </ul>
  </div>

  <div class="instructions">
    <h3>Special Instructions:</h3>
    <p>Check in at the VIP entrance...</p>
  </div>

  <div class="concierge">
    <h3>VIP Concierge:</h3>
    <p>For assistance, contact: vip@example.com</p>
  </div>
</div>
```

**Source Tree** (`docs/architecture/source-tree.md`):
```
src/
├── app/
│   ├── api/
│   │   └── seating/
│   │       ├── sections/route.ts
│   │       └── tiers/route.ts
│   └── organizer/
│       └── seating/
│           └── section-config/page.tsx
├── components/
│   └── seating/
│       ├── TierComparison.tsx
│       ├── VIPBadge.tsx
│       ├── SectionTierEditor.tsx
│       └── BenefitsDisplay.tsx
└── lib/
    ├── seating/
    │   └── section-tiers.ts
    ├── tickets/
    │   └── vip-ticket.ts
    └── email/
        └── templates/
            └── vip-confirmation.html
```

### Testing

**Testing Requirements for this story**:
- Unit tests for tier pricing calculation
- Unit tests for benefits display
- Unit tests for VIP ticket generation
- Integration test for tier creation
- Integration test for VIP checkout flow
- E2E test for creating VIP sections
- E2E test for purchasing VIP tickets
- E2E test for tier comparison
- E2E test for complimentary item inclusion
- Test VIP email template rendering
- Test VIP credential generation
- Verify pricing accuracy across tiers

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2024-01-15 | 1.0 | Initial story creation | SM Agent |

---

## Dev Agent Record

### Agent Model Used
*To be populated by dev agent*

### Debug Log References
*To be populated by dev agent*

### Completion Notes List
*To be populated by dev agent*

### File List
*To be populated by dev agent*

---

## QA Results
*To be populated by QA agent*