# ORG-008: Custom Report Builder

**Epic:** EPIC-007 - Organizer Dashboard & Analytics
**Story Points:** 8
**Priority:** Medium
**Status:** Ready for Development

## User Story
As an **event organizer**
I want to **build custom reports with flexible dimensions and metrics**
So that **I can analyze my events exactly how I need and export data for stakeholders or external analysis**

## Acceptance Criteria

### AC1: Drag-and-Drop Report Builder Interface
- [ ] Visual report builder with drag-and-drop functionality
- [ ] Left sidebar: Available dimensions and metrics
- [ ] Center canvas: Report preview with live data
- [ ] Right sidebar: Report settings and formatting
- [ ] Drag dimensions to rows/columns
- [ ] Drag metrics to values area
- [ ] Intuitive UI similar to Excel pivot tables or Google Data Studio

### AC2: Dimension Selection
- [ ] Available dimensions:
  - **Time**: Date, Day of Week, Hour, Month, Quarter, Year
  - **Event**: Event Name, Event Type, Venue, Status
  - **Ticket**: Ticket Type, Price Tier, Discount Code Used
  - **Customer**: Age Group, Location (City, State, Country), New vs Returning
  - **Order**: Payment Method, Order Source (UTM), Device Type
  - **Marketing**: Campaign, Referral Source, Promo Code
- [ ] Hierarchical dimensions (drill-down capability)
- [ ] Custom dimension grouping
- [ ] Dimension filters (include/exclude specific values)

### AC3: Metric Selection
- [ ] Available metrics:
  - **Sales**: Tickets Sold, Revenue, Average Order Value, Units per Transaction
  - **Financial**: Gross Revenue, Net Revenue, Platform Fees, Processing Fees, Refunds
  - **Attendance**: Check-ins, No-shows, Check-in Rate
  - **Conversion**: Page Views, Conversion Rate, Cart Abandonment Rate
  - **Customer**: Unique Customers, Repeat Customer Rate, Customer Lifetime Value
  - **Marketing**: Cost per Acquisition, Return on Ad Spend (ROAS), Click-through Rate
- [ ] Calculated metrics: Create custom formulas (e.g., Net Revenue = Gross - Fees)
- [ ] Aggregation functions: Sum, Average, Count, Min, Max, Median, Percentile
- [ ] Comparison metrics: vs Previous Period, vs Same Period Last Year

### AC4: Report Filters
- [ ] Global filters apply to entire report:
  - Date range (custom, presets)
  - Event selection (single or multiple)
  - Status filter (published, draft, cancelled)
- [ ] Dimension-specific filters:
  - Filter by ticket type, location, age group, etc.
  - Multiple filter conditions (AND/OR logic)
  - "In", "Not In", "Contains", "Equals", "Greater Than" operators
- [ ] Dynamic filter dropdowns populated from actual data
- [ ] Save filter sets as "Quick Filters"

### AC5: Visualization Options
- [ ] Multiple chart types:
  - **Table**: Standard data table
  - **Pivot Table**: Cross-tab with row/column dimensions
  - **Bar Chart**: Horizontal or vertical
  - **Line Chart**: Time series
  - **Pie/Donut Chart**: Percentage breakdown
  - **Area Chart**: Cumulative trends
  - **Heatmap**: Two-dimensional data density
  - **Scorecard**: Single metric with comparison
- [ ] Switch between visualizations without rebuilding query
- [ ] Conditional formatting (color scales, thresholds)
- [ ] Sort by any column
- [ ] Toggle chart options (legends, labels, grid lines)

### AC6: Saved Reports Library
- [ ] Save custom reports with name and description
- [ ] Organize reports in folders/categories
- [ ] Share reports with team members (future: permissions)
- [ ] Duplicate/clone existing reports
- [ ] Set default report (loads on dashboard open)
- [ ] Recently viewed reports quick access
- [ ] Star/favorite reports for quick access
- [ ] Version history of report changes

### AC7: Scheduled Exports
- [ ] Schedule reports to run automatically:
  - Daily, Weekly, Monthly, Quarterly
  - Specific day/time
- [ ] Email delivery to specified recipients
- [ ] Multiple export formats: CSV, Excel, PDF, Google Sheets
- [ ] Attach to email or link to download
- [ ] Include commentary/notes in email
- [ ] Pause/resume scheduled reports

