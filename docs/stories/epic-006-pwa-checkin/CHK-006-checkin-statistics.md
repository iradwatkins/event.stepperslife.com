# Story: CHK-006 - Real-Time Check-in Statistics

**Epic**: EPIC-006 - Mobile Check-in PWA
**Story Points**: 3
**Priority**: P2 (Medium)
**Status**: Draft
**Dependencies**: CHK-001 (PWA Framework), CHK-005 (Multi-Device Sync)

---

## Story

**As an** event staff member or manager
**I want to** view real-time check-in progress and statistics
**So that** I can monitor event attendance and identify bottlenecks at entrances

---

## Acceptance Criteria

1. GIVEN I'm on the check-in screen
   WHEN I view the statistics panel
   THEN I should see:
   - Total attendees expected
   - Current check-in count
   - Percentage checked-in with progress bar
   - Remaining attendees count
   - All stats updating in real-time
   - Visual indicators (icons, colors)

2. GIVEN check-ins are happening across devices
   WHEN new attendees are checked in
   THEN statistics should:
   - Update within 2 seconds
   - Animate number changes smoothly
   - Show live activity indicator
   - Update progress bar with animation
   - Never decrease incorrectly
   - Work in both online and offline modes

3. GIVEN I want to see check-in trends
   WHEN I view the detailed statistics
   THEN I should see:
   - Check-in rate (attendees per minute)
   - Peak check-in time
   - Average time per check-in
   - Current rate vs expected rate
   - Estimated time to complete check-in
   - Visual graph of check-ins over time

4. GIVEN the event has multiple ticket types
   WHEN I view ticket breakdown
   THEN I should see:
   - Count per ticket type (VIP, General, etc.)
   - Percentage per type
   - Color-coded visual breakdown
   - Which types are most/least checked-in
   - Capacity indicators per type
   - Tap to filter view by type

5. GIVEN I'm a manager monitoring multiple entry points
   WHEN I access the analytics dashboard
   THEN I should see:
   - Check-ins per device/entry point
   - Staff performance metrics
   - Busiest entry points
   - Entry point comparison chart
   - Real-time alerts for issues
   - Export data option

6. GIVEN event is at capacity
   WHEN attendance reaches limits
   THEN I should see:
   - Warning at 90% capacity
   - Alert at 100% capacity
   - Visual capacity indicator (red/yellow/green)
   - Recommended actions
   - Override option for managers
   - Fire safety compliance warnings

---

## Tasks / Subtasks

- [ ] Create statistics dashboard component (AC: 1)
  - [ ] Design statistics layout
  - [ ] Display core metrics
  - [ ] Add visual indicators
  - [ ] Make mobile-responsive

- [ ] Implement real-time statistics updates (AC: 2)
  - [ ] Subscribe to WebSocket events
  - [ ] Update stats on check-in events
  - [ ] Animate value changes
  - [ ] Handle offline calculations

- [ ] Add progress indicators (AC: 1, 2)
  - [ ] Create animated progress bar
  - [ ] Add percentage display
  - [ ] Color-code by status
  - [ ] Smooth transitions

- [ ] Build check-in rate calculator (AC: 3)
  - [ ] Calculate current rate
  - [ ] Track rate over time
  - [ ] Display rate per minute
  - [ ] Show moving average

- [ ] Create time series chart (AC: 3)
  - [ ] Install Recharts library
  - [ ] Plot check-ins over time
  - [ ] Update chart in real-time
  - [ ] Make chart interactive

- [ ] Implement ticket type breakdown (AC: 4)
  - [ ] Group by ticket type
  - [ ] Calculate percentages
  - [ ] Create visual breakdown
  - [ ] Add filtering

- [ ] Add capacity warnings (AC: 6)
  - [ ] Monitor capacity levels
  - [ ] Show warnings at thresholds
  - [ ] Color-code indicators
  - [ ] Alert staff

- [ ] Build entry point analytics (AC: 5)
  - [ ] Track per-device stats
  - [ ] Calculate performance metrics
  - [ ] Create comparison view
  - [ ] Identify bottlenecks

- [ ] Create manager dashboard (AC: 5)
  - [ ] Design analytics layout
  - [ ] Add detailed metrics
  - [ ] Include charts
  - [ ] Export functionality

- [ ] Implement estimated completion time (AC: 3)
  - [ ] Calculate remaining time
  - [ ] Use current rate
  - [ ] Account for trends
  - [ ] Display estimate

- [ ] Add staff performance metrics (AC: 5)
  - [ ] Track per-staff check-ins
  - [ ] Calculate average time
  - [ ] Show leaderboard
  - [ ] Anonymous option

- [ ] Create statistics caching (AC: 2)
  - [ ] Cache calculated stats
  - [ ] Update cache efficiently
  - [ ] Reduce recalculations
  - [ ] Optimize performance

- [ ] Add data export (AC: 5)
  - [ ] Export to CSV
  - [ ] Export to PDF
  - [ ] Include all metrics
  - [ ] Timestamp exports

- [ ] Build offline statistics (AC: 2)
  - [ ] Calculate from local data
  - [ ] Sync when online
  - [ ] Show offline indicator
  - [ ] Merge with server stats

---

## Dev Notes

### Architecture References

