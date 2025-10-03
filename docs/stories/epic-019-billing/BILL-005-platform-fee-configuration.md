# BILL-005: Platform Fee Configuration

**Epic:** EPIC-019 - Platform Billing & Revenue
**Story Points:** 3
**Priority:** P2 (Medium)
**Status:** Ready for Development

## User Story

**As a** platform administrator
**I want** to dynamically configure platform fee rates and structures
**So that** I can optimize pricing, run promotions, and offer custom rates to enterprise clients

## Acceptance Criteria

### Primary Criteria
- [ ] Admin can create and manage fee rules
- [ ] Support for flat fee + percentage fee structure
- [ ] Effective date scheduling for fee changes
- [ ] Fee rules can be scoped by: global, organizer, event, event type
- [ ] Volume-based tiering (lower rates for high-volume organizers)
- [ ] Promotional pricing with start/end dates
- [ ] Fee rule versioning and audit trail
- [ ] Preview fee impact before applying changes

### Fee Rule Types
- [ ] Global default fee (applies to all transactions)
- [ ] Organizer-specific fee (custom rates for specific organizers)
- [ ] Event-specific fee (special pricing for specific events)
- [ ] Event type fee (different rates for conferences vs. concerts)
- [ ] Volume tier fee (reduced rates based on ticket volume)
- [ ] Promotional fee (temporary reduced rates)

### Admin Interface
- [ ] Fee rule creation form with validation
- [ ] Fee rule listing with search and filters
- [ ] Fee rule edit and deactivation
- [ ] Preview impact of fee changes (estimated revenue change)
- [ ] Bulk import/export of fee rules (CSV)
- [ ] Fee rule approval workflow (optional)

## Technical Specifications

### Fee Configuration Service

**File:** `lib/services/fee-configuration.service.ts`

```typescript
enum FeeRuleType {
  GLOBAL_DEFAULT = 'GLOBAL_DEFAULT',
  ORGANIZER_SPECIFIC = 'ORGANIZER_SPECIFIC',
  EVENT_SPECIFIC = 'EVENT_SPECIFIC',
  EVENT_TYPE = 'EVENT_TYPE',
  VOLUME_TIER = 'VOLUME_TIER',
  PROMOTIONAL = 'PROMOTIONAL'
}

enum FeeRuleStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  SCHEDULED = 'SCHEDULED',
  EXPIRED = 'EXPIRED',
  DEACTIVATED = 'DEACTIVATED'
}

interface FeeRule {
  id: string
  name: string
  description: string
  type: FeeRuleType
  status: FeeRuleStatus

  // Fee structure
  flatFee: number // In cents: 50 = $0.50
  percentageFee: number // As decimal: 0.029 = 2.9%

  // Scope
  organizerId?: string // For organizer-specific rules
  eventId?: string // For event-specific rules
  eventType?: string // e.g., "concert", "conference"

  // Volume tiers (for VOLUME_TIER type)
  volumeTiers?: Array<{
    minVolume: number // Minimum monthly ticket sales
    maxVolume: number | null // null = unlimited
    flatFee: number
    percentageFee: number
  }>

  // Schedule
  effectiveDate: Date
  expirationDate?: Date

  // Priority (higher number = higher priority)
  priority: number

  // Metadata
  createdBy: string
  approvedBy?: string
  version: number
  metadata: any

  createdAt: Date
  updatedAt: Date
}

class FeeConfigurationService {
  /**
   * Get applicable fee rule for a transaction
   * Considers priority, scope, and effective dates
   */
  async getApplicableFeeRule(context: {
    organizerId: string
    eventId?: string
    eventType?: string
    transactionDate: Date
  }): Promise<FeeRule>

  /**
   * Calculate fee using applicable rule
   */
  async calculateFee(
    ticketPrice: number,
    context: FeeRuleContext
  ): Promise<{
    flatFee: number
    percentageFee: number
    totalFee: number
    appliedRuleId: string
  }>

  /**
   * Create new fee rule
   */
  async createFeeRule(rule: CreateFeeRuleInput): Promise<FeeRule>

  /**
   * Update existing fee rule
   */
  async updateFeeRule(
    ruleId: string,
    updates: UpdateFeeRuleInput
  ): Promise<FeeRule>

  /**
   * Deactivate fee rule
   */
  async deactivateFeeRule(ruleId: string): Promise<void>

  /**
   * Preview fee impact
   */
  async previewFeeImpact(rule: FeeRule): Promise<{
    affectedOrganizers: number
    affectedEvents: number
    estimatedRevenueChange: number
    projectedMonthlyRevenue: number
  }>

  /**
   * Get organizer's current fee rate
   */
  async getOrganizerFeeRate(organizerId: string): Promise<FeeRule>

  /**
   * Apply volume tier (check monthly volume and adjust rate)
   */
  async applyVolumeTier(organizerId: string): Promise<void>
}
```

