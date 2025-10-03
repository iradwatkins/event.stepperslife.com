# ORG-009: Export Functionality

**Epic:** EPIC-007 - Organizer Dashboard & Analytics
**Story Points:** 2
**Priority:** Medium
**Status:** Ready for Development

## User Story
As an **event organizer**
I want to **export data in multiple formats for external analysis**
So that **I can share reports with stakeholders, import into accounting software, or perform advanced analysis in Excel**

## Acceptance Criteria

### AC1: Export Button Placement
- [ ] "Export" button visible on all major data views:
  - Dashboard overview
  - Attendee lists
  - Revenue reports
  - Analytics charts
  - Custom reports
- [ ] Export dropdown menu shows format options
- [ ] Keyboard shortcut: Ctrl+E (or Cmd+E)
- [ ] Disabled state when no data to export

### AC2: CSV Export (Basic)
- [ ] Export raw data as comma-separated values
- [ ] Includes all visible columns from current view
- [ ] Respects active filters and sort order
- [ ] UTF-8 encoding with BOM (for Excel compatibility)
- [ ] Proper escaping of special characters (commas, quotes, newlines)
- [ ] File naming: `{data-type}-{event-name}-{date}.csv`
- [ ] Download starts immediately (no page refresh)
- [ ] Maximum 100,000 rows per export

### AC3: Excel Export (Formatted)
- [ ] Export as .xlsx with formatting:
  - Bold headers
  - Auto-sized columns
  - Number formatting (currency, percentages)
  - Date formatting
  - Conditional formatting (optional)
- [ ] Multiple sheets for different data sections
- [ ] Include summary sheet with key metrics
- [ ] Freeze header row for scrolling
- [ ] Charts embedded in separate sheet
- [ ] Company branding (logo, colors) optional

### AC4: PDF Export (Printable)
- [ ] Generate print-ready PDF reports
- [ ] Professional layout with:
  - Header with event name and date range
  - Footer with page numbers
  - Table of contents for multi-page reports
  - Charts rendered as images
- [ ] Page orientation: Portrait or Landscape (auto-detect or user choice)
- [ ] Page size: Letter (US) or A4 (International)
- [ ] Include export metadata (generated date, filters applied)
- [ ] Watermark option (e.g., "CONFIDENTIAL")

### AC5: Email Delivery
- [ ] "Email Report" option sends export as attachment
- [ ] Email form fields:
  - To: (comma-separated email addresses)
  - Subject: (pre-filled with report name)
  - Message: (optional note)
  - Format: (CSV, Excel, PDF dropdown)
- [ ] Validate email addresses before sending
- [ ] Show confirmation toast when sent
- [ ] Email body includes summary and download link
- [ ] Link expires after 7 days
- [ ] Maximum 3 recipients per send (to prevent spam)

### AC6: Scheduled Exports
- [ ] Schedule recurring exports:
  - Frequency: Daily, Weekly (day of week), Monthly (day of month)
  - Time: Specific hour (timezone-aware)
  - Format: CSV, Excel, or PDF
  - Recipients: Email addresses
- [ ] Manage scheduled exports:
  - List all active schedules
  - Pause/resume schedule
  - Edit schedule settings
  - Delete schedule
- [ ] Email notification when schedule runs
- [ ] Retry failed exports (up to 3 attempts)

### AC7: Bulk Export
- [ ] Export data from multiple events at once
- [ ] Select events from list with checkboxes
- [ ] Single file with sheets/sections per event
- [ ] Or separate file per event (ZIP archive)
- [ ] Progress indicator for large exports
- [ ] Cancel export in progress

### AC8: Export Progress and Status
- [ ] Show progress bar for large exports (>1,000 rows)
- [ ] Estimated time remaining
- [ ] "Cancel" button to abort export
- [ ] Toast notification when complete
- [ ] Download link in notification (if file ready)
- [ ] Error handling with retry option
- [ ] Export history log (last 10 exports)

### AC9: Export Templates
- [ ] Save export configurations as templates:
  - Selected columns
  - Sort order
  - Filters
  - Format preferences
