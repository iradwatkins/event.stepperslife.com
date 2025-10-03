# ORG-008b: Dimension & Metric Selection Logic

**Epic:** EPIC-007 - Organizer Dashboard & Analytics
**Parent Story:** ORG-008 - Custom Report Builder
**Story Points:** 2
**Priority:** High
**Status:** Ready for Development

## User Story
As an **event organizer**
I want to **select from a comprehensive list of dimensions and metrics for my reports**
So that **I can analyze every aspect of my event data with proper validation and guidance**

## Parent Story Context
This is the second sub-story of ORG-008: Custom Report Builder (8 points). This story implements the complete dimension and metric catalog system that populates the drag-and-drop UI created in ORG-008a.

**Sharding Strategy:**
- **ORG-008a**: UI & Drag-Drop Interface (3 points) ✓ Foundation
- **ORG-008b** (this story): Dimension & Metric Selection Logic (2 points)
- **ORG-008c**: Query Engine & Data Aggregation (3 points)
- **ORG-008d**: Report Saving & Template System (2 points)

**Integration Points:**
- Consumes UI components from ORG-008a (LeftSidebar, DraggableItem)
- Provides dimension/metric metadata to ORG-008c query engine
- Dimensions/metrics will be persisted by ORG-008d save system

## Acceptance Criteria

### AC1: Dimension Catalog (15+ Dimensions)
- [ ] Define comprehensive dimension registry:
  - **Time Dimensions** (6):
    - Date (YYYY-MM-DD)
    - Day of Week (Monday-Sunday)
    - Hour (0-23)
    - Month (January-December)
    - Quarter (Q1-Q4)
    - Year (YYYY)
  - **Event Dimensions** (4):
    - Event Name
    - Event Type (Dance, Workshop, Social)
    - Venue
    - Event Status (Published, Draft, Cancelled)
  - **Ticket Dimensions** (3):
    - Ticket Type Name
    - Price Tier (Free, Regular, VIP)
    - Discount Code Used
  - **Customer Dimensions** (5):
    - Age Group (18-24, 25-34, 35-44, 45-54, 55+)
    - City
    - State/Province
    - Country
    - Customer Type (New, Returning)
  - **Order Dimensions** (4):
    - Payment Method (Card, Cash, Other)
    - Order Source (Direct, UTM campaign)
    - Device Type (Desktop, Mobile, Tablet)
    - Referral Source
- [ ] Each dimension has metadata:
  - `id`: Unique identifier
  - `field`: Database field mapping (e.g., "event.name")
  - `label`: Display name
  - `category`: Group (Time, Event, Ticket, Customer, Order)
  - `dataType`: 'string' | 'number' | 'date' | 'enum'
  - `icon`: Icon identifier
  - `description`: Help text explaining the dimension

### AC2: Metric Catalog (20+ Metrics)
- [ ] Define comprehensive metric registry:
  - **Sales Metrics** (4):
    - Tickets Sold (Count)
    - Revenue (Sum, Currency)
    - Average Order Value (Avg, Currency)
    - Units per Transaction (Avg, Number)
  - **Financial Metrics** (5):
    - Gross Revenue (Sum, Currency)
    - Net Revenue (Calculated: Gross - Fees)
    - Platform Fees (Sum, Currency)
    - Processing Fees (Sum, Currency)
    - Refunds (Sum, Currency)
  - **Attendance Metrics** (3):
    - Check-ins (Count)
    - No-shows (Count)
    - Check-in Rate (Percentage: Check-ins / Tickets Sold)
  - **Conversion Metrics** (3):
    - Page Views (Count)
    - Conversion Rate (Percentage: Orders / Page Views)
    - Cart Abandonment Rate (Percentage)
  - **Customer Metrics** (3):
    - Unique Customers (Distinct Count)
    - Repeat Customer Rate (Percentage)
    - Customer Lifetime Value (Avg, Currency)
  - **Marketing Metrics** (3):
    - Cost per Acquisition (Calculated: Ad Spend / Customers)
    - Return on Ad Spend (Calculated: Revenue / Ad Spend)
    - Click-through Rate (Percentage)
- [ ] Each metric has metadata:
  - `id`: Unique identifier
  - `field`: Database field or calculation
  - `label`: Display name
  - `category`: Group (Sales, Financial, Attendance, etc.)
  - `aggregation`: 'sum' | 'avg' | 'count' | 'distinct' | 'calculated'
  - `format`: 'number' | 'currency' | 'percentage'
  - `icon`: Icon identifier
  - `description`: Help text
  - `calculation`: Formula for calculated metrics

### AC3: Left Sidebar Population
- [ ] Populate left sidebar with dimension/metric lists
- [ ] Collapsible category sections:
  - Dimensions (expandable by category: Time, Event, Ticket, etc.)
  - Metrics (expandable by category: Sales, Financial, etc.)