### AC8: Report Templates
- [ ] Pre-built report templates:
  - **Sales Summary**: Revenue by event and ticket type
  - **Daily Sales Report**: Tickets sold per day
  - **Customer Demographics**: Age and location breakdown
  - **Marketing Performance**: Revenue by source/campaign
  - **Financial Summary**: Net revenue after fees
  - **Event Comparison**: Compare multiple events side-by-side
- [ ] Create custom templates from saved reports
- [ ] Template gallery with previews
- [ ] Import/export templates (JSON)

### AC9: Advanced Features
- [ ] Drill-down/drill-up on dimensions
- [ ] Pivot rows and columns
- [ ] Subtotals and grand totals
- [ ] Percentage of total calculations
- [ ] Running totals and cumulative sums
- [ ] Moving averages (7-day, 30-day)
- [ ] Year-over-year comparisons
- [ ] Cohort analysis (customer retention over time)

### AC10: Export and Sharing
- [ ] Export formats:
  - **CSV**: Raw data for Excel/Sheets
  - **Excel (.xlsx)**: Formatted with charts
  - **PDF**: Print-ready report
  - **Google Sheets**: Direct export with live refresh
  - **Image (PNG/SVG)**: Chart images
- [ ] Email report directly from interface
- [ ] Generate shareable link (view-only, expiring)
- [ ] Embed report in external dashboard (iframe)
- [ ] API access to report data

## Technical Implementation

### Frontend Components
```typescript
// /components/dashboard/analytics/ReportBuilder.tsx
interface ReportBuilderProps {
  organizerId: string;
  savedReportId?: string; // Load existing report
}

interface ReportDefinition {
  id: string;
  name: string;
  description?: string;
  dimensions: Dimension[];
  metrics: Metric[];
  filters: Filter[];
  visualization: VisualizationType;
  settings: ReportSettings;
  schedule?: ScheduleConfig;
}

interface Dimension {
  id: string;
  field: string; // e.g., "event.name", "ticket.type"
  label: string;
  position: 'row' | 'column';
  sort?: 'asc' | 'desc';
  aggregation?: 'group' | 'none';
}

interface Metric {
  id: string;
  field: string; // e.g., "revenue", "ticketsSold"
  label: string;
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
  format: 'number' | 'currency' | 'percentage';
  calculation?: string; // Custom formula: "gross - fees"
}

interface Filter {
  dimension: string;
  operator: 'eq' | 'neq' | 'in' | 'notIn' | 'gt' | 'lt' | 'contains';
  value: any;
  logic?: 'AND' | 'OR';
}

interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time: string; // "09:00"
  timezone: string;
  recipients: string[];
  format: 'csv' | 'excel' | 'pdf';
}

// Component Structure
- ReportBuilder (container)
  - BuilderLayout
    - Sidebar (left)
      - DimensionsPanel (draggable items)
      - MetricsPanel (draggable items)
      - TemplatesPanel (pre-built reports)
    - Canvas (center)
      - DropZones
        - RowsDropZone
        - ColumnsDropZone
        - ValuesDropZone
      - ReportPreview (live data)
        - DataTable
        - ChartVisualization
    - SettingsPanel (right)
      - FilterBuilder
      - VisualizationSettings
      - FormatOptions
      - ScheduleConfig
  - Toolbar
    - SaveButton
    - ExportButton
    - ScheduleButton
    - ShareButton
```

### Backend API
```typescript
// /app/api/dashboard/reports/route.ts

// Create/update report
POST /api/dashboard/reports
Body: {
  name: "Monthly Sales Report",
  description: "Revenue breakdown by event and ticket type",
  organizerId: "org_123",
  definition: {
    dimensions: [
      { field: "event.name", position: "row" },
      { field: "ticketType.name", position: "column" }
    ],
    metrics: [
      { field: "revenue", aggregation: "sum", format: "currency" },
      { field: "ticketsSold", aggregation: "sum", format: "number" }
    ],
    filters: [
      { dimension: "order.createdAt", operator: "gte", value: "2025-09-01" }
    ],
    visualization: "pivot-table"
  }
}

Response: {
  success: true,
  data: { reportId: "rpt_456" }
}

// Execute report query
POST /api/dashboard/reports/[reportId]/execute
Body: {
  dateRange: { start: "2025-09-01", end: "2025-09-30" },
  additionalFilters: [...]
}

Response: {
  success: true,
  data: {
    columns: ["Event Name", "VIP", "General", "Total"],
    rows: [
      ["Summer Dance", 9000, 6000, 15000],
      ["Winter Gala", 12000, 8000, 20000]
    ],
    metadata: {
      generatedAt: "2025-09-30T10:00:00Z",
      rowCount: 2,
      executionTime: 245 // ms
    }
  }
}

// Get saved reports
GET /api/dashboard/reports?organizerId={id}&folder={folder}

// Schedule report
POST /api/dashboard/reports/[reportId]/schedule
Body: {
  frequency: "weekly",
  dayOfWeek: 1, // Monday
  time: "09:00",
  recipients: ["user@example.com"],
  format: "pdf"
}

// Export report
GET /api/dashboard/reports/[reportId]/export?format={csv|excel|pdf}
```