- [ ] Template library with pre-built options:
  - "Basic Attendee List"
  - "Financial Summary"
  - "Marketing Report"
  - "Event Comparison"
- [ ] Apply template with one click
- [ ] Edit and delete custom templates

### AC10: Data Validation and Limits
- [ ] Maximum export size: 100,000 rows or 50MB file
- [ ] Show row count before export
- [ ] Warning for large exports (>10,000 rows)
- [ ] Option to filter/limit data if too large
- [ ] Rate limiting: 10 exports per hour per user
- [ ] Queue exports during high load

## Technical Implementation

### Frontend Components
```typescript
// /components/dashboard/ExportButton.tsx
interface ExportButtonProps {
  dataType: 'attendees' | 'revenue' | 'analytics' | 'custom';
  eventId?: string;
  filters?: any;
  onExport?: (format: ExportFormat) => void;
}

type ExportFormat = 'csv' | 'excel' | 'pdf';

export function ExportButton({ dataType, eventId, filters, onExport }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);

    try {
      const response = await fetch('/api/dashboard/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataType,
          eventId,
          filters,
          format
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${dataType}-${eventId}-${format}-${Date.now()}.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);

        toast.success('Export completed successfully');
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting... {progress}%
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileText className="mr-2 h-4 w-4" />
          <span>CSV (Basic)</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <span>Excel (Formatted)</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FilePdf className="mr-2 h-4 w-4" />
          <span>PDF (Printable)</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setIsOpen(false)}>
          <Mail className="mr-2 h-4 w-4" />
          <span>Email Report...</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// /components/dashboard/EmailReportModal.tsx
export function EmailReportModal({ isOpen, onClose, exportConfig }: EmailReportModalProps) {
  const [recipients, setRecipients] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [format, setFormat] = useState<ExportFormat>('pdf');

  const handleSend = async () => {
    try {
      await fetch('/api/dashboard/export/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients,
          subject,
          message,
          format,
          exportConfig
        })
      });

      toast.success(`Report sent to ${recipients.length} recipient(s)`);
      onClose();
    } catch (error) {
      toast.error('Failed to send report');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Email Report</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Recipients (comma-separated)</Label>
            <Input
              placeholder="email@example.com, another@example.com"
              value={recipients.join(', ')}
              onChange={(e) => setRecipients(e.target.value.split(',').map(s => s.trim()))}
            />
          </div>
          <div>
            <Label>Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <Label>Message (optional)</Label>
            <Textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <div>
            <Label>Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSend}>Send Report</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Backend API
```typescript
// /app/api/dashboard/export/route.ts
import { generateCSV, generateExcel, generatePDF } from '@/lib/services/export.service';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { dataType, eventId, filters, format } = await req.json();

  // Validate organizer owns event
  if (eventId) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true }
    });

    if (event?.organizerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Fetch data based on type
  let data: any[];
  switch (dataType) {
    case 'attendees':
      data = await getAttendeeData(eventId, filters);
      break;
    case 'revenue':
      data = await getRevenueData(eventId, filters);
      break;
    case 'analytics':
      data = await getAnalyticsData(eventId, filters);
      break;
    default:
      return NextResponse.json({ error: 'Invalid data type' }, { status: 400 });
  }

  // Check size limit
  if (data.length > 100000) {
    return NextResponse.json(
      { error: 'Export too large. Please filter data or contact support.' },
      { status: 400 }
    );
  }

  // Generate export file
  let file: Buffer;
  let contentType: string;
  let extension: string;

  switch (format) {
    case 'csv':
      file = await generateCSV(data);
      contentType = 'text/csv';
      extension = 'csv';
      break;
    case 'excel':
      file = await generateExcel(data, dataType);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      extension = 'xlsx';
      break;
    case 'pdf':
      file = await generatePDF(data, dataType);
      contentType = 'application/pdf';
      extension = 'pdf';
      break;
    default:
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  }

  // Return file
  return new NextResponse(file, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${dataType}-${Date.now()}.${extension}"`,
      'Content-Length': file.length.toString()
    }
  });
}

