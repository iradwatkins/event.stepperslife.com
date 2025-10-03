# Story: SEAT-005 - Accessible Seating Options

**Epic**: EPIC-009 - Reserved Seating System
**Story Points**: 3
**Priority**: E1 (High)
**Status**: Draft
**Dependencies**: SEAT-001 (Seating Chart Creator), SEAT-002 (Interactive Seat Selection), ADA compliance requirements

---

## Story

**As a** customer with accessibility needs
**I want to** easily find and select accessible seating options
**So that** I can attend events comfortably and safely with appropriate accommodations

---

## Acceptance Criteria

1. GIVEN I'm browsing events with reserved seating
   WHEN I view the seating chart
   THEN I should see:
   - Clear wheelchair icon marking accessible seats
   - "Accessible Seating" filter toggle
   - Companion seat indicators next to accessible seats
   - Accessibility features listed (transfer seats, aisle access, etc.)
   - Percentage of accessible seats available
   - Contact info for special accommodation requests

2. GIVEN I enable the "Accessible Seating" filter
   WHEN the chart updates
   THEN the system should:
   - Highlight all accessible seating areas
   - Dim or hide non-accessible seats
   - Group accessible seats with companion seats
   - Show proximity to accessible facilities (restrooms, entrances)
   - Display accessible parking information
   - Show route from entrance to seats

3. GIVEN I select an accessible seat
   WHEN I add it to my cart
   THEN the system should:
   - Automatically include companion seat option
   - Show "Select companion seat" prompt
   - Validate companion seat is adjacent
   - Display accessibility features for that seat
   - Note any special requirements (transfer, etc.)
   - Allow adding accessibility notes to order

4. GIVEN I need specific accessibility accommodations
   WHEN I'm completing my purchase
   THEN I should be able to:
   - Specify type of accommodation needed (wheelchair, mobility aid, service animal, etc.)
   - Add notes about specific requirements
   - Request additional assistance
   - Upload relevant documentation if required
   - Receive confirmation of accommodations
   - Get contact info for day-of-event support

5. GIVEN I'm an event organizer creating a seating chart
   WHEN I designate accessible seats
   THEN I should be able to:
   - Mark seats as wheelchair accessible
   - Designate transfer seats (can move from wheelchair)
   - Identify companion seats
   - Specify accessibility features (removable armrest, extra space, etc.)
   - Set accessibility pricing (typically same as section)
   - Define accessible routes and facilities
   - Meet ADA minimum requirements (1% of capacity or 1 seat minimum)

6. GIVEN an event has limited accessible seating
   WHEN accessible seats are selling out
   THEN the system should:
   - Reserve accessible seats for verified needs (honor system)
   - Show "Limited accessible seats" warning
   - Provide alternative contact method for assistance
   - Prevent non-accessibility purchases of accessible seats (until sold out)
   - Alert organizer when accessible seats are low
   - Offer waitlist for accessible seating

---

## Tasks / Subtasks

- [ ] Add accessibility fields to seat data model (AC: 5)
  - [ ] Add isAccessible boolean
  - [ ] Add isCompanion boolean
  - [ ] Add accessibilityType enum (wheelchair, transfer, companion)
  - [ ] Add accessibilityFeatures JSON field

- [ ] Create accessible seating designation UI for organizers (AC: 5)
  - [ ] Wheelchair accessible seat marker
  - [ ] Transfer seat marker
  - [ ] Companion seat marker
  - [ ] Accessibility features form
  - [ ] Validate ADA minimum requirements

- [ ] Build accessible seating filter for customers (AC: 1, 2)
  - [ ] Toggle filter in chart UI
  - [ ] Highlight accessible seats
  - [ ] Dim non-accessible seats
  - [ ] Show accessibility legend

- [ ] Implement companion seat pairing (AC: 3)
  - [ ] Auto-suggest companion seat
  - [ ] Validate adjacency
  - [ ] Allow selection of companion seat
  - [ ] Show companion seat pricing

- [ ] Add accessibility information display (AC: 1, 2)
  - [ ] Show accessibility features per seat
  - [ ] Display facility locations
  - [ ] Show accessible routes
  - [ ] List parking information

- [ ] Create accessibility notes and requests (AC: 4)
  - [ ] Add notes field to order
  - [ ] Specify accommodation type
  - [ ] Request additional assistance
  - [ ] Capture special requirements

- [ ] Build ADA compliance validation (AC: 5)
  - [ ] Calculate required accessible seats (1% minimum)
  - [ ] Validate distribution across sections
  - [ ] Alert on non-compliance
  - [ ] Generate compliance report