### Database Schema

**Table:** `fee_rules`

```sql
CREATE TYPE fee_rule_type AS ENUM (
  'GLOBAL_DEFAULT', 'ORGANIZER_SPECIFIC', 'EVENT_SPECIFIC',
  'EVENT_TYPE', 'VOLUME_TIER', 'PROMOTIONAL'
);

CREATE TYPE fee_rule_status AS ENUM (
  'DRAFT', 'ACTIVE', 'SCHEDULED', 'EXPIRED', 'DEACTIVATED'
);

CREATE TABLE fee_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Rule details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type fee_rule_type NOT NULL,
  status fee_rule_status NOT NULL DEFAULT 'DRAFT',

  -- Fee structure
  flat_fee DECIMAL(10,2) NOT NULL DEFAULT 0.50,
  percentage_fee DECIMAL(5,4) NOT NULL DEFAULT 0.0290,

  -- Scope
  organizer_id UUID REFERENCES users(id),
  event_id UUID REFERENCES events(id),
  event_type VARCHAR(100),

  -- Schedule
  effective_date DATE NOT NULL,
  expiration_date DATE,

  -- Priority (higher = more specific, takes precedence)
  priority INTEGER NOT NULL DEFAULT 0,

  -- Volume tiers (JSONB for flexibility)
  volume_tiers JSONB,
  /* Example:
  [
    {
      "minVolume": 0,
      "maxVolume": 100,
      "flatFee": 0.50,
      "percentageFee": 0.029
    },
    {
      "minVolume": 100,
      "maxVolume": 1000,
      "flatFee": 0.40,
      "percentageFee": 0.025
    },
    {
      "minVolume": 1000,
      "maxVolume": null,
      "flatFee": 0.30,
      "percentageFee": 0.020
    }
  ]
  */

  -- Audit
  created_by UUID NOT NULL REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  version INTEGER NOT NULL DEFAULT 1,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_dates CHECK (
    expiration_date IS NULL OR expiration_date > effective_date
  ),
  CONSTRAINT positive_fees CHECK (
    flat_fee >= 0 AND percentage_fee >= 0
  )
);

CREATE INDEX idx_fee_rules_type ON fee_rules(type);
CREATE INDEX idx_fee_rules_status ON fee_rules(status);
CREATE INDEX idx_fee_rules_organizer ON fee_rules(organizer_id);
CREATE INDEX idx_fee_rules_event ON fee_rules(event_id);
CREATE INDEX idx_fee_rules_effective_date ON fee_rules(effective_date);
CREATE INDEX idx_fee_rules_priority ON fee_rules(priority DESC);
```

**Table:** `fee_rule_history` (Versioning and audit trail)

