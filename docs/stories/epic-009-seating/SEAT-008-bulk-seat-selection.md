# Story: SEAT-008 - Bulk Seat Selection for Groups

**Epic**: EPIC-009 - Reserved Seating System
**Story Points**: 3
**Priority**: E2 (Medium)
**Status**: Draft
**Dependencies**: SEAT-002 (Interactive Seat Selection), SEAT-003 (Real-Time Availability)

---

## Story

**As a** customer purchasing tickets for a group
**I want to** select multiple adjacent seats at once
**So that** my group can sit together without manually clicking each individual seat

---

## Acceptance Criteria

1. GIVEN I'm selecting seats for multiple people
   WHEN I enter the number of seats needed
   THEN I should see:
   - "Select [N] seats" mode indicator
   - Multi-select toggle button
   - "Best Available" button for auto-selection
   - Visual guide showing contiguous seat groups
   - Ability to drag-select multiple seats
   - Counter showing selected vs. needed seats

2. GIVEN I enable multi-select mode
   WHEN I click seats on the chart
   THEN the system should:
   - Select multiple seats with each click
   - Highlight all selected seats
   - Show running count (e.g., "3 of 5 seats selected")
   - Allow deselection by clicking again
   - Warn if seats are not adjacent
   - Suggest adjacent alternatives

3. GIVEN I use "Best Available" feature
   WHEN I specify the number of seats
   THEN the system should:
   - Find best contiguous group of seats
   - Prioritize center sections and rows
   - Keep group together in same row
   - Fall back to adjacent rows if needed
   - Auto-select the recommended seats
   - Allow me to adjust selection manually
   - Show why these seats were chosen

4. GIVEN I need seats for a large group
   WHEN I select "Find [N] adjacent seats"
   THEN the system should:
   - Search all sections for contiguous blocks
   - Highlight available groups on chart
   - Sort options by best-to-worst (proximity, view)
   - Show "2 rows of 4" vs "1 row of 8" options
   - Allow choosing between options
   - Reserve entire group atomically

5. GIVEN I drag-select seats
   WHEN I click and drag across the chart
   THEN the system should:
   - Show selection rectangle while dragging
   - Select all available seats in rectangle
   - Skip unavailable seats automatically
   - Limit to reasonable group size (e.g., 20 seats max)
   - Show preview of selection before confirming
   - Validate adjacency of selected seats

6. GIVEN I select non-adjacent seats accidentally
   WHEN the system detects separation
   THEN it should:
   - Show warning "Seats are not together"
   - Highlight the gap visually
   - Suggest closest contiguous alternative
   - Allow override with "Select anyway" option
   - Show message "Your group will be separated"
   - Confirm intent before proceeding

---

## Tasks / Subtasks

- [ ] Create multi-select mode UI (AC: 1, 2)
  - [ ] Toggle button for multi-select
  - [ ] Mode indicator banner
  - [ ] Seat counter display
  - [ ] Visual highlighting for selected seats

- [ ] Implement drag-to-select functionality (AC: 5)
  - [ ] Detect mouse drag events
  - [ ] Draw selection rectangle
  - [ ] Calculate seats within rectangle
  - [ ] Auto-select available seats

- [ ] Build "Best Available" algorithm (AC: 3)
  - [ ] Define seat scoring criteria
  - [ ] Find contiguous seat blocks
  - [ ] Prioritize center sections
  - [ ] Implement adjacency detection
  - [ ] Return ranked options

- [ ] Create adjacency detection algorithm (AC: 2, 6)
  - [ ] Check if seats in same row
  - [ ] Calculate seat distances
  - [ ] Detect gaps between seats
  - [ ] Validate contiguous groups

- [ ] Implement bulk seat search (AC: 4)
  - [ ] Search for N contiguous seats
  - [ ] Find blocks across all sections
  - [ ] Rank by quality score
  - [ ] Handle multi-row configurations

- [ ] Add seat group visualization (AC: 1, 4)
  - [ ] Highlight available groups
  - [ ] Show group boundaries
  - [ ] Color-code by size
  - [ ] Animate group suggestions

