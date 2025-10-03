# Story: PAY-008 - Tax Calculation System

**Epic**: EPIC-003 - Payment Processing Foundation
**Story Points**: 3
**Priority**: P0 (Critical)
**Status**: Not Started
**Dependencies**: PAY-001 (Square SDK Integration), PAY-002 (Credit Card Processing)

---

## Story

**As a** platform administrator
**I want to** automatically calculate and apply sales tax based on event location
**So that** we comply with state and local tax regulations

---

## Acceptance Criteria

1. GIVEN an event has a physical venue location
   WHEN a customer purchases tickets
   THEN the system should:
   - Determine tax jurisdiction from venue address
   - Look up applicable state sales tax rate
   - Look up applicable local tax rates (city/county)
   - Calculate combined tax rate
   - Apply tax to taxable amount
   - Display tax breakdown to customer
   - Store tax calculation details in order

2. GIVEN tax rates are configured in the system
   WHEN viewing tax configuration
   THEN administrators should see:
   - State-by-state tax rates
   - Local tax rate overrides
   - Tax exemption categories
   - Last updated timestamps
   - Source of tax rate data
   - Ability to update rates manually

3. GIVEN a ticket purchase includes multiple ticket types
   WHEN calculating tax
   THEN the system should:
   - Apply tax to each ticket separately
   - Calculate tax on subtotal before fees
   - Not apply tax to platform fees (service fees typically exempt)
   - Handle mixed taxable/non-taxable items
   - Round tax amounts correctly (per regulations)
   - Store per-ticket tax amounts

4. GIVEN certain events may be tax-exempt
   WHEN organizer marks event as tax-exempt
   THEN the system should:
   - Require tax exemption documentation
   - Store exemption certificate details
   - Skip tax calculation for exempt events
   - Display "Tax Exempt" on checkout
   - Track exempt transactions separately
   - Allow admin override with audit trail

5. GIVEN tax calculations must be accurate
   WHEN system calculates tax
   THEN it should:
   - Use current tax rates at time of purchase
   - Handle nexus requirements by state
   - Calculate to 2 decimal places
   - Follow rounding rules (up to nearest cent)
   - Validate calculated tax before charge
   - Log all tax calculations for audit

6. GIVEN tax rates may change
   WHEN administrator updates tax rates
   THEN the system should:
   - Accept new tax rates with effective date
   - Apply new rates only to future purchases
   - Never retroactively change completed orders
   - Notify affected organizers of changes
   - Maintain historical tax rate records
   - Generate tax rate change audit log

---

## Tasks / Subtasks

- [ ] Design tax calculation system architecture (AC: 1, 5)
  - [ ] Define TaxService class interface
  - [ ] Design tax rate lookup system
  - [ ] Plan caching strategy for tax rates
  - [ ] Document tax calculation formulas

- [ ] Create tax rate database schema (AC: 2, 6)
  - [ ] Create TaxRate model with state/local rates
  - [ ] Create TaxExemption model
  - [ ] Add taxAmount field to Order model
  - [ ] Add taxRate field to Order model
  - [ ] Add taxBreakdown JSON field for details
  - [ ] Create migration scripts

- [ ] Build TaxService implementation (AC: 1, 3, 5)
  - [ ] File: `/lib/services/tax.service.ts`
  - [ ] Implement `calculateSalesTax()` method
  - [ ] Implement `getTaxRate()` for location lookup
  - [ ] Implement tax rounding logic
  - [ ] Add tax calculation validation
  - [ ] Cache tax rates for performance

- [ ] Integrate with venue/location system (AC: 1)
  - [ ] Extract state/zip from venue address
  - [ ] Implement geocoding fallback if needed
  - [ ] Handle venues without complete address
  - [ ] Default to organizer location if venue missing

- [ ] Add tax calculation to purchase flow (AC: 1, 3)
  - [ ] Update `/api/events/[eventId]/purchase` route
  - [ ] Calculate tax before payment processing
  - [ ] Include tax in Square payment amount
  - [ ] Store tax details in order record
  - [ ] Display tax breakdown in response

- [ ] Implement tax exemption system (AC: 4)
  - [ ] Create exemption certificate upload
  - [ ] Add exemption fields to Event model
  - [ ] Validate exemption documentation
  - [ ] Skip tax for exempt events
  - [ ] Add admin approval workflow

- [ ] Build tax rate management UI (AC: 2, 6)
  - [ ] Create `/app/admin/tax-rates/page.tsx`
  - [ ] Build state tax rate editor
  - [ ] Add local tax rate overrides
  - [ ] Implement bulk rate updates
  - [ ] Show rate change history