```sql
CREATE TABLE fee_rule_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_rule_id UUID NOT NULL REFERENCES fee_rules(id),

  -- Snapshot of rule at this version
  version INTEGER NOT NULL,
  rule_snapshot JSONB NOT NULL, -- Full rule data

  -- Change tracking
  change_type VARCHAR(50) NOT NULL, -- created, updated, deactivated
  changed_by UUID REFERENCES users(id),
  change_reason TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_rule_version UNIQUE (fee_rule_id, version)
);

CREATE INDEX idx_fee_rule_history_rule ON fee_rule_history(fee_rule_id);
CREATE INDEX idx_fee_rule_history_date ON fee_rule_history(created_at);
```

### Fee Rule Priority System

Priority determines which rule applies when multiple rules match:

```typescript
// Priority order (higher number = higher priority):
const PRIORITY_LEVELS = {
  EVENT_SPECIFIC: 100,      // Highest: Specific event override
  ORGANIZER_SPECIFIC: 80,   // Organizer custom rate
  VOLUME_TIER: 60,          // Volume-based pricing
  PROMOTIONAL: 50,          // Promotional pricing
  EVENT_TYPE: 40,           // Event category pricing
  GLOBAL_DEFAULT: 0         // Lowest: Default platform rate
}

// Example: If organizer has both custom rate and volume tier,
// custom rate (priority 80) takes precedence over volume tier (priority 60)
```

### Fee Rule Selection Algorithm

```typescript
async function getApplicableFeeRule(context: FeeRuleContext): Promise<FeeRule> {
  const now = context.transactionDate || new Date()

  // Query all potentially applicable rules
  const candidateRules = await db.feeRules.findMany({
    where: {
      status: 'ACTIVE',
      effectiveDate: { lte: now },
      OR: [
        { expirationDate: null },
        { expirationDate: { gte: now } }
      ],
      OR: [
        // Event-specific rule
        { type: 'EVENT_SPECIFIC', eventId: context.eventId },
        // Organizer-specific rule
        { type: 'ORGANIZER_SPECIFIC', organizerId: context.organizerId },
        // Event type rule
        { type: 'EVENT_TYPE', eventType: context.eventType },
        // Volume tier (check monthly volume)
        { type: 'VOLUME_TIER' },
        // Promotional rule
        { type: 'PROMOTIONAL' },
        // Global default
        { type: 'GLOBAL_DEFAULT' }
      ]
    },
    orderBy: [
      { priority: 'desc' },
      { effectiveDate: 'desc' } // Newer rules preferred
    ]
  })

  // Return highest priority rule
  return candidateRules[0] || getGlobalDefaultRule()
}
```

### API Endpoints

**POST /api/admin/fee-rules**
```typescript
// Create fee rule (admin only)
Request: {
  name: string
  description?: string
  type: FeeRuleType
  flatFee: number
  percentageFee: number
  organizerId?: string
  eventId?: string
  eventType?: string
  volumeTiers?: VolumeTier[]
  effectiveDate: string
  expirationDate?: string
  priority?: number
}

Response: {
  feeRule: FeeRule
}
```

**PUT /api/admin/fee-rules/:id**
```typescript
// Update fee rule (creates new version)
Request: {
  name?: string
  description?: string
  flatFee?: number
  percentageFee?: number
  effectiveDate?: string
  expirationDate?: string
  status?: FeeRuleStatus
}

Response: {
  feeRule: FeeRule
  version: number
}
```

**DELETE /api/admin/fee-rules/:id**
```typescript
// Deactivate fee rule
Response: {
  success: boolean
}
```

**GET /api/admin/fee-rules**
```typescript
// List fee rules
Query: {
  type?: FeeRuleType
  status?: FeeRuleStatus
  organizerId?: string
  page: number
  limit: number
}

Response: {
  feeRules: FeeRule[]
  total: number
  page: number
  totalPages: number
}
```

**POST /api/admin/fee-rules/:id/preview-impact**
```typescript
// Preview impact of fee rule
Response: {
  affectedOrganizers: number
  affectedEvents: number
  currentMonthlyRevenue: number
  projectedMonthlyRevenue: number
  revenueChange: number
  revenueChangePercent: number
}
```