### Query Builder Service
```typescript
// /lib/services/reportBuilder.service.ts
export class ReportBuilderService {
  async executeReport(
    reportDefinition: ReportDefinition,
    dateRange: DateRange,
    additionalFilters: Filter[]
  ): Promise<ReportResult> {
    // Build SQL query dynamically
    const query = this.buildQuery(reportDefinition, dateRange, additionalFilters);

    // Execute query
    const result = await prisma.$queryRaw(query);

    // Transform result based on visualization type
    return this.transformResult(result, reportDefinition);
  }

  private buildQuery(
    definition: ReportDefinition,
    dateRange: DateRange,
    filters: Filter[]
  ): string {
    const { dimensions, metrics, filters: reportFilters } = definition;

    // SELECT clause
    const selectFields = [
      ...dimensions.map(d => this.getDimensionField(d)),
      ...metrics.map(m => this.getMetricField(m))
    ];

    // FROM clause (determine which tables to join)
    const tables = this.getRequiredTables(dimensions, metrics);
    const fromClause = this.buildJoins(tables);

    // WHERE clause
    const allFilters = [...reportFilters, ...filters];
    const whereClause = this.buildWhereClause(allFilters, dateRange);

    // GROUP BY clause
    const groupByFields = dimensions.map(d => this.getDimensionField(d));

    // ORDER BY clause
    const orderByFields = dimensions
      .filter(d => d.sort)
      .map(d => `${this.getDimensionField(d)} ${d.sort}`);

    return `
      SELECT ${selectFields.join(', ')}
      FROM ${fromClause}
      WHERE ${whereClause}
      GROUP BY ${groupByFields.join(', ')}
      ${orderByFields.length > 0 ? `ORDER BY ${orderByFields.join(', ')}` : ''}
    `;
  }

  private getDimensionField(dimension: Dimension): string {
    const fieldMap: Record<string, string> = {
      'event.name': 'e.name as event_name',
      'event.startDate': 'DATE(e.startDateTime) as event_date',
      'ticketType.name': 'tt.name as ticket_type',
      'user.city': 'u.city',
      'user.ageGroup': this.getAgeGroupExpression(),
      'order.date': 'DATE(o.createdAt) as order_date',
      'order.source': 'o.source'
    };

    return fieldMap[dimension.field] || dimension.field;
  }

  private getMetricField(metric: Metric): string {
    const aggregationMap: Record<string, string> = {
      sum: 'SUM',
      avg: 'AVG',
      count: 'COUNT',
      min: 'MIN',
      max: 'MAX'
    };

    const agg = aggregationMap[metric.aggregation];

    if (metric.calculation) {
      // Custom calculated metric
      return `${agg}(${metric.calculation}) as ${metric.field}`;
    }

    const fieldMap: Record<string, string> = {
      revenue: 'o.totalAmount',
      netRevenue: '(o.totalAmount - o.platformFee - o.processingFee)',
      ticketsSold: 'oi.quantity',
      checkIns: 'CASE WHEN ci.id IS NOT NULL THEN 1 ELSE 0 END'
    };

    const field = fieldMap[metric.field] || metric.field;
    return `${agg}(${field}) as ${metric.field}`;
  }

  private getRequiredTables(dimensions: Dimension[], metrics: Metric[]): string[] {
    const tables = new Set<string>(['orders']);

    // Determine which tables to join based on fields used
    const allFields = [
      ...dimensions.map(d => d.field),
      ...metrics.map(m => m.field)
    ];

    if (allFields.some(f => f.startsWith('event.'))) {
      tables.add('events');
    }
    if (allFields.some(f => f.startsWith('ticketType.'))) {
      tables.add('orderItems');
      tables.add('ticketTypes');
    }
    if (allFields.some(f => f.startsWith('user.'))) {
      tables.add('users');
    }
    if (allFields.some(f => f.includes('checkIn'))) {
      tables.add('checkIns');
    }

    return Array.from(tables);
  }

  private buildJoins(tables: string[]): string {
    let fromClause = 'orders o';

    if (tables.includes('events')) {
      fromClause += ' LEFT JOIN events e ON o.eventId = e.id';
    }
    if (tables.includes('orderItems')) {
      fromClause += ' LEFT JOIN orderItems oi ON o.id = oi.orderId';
    }
    if (tables.includes('ticketTypes')) {
      fromClause += ' LEFT JOIN ticketTypes tt ON oi.ticketTypeId = tt.id';
    }
    if (tables.includes('users')) {
      fromClause += ' LEFT JOIN users u ON o.userId = u.id';
    }
    if (tables.includes('checkIns')) {
      fromClause += ' LEFT JOIN tickets t ON oi.id = t.orderItemId';
      fromClause += ' LEFT JOIN checkIns ci ON t.id = ci.ticketId';
    }

    return fromClause;
  }

  private transformResult(
    rawData: any[],
    definition: ReportDefinition
  ): ReportResult {
    if (definition.visualization === 'pivot-table') {
      return this.transformToPivotTable(rawData, definition);
    }

    // Default: flat table
    return {
      columns: this.getColumnNames(definition),
      rows: rawData.map(row => this.extractRowValues(row, definition)),
      metadata: {
        generatedAt: new Date(),
        rowCount: rawData.length
      }
    };
  }

  private transformToPivotTable(
    rawData: any[],
    definition: ReportDefinition
  ): ReportResult {
    const rowDimension = definition.dimensions.find(d => d.position === 'row');
    const colDimension = definition.dimensions.find(d => d.position === 'column');
    const metric = definition.metrics[0]; // Primary metric

    // Create pivot structure
    const pivot = new Map<string, Map<string, number>>();

    rawData.forEach(row => {
      const rowKey = row[rowDimension!.field];
      const colKey = row[colDimension!.field];
      const value = row[metric.field];

      if (!pivot.has(rowKey)) {
        pivot.set(rowKey, new Map());
      }
      pivot.get(rowKey)!.set(colKey, value);
    });

    // Get unique column values
    const columnValues = [...new Set(rawData.map(r => r[colDimension!.field]))];

    // Build result
    const columns = [rowDimension!.label, ...columnValues, 'Total'];
    const rows = Array.from(pivot.entries()).map(([rowKey, colMap]) => {
      const values = columnValues.map(col => colMap.get(col) || 0);
      const total = values.reduce((sum, v) => sum + v, 0);
      return [rowKey, ...values, total];
    });

    return { columns, rows, metadata: { generatedAt: new Date(), rowCount: rows.length } };
  }
}
```