- [ ] Search/filter box at top:
  - Filters both dimensions and metrics
  - Highlights matching text
  - Shows count of results
- [ ] Each item shows:
  - Icon (category-specific)
  - Label
  - Description on hover (tooltip)
  - Drag handle (⋮⋮)
- [ ] Recently used section (last 5 items)
- [ ] Favorites system (star icon to favorite, separate section)

### AC4: Validation Rules
- [ ] Dimension validation:
  - Dimensions can be dropped in Rows or Columns zones only
  - Maximum 3 dimensions in Rows
  - Maximum 2 dimensions in Columns
  - No duplicate dimensions across zones
- [ ] Metric validation:
  - Metrics can only be dropped in Values zone
  - Maximum 5 metrics in Values
  - No duplicate metrics
  - Calculated metrics require dependency metrics (validate formula)
- [ ] Combination validation:
  - Certain dimensions incompatible with certain metrics
  - Example: "Hour" dimension requires date range ≤ 7 days
  - Example: "Customer Lifetime Value" requires Customer dimension
- [ ] Visual feedback:
  - Invalid drop zones show red border
  - Error toast with explanation
  - Validation icon on incompatible items

### AC5: Dimension Hierarchies
- [ ] Support hierarchical dimensions (drill-down):
  - **Time Hierarchy**: Year → Quarter → Month → Date → Day of Week → Hour
  - **Location Hierarchy**: Country → State → City
  - **Event Hierarchy**: Event Type → Event Name → Ticket Type
- [ ] Visual indicator for hierarchical dimensions (▸ icon)
- [ ] Context menu on dropped dimension:
  - "Drill down" option (adds child dimension below)
  - "Roll up" option (removes child dimension)
- [ ] Auto-sort by hierarchy level

### AC6: Calculated Metrics Builder
- [ ] UI to create custom calculated metrics:
  - Formula input with autocomplete
  - Supported operators: +, -, *, /, ()
  - Reference existing metrics by name
  - Example: `Net Revenue = Gross Revenue - Platform Fees - Processing Fees`
- [ ] Formula validation:
  - Check syntax
  - Verify referenced metrics exist
  - Prevent circular dependencies
  - Show preview calculation with sample data
- [ ] Save calculated metrics to user's library (persisted per organizer)
- [ ] Edit/delete calculated metrics

### AC7: Metric Aggregation Options
- [ ] When metric dropped, show aggregation selector:
  - Sum (default for currency/quantity)
  - Average
  - Count
  - Min
  - Max
  - Distinct Count (for unique values)
- [ ] Context menu on dropped metric:
  - Change aggregation
  - Change format (number, currency, percentage)
  - Add comparison (vs Previous Period, vs Same Period Last Year)
- [ ] Show aggregation in chip label: "Revenue (Sum)"

### AC8: Dimension/Metric Descriptions & Help
- [ ] Tooltip on hover shows:
  - Full description
  - Data type
  - Example values
  - "Learn more" link to docs
- [ ] Help panel (? icon in sidebar):
  - Explains dimensions vs metrics
  - Best practices (which combinations work well)
  - Video tutorial embed
- [ ] Suggested combinations:
  - When dimension dropped, suggest compatible metrics
  - "Users who used 'Event Name' also added 'Revenue' and 'Tickets Sold'"

## Technical Implementation

### Dimension Registry
```typescript
// /lib/analytics/dimensionRegistry.ts
export interface Dimension {
  id: string;
  field: string;
  label: string;
  category: 'time' | 'event' | 'ticket' | 'customer' | 'order' | 'marketing';
  dataType: 'string' | 'number' | 'date' | 'enum';
  icon: string;
  description: string;
  hierarchy?: {
    level: number;
    parent?: string;
    children?: string[];
  };
  sqlMapping: string; // How to extract from DB
  exampleValues?: string[];
}

export const DIMENSION_REGISTRY: Dimension[] = [
  // Time Dimensions
  {
    id: 'dim_date',
    field: 'date',
    label: 'Date',
    category: 'time',
    dataType: 'date',
    icon: '📅',
    description: 'The date when the order was placed',
    hierarchy: { level: 3, parent: 'dim_month', children: ['dim_day_of_week', 'dim_hour'] },
    sqlMapping: 'DATE(o.createdAt)',
    exampleValues: ['2025-09-01', '2025-09-02']
  },
  {
    id: 'dim_month',
    field: 'month',
    label: 'Month',
    category: 'time',
    dataType: 'enum',
    icon: '📆',
    description: 'The month when the order was placed',
    hierarchy: { level: 2, parent: 'dim_quarter', children: ['dim_date'] },
    sqlMapping: 'DATE_FORMAT(o.createdAt, "%Y-%m")',
    exampleValues: ['2025-09', '2025-10']
  },
  // Event Dimensions
  {
    id: 'dim_event_name',
    field: 'event.name',
    label: 'Event Name',
    category: 'event',
    dataType: 'string',
    icon: '🎉',
    description: 'The name of the event',
    hierarchy: { level: 2, parent: 'dim_event_type', children: ['dim_ticket_type'] },
    sqlMapping: 'e.name',
    exampleValues: ['Summer Dance', 'Winter Gala']
  },
  // ... more dimensions
];

export function getDimensionById(id: string): Dimension | undefined {
  return DIMENSION_REGISTRY.find(d => d.id === id);
}

export function getDimensionsByCategory(category: string): Dimension[] {
  return DIMENSION_REGISTRY.filter(d => d.category === category);
}

export function searchDimensions(query: string): Dimension[] {
  const lowerQuery = query.toLowerCase();
  return DIMENSION_REGISTRY.filter(d =>
    d.label.toLowerCase().includes(lowerQuery) ||
    d.description.toLowerCase().includes(lowerQuery)
  );
}
```