**GET /api/organizer/current-fee-rate**
```typescript
// Get organizer's current fee rate (organizer-facing)
Response: {
  feeRule: FeeRule
  flatFee: number
  percentageFee: number
  effectiveDate: string
  expirationDate?: string
  nextScheduledChange?: {
    effectiveDate: string
    flatFee: number
    percentageFee: number
  }
}
```

## Integration Points

### 1. Transaction Billing (BILL-001)
- Query applicable fee rule before calculating fee
- Store applied rule ID with each transaction fee
- Support fee rule changes without affecting historical data

### 2. Revenue Distribution (BILL-003)
- Use current fee rule for revenue split
- Track which rule was applied to each transaction

### 3. Admin Dashboard
- Display current fee configuration
- Show fee rule management interface
- Preview revenue impact of changes

### 4. Organizer Dashboard
- Display current fee rate to organizers
- Show upcoming fee changes (if any)
- Explain fee structure clearly

## Business Rules

### Global Default Fee Rule
- Always have one active global default rule
- Cannot delete global default (only update)
- Serves as fallback when no other rules apply
- Initial configuration: $0.50 + 2.9%

### Fee Rule Effective Dates
- Fee changes take effect at midnight UTC on effective date
- Transactions use fee rule active at transaction time
- Historical transactions not affected by rule changes

### Volume Tier Calculation
- Monthly ticket volume calculated from 1st to last day of month
- Tier adjustment happens automatically at month start
- Notification sent to organizer when tier changes
- Volume resets each month

### Promotional Pricing
- Must have expiration date
- Automatically expires and reverts to previous rule
- Can be stacked with other rules (priority determines precedence)
- Example: Black Friday special: 50% off fees for 3 days

### Enterprise Custom Rates
- Negotiated with sales team
- Created as organizer-specific rule
- No expiration date (unless contract specifies)
- Highest priority (except event-specific overrides)

### Fee Rule Approval Workflow (Optional)
1. Admin creates rule in DRAFT status
2. Finance approves rule (moves to SCHEDULED or ACTIVE)
3. Rule takes effect on effective date
4. Automatic email notification to affected organizers

## UI/UX Specifications

### Fee Rule Management Dashboard

```tsx
// Admin interface
<FeeRulesDashboard>
  <FeeRuleStats
    activeRules={count}
    scheduledRules={count}
    totalOrganizersWithCustomRates={count}
  />

  <FeeRuleFilters
    type={FeeRuleType}
    status={FeeRuleStatus}
    search={string}
  />

  <FeeRulesList
    rules={feeRules}
    onEdit={handleEdit}
    onDeactivate={handleDeactivate}
    onPreviewImpact={handlePreview}
  />

  <CreateFeeRuleButton />
</FeeRulesDashboard>
```

### Create/Edit Fee Rule Form

```tsx
<FeeRuleForm>
  <Input label="Rule Name" required />
  <Textarea label="Description" />

  <Select label="Rule Type" options={FeeRuleType} />

  {/* Conditional fields based on type */}
  {type === 'ORGANIZER_SPECIFIC' && (
    <OrganizerSelector />
  )}

  {type === 'EVENT_SPECIFIC' && (
    <EventSelector />
  )}

  {type === 'VOLUME_TIER' && (
    <VolumeTierBuilder />
  )}

  <FeeStructureInputs>
    <CurrencyInput label="Flat Fee" />
    <PercentInput label="Percentage Fee" />
  </FeeStructureInputs>

  <DatePicker label="Effective Date" required />
  <DatePicker label="Expiration Date" optional />

  <FeePreview
    examplePrice={100}
    calculatedFee={calculateFee(100)}
  />

  <Button>Preview Impact</Button>
  <Button type="submit">Save Rule</Button>
</FeeRuleForm>
```

### Volume Tier Builder

