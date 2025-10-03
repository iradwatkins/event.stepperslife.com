# ORG-008c: Query Engine & Data Aggregation

**Epic:** EPIC-007 - Organizer Dashboard & Analytics
**Parent Story:** ORG-008 - Custom Report Builder
**Story Points:** 3
**Priority:** High
**Status:** Ready for Development

## User Story
As an **event organizer**
I want my **custom reports to execute queries and aggregate data correctly**
So that **I see accurate, real-time analytics based on my dimension and metric selections**

## Parent Story Context
This is the third sub-story of ORG-008: Custom Report Builder (8 points). This story implements the backend query engine that transforms report definitions into SQL queries, executes them efficiently, and returns aggregated data.

**Sharding Strategy:**
- **ORG-008a**: UI & Drag-Drop Interface (3 points) ✓ Foundation
- **ORG-008b**: Dimension & Metric Selection Logic (2 points) ✓ Metadata
- **ORG-008c** (this story): Query Engine & Data Aggregation (3 points)
- **ORG-008d**: Report Saving & Template System (2 points)

**Integration Points:**
- Consumes report state from ORG-008a (UI component state)
- Uses dimension/metric metadata from ORG-008b (registry)
- Provides query results to ORG-008a (preview area)
- Query definitions will be saved by ORG-008d

## Acceptance Criteria

### AC1: Query Builder Service
- [ ] Core service to translate report definition → SQL query
- [ ] Support for dynamic SELECT, FROM, JOIN, WHERE, GROUP BY, ORDER BY
- [ ] Input: `ReportDefinition` (dimensions, metrics, filters)
- [ ] Output: Prisma query or raw SQL
- [ ] Query optimization:
  - Use indexes (ensure `orders.createdAt`, `orders.eventId`, etc. indexed)
  - Minimize joins (only join tables that are needed)
  - Push filters early (WHERE before JOIN when possible)
  - Use EXPLAIN ANALYZE to verify query plans
- [ ] Security: Parameterized queries (prevent SQL injection)
- [ ] Logging: Log all queries with execution time

### AC2: SELECT Clause Generation
- [ ] Map dimensions to SELECT fields:
  - Simple fields: `e.name AS event_name`
  - Date transformations: `DATE(o.createdAt) AS order_date`
  - Custom expressions: `YEAR(o.createdAt) AS year`
- [ ] Map metrics to aggregation functions:
  - Sum: `SUM(o.totalAmount) AS revenue`
  - Average: `AVG(o.totalAmount) AS avg_order_value`
  - Count: `COUNT(DISTINCT o.userId) AS unique_customers`
  - Calculated: `SUM(o.totalAmount - o.platformFee - o.processingFee) AS net_revenue`
- [ ] Handle NULL values (COALESCE for aggregations)
- [ ] Apply formatting hints (currency, percentage) as metadata

### AC3: FROM/JOIN Clause Generation
- [ ] Determine required tables from dimensions/metrics:
  - Base: `orders` (always)
  - Add `events` if event dimensions used
  - Add `orderItems` + `ticketTypes` if ticket dimensions used
  - Add `users` if customer dimensions used
  - Add `tickets` + `checkIns` if attendance metrics used
- [ ] Build JOIN chain efficiently:
  ```sql
  FROM orders o
  LEFT JOIN events e ON o.eventId = e.id
  LEFT JOIN orderItems oi ON o.id = oi.orderId
  LEFT JOIN ticketTypes tt ON oi.ticketTypeId = tt.id
  LEFT JOIN users u ON o.userId = u.id
  LEFT JOIN tickets t ON oi.id = t.orderItemId
  LEFT JOIN checkIns ci ON t.id = ci.ticketId
  ```
- [ ] Use LEFT JOIN to preserve all orders (even if missing related data)
- [ ] Avoid unnecessary joins (performance)

### AC4: WHERE Clause Generation
- [ ] Global filters:
  - Date range: `o.createdAt BETWEEN ? AND ?`
  - Event selection: `o.eventId IN (?)`
  - Status filter: `e.status = ?`
