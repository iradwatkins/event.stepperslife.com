# ORG-008a: Report Builder UI & Drag-Drop Interface

**Epic:** EPIC-007 - Organizer Dashboard & Analytics
**Parent Story:** ORG-008 - Custom Report Builder
**Story Points:** 3
**Priority:** High
**Status:** Ready for Development

## User Story
As an **event organizer**
I want to **use a visual drag-and-drop interface to build custom reports**
So that **I can intuitively design reports without writing code or complex queries**

## Parent Story Context
This is the first sub-story of ORG-008: Custom Report Builder (8 points). This story focuses solely on the visual drag-and-drop UI interface, providing the foundation for the custom report builder experience.

**Sharding Strategy:**
- **ORG-008a** (this story): UI & Drag-Drop Interface (3 points)
- **ORG-008b**: Dimension & Metric Selection Logic (2 points)
- **ORG-008c**: Query Engine & Data Aggregation (3 points)
- **ORG-008d**: Report Saving & Template System (2 points)

**Integration Points:**
- Provides UI foundation that ORG-008b will populate with dimensions/metrics
- Creates drop zones and canvas that ORG-008c will connect to query engine
- Establishes layout that ORG-008d will extend with save/load functionality

## Acceptance Criteria

### AC1: Report Builder Layout & Structure
- [ ] Three-panel layout:
  - **Left Sidebar** (250px): Draggable items source
  - **Center Canvas** (fluid): Drop zones and preview area
  - **Right Sidebar** (300px): Settings and configuration
- [ ] Responsive layout adjusts for tablet (collapses sidebars to tabs)
- [ ] Toolbar at top with primary actions: Save, Export, Reset, Templates
- [ ] Collapsible sidebars (toggle buttons to maximize canvas space)
- [ ] Layout state persists in localStorage (sidebar open/closed)

### AC2: Drag-and-Drop Functionality
- [ ] Use `@dnd-kit/core` library for drag-and-drop
- [ ] Draggable items from left sidebar (dimensions/metrics placeholders)
- [ ] Visual drag feedback:
  - Item "lifts" with shadow when grabbed
  - Semi-transparent clone follows cursor
  - Original item dims while dragging
- [ ] Drop zones highlight when draggable item hovers over them
- [ ] Snap-to-zone animation when item dropped
- [ ] Prevent invalid drops (show red indicator)
- [ ] Keyboard accessibility (Space to grab, Arrow keys to move, Enter to drop)
- [ ] Touch support for mobile/tablet

### AC3: Drop Zones
- [ ] Three primary drop zones on canvas:
  - **Rows Zone**: Vertical list of row dimensions
  - **Columns Zone**: Horizontal list of column dimensions
  - **Values Zone**: Grid of metrics to calculate
- [ ] Each drop zone:
  - Shows placeholder text when empty ("Drop dimensions here")
  - Displays border and icon when hovered during drag
  - Contains draggable chips/pills for dropped items
  - Supports reordering within zone (drag to reorder)
  - Has remove button (X) on each dropped item
- [ ] Visual hierarchy: Rows → Columns → Values
- [ ] Drop zone capacity limits (configurable, default: 5 items per zone)

### AC4: Dropped Item Management
- [ ] Dropped items appear as interactive chips/pills:
  - Icon indicating type (dimension/metric)
  - Label text (truncated if too long, tooltip for full name)
  - Remove button (X icon)
  - Drag handle icon (⋮⋮)
- [ ] Reorder items within same drop zone (drag to reorder)
- [ ] Move items between compatible drop zones (dimensions only in Rows/Columns)
- [ ] Double-click item to open inline settings modal
- [ ] Batch operations:
  - "Clear All" button per drop zone
  - "Reset Report" button clears all zones

### AC5: Canvas Preview Area
- [ ] Below drop zones: Live preview section
- [ ] Preview shows placeholder when no items dropped:
  - Empty state illustration
  - "Drop dimensions and metrics to build your report"
  - Quick start tips