- [ ] Build non-adjacency warnings (AC: 6)
  - [ ] Detect non-contiguous selections
  - [ ] Show warning dialog
  - [ ] Suggest alternatives
  - [ ] Allow override with confirmation

- [ ] Create "Find adjacent" suggestions (AC: 2, 6)
  - [ ] Find nearby contiguous seats
  - [ ] Calculate similarity to current selection
  - [ ] Show "Try these instead" UI
  - [ ] One-click swap to suggestion

- [ ] Implement atomic group reservation (AC: 4)
  - [ ] Reserve all seats in transaction
  - [ ] Roll back if any seat unavailable
  - [ ] Handle race conditions
  - [ ] Show clear error on failure

- [ ] Add group size presets (AC: 1)
  - [ ] Quick select buttons (2, 4, 6, 8 seats)
  - [ ] Custom number input
  - [ ] Validate max group size
  - [ ] Adjust best available accordingly

- [ ] Build split group options (AC: 4)
  - [ ] Offer "2 rows of 4" alternatives
  - [ ] Show visual preview of split
  - [ ] Allow selection between options
  - [ ] Calculate tradeoffs (together vs. better seats)

- [ ] Optimize selection algorithms for performance (AC: 3, 4)
  - [ ] Index seats by adjacency
  - [ ] Cache contiguous blocks
  - [ ] Pre-calculate seat scores
  - [ ] Limit search space for large venues

---

## Dev Notes

### Architecture References

**Bulk Selection** (`docs/architecture/seating-architecture.md`):
- Multi-select mode for group purchases
- Best available algorithm prioritizes center + contiguity
- Drag selection for quick multi-seat selection
- Adjacency validation with warnings
- Atomic reservation of entire group

**Adjacency Algorithm** (`docs/architecture/algorithms.md`):
- Same row + consecutive seat numbers = adjacent
- Adjacent rows with aligned seats = semi-adjacent
- Gap detection: missing seat numbers
- Handle curved rows and irregular layouts
- Score by compactness and proximity

**Best Available Algorithm** (`docs/architecture/algorithms.md`):
```
1. Score each seat:
   - Distance from center (lower is better)
   - Row position (middle rows preferred)
   - Price tier (within budget)
   - View quality (no obstructions)

2. Find contiguous blocks:
   - Search for N consecutive available seats
   - Same row is ideal
   - Adjacent rows acceptable if aligned
   - Split only as last resort

3. Rank options:
   - Sum of seat scores
   - Contiguity bonus
   - Center proximity
   - Return top 3 options
```

**Adjacency Detection Logic**:
```typescript
// lib/seating/adjacency.ts
export function areSeatsAdjacent(seats: Seat[]): boolean {
  if (seats.length === 0) return true;
  if (seats.length === 1) return true;

  // Group by row
  const byRow = groupBy(seats, 'row');
  const rows = Object.keys(byRow);

  // Must be in same row or adjacent rows
  if (rows.length > 2) return false;

  for (const row of rows) {
    const seatsInRow = byRow[row].sort((a, b) =>
      parseInt(a.number) - parseInt(b.number)
    );

    // Check consecutive seat numbers
    for (let i = 1; i < seatsInRow.length; i++) {
      const prev = parseInt(seatsInRow[i - 1].number);
      const curr = parseInt(seatsInRow[i].number);
      if (curr - prev > 1) {
        return false; // Gap detected
      }
    }
  }

  // If two rows, check alignment
  if (rows.length === 2) {
    const row1Seats = byRow[rows[0]];
    const row2Seats = byRow[rows[1]];

    // Check if rows are adjacent and seats align
    return areRowsAdjacent(rows[0], rows[1]) &&
           seatsAlignBetweenRows(row1Seats, row2Seats);
  }

  return true;
}

export function findAdjacentSeats(
  seatId: string,
  count: number,
  allSeats: Seat[]
): Seat[] | null {
  const startSeat = allSeats.find(s => s.id === seatId);
  if (!startSeat) return null;

  // Find seats in same row
  const sameRowSeats = allSeats
    .filter(s => s.row === startSeat.row && s.status === 'AVAILABLE')
    .sort((a, b) => parseInt(a.number) - parseInt(b.number));

  // Look for contiguous block
  for (let i = 0; i < sameRowSeats.length; i++) {
    const block = sameRowSeats.slice(i, i + count);
    if (block.length === count && areSeatsContiguous(block)) {
      return block;
    }
  }

  return null; // No contiguous block found
}

function areSeatsContiguous(seats: Seat[]): boolean {
  for (let i = 1; i < seats.length; i++) {
    const prevNum = parseInt(seats[i - 1].number);
    const currNum = parseInt(seats[i].number);
    if (currNum - prevNum !== 1) return false;
  }
  return true;
}
```