- [ ] Create tax reporting features (AC: 5, 6)
  - [ ] Generate daily tax collection reports
  - [ ] Build monthly tax summary by jurisdiction
  - [ ] Export tax data for filing
  - [ ] Create audit trail for tax calculations
  - [ ] Add tax reconciliation tools

- [ ] Add tax rate data seeding (AC: 2)
  - [ ] Research current US state sales tax rates
  - [ ] Create seed data for all 50 states
  - [ ] Add major city local tax rates
  - [ ] Document rate sources and dates
  - [ ] Add rate update check system

- [ ] Implement tax display in UI (AC: 1, 3)
  - [ ] Show tax breakdown in checkout
  - [ ] Display tax in order confirmation
  - [ ] Show tax on receipts
  - [ ] Add tax explanation tooltips

- [ ] Add comprehensive testing (AC: All)
  - [ ] Unit tests for tax calculations
  - [ ] Test all 50 state tax rates
  - [ ] Test tax exemption flows
  - [ ] Test rate change scenarios
  - [ ] Integration tests with purchase flow

- [ ] Create tax documentation (AC: All)
  - [ ] Document tax calculation logic
  - [ ] Create organizer tax guide
  - [ ] Add admin tax management docs
  - [ ] Document tax compliance requirements

---

## Dev Notes

### Architecture References
- **System Overview**: `/docs/architecture/system-overview.md`
- **Tax Architecture**: Section on tax calculation in payment processing
- **Database Schema**: `/prisma/schema.prisma` - Order, TaxRate models

### Source Tree
```
lib/services/
  └── tax.service.ts          # NEW: Tax calculation service
app/api/events/[eventId]/
  └── purchase/route.ts        # MODIFY: Add tax calculation
app/admin/tax-rates/
  └── page.tsx                 # NEW: Tax rate management UI
prisma/
  └── schema.prisma            # MODIFY: Add TaxRate model
```

### Technical Considerations

**Tax Rate Lookup Strategy**:
```typescript
// Priority order for tax rate determination:
1. Venue address → state + local rates
2. Organizer address → state rate only
3. Platform default → 0% (mark as needs review)
```

**US Sales Tax Nexus**:
- Apply tax if event is in state where platform has nexus
- Most states: Physical presence = nexus
- Economic nexus thresholds vary by state
- Marketplace facilitator laws apply in some states

**Tax Calculation Formula**:
```
Taxable Amount = Ticket Price × Quantity
Tax Rate = State Rate + Local Rate
Tax Amount = ROUNDUP(Taxable Amount × Tax Rate, 2)
Total = Taxable Amount + Tax Amount + Platform Fees
```

**Tax-Exempt Events**:
- Non-profit events (with 501(c)(3) documentation)
- Government events
- Educational institution events
- Religious organization events
- Require valid exemption certificate on file

**Compliance Requirements**:
- Store tax calculation details for 7 years (IRS requirement)
- Provide detailed tax reports for organizers
- File and remit taxes according to state requirements
- Update tax rates quarterly (or as states announce changes)

### Sample Tax Rates (As of 2024)
```typescript
const STATE_TAX_RATES = {
  'CA': 0.0725,  // California base rate
  'TX': 0.0625,  // Texas rate
  'NY': 0.04,    // New York rate
  'FL': 0.06,    // Florida rate
  // ... all 50 states
};

// Local rates must be added per city/county
const LOCAL_TAX_OVERRIDES = {
  'CA-LOS-ANGELES': 0.0250,  // LA County add-on
  'TX-AUSTIN': 0.0200,       // Austin add-on
  // ... major cities
};
```

### API Integration
- Update Square payment amount to include tax
- Store tax details in Square payment metadata
- Link tax amounts to Square order items

### Testing Strategy
- Test with all 50 state tax rates
- Verify rounding to 2 decimal places
- Test exemption certificate validation
- Verify historical rate preservation
- Load test with high transaction volume

---

## Testing

### Unit Tests
- Tax rate lookup by state/zip
- Tax calculation accuracy
- Rounding logic correctness
- Exemption validation
- Rate change handling

### Integration Tests
- Full purchase flow with tax
- Tax exemption end-to-end
- Rate update scenarios
- Multi-state event handling

### Performance Tests
- Tax calculation speed (<50ms)
- Rate lookup caching effectiveness
- Concurrent tax calculations

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-09-29 | BMAD SM Agent | Initial story creation |

---

## Dev Agent Record

**Status**: Not Started
**Assigned To**: TBD
**Started**: TBD
**Completed**: TBD

**Implementation Notes**:
- TBD during development

**Blockers**:
- None

---

## QA Results

**Status**: Not Tested
**Tested By**: TBD
**Test Date**: TBD

**Test Results**:
- TBD

**Issues Found**:
- TBD

---

*Generated by BMAD Scrum Master (SM) Agent - Story Management System*