- [ ] When items dropped: Preview updates automatically (mock data for now)
- [ ] Preview loading state (skeleton UI while "fetching" data)
- [ ] Preview error state (red banner if invalid combination)
- [ ] Toggle preview on/off (button to maximize drop zone space)

### AC6: Toolbar Actions
- [ ] **Reset Button**: Clears all drop zones, shows confirmation modal
- [ ] **Undo/Redo**: Navigate report builder history (up to 20 steps)
- [ ] **View Toggle**: Switch between "Builder Mode" and "Preview Mode"
- [ ] **Full Screen**: Maximize canvas, hide sidebars
- [ ] **Help**: Tooltip tour of drag-and-drop functionality
- [ ] All buttons have keyboard shortcuts (e.g., Ctrl+Z for undo)

### AC7: Interaction Feedback
- [ ] Smooth animations (150-200ms transitions)
- [ ] Haptic feedback on drop (if supported)
- [ ] Toast notifications for key actions:
  - "Dimension added to Rows"
  - "Invalid drop: Metrics cannot be used as dimensions"
- [ ] Error messages for invalid operations
- [ ] Loading spinners for async operations
- [ ] Optimistic UI updates (immediate visual feedback)

### AC8: Settings Panel (Right Sidebar)
- [ ] Collapsible sections:
  - **Filters** (placeholder for ORG-008b)
  - **Visualization Type** (dropdown: Table, Pivot, Chart - placeholder)
  - **Format Options** (placeholder for ORG-008c)
  - **Schedule** (placeholder for ORG-008d)
- [ ] Each section expands/collapses independently
- [ ] Settings save to component state (not persisted yet)
- [ ] Settings panel scrollable if content overflows

## Technical Implementation

### Frontend Components
```typescript
// /components/dashboard/analytics/ReportBuilder/ReportBuilder.tsx
import { DndContext, DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { useState } from 'react';

interface ReportBuilderProps {
  organizerId: string;
  savedReportId?: string;
}

interface DroppedItem {
  id: string;
  type: 'dimension' | 'metric';
  label: string;
  field: string;
  icon?: string;
}

interface ReportState {
  rows: DroppedItem[];
  columns: DroppedItem[];
  values: DroppedItem[];
}

export default function ReportBuilder({ organizerId }: ReportBuilderProps) {
  const [reportState, setReportState] = useState<ReportState>({
    rows: [],
    columns: [],
    values: []
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const targetZone = over.id as 'rows' | 'columns' | 'values';
    const item = active.data.current as DroppedItem;

    // Validate drop
    if (!isValidDrop(item, targetZone)) {
      toast.error('Invalid drop: Metrics cannot be used as dimensions');
      return;
    }

    // Add item to zone
    setReportState(prev => ({
      ...prev,
      [targetZone]: [...prev[targetZone], item]
    }));

    toast.success(`${item.label} added to ${targetZone}`);
  };

  return (
    <div className="report-builder h-screen flex flex-col">
      {/* Toolbar */}
      <Toolbar
        onReset={handleReset}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <LeftSidebar
          isOpen={leftSidebarOpen}
          onToggle={() => setLeftSidebarOpen(!leftSidebarOpen)}
        />

        {/* Canvas */}
        <DndContext onDragEnd={handleDragEnd}>
          <Canvas reportState={reportState} />
        </DndContext>

        {/* Right Sidebar */}
        <RightSidebar
          isOpen={rightSidebarOpen}
          onToggle={() => setRightSidebarOpen(!rightSidebarOpen)}
        />
      </div>
    </div>
  );
}
```