```tsx
<VolumeTierBuilder>
  <Table>
    <thead>
      <tr>
        <th>Min Volume</th>
        <th>Max Volume</th>
        <th>Flat Fee</th>
        <th>Percentage Fee</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {tiers.map(tier => (
        <tr key={tier.id}>
          <td><Input value={tier.minVolume} /></td>
          <td><Input value={tier.maxVolume} /></td>
          <td><CurrencyInput value={tier.flatFee} /></td>
          <td><PercentInput value={tier.percentageFee} /></td>
          <td><Button onClick={() => removeTier(tier.id)}>Remove</Button></td>
        </tr>
      ))}
    </tbody>
  </Table>
  <Button onClick={addTier}>Add Tier</Button>
</VolumeTierBuilder>
```

### Fee Impact Preview

```tsx
<FeeImpactPreview>
  <Stat label="Affected Organizers" value={50} />
  <Stat label="Affected Events" value={120} />
  <Stat label="Current Monthly Revenue" value="$10,500" />
  <Stat label="Projected Monthly Revenue" value="$9,800" />
  <Stat label="Revenue Change" value="-$700 (-6.7%)" danger />

  <Chart data={revenueProjection} />
</FeeImpactPreview>
```

## Testing Requirements

### Unit Tests
- Fee rule selection algorithm
- Priority-based rule matching
- Volume tier calculation
- Effective date validation
- Fee calculation with different rules

### Integration Tests
- Create and apply fee rule
- Update fee rule and verify versioning
- Deactivate rule and verify fallback
- Volume tier promotion workflow
- Promotional pricing expiration

### E2E Tests
- Admin creates custom fee for enterprise client
- Volume tier automatically adjusts organizer fee
- Promotional pricing starts and expires
- Fee rule change preview accuracy

## Performance Requirements

- Fee rule lookup: < 50ms (indexed, cached)
- Fee calculation: < 10ms
- Fee impact preview: < 5 seconds
- Fee rule listing: < 1 second
- Volume tier calculation (monthly job): < 30 minutes

## Security Considerations

- Only super admin role can manage fee rules
- Fee rule changes require audit logging
- Prevent SQL injection in rule queries
- Validate all fee amounts (no negative fees)
- Rate limit admin API endpoints

## Monitoring & Alerts

### Metrics to Track
- Number of active fee rules
- Revenue by fee rule type
- Volume tier distribution of organizers
- Promotional pricing effectiveness

### Alerts
- No global default rule found
- Fee rule conflict detected (multiple same-priority rules)
- Unexpected revenue drop after fee change
- Volume tier promotion failures

## Documentation Requirements

- [ ] Fee rule types and use cases
- [ ] Priority system explanation
- [ ] Volume tier configuration guide
- [ ] Promotional pricing setup guide
- [ ] API documentation for fee endpoints

## Dependencies

- BILL-001: Flat-Fee Transaction Billing (update to use dynamic fees)
- BILL-003: Revenue Distribution (update to use dynamic fees)
- Admin dashboard UI framework

## Definition of Done

- [ ] Fee configuration service implemented
- [ ] Database schema created with indexes
- [ ] Fee rule selection algorithm tested
- [ ] API endpoints deployed and documented
- [ ] Admin UI for fee rule management complete
- [ ] Volume tier calculation job implemented
- [ ] Fee impact preview working
- [ ] Integration with transaction billing complete
- [ ] All tests passing (unit, integration, E2E)
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Monitoring configured
- [ ] Documentation published

## Notes

**Backward Compatibility:** Existing transactions with hardcoded fees ($0.50 + 2.9%) remain unchanged. Only new transactions use dynamic fee configuration.

**Fee Rule Versioning:** When updating a fee rule, create a new version. This allows tracking historical fee structures and auditing changes.

**A/B Testing:** Future enhancement could allow A/B testing different fee structures to optimize revenue.

**Tax Implications:** Fee changes may affect tax calculations. Ensure tax system is updated accordingly.

**Migration Plan:** Migrate existing hardcoded fee structure to a global default fee rule during deployment.