- [ ] Implement accessible seat protection (AC: 6)
  - [ ] Reserve for accessibility needs
  - [ ] Show verification prompt
  - [ ] Allow bypass when near sellout
  - [ ] Alert organizer when low

- [ ] Add accessibility documentation upload (AC: 4)
  - [ ] Upload form for documentation
  - [ ] Store securely
  - [ ] Optional verification workflow
  - [ ] HIPAA compliance considerations

- [ ] Create accessibility contact and support (AC: 1, 4)
  - [ ] Display organizer contact
  - [ ] Accessibility coordinator info
  - [ ] Day-of-event support details
  - [ ] Emergency contact information

- [ ] Build accessibility waitlist (AC: 6)
  - [ ] Waitlist registration
  - [ ] Notification when seat available
  - [ ] Priority booking for waitlist
  - [ ] Automatic seat assignment

- [ ] Add accessibility analytics for organizers (AC: 5)
  - [ ] Track accessible seat utilization
  - [ ] Monitor accommodation requests
  - [ ] Report on accessibility compliance
  - [ ] Suggest improvements

---

## Dev Notes

### Architecture References

**Accessibility Requirements** (`docs/architecture/accessibility.md`):
- ADA compliance: Minimum 1% of seating or 1 seat
- Wheelchair spaces must be integrated throughout venue
- Companion seats must be adjacent
- Accessible seats should not be priced higher
- Clear signage and wayfinding required

**Accessibility Features** (`docs/architecture/seating-architecture.md`):
- Wheelchair accessible: Floor-level, no stairs, adequate space
- Transfer seats: Can move from wheelchair, near aisle
- Companion seats: Adjacent to accessible seat, standard seating
- Aisle access: Direct access without crossing rows
- Removable armrests: Easier transfer
- Extra space: For mobility aids, service animals

**Database Schema Extension**:
```prisma
model Seat {
  id                    String   @id @default(cuid())
  // ... existing fields
  isAccessible          Boolean  @default(false)
  isCompanion           Boolean  @default(false)
  accessibilityType     AccessibilityType?
  accessibilityFeatures Json?    // Detailed features

  @@index([isAccessible])
}

enum AccessibilityType {
  WHEELCHAIR
  TRANSFER
  COMPANION
  AISLE_ACCESS
}

model Order {
  id                        String   @id @default(cuid())
  // ... existing fields
  accessibilityRequired     Boolean  @default(false)
  accessibilityNotes        String?
  accommodationType         AccommodationType?
  documentationUrl          String?
}

enum AccommodationType {
  WHEELCHAIR
  MOBILITY_AID
  SERVICE_ANIMAL
  HEARING_ASSISTANCE
  VISUAL_ASSISTANCE
  OTHER
}
```

**Accessibility Features JSON Structure**:
```typescript
interface AccessibilityFeatures {
  wheelchairAccessible: boolean;
  transferSeat: boolean;
  aisleAccess: boolean;
  removableArmrest: boolean;
  extraSpace: boolean;
  companionSeatIncluded: boolean;
  proximityToAccessibleRestroom: 'close' | 'medium' | 'far';
  proximityToAccessibleEntrance: 'close' | 'medium' | 'far';
  elevatorAccess: boolean;
  rampAccess: boolean;
  notes?: string;
}
```

**ADA Compliance Validation**:
```typescript
// lib/seating/ada-compliance.ts
export function validateADACompliance(seatingChart: SeatingChart): {
  compliant: boolean;
  issues: string[];
  recommendations: string[];
} {
  const totalSeats = seatingChart.totalSeats;
  const accessibleSeats = seatingChart.sections
    .flatMap(s => s.seats)
    .filter(s => s.isAccessible).length;

  const requiredAccessibleSeats = Math.max(1, Math.ceil(totalSeats * 0.01));

  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check minimum requirement
  if (accessibleSeats < requiredAccessibleSeats) {
    issues.push(
      `Insufficient accessible seating: ${accessibleSeats} provided, ${requiredAccessibleSeats} required`
    );
  }

  // Check distribution across price levels
  const sections = seatingChart.sections;
  const sectionsWithAccessible = sections.filter(s =>
    s.seats.some(seat => seat.isAccessible)
  ).length;

  if (sections.length > 1 && sectionsWithAccessible < sections.length * 0.5) {
    recommendations.push(
      'Distribute accessible seating across more sections for better choice'
    );
  }

  // Check companion seats
  const accessibleSeatsWithoutCompanion = seatingChart.sections
    .flatMap(s => s.seats)
    .filter(s => s.isAccessible && !hasAdjacentCompanion(s, seatingChart))
    .length;

  if (accessibleSeatsWithoutCompanion > 0) {
    issues.push(
      `${accessibleSeatsWithoutCompanion} accessible seats lack adjacent companion seats`
    );
  }

  return {
    compliant: issues.length === 0,
    issues,
    recommendations,
  };
}
```