- [ ] Dimension filters:
  - Equals: `e.name = ?`
  - In: `e.name IN (?, ?)`
  - Not In: `e.name NOT IN (?, ?)`
  - Contains: `e.name LIKE ?` (with wildcards)
  - Greater/Less: `o.totalAmount > ?`
  - AND/OR logic: `(condition1) AND (condition2 OR condition3)`
- [ ] Security: Always add organizer filter: `e.organizerId = ?`
- [ ] Combine all filters with AND

### AC5: GROUP BY Clause Generation
- [ ] Group by all dimension fields:
  ```sql
  GROUP BY e.name, DATE(o.createdAt), tt.name
  ```
- [ ] Handle hierarchical dimensions:
  - If "Year" + "Month" selected, group by both
  - If "Event Name" + "Ticket Type", group by both
- [ ] Order matters: Dimension order affects result structure

### AC6: ORDER BY Clause Generation
- [ ] Default sort: First dimension ASC
- [ ] User-specified sort:
  - Sort by dimension: `e.name ASC`
  - Sort by metric: `SUM(o.totalAmount) DESC`
- [ ] Multi-column sort: `ORDER BY year DESC, month DESC`
- [ ] NULL handling: `NULLS LAST`

### AC7: Data Transformation & Pivot Logic
- [ ] For flat table visualization:
  - Return rows as-is (array of objects)
  - Column headers from dimension/metric labels
- [ ] For pivot table visualization:
  - Row dimension(s) → Row headers
  - Column dimension(s) → Column headers
  - Metrics → Cell values
  - Calculate row/column subtotals
  - Calculate grand total
  - Example: Events (rows) × Ticket Types (columns) → Revenue (cells)
- [ ] For chart visualizations:
  - Time series: X-axis = time dimension, Y-axis = metric
  - Bar chart: X-axis = dimension, Y-axis = metric
  - Pie chart: Slices = dimension, Values = metric

### AC8: Performance Optimizations
- [ ] Query result caching:
  - Cache key: hash(report definition + date range + filters)
  - TTL: 5 minutes for recent data, 1 hour for historical data
  - Use Redis or in-memory cache
- [ ] Query pagination:
  - Limit results to 10,000 rows by default
  - Offer "Load more" or pagination for larger datasets
- [ ] Streaming for exports:
  - For CSV/Excel exports with >10k rows, stream results
  - Don't load entire dataset into memory
- [ ] Database query timeout: 30 seconds max
- [ ] Background job for slow queries (>10 seconds)

### AC9: Aggregation Functions
- [ ] Implement all aggregations:
  - **Sum**: `SUM(field)`
  - **Average**: `AVG(field)`
  - **Count**: `COUNT(field)`
  - **Distinct Count**: `COUNT(DISTINCT field)`
  - **Min**: `MIN(field)`
  - **Max**: `MAX(field)`
  - **Median**: Use `PERCENTILE_CONT(0.5)` or custom SQL
  - **Percentile**: `PERCENTILE_CONT(percentile)`
- [ ] Calculated aggregations:
  - Parse formula: `(revenue - fees) / orders`
  - Substitute metric values
  - Compute result
- [ ] Comparison aggregations:
  - "vs Previous Period": Execute second query for comparison range, return delta
  - "vs Same Period Last Year": Shift date range by 1 year, return delta

### AC10: API Endpoints
- [ ] **Execute Report**:
  ```
  POST /api/dashboard/reports/execute
  Body: {
    dimensions: [...],
    metrics: [...],
    filters: [...],
    visualization: 'pivot-table' | 'table' | 'chart',
    dateRange: { start, end }
  }
  Response: {
    columns: [...],
    rows: [...],
    metadata: { rowCount, executionTime, cached }
  }
  ```
- [ ] **Preview Report** (same as execute, but limited to 100 rows):
  ```
  POST /api/dashboard/reports/preview
  ```
- [ ] **Query Performance Stats**:
  ```
  GET /api/dashboard/reports/stats
  Response: {
    avgExecutionTime: 245,
    slowestQueries: [...],
    cacheHitRate: 0.78
  }
  ```

## Technical Implementation

