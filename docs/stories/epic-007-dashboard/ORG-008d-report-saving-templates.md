# ORG-008d: Report Saving & Template System

**Epic:** EPIC-007 - Organizer Dashboard & Analytics
**Parent Story:** ORG-008 - Custom Report Builder
**Story Points:** 2
**Priority:** Medium
**Status:** Ready for Development

## User Story
As an **event organizer**
I want to **save my custom reports and use pre-built templates**
So that **I can quickly access my favorite reports and get started with common analytics patterns**

## Parent Story Context
This is the fourth and final sub-story of ORG-008: Custom Report Builder (8 points). This story implements report persistence, saved reports library, templates, and scheduled report functionality.

**Sharding Strategy:**
- **ORG-008a**: UI & Drag-Drop Interface (3 points) ✓ Foundation
- **ORG-008b**: Dimension & Metric Selection Logic (2 points) ✓ Metadata
- **ORG-008c**: Query Engine & Data Aggregation (3 points) ✓ Backend
- **ORG-008d** (this story): Report Saving & Template System (2 points)

**Integration Points:**
- Extends ORG-008a toolbar with functional Save button
- Persists report definitions from ORG-008b (dimensions/metrics)
- Saves query configurations for ORG-008c to re-execute
- Completes the full report builder workflow

## Acceptance Criteria

### AC1: Save Report Functionality
- [ ] "Save Report" button in toolbar (ORG-008a)
- [ ] Save dialog modal:
  - Report name (required, max 100 chars)
  - Description (optional, max 500 chars)
  - Folder/category dropdown (e.g., "Sales", "Marketing", "Custom")
  - Tags (optional, for search/filtering)
  - "Set as default" checkbox (loads on dashboard open)
  - "Share with team" toggle (future: permissions)
- [ ] Validation:
  - Unique report name per organizer
  - At least 1 dimension + 1 metric required
  - Valid date range
- [ ] Save creates `Report` record in database:
  - `id`, `organizerId`, `name`, `description`, `folder`, `tags`
  - `definition` (JSON): dimensions, metrics, filters, visualization, settings
  - `createdAt`, `updatedAt`, `lastAccessedAt`
  - `isDefault`, `isShared`, `isFavorite`
- [ ] Toast notification: "Report saved successfully"
- [ ] Auto-save draft every 30 seconds (local storage)

### AC2: Load Saved Report
- [ ] "My Reports" dropdown in toolbar
- [ ] Lists all saved reports (grouped by folder)
- [ ] Clicking report:
  - Loads report definition
  - Populates drop zones with dimensions/metrics
  - Applies filters
  - Executes query and shows results
  - Updates URL: `/dashboard/reports/builder?reportId=rpt_123`
- [ ] "Recently viewed" section (last 5 reports)
- [ ] Search reports by name/description/tags
- [ ] Sort options: Name (A-Z), Last Modified, Last Accessed

### AC3: Update Existing Report
- [ ] If report loaded, "Save" button becomes "Update"
- [ ] "Save As New" option (duplicate with new name)
- [ ] Track version history:
  - Store snapshots of report definition on each update
  - "View History" button shows list of versions
  - Restore previous version (creates new version)
- [ ] Show "unsaved changes" indicator if report modified
- [ ] Confirmation dialog before navigating away with unsaved changes

### AC4: Saved Reports Library
- [ ] New page: `/dashboard/reports/library`
- [ ] Grid view of all saved reports:
  - Report card: Name, description, folder, last modified, favorite icon
  - Thumbnail preview (chart/table screenshot or placeholder)
  - Quick actions: Open, Duplicate, Delete, Share
- [ ] Filters:
  - Folder dropdown
  - Tags multiselect
  - Date range (created/modified)
  - "My reports" vs "Shared with me"
- [ ] Search bar (name/description/tags)
- [ ] Bulk actions: Delete multiple, move to folder
- [ ] Sort: Name, Last Modified, Most Used

### AC5: Report Templates
- [ ] Pre-built report templates (5-8 templates):
  1. **Sales Summary**: Revenue by event and ticket type
  2. **Daily Sales Report**: Tickets sold per day (last 30 days)
  3. **Customer Demographics**: Age and location breakdown
  4. **Marketing Performance**: Revenue by source/campaign
  5. **Financial Summary**: Net revenue after fees
  6. **Event Comparison**: Compare 2-5 events side-by-side
  7. **Attendance Tracking**: Check-ins vs tickets sold
  8. **Top Events**: Events ranked by revenue/attendance