### Drop Zone Component
```typescript
// /components/dashboard/analytics/ReportBuilder/DropZone.tsx
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface DropZoneProps {
  id: 'rows' | 'columns' | 'values';
  label: string;
  items: DroppedItem[];
  onRemove: (id: string) => void;
  onReorder: (items: DroppedItem[]) => void;
}

export function DropZone({ id, label, items, onRemove, onReorder }: DropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'drop-zone p-4 rounded-lg border-2 border-dashed min-h-[100px]',
        isOver ? 'border-primary bg-primary/10' : 'border-gray-300',
        items.length === 0 && 'bg-gray-50'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
        {items.length > 0 && (
          <button
            onClick={() => items.forEach(item => onRemove(item.id))}
            className="text-xs text-red-600 hover:underline"
          >
            Clear All
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <DragIcon className="mx-auto mb-2 h-8 w-8" />
          <p className="text-sm">Drop {label.toLowerCase()} here</p>
        </div>
      ) : (
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map(item => (
              <DroppedItemChip
                key={item.id}
                item={item}
                onRemove={() => onRemove(item.id)}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
}
```

### Draggable Item Chip
```typescript
// /components/dashboard/analytics/ReportBuilder/DroppedItemChip.tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DroppedItemChipProps {
  item: DroppedItem;
  onRemove: () => void;
}

export function DroppedItemChip({ item, onRemove }: DroppedItemChipProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 bg-white rounded-md border border-gray-300 px-3 py-2 shadow-sm"
    >
      <div {...attributes} {...listeners} className="cursor-grab">
        <DragHandleIcon className="h-4 w-4 text-gray-400" />
      </div>

      {item.icon && <span className="text-lg">{item.icon}</span>}

      <span className="flex-1 text-sm font-medium truncate">
        {item.label}
      </span>

      <button
        onClick={onRemove}
        className="text-gray-400 hover:text-red-600 transition"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
```

## UI/UX Design

### Builder Layout
```
┌────────────────────────────────────────────────────────────────┐
│ 📊 Report Builder          [Reset] [Undo] [Redo] [Save] [Export]│
├──────────┬──────────────────────────────────────────┬──────────┤
│          │                                           │          │
│📦 Items  │  📍 Drop Dimensions to Rows              │⚙️ Settings│
│          │  ┌─────────────────────────────────────┐│          │
│[Collapse]│  │ Drop dimensions here                ││[Collapse]│
│          │  └─────────────────────────────────────┘│          │
│Dimensions│                                           │Filters   │
│ 📅 Date  │  📊 Drop Dimensions to Columns           │[+ Add]   │
│ 📍 Event │  ┌─────────────────────────────────────┐│          │
│ 🎟️ Ticket│  │ Drop dimensions here                ││Viz Type  │
│          │  └─────────────────────────────────────┘│[Table ▾] │
│Metrics   │                                           │          │
│ 💰 Revenue│  📈 Drop Metrics to Values              │Format    │
│ 🎫 Tickets│  ┌─────────────────────────────────────┐│[Options] │
│ 👥 Attendee│ │ Drop metrics here                  ││          │
│          │  └─────────────────────────────────────┘│Schedule  │
│          │                                           │[+ Add]   │
│          │  ───────────────────────────────────────│          │
│          │  📋 Preview                              │Share     │
│          │  Drop items above to see your report    │[🔗 Link] │
│          │                                           │          │
└──────────┴──────────────────────────────────────────┴──────────┘
```

## Integration Points

### Dependencies
- **None**: This is the foundational UI story

### Provides Interfaces For
- **ORG-008b**: Left sidebar will be populated with actual dimensions/metrics
- **ORG-008c**: Canvas will trigger query execution on state changes
- **ORG-008d**: Toolbar Save button will be connected to persistence service

### Data Contracts
```typescript
// Export report state format for ORG-008b, 008c, 008d
export interface ReportBuilderState {
  rows: DroppedItem[];
  columns: DroppedItem[];
  values: DroppedItem[];
  history: ReportBuilderState[]; // For undo/redo
  historyIndex: number;
}

// Event emitters for integration
export type ReportBuilderEvents = {
  'state:change': (state: ReportBuilderState) => void;
  'item:dropped': (item: DroppedItem, zone: string) => void;
  'item:removed': (itemId: string, zone: string) => void;
  'reset:triggered': () => void;
};
```

## Testing Requirements