### Query Builder Service
```typescript
// /lib/services/queryBuilder.service.ts
import { Prisma } from '@prisma/client';

export interface ReportDefinition {
  dimensions: SelectedDimension[];
  metrics: SelectedMetric[];
  filters: ReportFilter[];
  dateRange: { start: Date; end: Date };
  visualization: 'table' | 'pivot-table' | 'chart';
  limit?: number;
}

export interface QueryResult {
  columns: string[];
  rows: any[][];
  metadata: {
    generatedAt: Date;
    rowCount: number;
    executionTime: number;
    cached: boolean;
  };
}

export class QueryBuilderService {
  async executeReport(
    reportDefinition: ReportDefinition,
    organizerId: string
  ): Promise<QueryResult> {
    const startTime = Date.now();

    // Check cache
    const cacheKey = this.getCacheKey(reportDefinition, organizerId);
    const cached = await this.cache.get<QueryResult>(cacheKey);
    if (cached) {
      cached.metadata.cached = true;
      return cached;
    }

    // Build query
    const query = this.buildQuery(reportDefinition, organizerId);

    // Execute query
    const rawData = await prisma.$queryRawUnsafe<any[]>(query.sql, ...query.params);

    // Transform result
    const result = this.transformResult(rawData, reportDefinition);

    // Add metadata
    result.metadata = {
      generatedAt: new Date(),
      rowCount: result.rows.length,
      executionTime: Date.now() - startTime,
      cached: false
    };

    // Cache result
    await this.cache.set(cacheKey, result, this.getCacheTTL(reportDefinition));

    // Log query
    logger.info('Report executed', {
      organizerId,
      executionTime: result.metadata.executionTime,
      rowCount: result.metadata.rowCount
    });

    return result;
  }

  private buildQuery(
    definition: ReportDefinition,
    organizerId: string
  ): { sql: string; params: any[] } {
    const { dimensions, metrics, filters, dateRange } = definition;

    // SELECT clause
    const selectClauses = [
      ...dimensions.map(d => this.buildDimensionSelect(d)),
      ...metrics.map(m => this.buildMetricSelect(m))
    ];

    // FROM clause
    const requiredTables = this.getRequiredTables(dimensions, metrics);
    const fromClause = this.buildFromClause(requiredTables);

    // WHERE clause
    const whereClauses: string[] = [];
    const params: any[] = [];

    // Add organizer filter (security)
    whereClauses.push('e.organizerId = ?');
    params.push(organizerId);

    // Add date range filter
    whereClauses.push('o.createdAt BETWEEN ? AND ?');
    params.push(dateRange.start, dateRange.end);

    // Add custom filters
    filters.forEach(filter => {
      const { clause, values } = this.buildFilterClause(filter);
      whereClauses.push(clause);
      params.push(...values);
    });

    // GROUP BY clause
    const groupByFields = dimensions.map(d => this.getDimensionField(d));

    // ORDER BY clause
    const orderByFields = this.buildOrderByClause(dimensions, metrics);

    // LIMIT clause
    const limit = definition.limit || 10000;

    // Assemble query
    const sql = `
      SELECT ${selectClauses.join(', ')}
      ${fromClause}
      WHERE ${whereClauses.join(' AND ')}
      ${groupByFields.length > 0 ? `GROUP BY ${groupByFields.join(', ')}` : ''}
      ${orderByFields ? `ORDER BY ${orderByFields}` : ''}
      LIMIT ${limit}
    `;

    return { sql, params };
  }

  private buildDimensionSelect(dimension: SelectedDimension): string {
    const meta = getDimensionById(dimension.dimension.id);
    return `${meta.sqlMapping} AS ${dimension.dimension.field}`;
  }

  private buildMetricSelect(metric: SelectedMetric): string {
    const meta = getMetricById(metric.metric.id);

    if (metric.metric.aggregation === 'calculated') {
      // Parse formula and substitute values
      return this.buildCalculatedMetric(metric);
    }

    const aggFunc = this.getAggregationFunction(metric.aggregation);
    return `${aggFunc}(${meta.sqlMapping}) AS ${metric.metric.field}`;
  }

  private getAggregationFunction(aggregation: string): string {
    const map: Record<string, string> = {
      sum: 'SUM',
      avg: 'AVG',
      count: 'COUNT',
      distinct: 'COUNT(DISTINCT',
      min: 'MIN',
      max: 'MAX'
    };
    return map[aggregation] || 'SUM';
  }

  private buildFromClause(requiredTables: Set<string>): string {
    let clause = 'FROM orders o';

    if (requiredTables.has('events')) {
      clause += ' LEFT JOIN events e ON o.eventId = e.id';
    }
    if (requiredTables.has('orderItems')) {
      clause += ' LEFT JOIN orderItems oi ON o.id = oi.orderId';
    }
    if (requiredTables.has('ticketTypes')) {
      clause += ' LEFT JOIN ticketTypes tt ON oi.ticketTypeId = tt.id';
    }
    if (requiredTables.has('users')) {
      clause += ' LEFT JOIN users u ON o.userId = u.id';
    }
    if (requiredTables.has('tickets')) {
      clause += ' LEFT JOIN tickets t ON oi.id = t.orderItemId';
    }
    if (requiredTables.has('checkIns')) {
      clause += ' LEFT JOIN checkIns ci ON t.id = ci.ticketId';
    }

    return clause;
  }

  private getRequiredTables(
    dimensions: SelectedDimension[],
    metrics: SelectedMetric[]
  ): Set<string> {
    const tables = new Set<string>(['orders', 'events']); // Always need these

    const allFields = [
      ...dimensions.map(d => d.dimension.field),
      ...metrics.map(m => m.metric.field)
    ];

    allFields.forEach(field => {
      if (field.startsWith('ticketType.')) {
        tables.add('orderItems');
        tables.add('ticketTypes');
      } else if (field.startsWith('user.')) {
        tables.add('users');
      } else if (field.includes('checkIn')) {
        tables.add('tickets');
        tables.add('checkIns');
      }
    });

    return tables;
  }

  private transformResult(
    rawData: any[],
    definition: ReportDefinition
  ): Omit<QueryResult, 'metadata'> {
    if (definition.visualization === 'pivot-table') {
      return this.transformToPivotTable(rawData, definition);
    }

    // Default: flat table
    const columns = [
      ...definition.dimensions.map(d => d.dimension.label),
      ...definition.metrics.map(m => m.metric.label)
    ];

    const rows = rawData.map(row => {
      return [
        ...definition.dimensions.map(d => row[d.dimension.field]),
        ...definition.metrics.map(m => this.formatValue(row[m.metric.field], m.format))
      ];
    });

    return { columns, rows };
  }

  private transformToPivotTable(
    rawData: any[],
    definition: ReportDefinition
  ): Omit<QueryResult, 'metadata'> {
    const rowDim = definition.dimensions.find(d => d.position === 'row');
    const colDim = definition.dimensions.find(d => d.position === 'column');
    const metric = definition.metrics[0]; // Primary metric

    if (!rowDim || !colDim) {
      throw new Error('Pivot table requires row and column dimensions');
    }

    // Build pivot map
    const pivot = new Map<string, Map<string, number>>();
    const columnValues = new Set<string>();

    rawData.forEach(row => {
      const rowKey = row[rowDim.dimension.field];
      const colKey = row[colDim.dimension.field];
      const value = row[metric.metric.field];

      if (!pivot.has(rowKey)) {
        pivot.set(rowKey, new Map());
      }
      pivot.get(rowKey)!.set(colKey, value);
      columnValues.add(colKey);
    });

    // Build result
    const colArray = Array.from(columnValues).sort();
    const columns = [rowDim.dimension.label, ...colArray, 'Total'];

    const rows = Array.from(pivot.entries()).map(([rowKey, colMap]) => {
      const values = colArray.map(col => colMap.get(col) || 0);
      const total = values.reduce((sum, v) => sum + v, 0);
      return [rowKey, ...values, total];
    });

    // Add grand total row
    const grandTotals = colArray.map(col => {
      return Array.from(pivot.values()).reduce(
        (sum, colMap) => sum + (colMap.get(col) || 0),
        0
      );
    });
    const grandTotal = grandTotals.reduce((sum, v) => sum + v, 0);
    rows.push(['Grand Total', ...grandTotals, grandTotal]);

    return { columns, rows };
  }

  private formatValue(value: any, format: string): any {
    if (value === null || value === undefined) return '-';

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      case 'percentage':
        return `${(value * 100).toFixed(2)}%`;
      case 'number':
        return new Intl.NumberFormat('en-US').format(value);
      default:
        return value;
    }
  }

  private getCacheKey(definition: ReportDefinition, organizerId: string): string {
    const hash = createHash('md5')
      .update(JSON.stringify({ definition, organizerId }))
      .digest('hex');
    return `report:${hash}`;
  }

  private getCacheTTL(definition: ReportDefinition): number {
    const { dateRange } = definition;
    const daysSinceEnd = Math.floor(
      (Date.now() - dateRange.end.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Recent data (last 7 days): 5 minutes cache
    if (daysSinceEnd <= 7) return 5 * 60;

    // Historical data: 1 hour cache
    return 60 * 60;
  }
}
```