- [ ] Template gallery in report builder:
  - "Templates" tab in left sidebar (ORG-008a)
  - Template cards: Name, description, preview image
  - "Use Template" button
- [ ] Clicking template:
  - Loads template definition into builder
  - Shows modal: "Customize template or save as-is"
  - Can modify dimensions/metrics before saving
- [ ] Custom templates:
  - Save any report as template (organizer-specific)
  - Share templates with team (future)

### AC6: Report Folders & Organization
- [ ] Folder management:
  - Create new folder (modal: name, color)
  - Rename folder
  - Delete folder (moves reports to "Uncategorized")
- [ ] Default folders:
  - "Uncategorized" (default)
  - "Sales" (pre-created)
  - "Marketing" (pre-created)
  - "Financial" (pre-created)
- [ ] Drag-and-drop to move reports between folders
- [ ] Folder sidebar in library page (collapsible)
- [ ] Folder count badge (number of reports)

### AC7: Favorite & Star Reports
- [ ] Star icon on report card (toggle favorite)
- [ ] "Favorites" section in "My Reports" dropdown (top)
- [ ] Favorites persist per user
- [ ] Quick access: Recent + Favorites shown on dashboard home

### AC8: Scheduled Reports (Basic)
- [ ] "Schedule" button in toolbar
- [ ] Schedule dialog:
  - Frequency: Daily, Weekly, Monthly
  - Day/time selector
  - Recipients: Email addresses (comma-separated)
  - Format: CSV, Excel, PDF
  - Subject line customization
  - Include message (optional)
- [ ] Create `ReportSchedule` record:
  - `reportId`, `frequency`, `dayOfWeek`, `dayOfMonth`, `time`, `timezone`
  - `recipients`, `format`, `isActive`, `lastRunAt`, `nextRunAt`
- [ ] Cron job or scheduled task:
  - Runs at specified time
  - Executes report with current data
  - Generates export file
  - Sends email with attachment
- [ ] "Scheduled Reports" page:
  - List all scheduled reports
  - Enable/disable schedule
  - Edit schedule
  - View delivery history (last 10 runs)
  - Retry failed deliveries

### AC9: Export Saved Report
- [ ] "Export" button in toolbar (ORG-008a)
- [ ] Export dialog:
  - Format: CSV, Excel, PDF, Google Sheets
  - Options: Include chart, Include summary, Page size (PDF)
- [ ] CSV export:
  - Raw data (columns + rows)
  - UTF-8 encoding
  - Filename: `{report_name}_{date}.csv`
- [ ] Excel export:
  - Formatted table (headers, borders, colors)
  - Chart embedded (if applicable)
  - Multiple sheets for pivot tables
  - Filename: `{report_name}_{date}.xlsx`
- [ ] PDF export:
  - Print-friendly layout
  - Report name, date, filters shown
  - Chart + table
  - Page numbers, logo
  - Filename: `{report_name}_{date}.pdf`
- [ ] Google Sheets export:
  - Create new sheet in user's Google Drive
  - Authenticate with Google OAuth
  - Share link shown in modal
- [ ] Download starts immediately (toast notification)

### AC10: Delete & Archive Reports
- [ ] Delete report:
  - Confirmation dialog: "Are you sure?"
  - Soft delete (mark as deleted, keep in DB for 30 days)
  - "Deleted Reports" section (trash bin)
  - Restore option (within 30 days)
  - Permanent delete after 30 days (cron job)
- [ ] Archive report:
  - Move to "Archived" folder
  - Hidden from main library (toggle to show)
  - Can unarchive anytime

## Technical Implementation