**Best Available Implementation**:
```typescript
// lib/seating/best-available.ts
export function findBestAvailable(
  count: number,
  seatingChart: SeatingChart,
  preferences?: SeatPreferences
): SeatGroup[] {
  const availableSeats = seatingChart.sections
    .flatMap(s => s.seats)
    .filter(s => s.status === 'AVAILABLE');

  // Score all seats
  const scoredSeats = availableSeats.map(seat => ({
    seat,
    score: scoreSeat(seat, seatingChart, preferences),
  }));

  // Find contiguous blocks
  const blocks = findContiguousBlocks(scoredSeats, count);

  // Rank by combined score
  const rankedBlocks = blocks
    .map(block => ({
      seats: block.map(s => s.seat),
      totalScore: block.reduce((sum, s) => sum + s.score, 0),
      averageScore: block.reduce((sum, s) => sum + s.score, 0) / block.length,
      contiguityBonus: calculateContiguityBonus(block),
    }))
    .sort((a, b) =>
      (b.totalScore + b.contiguityBonus) - (a.totalScore + a.contiguityBonus)
    );

  return rankedBlocks.slice(0, 3); // Return top 3 options
}

function scoreSeat(
  seat: Seat,
  chart: SeatingChart,
  preferences?: SeatPreferences
): number {
  let score = 100; // Base score

  // Distance from center (horizontal)
  const centerX = chart.chartData.width / 2;
  const distanceFromCenter = Math.abs(seat.x - centerX);
  const centerPenalty = (distanceFromCenter / centerX) * 30;
  score -= centerPenalty;

  // Row preference (middle rows better)
  const totalRows = chart.sections
    .flatMap(s => s.seats)
    .map(s => s.row)
    .filter((v, i, a) => a.indexOf(v) === i).length;

  const rowNumber = parseInt(seat.row) || 0;
  const middleRow = totalRows / 2;
  const rowPenalty = Math.abs(rowNumber - middleRow) * 2;
  score -= rowPenalty;

  // Accessibility preference
  if (preferences?.requireAccessible && !seat.isAccessible) {
    score -= 1000; // Effectively exclude
  }

  // Restricted view penalty
  if (seat.hasRestrictedView) {
    score -= 20;
  }

  // Price preference
  if (preferences?.maxPrice && seat.price > preferences.maxPrice) {
    score -= 1000; // Effectively exclude
  }

  return Math.max(0, score);
}

function findContiguousBlocks(
  scoredSeats: ScoredSeat[],
  count: number
): ScoredSeat[][] {
  const blocks: ScoredSeat[][] = [];

  // Group by row
  const byRow = groupBy(scoredSeats, seat => seat.seat.row);

  for (const row of Object.values(byRow)) {
    const sorted = row.sort((a, b) =>
      parseInt(a.seat.number) - parseInt(b.seat.number)
    );

    // Sliding window to find contiguous blocks
    for (let i = 0; i <= sorted.length - count; i++) {
      const block = sorted.slice(i, i + count);
      if (areSeatsContiguous(block.map(s => s.seat))) {
        blocks.push(block);
      }
    }
  }

  return blocks;
}

function calculateContiguityBonus(block: ScoredSeat[]): number {
  // Bonus for being in single row
  const rows = new Set(block.map(s => s.seat.row));
  if (rows.size === 1) return 50;

  // Small bonus for adjacent rows
  if (rows.size === 2) return 20;

  return 0;
}
```