// Email export endpoint
export async function POST(req: Request) {
  const { recipients, subject, message, format, exportConfig } = await req.json();

  // Validate recipients (max 3)
  if (recipients.length > 3) {
    return NextResponse.json({ error: 'Maximum 3 recipients allowed' }, { status: 400 });
  }

  // Generate export
  const file = await generateExport(exportConfig, format);

  // Send email
  await emailService.send({
    to: recipients,
    subject,
    html: `
      <p>${message}</p>
      <p>Your report is attached to this email.</p>
      <p>Generated on ${format(new Date(), 'PPP')}</p>
    `,
    attachments: [
      {
        filename: `report.${format}`,
        content: file
      }
    ]
  });

  return NextResponse.json({ success: true });
}
```

### Export Service
```typescript
// /lib/services/export.service.ts
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export class ExportService {
  async generateCSV(data: any[]): Promise<Buffer> {
    if (data.length === 0) {
      return Buffer.from('No data to export');
    }

    // Get headers from first row
    const headers = Object.keys(data[0]);

    // Build CSV
    const rows = [
      headers.join(','), // Header row
      ...data.map(row =>
        headers.map(h => this.escapeCSV(row[h])).join(',')
      )
    ];

    // Add UTF-8 BOM for Excel compatibility
    const bom = '\uFEFF';
    return Buffer.from(bom + rows.join('\n'), 'utf-8');
  }

  private escapeCSV(value: any): string {
    if (value === null || value === undefined) return '';
    const str = String(value);

    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
  }

  async generateExcel(data: any[], dataType: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data');

    if (data.length === 0) {
      worksheet.addRow(['No data to export']);
      return await workbook.xlsx.writeBuffer() as Buffer;
    }

    // Add headers
    const headers = Object.keys(data[0]);
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' }
    };
    headerRow.font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // Add data rows
    data.forEach(row => {
      const values = headers.map(h => row[h]);
      worksheet.addRow(values);
    });

    // Format columns
    worksheet.columns.forEach((column, index) => {
      const header = headers[index];

      // Auto-size column
      let maxLength = header.length;
      column.eachCell?.({ includeEmpty: false }, (cell) => {
        const length = cell.value ? String(cell.value).length : 0;
        if (length > maxLength) maxLength = length;
      });
      column.width = Math.min(maxLength + 2, 50);

      // Format numbers/currency
      if (header.toLowerCase().includes('revenue') || header.toLowerCase().includes('price')) {
        column.numFmt = '$#,##0.00';
      } else if (header.toLowerCase().includes('percent')) {
        column.numFmt = '0.0%';
      }
    });

    // Freeze header row
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Add summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.addRow(['Export Summary']);
    summarySheet.addRow(['Generated', new Date()]);
    summarySheet.addRow(['Data Type', dataType]);
    summarySheet.addRow(['Total Rows', data.length]);

    return await workbook.xlsx.writeBuffer() as Buffer;
  }

  async generatePDF(data: any[], dataType: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'letter', margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text(`${dataType} Report`, { align: 'center' });
      doc.fontSize(10).text(`Generated on ${format(new Date(), 'PPP')}`, { align: 'center' });
      doc.moveDown();

      // Table
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        const tableTop = 150;
        const rowHeight = 20;
        const colWidth = (doc.page.width - 100) / headers.length;

        // Draw headers
        headers.forEach((header, i) => {
          doc.fontSize(10).text(header, 50 + i * colWidth, tableTop, {
            width: colWidth,
            align: 'left'
          });
        });

        // Draw rows (limit to first 50 rows for PDF)
        data.slice(0, 50).forEach((row, rowIndex) => {
          const y = tableTop + (rowIndex + 1) * rowHeight;
          headers.forEach((header, colIndex) => {
            doc.fontSize(8).text(String(row[header] || ''), 50 + colIndex * colWidth, y, {
              width: colWidth,
              align: 'left'
            });
          });
        });

        if (data.length > 50) {
          doc.addPage();
          doc.fontSize(10).text(`... and ${data.length - 50} more rows. Export to Excel for full data.`);
        }
      } else {
        doc.text('No data to export');
      }

      // Footer
      doc.fontSize(8).text(
        `Page ${doc.bufferedPageRange().start + 1} of ${doc.bufferedPageRange().count}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );

      doc.end();
    });
  }
}

export const exportService = new ExportService();
export const { generateCSV, generateExcel, generatePDF } = exportService;
```

## UI/UX Design

### Export Button States
```
Normal:    [📥 Export ▼]
Hover:     [📥 Export ▼] (with highlight)
Exporting: [⏳ Exporting... 45%]
Success:   [✓ Export Complete] (green, 2 seconds)
Error:     [❌ Export Failed - Retry] (red)
```

### Export Modal
```
┌─────────────────────────────────────┐
│ Export Data                         │
├─────────────────────────────────────┤
│ Format:                             │
│ ○ CSV (Basic)                       │
│ ○ Excel (Formatted)                 │
│ ● PDF (Printable)                   │
│                                     │
│ Options:                            │
│ ☑ Include charts                    │
│ ☐ Add summary sheet                 │
│ ☐ Apply company branding            │
│                                     │
│ ℹ️ This export will include 1,234  │
│    rows of data (< 5 MB)            │
│                                     │
│ [Cancel]          [Download Export] │
└─────────────────────────────────────┘
```

## Integration Points

### Dependencies
- ExcelJS library for Excel generation
- PDFKit for PDF generation
- Email service (SendGrid/Resend)
- Background job queue for large exports

## Performance Requirements

- **Small exports (<1,000 rows)**: < 2 seconds
- **Medium exports (1,000-10,000 rows)**: < 10 seconds
- **Large exports (10,000-100,000 rows)**: < 60 seconds
- **PDF generation**: < 5 seconds

## Testing Requirements

### Unit Tests
```typescript
describe('ExportService', () => {
  it('generates valid CSV', async () => {
    const csv = await exportService.generateCSV(mockData);
    expect(csv.toString()).toContain('Name,Email,Ticket Type');
  });

  it('escapes CSV special characters', () => {
    const escaped = exportService.escapeCSV('Test, "Quote"');
    expect(escaped).toBe('"Test, ""Quote"""');
  });

  it('generates formatted Excel', async () => {
    const excel = await exportService.generateExcel(mockData, 'attendees');
    expect(excel).toBeInstanceOf(Buffer);
  });
});
```

### Integration Tests
- [ ] Test export API endpoints
- [ ] Test email delivery
- [ ] Test scheduled exports
- [ ] Test large file handling

### E2E Tests
```typescript
test('organizer exports attendee list', async ({ page }) => {
  await page.goto('/dashboard/events/evt_123/attendees');

  // Click export button
  await page.click('button:has-text("Export")');
  await page.click('text=Excel (Formatted)');

  // Wait for download
  const download = await page.waitForEvent('download');
  expect(download.suggestedFilename()).toMatch(/attendees.*\.xlsx/);
});
```

## Security Considerations

- [ ] Verify organizer owns data before export
- [ ] Rate limit exports (10 per hour per user)
- [ ] Validate email recipients
- [ ] Scan exported files for sensitive data
- [ ] Expire email links after 7 days

## Accessibility

- [ ] Keyboard shortcut (Ctrl+E) announced
- [ ] Screen reader announces export progress
- [ ] Focus management for modals
- [ ] High contrast mode for buttons

## Success Metrics

- **Target**: 60% of organizers export data monthly
- **Target**: Average 2 exports per organizer per month
- **Target**: 70% use Excel format
- **Target**: <1% export failures

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All 3 export formats work correctly
- [ ] Email delivery reliable
- [ ] Unit tests pass (>80% coverage)
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Code reviewed and approved
- [ ] QA sign-off received
- [ ] Product Owner acceptance

## Notes

- Monitor export file sizes and optimize if needed
- Consider streaming large exports instead of buffering
- Add compression for large CSV files (gzip)
- Future: Google Sheets direct export integration