### Database Schema
```prisma
// prisma/schema.prisma

model Report {
  id            String   @id @default(cuid())
  organizerId   String
  name          String
  description   String?
  folder        String   @default("Uncategorized")
  tags          String[] // Array of tag strings
  definition    Json     // { dimensions, metrics, filters, visualization, settings }
  isDefault     Boolean  @default(false)
  isShared      Boolean  @default(false)
  isFavorite    Boolean  @default(false)
  isArchived    Boolean  @default(false)
  isDeleted     Boolean  @default(false)
  deletedAt     DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  lastAccessedAt DateTime @default(now())

  organizer     User     @relation(fields: [organizerId], references: [id])
  schedules     ReportSchedule[]
  versions      ReportVersion[]

  @@index([organizerId, isDeleted])
  @@index([organizerId, folder])
  @@index([organizerId, isFavorite])
}

model ReportVersion {
  id            String   @id @default(cuid())
  reportId      String
  version       Int      // Incremental version number
  definition    Json     // Snapshot of report definition
  createdAt     DateTime @default(now())
  createdBy     String   // User ID

  report        Report   @relation(fields: [reportId], references: [id], onDelete: Cascade)

  @@index([reportId, version])
}

model ReportSchedule {
  id            String   @id @default(cuid())
  reportId      String
  frequency     String   // 'daily', 'weekly', 'monthly'
  dayOfWeek     Int?     // 0-6 for weekly
  dayOfMonth    Int?     // 1-31 for monthly
  time          String   // '09:00'
  timezone      String   @default('America/New_York')
  recipients    String[] // Array of email addresses
  format        String   // 'csv', 'excel', 'pdf'
  subject       String?
  message       String?
  isActive      Boolean  @default(true)
  lastRunAt     DateTime?
  nextRunAt     DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  report        Report   @relation(fields: [reportId], references: [id], onDelete: Cascade)
  deliveries    ReportDelivery[]

  @@index([isActive, nextRunAt])
}

model ReportDelivery {
  id            String   @id @default(cuid())
  scheduleId    String
  status        String   // 'success', 'failed', 'pending'
  executedAt    DateTime @default(now())
  error         String?
  fileSize      Int?     // bytes
  recipientCount Int?

  schedule      ReportSchedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)

  @@index([scheduleId, executedAt])
}

model ReportTemplate {
  id            String   @id @default(cuid())
  name          String
  description   String
  category      String   // 'sales', 'marketing', 'financial', 'custom'
  definition    Json     // Template report definition
  previewImage  String?  // URL to preview image
  isPublic      Boolean  @default(true) // Public templates for all users
  createdBy     String?  // If custom template, organizer ID
  createdAt     DateTime @default(now())

  @@index([category, isPublic])
}
```

### API Routes
```typescript
// /app/api/dashboard/reports/route.ts

// Create/Update Report
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { id, name, description, folder, tags, definition, isDefault } = body;

  // Validation
  if (!name || !definition) {
    return NextResponse.json({ error: 'Name and definition required' }, { status: 400 });
  }

  try {
    let report;

    if (id) {
      // Update existing report
      report = await prisma.report.update({
        where: { id, organizerId: session.user.organizerId },
        data: {
          name,
          description,
          folder,
          tags,
          definition,
          isDefault,
          updatedAt: new Date()
        }
      });

      // Create version snapshot
      await prisma.reportVersion.create({
        data: {
          reportId: report.id,
          version: await getNextVersionNumber(report.id),
          definition,
          createdBy: session.user.id
        }
      });
    } else {
      // Create new report
      report = await prisma.report.create({
        data: {
          organizerId: session.user.organizerId,
          name,
          description,
          folder,
          tags,
          definition,
          isDefault
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: { reportId: report.id }
    });
  } catch (error) {
    logger.error('Failed to save report', { error });
    return NextResponse.json({ error: 'Failed to save report' }, { status: 500 });
  }
}

// Get Reports
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const folder = searchParams.get('folder');
  const search = searchParams.get('search');

  const reports = await prisma.report.findMany({
    where: {
      organizerId: session.user.organizerId,
      isDeleted: false,
      ...(folder && { folder }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    },
    orderBy: { lastAccessedAt: 'desc' }
  });

  return NextResponse.json({ success: true, data: reports });
}

// /app/api/dashboard/reports/[reportId]/route.ts

// Load Report
export async function GET(
  req: Request,
  { params }: { params: { reportId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const report = await prisma.report.findUnique({
    where: {
      id: params.reportId,
      organizerId: session.user.organizerId
    }
  });

  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  // Update last accessed timestamp
  await prisma.report.update({
    where: { id: report.id },
    data: { lastAccessedAt: new Date() }
  });

  return NextResponse.json({ success: true, data: report });
}

// Delete Report
export async function DELETE(
  req: Request,
  { params }: { params: { reportId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Soft delete
  await prisma.report.update({
    where: {
      id: params.reportId,
      organizerId: session.user.organizerId
    },
    data: {
      isDeleted: true,
      deletedAt: new Date()
    }
  });

  return NextResponse.json({ success: true });
}

// /app/api/dashboard/reports/[reportId]/schedule/route.ts

export async function POST(
  req: Request,
  { params }: { params: { reportId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { frequency, dayOfWeek, dayOfMonth, time, recipients, format } = body;

  // Calculate next run time
  const nextRunAt = calculateNextRun(frequency, dayOfWeek, dayOfMonth, time);

  const schedule = await prisma.reportSchedule.create({
    data: {
      reportId: params.reportId,
      frequency,
      dayOfWeek,
      dayOfMonth,
      time,
      recipients,
      format,
      nextRunAt
    }
  });

  // Register cron job (using Bull queue or similar)
  await scheduleService.registerSchedule(schedule);

  return NextResponse.json({ success: true, data: { scheduleId: schedule.id } });
}
```