**Drag Selection Component**:
```typescript
// components/seating/DragSelect.tsx
export function DragSelectChart({ seats, onSelectSeats }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [dragEnd, setDragEnd] = useState<Point | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setDragEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseUp = () => {
    if (!isDragging || !dragStart || !dragEnd) return;

    // Find seats within selection rectangle
    const selectedSeats = seats.filter(seat =>
      seat.status === 'AVAILABLE' &&
      seat.x >= Math.min(dragStart.x, dragEnd.x) &&
      seat.x <= Math.max(dragStart.x, dragEnd.x) &&
      seat.y >= Math.min(dragStart.y, dragEnd.y) &&
      seat.y <= Math.max(dragStart.y, dragEnd.y)
    );

    if (selectedSeats.length > 20) {
      alert('Please select 20 or fewer seats at once');
      return;
    }

    onSelectSeats(selectedSeats);

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  return (
    <svg
      width="100%"
      height="100%"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Render seats */}
      {seats.map(seat => (
        <SeatCircle key={seat.id} seat={seat} />
      ))}

      {/* Render selection rectangle */}
      {isDragging && dragStart && dragEnd && (
        <rect
          x={Math.min(dragStart.x, dragEnd.x)}
          y={Math.min(dragStart.y, dragEnd.y)}
          width={Math.abs(dragEnd.x - dragStart.x)}
          height={Math.abs(dragEnd.y - dragStart.y)}
          fill="rgba(59, 130, 246, 0.2)"
          stroke="rgb(59, 130, 246)"
          strokeWidth={2}
        />
      )}
    </svg>
  );
}
```

**Best Available Button**:
```typescript
// components/seating/BestAvailableButton.tsx
export function BestAvailableButton({ count, onSelect }: Props) {
  const [options, setOptions] = useState<SeatGroup[]>([]);
  const [showOptions, setShowOptions] = useState(false);

  const handleFindBest = async () => {
    const chart = await fetchSeatingChart();
    const bestOptions = findBestAvailable(count, chart);
    setOptions(bestOptions);
    setShowOptions(true);
  };

  return (
    <>
      <button onClick={handleFindBest} className="best-available-btn">
        <MagicWandIcon />
        Find Best {count} Seats
      </button>

      {showOptions && (
        <Dialog onClose={() => setShowOptions(false)}>
          <h3>Best Available Options</h3>
          {options.map((option, i) => (
            <div key={i} className="option-card">
              <h4>Option {i + 1}</h4>
              <p>
                {option.seats[0].section} - Row {option.seats[0].row},
                Seats {option.seats[0].number}-{option.seats[option.seats.length - 1].number}
              </p>
              <p>Score: {option.averageScore.toFixed(0)}/100</p>
              <button onClick={() => {
                onSelect(option.seats);
                setShowOptions(false);
              }}>
                Select These Seats
              </button>
            </div>
          ))}
        </Dialog>
      )}
    </>
  );
}
```

**Source Tree** (`docs/architecture/source-tree.md`):
```
src/
├── components/
│   └── seating/
│       ├── DragSelectChart.tsx
│       ├── BestAvailableButton.tsx
│       ├── MultiSelectMode.tsx
│       └── AdjacencyWarning.tsx
└── lib/
    └── seating/
        ├── adjacency.ts
        ├── best-available.ts
        ├── seat-scoring.ts
        └── bulk-selection.ts
```

### Testing

**Testing Requirements for this story**:
- Unit tests for adjacency detection
- Unit tests for best available algorithm
- Unit tests for seat scoring
- Unit tests for contiguous block finding
- Integration test for bulk selection
- Integration test for drag selection
- E2E test for best available flow
- E2E test for multi-select mode
- E2E test for adjacency warnings
- Test drag selection with various shapes
- Test best available with different capacities
- Performance test for large venue search

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