### Unit Tests
```typescript
describe('ReportBuilder', () => {
  it('renders three-panel layout', () => {
    render(<ReportBuilder organizerId="org_123" />);
    expect(screen.getByText('Items')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('toggles sidebar visibility', async () => {
    render(<ReportBuilder organizerId="org_123" />);
    const toggle = screen.getByLabelText('Collapse left sidebar');
    await userEvent.click(toggle);
    expect(screen.queryByText('Items')).not.toBeVisible();
  });
});

describe('DropZone', () => {
  it('shows placeholder when empty', () => {
    render(<DropZone id="rows" label="Rows" items={[]} />);
    expect(screen.getByText('Drop rows here')).toBeInTheDocument();
  });

  it('displays dropped items', () => {
    const items = [{ id: '1', type: 'dimension', label: 'Event Name', field: 'event.name' }];
    render(<DropZone id="rows" label="Rows" items={items} />);
    expect(screen.getByText('Event Name')).toBeInTheDocument();
  });

  it('calls onRemove when X clicked', async () => {
    const onRemove = jest.fn();
    const items = [{ id: '1', type: 'dimension', label: 'Event Name', field: 'event.name' }];
    render(<DropZone id="rows" label="Rows" items={items} onRemove={onRemove} />);
    await userEvent.click(screen.getByRole('button', { name: /remove/i }));
    expect(onRemove).toHaveBeenCalledWith('1');
  });
});
```

### Integration Tests
- [ ] Drag item from sidebar to drop zone
- [ ] Reorder items within drop zone
- [ ] Move item between drop zones
- [ ] Clear all items in zone
- [ ] Reset entire report
- [ ] Undo/redo operations

### E2E Tests
```typescript
test('user builds report with drag-and-drop', async ({ page }) => {
  await page.goto('/dashboard/reports/builder');

  // Verify layout
  await expect(page.locator('.left-sidebar')).toBeVisible();
  await expect(page.locator('.canvas')).toBeVisible();
  await expect(page.locator('.right-sidebar')).toBeVisible();

  // Drag dimension to rows (mock for now)
  const dimension = page.locator('[data-draggable="event.name"]');
  const rowsZone = page.locator('[data-dropzone="rows"]');
  await dimension.dragTo(rowsZone);

  // Verify item appears in zone
  await expect(rowsZone.locator('text=Event Name')).toBeVisible();

  // Remove item
  await page.click('[data-dropzone="rows"] button[aria-label="Remove"]');
  await expect(rowsZone.locator('text=Event Name')).not.toBeVisible();
});
```

## Performance Requirements

- **Initial load**: < 1 second
- **Drag operation**: 60fps (16.67ms per frame)
- **Drop animation**: < 200ms
- **State update**: < 50ms
- **Sidebar toggle**: < 150ms transition

## Accessibility

- [ ] Keyboard navigation: Tab through all interactive elements
- [ ] Space/Enter to grab draggable items
- [ ] Arrow keys to move items between zones
- [ ] Escape to cancel drag operation
- [ ] Screen reader announces drop zones and items
- [ ] ARIA labels for all buttons and zones
- [ ] Focus visible indicators
- [ ] Skip to content links

## Definition of Done

- [ ] Three-panel layout implemented
- [ ] Drag-and-drop working with @dnd-kit
- [ ] All three drop zones functional
- [ ] Dropped items can be reordered and removed
- [ ] Undo/redo working (up to 20 steps)
- [ ] Toolbar actions implemented
- [ ] Responsive layout for tablet
- [ ] Keyboard navigation fully functional
- [ ] Unit tests pass (>85% coverage)
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Performance benchmarks met (60fps drag)
- [ ] Accessibility audit passed (Axe DevTools)
- [ ] Code reviewed and approved
- [ ] QA sign-off received
- [ ] Product Owner acceptance

## Notes

- Use `@dnd-kit/core` instead of `react-dnd` (better performance, smaller bundle)
- Mock data in preview for this story (real data in ORG-008c)
- Left sidebar items are placeholders (populated in ORG-008b)
- Save functionality is placeholder (implemented in ORG-008d)
- Focus on smooth, intuitive UX inspired by Google Data Studio