### Schedule Service
```typescript
// /lib/services/reportSchedule.service.ts
export class ReportScheduleService {
  async scheduleReport(
    reportId: string,
    schedule: ScheduleConfig
  ): Promise<void> {
    // Create cron job
    const cronExpression = this.buildCronExpression(schedule);

    await prisma.reportSchedule.create({
      data: {
        reportId,
        frequency: schedule.frequency,
        cronExpression,
        recipients: schedule.recipients,
        format: schedule.format,
        timezone: schedule.timezone,
        isActive: true
      }
    });

    // Register with job queue (e.g., Bull)
    await this.queueService.addRecurringJob({
      name: `report-${reportId}`,
      cron: cronExpression,
      handler: async () => {
        await this.executeScheduledReport(reportId);
      }
    });
  }

  private async executeScheduledReport(reportId: string): Promise<void> {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: { schedule: true }
    });

    // Execute report
    const result = await this.reportBuilder.executeReport(
      report.definition,
      this.getDateRangeForSchedule(report.schedule.frequency),
      []
    );

    // Generate file
    const file = await this.exportService.export(result, report.schedule.format);

    // Send email
    await this.emailService.send({
      to: report.schedule.recipients,
      subject: `Scheduled Report: ${report.name}`,
      body: `Your scheduled report "${report.name}" is ready.`,
      attachments: [{ filename: `${report.name}.${report.schedule.format}`, content: file }]
    });
  }
}
```

## UI/UX Design