### API Route
```typescript
// /app/api/dashboard/reports/execute/route.ts
import { QueryBuilderService } from '@/lib/services/queryBuilder.service';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { dimensions, metrics, filters, dateRange, visualization } = body;

  // Validate input
  if (!dimensions || !metrics || !dateRange) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    const service = new QueryBuilderService();
    const result = await service.executeReport(
      { dimensions, metrics, filters, dateRange, visualization },
      session.user.organizerId
    );

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Report execution failed', { error });
    return NextResponse.json(
      { error: 'Failed to execute report' },
      { status: 500 }
    );
  }
}
```

## Integration Points

### Dependencies
- **ORG-008a**: Receives report state, sends results to preview
- **ORG-008b**: Uses dimension/metric registry for SQL mapping

### Provides To
- **ORG-008a**: Query results for preview display
- **ORG-008d**: Query execution capability for saved reports

## Testing Requirements

### Unit Tests
```typescript
describe('QueryBuilderService', () => {
  it('builds correct SELECT clause', () => {
    const sql = service.buildQuery(definition, 'org_123');
    expect(sql.sql).toContain('SELECT e.name AS event_name');
    expect(sql.sql).toContain('SUM(o.totalAmount) AS revenue');
  });

  it('includes organizer filter', () => {
    const sql = service.buildQuery(definition, 'org_123');
    expect(sql.sql).toContain('e.organizerId = ?');
    expect(sql.params).toContain('org_123');
  });

  it('transforms data to pivot table', () => {
    const result = service.transformToPivotTable(rawData, definition);
    expect(result.columns).toEqual(['Event', 'VIP', 'General', 'Total']);
    expect(result.rows[0]).toEqual(['Summer Dance', 9000, 6000, 15000]);
  });

  it('caches results', async () => {
    await service.executeReport(definition, 'org_123');
    const cached = await service.executeReport(definition, 'org_123');
    expect(cached.metadata.cached).toBe(true);
  });
});
```