### Metric Registry
```typescript
// /lib/analytics/metricRegistry.ts
export interface Metric {
  id: string;
  field: string;
  label: string;
  category: 'sales' | 'financial' | 'attendance' | 'conversion' | 'customer' | 'marketing';
  aggregation: 'sum' | 'avg' | 'count' | 'distinct' | 'calculated';
  format: 'number' | 'currency' | 'percentage';
  icon: string;
  description: string;
  sqlMapping?: string; // For direct DB fields
  calculation?: string; // For calculated metrics (formula)
  dependsOn?: string[]; // Other metric IDs required
}

export const METRIC_REGISTRY: Metric[] = [
  // Sales Metrics
  {
    id: 'metric_tickets_sold',
    field: 'ticketsSold',
    label: 'Tickets Sold',
    category: 'sales',
    aggregation: 'sum',
    format: 'number',
    icon: '🎫',
    description: 'Total number of tickets sold',
    sqlMapping: 'SUM(oi.quantity)'
  },
  {
    id: 'metric_revenue',
    field: 'revenue',
    label: 'Revenue',
    category: 'sales',
    aggregation: 'sum',
    format: 'currency',
    icon: '💰',
    description: 'Total revenue from ticket sales',
    sqlMapping: 'SUM(o.totalAmount)'
  },
  // Financial Metrics
  {
    id: 'metric_net_revenue',
    field: 'netRevenue',
    label: 'Net Revenue',
    category: 'financial',
    aggregation: 'calculated',
    format: 'currency',
    icon: '💵',
    description: 'Revenue minus platform and processing fees',
    calculation: 'revenue - platformFees - processingFees',
    dependsOn: ['metric_revenue', 'metric_platform_fees', 'metric_processing_fees']
  },
  // ... more metrics
];
```

### Validation Service
```typescript
// /lib/analytics/validationService.ts
export class ValidationService {
  validateDrop(
    item: Dimension | Metric,
    targetZone: 'rows' | 'columns' | 'values',
    currentState: ReportBuilderState
  ): ValidationResult {
    // Type validation
    if (this.isDimension(item) && targetZone === 'values') {
      return {
        valid: false,
        error: 'Dimensions cannot be used as metrics. Drop dimensions in Rows or Columns.'
      };
    }

    if (this.isMetric(item) && targetZone !== 'values') {
      return {
        valid: false,
        error: 'Metrics can only be dropped in the Values zone.'
      };
    }

    // Capacity validation
    const currentCount = currentState[targetZone].length;
    const maxCapacity = this.getMaxCapacity(targetZone);

    if (currentCount >= maxCapacity) {
      return {
        valid: false,
        error: `Maximum ${maxCapacity} items allowed in ${targetZone}`
      };
    }

    // Duplicate validation
    const isDuplicate = currentState[targetZone].some(existing => existing.id === item.id);
    if (isDuplicate) {
      return {
        valid: false,
        error: 'This item is already in the report'
      };
    }

    // Combination validation
    if (this.isDimension(item)) {
      const incompatibleMetrics = this.checkIncompatibleMetrics(item as Dimension, currentState);
      if (incompatibleMetrics.length > 0) {
        return {
          valid: false,
          error: `This dimension is incompatible with: ${incompatibleMetrics.join(', ')}`
        };
      }
    }

    return { valid: true };
  }

  private checkIncompatibleMetrics(dimension: Dimension, state: ReportBuilderState): string[] {
    const incompatible: string[] = [];

    // Example: Hour dimension requires date range ≤ 7 days
    if (dimension.id === 'dim_hour') {
      // Check if date range is set (will be validated in ORG-008c)
      incompatible.push('Requires date range ≤ 7 days');
    }

    return incompatible;
  }
}
```