### Report Builder Interface
```
┌─────────────────────────────────────────────────────────────┐
│ Custom Report Builder                          [Save] [Export]│
├──────────┬──────────────────────────────────────┬──────────┤
│Dimensions│  Drop Dimensions & Metrics Here     │ Settings │
│          │                                       │          │
│📊 Time   │  Rows: [Event Name]                 │Filters:  │
│ • Date   │  Columns: [Ticket Type]             │[+ Add]   │
│ • Month  │  Values: [Revenue (Sum)] [Tickets]  │          │
│          │                                       │          │
│📍 Event  │  ┌───────────────────────────────┐  │Viz Type: │
│ • Name   │  │ Event Name │VIP  │Gen │Total │  │[Pivot▼]  │
│ • Venue  │  ├────────────┼─────┼────┼──────┤  │          │
│          │  │Summer Dance│9000 │6000│15000 │  │Format:   │
│🎟️ Ticket │  │Winter Gala │12000│8000│20000 │  │[Settings]│
│ • Type   │  │Spring Party│7000 │5000│12000 │  │          │
│ • Price  │  └────────────┴─────┴────┴──────┘  │Schedule: │
│          │                                       │[+ Add]   │
│👤 Customer│  [Switch to Chart View]            │          │
│ • Age    │                                       │Share:    │
│ • Location│                                      │[🔗 Link] │
└──────────┴──────────────────────────────────────┴──────────┘
```

## Integration Points

### Dependencies
- **EPIC-003**: Order and payment data
- **EPIC-004**: Ticket data
- **EPIC-002**: Event data
- **Analytics system**: Page views, conversions

### Export Integrations
- Email service (SendGrid/Resend)
- Google Sheets API
- PDF generation (Puppeteer)
- Excel export (ExcelJS)

## Performance Requirements

- **Query execution**: < 5 seconds for 100k rows
- **Report builder UI**: < 1 second to update preview
- **Export generation**: < 10 seconds for 10k rows
- **Scheduled reports**: Complete within 5 minutes

## Testing Requirements

### Unit Tests
```typescript
describe('ReportBuilderService', () => {
  it('builds correct SQL query from definition', () => {
    const query = service.buildQuery(definition, dateRange, []);
    expect(query).toContain('SELECT e.name, SUM(o.totalAmount)');
  });

  it('transforms data to pivot table', () => {
    const result = service.transformToPivotTable(rawData, definition);
    expect(result.columns).toEqual(['Event', 'VIP', 'General', 'Total']);
  });
});
```

### Integration Tests
- [ ] Test report execution with various configurations
- [ ] Test scheduled report generation
- [ ] Test export formats (CSV, Excel, PDF)
- [ ] Test email delivery

### E2E Tests
```typescript
test('organizer builds custom report', async ({ page }) => {
  await page.goto('/dashboard/reports/builder');

  // Drag dimension
  await page.dragAndDrop('[data-field="event.name"]', '[data-zone="rows"]');

  // Drag metric
  await page.dragAndDrop('[data-field="revenue"]', '[data-zone="values"]');

  // Verify preview updates
  await expect(page.locator('.report-preview table')).toBeVisible();

  // Save report
  await page.fill('[name="reportName"]', 'My Custom Report');
  await page.click('button:has-text("Save")');
  await expect(page.locator('.toast')).toContainText('Report saved');
});
```

## Security Considerations

- [ ] Verify organizer owns all data in report
- [ ] Validate SQL injection prevention in query builder
- [ ] Rate limit report execution (10 req/min)
- [ ] Limit export file size (100MB max)
- [ ] Sanitize email recipients

## Accessibility

- [ ] Keyboard navigation for drag-and-drop
- [ ] Screen reader announces drop zones
- [ ] ARIA labels for builder elements
- [ ] Focus management for modals

## Success Metrics

- **Target**: 40% of organizers create custom reports
- **Target**: Average 3 saved reports per organizer
- **Target**: 25% schedule automated reports
- **Target**: 50% export reports monthly

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Drag-and-drop works smoothly
- [ ] Query builder generates correct SQL
- [ ] All export formats work
- [ ] Scheduled reports deliver reliably
- [ ] Unit tests pass (>80% coverage)
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Code reviewed and approved
- [ ] QA sign-off received
- [ ] Product Owner acceptance

## Notes

- Inspired by Google Data Studio and Tableau
- Consider using existing query builder libraries
- Monitor query complexity to prevent performance issues
- Future: AI-suggested reports based on usage patterns