### Integration Tests
- [ ] Execute simple report (1 dimension, 1 metric)
- [ ] Execute complex report (3 dimensions, 5 metrics)
- [ ] Execute pivot table report
- [ ] Execute report with filters
- [ ] Verify query performance (<5 seconds for 100k rows)

### Performance Tests
```typescript
describe('Performance', () => {
  it('executes report within 5 seconds', async () => {
    const start = Date.now();
    await service.executeReport(definition, 'org_123');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  it('caches improve performance by 10x', async () => {
    const uncachedTime = await measureExecutionTime(() =>
      service.executeReport(definition, 'org_123')
    );

    const cachedTime = await measureExecutionTime(() =>
      service.executeReport(definition, 'org_123')
    );

    expect(cachedTime).toBeLessThan(uncachedTime / 10);
  });
});
```

## Definition of Done

- [ ] Query builder service implemented
- [ ] All aggregation functions working
- [ ] Pivot table transformation working
- [ ] Caching implemented
- [ ] API endpoint functional
- [ ] Security: Organizer filter enforced
- [ ] Performance: <5 seconds for 100k rows
- [ ] Unit tests pass (>85% coverage)
- [ ] Integration tests pass
- [ ] Performance benchmarks met
- [ ] Code reviewed and approved
- [ ] QA sign-off received
- [ ] Product Owner acceptance

## Notes

- SQL injection prevention is CRITICAL (use parameterized queries)
- Query optimization is essential (add database indexes)
- Caching dramatically improves UX (5-minute cache for recent data)
- Consider materialized views for common aggregations (future optimization)
- Monitor slow queries with APM tools (Sentry, DataDog)