### Left Sidebar Component
```typescript
// /components/dashboard/analytics/ReportBuilder/LeftSidebar.tsx
import { DIMENSION_REGISTRY, METRIC_REGISTRY } from '@/lib/analytics/registry';
import { useState } from 'react';

export function LeftSidebar({ isOpen, onToggle }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<string[]>(['time', 'sales']);

  const filteredDimensions = searchQuery
    ? searchDimensions(searchQuery)
    : DIMENSION_REGISTRY;

  const filteredMetrics = searchQuery
    ? searchMetrics(searchQuery)
    : METRIC_REGISTRY;

  return (
    <aside className={cn('left-sidebar', !isOpen && 'collapsed')}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Items</h2>
          <button onClick={onToggle} className="text-gray-500">
            <CollapseIcon />
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search dimensions & metrics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg mb-4"
        />

        {/* Dimensions */}
        <Section title="Dimensions" defaultExpanded>
          {Object.entries(groupByCategory(filteredDimensions)).map(([category, items]) => (
            <CategoryGroup
              key={category}
              category={category}
              items={items}
              expanded={expandedSections.includes(category)}
              onToggle={() => toggleSection(category)}
            />
          ))}
        </Section>

        {/* Metrics */}
        <Section title="Metrics" defaultExpanded>
          {Object.entries(groupByCategory(filteredMetrics)).map(([category, items]) => (
            <CategoryGroup
              key={category}
              category={category}
              items={items}
              expanded={expandedSections.includes(category)}
              onToggle={() => toggleSection(category)}
            />
          ))}
        </Section>
      </div>
    </aside>
  );
}
```

## Integration Points

### Dependencies
- **ORG-008a**: Uses UI components (LeftSidebar, DraggableItem)

### Provides To
- **ORG-008c**: Dimension/metric metadata for query building
- **ORG-008d**: Selected dimensions/metrics to persist

### Data Contracts
```typescript
export interface SelectedDimension {
  dimension: Dimension;
  position: 'row' | 'column';
  sort?: 'asc' | 'desc';
  drillDownPath?: string[]; // Hierarchy path
}

export interface SelectedMetric {
  metric: Metric;
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'distinct';
  format: 'number' | 'currency' | 'percentage';
  comparison?: {
    type: 'previous-period' | 'same-period-last-year';
    label: string;
  };
}
```

## Testing Requirements

### Unit Tests
```typescript
describe('Dimension Registry', () => {
  it('returns all dimensions', () => {
    expect(DIMENSION_REGISTRY.length).toBeGreaterThanOrEqual(15);
  });

  it('gets dimension by ID', () => {
    const dim = getDimensionById('dim_date');
    expect(dim?.label).toBe('Date');
  });

  it('filters dimensions by category', () => {
    const timeDims = getDimensionsByCategory('time');
    expect(timeDims.length).toBeGreaterThanOrEqual(6);
  });

  it('searches dimensions', () => {
    const results = searchDimensions('event');
    expect(results.every(d => d.label.toLowerCase().includes('event'))).toBe(true);
  });
});

describe('Validation Service', () => {
  it('prevents dimensions in values zone', () => {
    const result = service.validateDrop(
      DIMENSION_REGISTRY[0],
      'values',
      emptyState
    );
    expect(result.valid).toBe(false);
  });

  it('prevents metrics in rows/columns', () => {
    const result = service.validateDrop(
      METRIC_REGISTRY[0],
      'rows',
      emptyState
    );
    expect(result.valid).toBe(false);
  });

  it('enforces max capacity', () => {
    const state = { rows: [dim1, dim2, dim3], columns: [], values: [] };
    const result = service.validateDrop(dim4, 'rows', state);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Maximum 3 items');
  });
});
```

### Integration Tests
- [ ] Search filters both dimensions and metrics
- [ ] Category sections expand/collapse
- [ ] Drag dimension from sidebar to rows zone
- [ ] Drag metric from sidebar to values zone
- [ ] Validation errors show toasts
- [ ] Incompatible drops are prevented

## Definition of Done

- [ ] 15+ dimensions defined in registry
- [ ] 20+ metrics defined in registry
- [ ] Left sidebar populated with all dimensions/metrics
- [ ] Search/filter functionality working
- [ ] Validation rules implemented
- [ ] Hierarchical dimensions supported
- [ ] Calculated metrics builder functional
- [ ] Unit tests pass (>90% coverage)
- [ ] Integration tests pass
- [ ] Code reviewed and approved
- [ ] QA sign-off received
- [ ] Product Owner acceptance

## Notes

- Focus on completeness: Cover all important event data dimensions
- Validation is critical: Prevent confusing/invalid reports
- Consider future: Registry should be extensible (custom dimensions later)
- Performance: Registry lookups should be O(1) with Map-based indexes