**Statistics Architecture** (`docs/architecture/analytics.md`):
- Real-time calculation using WebSocket events
- Server-side aggregation for accuracy
- Client-side caching for performance
- Incremental updates (don't recalculate all)
- Recharts library for visualizations

**Key Metrics** (`docs/architecture/metrics.md`):
```typescript
interface CheckInStats {
  // Core metrics
  totalExpected: number;
  totalCheckedIn: number;
  percentageComplete: number;
  remainingCount: number;

  // Rate metrics
  currentRate: number; // per minute
  averageRate: number;
  peakRate: number;
  estimatedCompletion: Date;

  // Breakdown
  byTicketType: {
    type: string;
    expected: number;
    checkedIn: number;
    percentage: number;
  }[];

  // Entry points
  byDevice: {
    deviceId: string;
    staffName: string;
    checkInCount: number;
    averageTime: number;
  }[];

  // Time series
  timeline: {
    timestamp: Date;
    count: number;
    rate: number;
  }[];
}
```

**Real-Time Update Strategy**:
```typescript
// Subscribe to WebSocket events
socket.on('check-in', (data) => {
  // Increment counter
  setTotalCheckedIn(prev => prev + 1);

  // Update rate (rolling 5-minute window)
  updateCheckInRate(data.timestamp);

  // Update ticket type breakdown
  incrementTicketType(data.ticketType);

  // Update timeline
  addTimelinePoint(data.timestamp);
});
```

**Statistics Calculation** (`lib/analytics/stats-calculator.ts`):
```typescript
class StatsCalculator {
  // Calculate current rate (last 5 minutes)
  calculateCurrentRate(checkIns: CheckIn[]): number {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentCheckIns = checkIns.filter(
      c => new Date(c.timestamp) > fiveMinutesAgo
    );
    return (recentCheckIns.length / 5); // per minute
  }

  // Estimate completion time
  estimateCompletion(
    remaining: number,
    currentRate: number
  ): Date {
    if (currentRate === 0) return null;
    const minutesRemaining = remaining / currentRate;
    return new Date(Date.now() + minutesRemaining * 60 * 1000);
  }

  // Calculate capacity status
  getCapacityStatus(
    checkedIn: number,
    capacity: number
  ): 'safe' | 'warning' | 'full' {
    const percentage = (checkedIn / capacity) * 100;
    if (percentage >= 100) return 'full';
    if (percentage >= 90) return 'warning';
    return 'safe';
  }
}
```

**Chart Configuration** (Recharts):
```typescript
// Real-time line chart
<LineChart data={timelineData}>
  <XAxis
    dataKey="time"
    tickFormatter={(time) => format(time, 'HH:mm')}
  />
  <YAxis label="Check-ins" />
  <Tooltip />
  <Line
    type="monotone"
    dataKey="count"
    stroke="#4F46E5"
    strokeWidth={2}
    dot={false}
    isAnimationActive={true}
  />
</LineChart>

// Ticket type breakdown (Pie chart)
<PieChart>
  <Pie
    data={ticketTypeData}
    dataKey="count"
    nameKey="type"
    cx="50%"
    cy="50%"
    label
  />
  <Tooltip />
  <Legend />
</PieChart>
```

**Source Tree** (`docs/architecture/source-tree.md`):
```
src/
├── app/
│   └── check-in/
│       └── stats/page.tsx
├── components/
│   └── check-in/
│       ├── StatsDashboard.tsx
│       ├── StatsCard.tsx
│       ├── ProgressBar.tsx
│       ├── CheckInChart.tsx
│       ├── TicketBreakdown.tsx
│       ├── CapacityIndicator.tsx
│       └── RateDisplay.tsx
├── lib/
│   └── analytics/
│       ├── stats-calculator.ts
│       ├── rate-tracker.ts
│       └── capacity-monitor.ts
└── hooks/
    ├── useCheckInStats.ts
    └── useRealTimeUpdates.ts
```

**Performance Optimizations**:
- Memoize calculated statistics
- Debounce rapid updates (100ms)
- Use virtual DOM diffing for charts
- Lazy load chart library
- Cache aggregations server-side
- Use Redis for real-time counters

**Mobile Optimization**:
- Responsive chart sizing
- Touch-friendly interactions
- Simplified view for small screens
- Swipeable stats cards
- Pull-to-refresh
- Auto-hide details when inactive

**Offline Handling**:
- Calculate stats from local data
- Show "Offline - Local Stats" indicator
- Sync with server when online
- Reconcile any differences
- Cache last synced stats

**Accessibility**:
- ARIA labels for charts
- Screen reader announcements
- Keyboard navigation
- High contrast colors
- Text alternatives for visuals

**Analytics Events**:
```typescript
// Track stats viewing
analytics.track('Stats Viewed', {
  eventId,
  staffId,
  view: 'dashboard' | 'detailed' | 'export'
});

// Track capacity warnings
analytics.track('Capacity Warning', {
  eventId,
  capacityPercent: 90,
  timestamp: new Date()
});
```

### Testing

**Testing Requirements for this story**:
- Unit tests for stats calculator
- Unit tests for rate calculator
- Unit tests for capacity monitor
- Integration test for real-time updates
- Integration test with WebSocket
- E2E test for stats dashboard
- E2E test for chart rendering
- Test with rapid check-ins
- Test statistics accuracy
- Test capacity warnings
- Test offline statistics
- Test chart interactions
- Performance test with large datasets
- Test memory usage with long-running session
- Test data export
- Accessibility testing
- Mobile responsiveness testing

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-09-30 | 1.0 | Initial story creation | SM Agent |

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