**Accessible Seat Filter Component**:
```typescript
// components/seating/AccessibilityFilter.tsx
export function AccessibilityFilter({ onFilterChange }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [features, setFeatures] = useState<string[]>([]);

  const handleToggle = () => {
    setEnabled(!enabled);
    onFilterChange({
      showOnlyAccessible: !enabled,
      requiredFeatures: features,
    });
  };

  return (
    <div className="accessibility-filter">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={enabled}
          onChange={handleToggle}
        />
        <WheelchairIcon />
        Show Accessible Seating Only
      </label>

      {enabled && (
        <div className="feature-filters">
          <label>
            <input
              type="checkbox"
              value="wheelchairAccessible"
              onChange={(e) => toggleFeature(e.target.value)}
            />
            Wheelchair Accessible
          </label>
          <label>
            <input
              type="checkbox"
              value="transferSeat"
              onChange={(e) => toggleFeature(e.target.value)}
            />
            Transfer Seat
          </label>
          <label>
            <input
              type="checkbox"
              value="companionSeatIncluded"
              onChange={(e) => toggleFeature(e.target.value)}
            />
            Companion Seat Available
          </label>
        </div>
      )}

      <div className="accessibility-info">
        <p>For additional assistance, contact:</p>
        <a href={`mailto:${event.accessibilityEmail}`}>
          {event.accessibilityEmail}
        </a>
        <p>{event.accessibilityPhone}</p>
      </div>
    </div>
  );
}
```

**Companion Seat Selection**:
```typescript
// lib/seating/companion-seats.ts
export function findCompanionSeats(
  accessibleSeat: Seat,
  seatingChart: SeatingChart
): Seat[] {
  const section = seatingChart.sections.find(s =>
    s.seats.some(seat => seat.id === accessibleSeat.id)
  );

  if (!section) return [];

  // Find adjacent seats in same row
  const companionSeats = section.seats.filter(seat =>
    seat.row === accessibleSeat.row &&
    Math.abs(parseInt(seat.number) - parseInt(accessibleSeat.number)) === 1 &&
    (seat.isCompanion || seat.isAccessible === false) &&
    seat.status === 'AVAILABLE'
  );

  return companionSeats;
}
```

**Accessibility Verification (Honor System)**:
```typescript
// components/checkout/AccessibilityVerification.tsx
export function AccessibilityVerification({ onConfirm }: Props) {
  return (
    <div className="accessibility-verification">
      <h3>Accessible Seating Verification</h3>
      <p>
        You are purchasing accessible seating. This seating is reserved for
        individuals with accessibility needs and their companions.
      </p>
      <label>
        <input
          type="checkbox"
          required
        />
        I confirm that I or someone in my party requires accessible seating
      </label>
      <button onClick={onConfirm}>Continue to Checkout</button>
      <p className="text-sm text-gray-600">
        If you do not require accessible seating, please select different seats
        to ensure availability for those who need them.
      </p>
    </div>
  );
}
```

**Source Tree** (`docs/architecture/source-tree.md`):
```
src/
├── app/
│   ├── api/
│   │   └── seating/
│   │       ├── accessible/route.ts
│   │       └── companion-seats/route.ts
│   └── events/
│       └── [id]/
│           └── accessible-info/page.tsx
├── components/
│   └── seating/
│       ├── AccessibilityFilter.tsx
│       ├── AccessibleSeatMarker.tsx
│       ├── CompanionSeatSelector.tsx
│       └── AccessibilityInfo.tsx
└── lib/
    └── seating/
        ├── ada-compliance.ts
        ├── companion-seats.ts
        └── accessibility-validation.ts
```

### Testing

**Testing Requirements for this story**:
- Unit tests for ADA compliance validation
- Unit tests for companion seat finding
- Unit tests for accessibility filtering
- Integration test for accessible seat selection
- Integration test for companion seat pairing
- E2E test for full accessible booking flow
- E2E test for accessibility filter
- E2E test for organizer accessibility setup
- Accessibility audit with screen readers
- Keyboard navigation testing
- WCAG 2.1 AA compliance verification
- Test with assistive technologies
- User testing with people with disabilities

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