### Template Seed Data
```typescript
// prisma/seeds/reportTemplates.ts

export const REPORT_TEMPLATES = [
  {
    name: 'Sales Summary',
    description: 'Revenue and tickets sold by event and ticket type',
    category: 'sales',
    definition: {
      dimensions: [
        { id: 'dim_event_name', position: 'row' },
        { id: 'dim_ticket_type', position: 'column' }
      ],
      metrics: [
        { id: 'metric_revenue', aggregation: 'sum' },
        { id: 'metric_tickets_sold', aggregation: 'sum' }
      ],
      visualization: 'pivot-table',
      filters: [],
      dateRange: 'last-30-days'
    }
  },
  {
    name: 'Daily Sales Report',
    description: 'Tickets sold and revenue per day for the last 30 days',
    category: 'sales',
    definition: {
      dimensions: [{ id: 'dim_date', position: 'row' }],
      metrics: [
        { id: 'metric_tickets_sold', aggregation: 'sum' },
        { id: 'metric_revenue', aggregation: 'sum' }
      ],
      visualization: 'line-chart',
      filters: [],
      dateRange: 'last-30-days'
    }
  },
  // ... more templates
];
```

## Integration Points

### Dependencies
- **ORG-008a**: Extends toolbar with Save/Load functionality
- **ORG-008b**: Saves dimension/metric selections
- **ORG-008c**: Uses query engine to re-execute saved reports

### Completes
- Full report builder workflow (build → save → load → schedule → export)

## Testing Requirements

### Unit Tests
```typescript
describe('Report API', () => {
  it('creates new report', async () => {
    const response = await POST({ body: reportData });
    expect(response.status).toBe(200);
    expect(response.data.reportId).toBeDefined();
  });

  it('loads saved report', async () => {
    const response = await GET({ params: { reportId: 'rpt_123' } });
    expect(response.data.name).toBe('My Report');
  });

  it('soft deletes report', async () => {
    await DELETE({ params: { reportId: 'rpt_123' } });
    const report = await prisma.report.findUnique({ where: { id: 'rpt_123' } });
    expect(report.isDeleted).toBe(true);
  });
});
```

### E2E Tests
```typescript
test('user saves and loads report', async ({ page }) => {
  await page.goto('/dashboard/reports/builder');

  // Build report
  await page.dragAndDrop('[data-draggable="event.name"]', '[data-dropzone="rows"]');
  await page.dragAndDrop('[data-draggable="revenue"]', '[data-dropzone="values"]');

  // Save report
  await page.click('button:has-text("Save")');
  await page.fill('[name="reportName"]', 'My Sales Report');
  await page.click('button:has-text("Save Report")');
  await expect(page.locator('.toast')).toContainText('Report saved');

  // Load report
  await page.goto('/dashboard/reports/library');
  await page.click('text=My Sales Report');
  await expect(page.locator('[data-dropzone="rows"]')).toContainText('Event Name');
});
```

## Definition of Done

- [ ] Save/update/delete report functionality
- [ ] Saved reports library page
- [ ] Load saved report into builder
- [ ] 8 pre-built templates created
- [ ] Template gallery functional
- [ ] Folder organization system
- [ ] Favorite/star reports
- [ ] Scheduled reports (basic)
- [ ] Export functionality (CSV, Excel, PDF)
- [ ] Unit tests pass (>85% coverage)
- [ ] E2E tests pass
- [ ] Code reviewed and approved
- [ ] QA sign-off received
- [ ] Product Owner acceptance

## Notes

- Soft delete allows recovery (better UX than permanent delete)
- Version history is powerful for auditing and rollback
- Templates accelerate adoption (users see value immediately)
- Scheduled reports enable "set it and forget it" analytics