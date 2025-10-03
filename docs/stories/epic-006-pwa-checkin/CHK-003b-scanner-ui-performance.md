# Story: CHK-003b - Scanner UI & Performance

**Epic**: EPIC-006 - Mobile Check-in PWA
**Story Points**: 2
**Priority**: P1 (High)
**Status**: Not Started
**Parent Story**: CHK-003 (QR Scanner Camera - 5 pts)
**Dependencies**: CHK-003a (Camera API & QR Detection)

---

## Story

**As an** event staff member using the scanner
**I want** a clear, intuitive scanning interface with helpful feedback
**So that** I can scan tickets efficiently without confusion or errors

**As a** user on mobile device
**I want** the scanner to be performant and battery-efficient
**So that** my device lasts throughout the entire event

---

## Acceptance Criteria

### AC1: Scanner Interface Design
**Given** scanner is active
**When** camera view is displayed
**Then** the UI should show:
- Full-screen video feed (no chrome/headers)
- Semi-transparent overlay with QR target guide
- Target guide: 250x250px square with rounded corners
- Animated corner brackets indicating scan area
- "Position QR code within frame" instruction text
- Top bar with: event name, online/offline indicator
- Bottom bar with: torch button, close button, manual entry
- Scanning animation (pulsing corners when active)
- Clean, high-contrast design for visibility

### AC2: Success/Error Visual Feedback
**Given** QR code is detected
**When** validation completes
**Then** show immediate feedback:

**Success (valid ticket)**:
- Green flash overlay (500ms)
- ✓ checkmark icon (large, centered)
- Attendee name display (2 seconds)
- Ticket tier badge
- Success sound (optional, toggle in settings)
- Haptic feedback (medium impact)
- Auto-advance to next scan after 2s

**Error (invalid/duplicate)**:
- Red flash overlay (500ms)
- ✗ error icon (large, centered)
- Error message clearly displayed
- Error sound (optional, toggle in settings)
- Strong haptic feedback (error pattern)
- Allow immediate retry
- Show "Retry" or "Manual Override" buttons

### AC3: Scanner Status Indicators
**Given** scanner is in various states
**When** displaying status
**Then** show:

| State | Indicator | Color | Message |
|-------|-----------|-------|---------|
| Initializing | Spinner | Gray | "Starting camera..." |
| Ready | Pulsing brackets | Blue | "Ready to scan" |
| Scanning | Animated corners | Blue | "Position QR code" |
| Processing | Spinner | Blue | "Validating..." |
| Success | Checkmark | Green | Attendee name |
| Error | X icon | Red | Error message |
| Offline | Offline badge | Orange | "Offline Mode" |

### AC4: Haptic & Audio Feedback
**Given** device supports haptics/audio
**When** scan events occur
**Then** provide feedback:

**Haptic patterns** (if supported):
- QR detected: Light impact (50ms)
- Valid ticket: Medium impact (100ms)
- Duplicate/error: Error pattern (50-50-50ms)
- Button press: Selection feedback

**Audio cues** (optional, user toggle):
- Success: Pleasant "ding" sound
- Error: Gentle "error" tone
- Volume: 50% system volume
- Respect device silent mode

### AC5: Battery & Performance Optimization
**Given** continuous scanner usage
**When** scanning for 1+ hours
**Then** optimize for:

**Battery life**:
- Target < 5% battery drain per hour
- Reduce frame rate when idle (5s no detection → 15fps)
- Lower resolution in low-light conditions
- Release camera when app backgrounded
- Implement idle timeout (60s → show continue prompt)
- Wake lock to prevent screen sleep during active scanning

**Performance**:
- Maintain 60fps UI (camera at 30fps)
- Web Worker for QR processing (non-blocking)
- Smooth animations (CSS transforms, no layout thrashing)
- Debounce rapid scans (3s cooldown)
- Clear memory buffers regularly
- Monitor FPS and warn if drops below 20fps

### AC6: Error State Handling
**Given** various error conditions
**When** errors occur
**Then** display helpful messages:

| Error | Message | Recovery Action |
|-------|---------|-----------------|
| Permission denied | "Camera access required. Enable in settings." | Link to settings |
| No camera | "No camera detected. Use manual entry." | Switch to manual mode |
| Camera in use | "Camera unavailable. Close other apps." | Retry button |
| Poor lighting | "Improve lighting or use torch" | Enable torch automatically |
| QR not detected | "Move closer or hold still" | Show positioning guide |
| Network timeout | "Switched to offline mode" | Show offline indicator |
| Battery low (<10%) | "Battery low. Consider plugging in." | Dismiss alert |

### AC7: Accessibility & Usability
**Given** diverse user needs
**When** using scanner
**Then** ensure:
- Large touch targets (44x44px minimum)
- High contrast UI (WCAG AA)
- Clear, legible fonts (16px minimum)
- Support for reduced motion (disable animations)
- Screen reader announcements for status changes
- Keyboard navigation support (for testing)
- RTL language support
- Portrait and landscape orientation support

---

## Tasks / Subtasks

### UI Components
- [ ] Create scanner overlay component
  - [ ] File: `/components/check-in/ScannerOverlay.tsx`
  - [ ] Full-screen video background
  - [ ] QR target guide with corners
  - [ ] Scanning animation
  - [ ] Status messages
  - [ ] Feedback overlays

- [ ] Build feedback animations
  - [ ] Green success flash
  - [ ] Red error flash
  - [ ] Checkmark/X icon animations
  - [ ] Pulsing scan brackets
  - [ ] Smooth transitions

- [ ] Create scanner controls
  - [ ] Component: `/components/check-in/ScannerControls.tsx`
  - [ ] Torch toggle button
  - [ ] Close/cancel button
  - [ ] Manual entry button
  - [ ] Settings button

- [ ] Build status display
  - [ ] Component: `/components/check-in/ScannerStatus.tsx`
  - [ ] Event name display
  - [ ] Online/offline indicator
  - [ ] Scan count
  - [ ] Battery indicator (if low)

### Feedback Systems
- [ ] Implement haptic feedback
  - [ ] Check device support
  - [ ] Define vibration patterns
  - [ ] Trigger on scan events
  - [ ] Respect user preferences

- [ ] Add audio feedback
  - [ ] Success sound asset
  - [ ] Error sound asset
  - [ ] Audio player service
  - [ ] User toggle in settings
  - [ ] Respect silent mode

- [ ] Create visual feedback
  - [ ] Flash overlay component
  - [ ] Icon animations
  - [ ] Color transitions
  - [ ] Loading states

### Performance Optimization
- [ ] Implement battery optimization
  - [ ] Adaptive frame rate
  - [ ] Idle detection (5s)
  - [ ] Background handling
  - [ ] Wake lock API
  - [ ] Battery level monitoring

- [ ] Add performance monitoring
  - [ ] FPS counter (dev mode)
  - [ ] Memory usage tracking
  - [ ] Performance warnings
  - [ ] Analytics logging

- [ ] Optimize rendering
  - [ ] Use CSS transforms
  - [ ] Avoid layout thrashing
  - [ ] Debounce expensive operations
  - [ ] Request animation frame
  - [ ] Virtual scrolling (if lists)

### Error Handling
- [ ] Create error display component
  - [ ] Component: `/components/check-in/ScannerError.tsx`
  - [ ] Error icon
  - [ ] Error message
  - [ ] Recovery actions
  - [ ] Retry button

- [ ] Build error recovery flows
  - [ ] Permission request retry
  - [ ] Camera switching
  - [ ] Manual entry fallback
  - [ ] Offline mode switch

### Accessibility
- [ ] Add ARIA labels
  - [ ] Scanner status announcements
  - [ ] Button labels
  - [ ] Error messages
  - [ ] Success confirmations

- [ ] Implement keyboard support
  - [ ] Focus management
  - [ ] Keyboard shortcuts
  - [ ] Escape to close
  - [ ] Tab navigation

- [ ] Support reduced motion
  - [ ] Detect prefers-reduced-motion
  - [ ] Disable animations
  - [ ] Static feedback instead

---

## Design Specifications

### Scanner Layout

```
┌─────────────────────────────────────┐
│ ┌─ Top Bar ─────────────────────┐ │
│ │ Event Name        [Online] 📶 │ │
│ └───────────────────────────────┘ │
│                                     │
│         [Camera Feed]               │
│                                     │
│     ┌───────────────────┐         │
│     │  ╔═══════════╗   │         │
│     │  ║           ║   │         │
│     │  ║  [QR Box] ║   │         │
│     │  ║           ║   │         │
│     │  ╚═══════════╝   │         │
│     └───────────────────┘         │
│   "Position QR code within frame"  │
│                                     │
│ ┌─ Bottom Bar ──────────────────┐ │
│ │  [💡] [✕ Close] [⌨️ Manual]  │ │
│ └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Success State Animation

```
1. QR Detected (0ms)
   - Stop scanning animation
   - Freeze frame

2. Green Flash (0-500ms)
   - Full-screen green overlay (50% opacity)
   - Fade in 200ms, hold 100ms, fade out 200ms
   - Haptic: medium impact

3. Checkmark (200-700ms)
   - Large ✓ icon (100px)
   - Scale in animation (0.5 → 1.0)
   - Attendee name fade in

4. Hold Display (700-2000ms)
   - Show attendee info
   - Ticket tier badge
   - Keep visible for 1.3 seconds

5. Reset (2000ms)
   - Fade out attendee info
   - Resume scanning
   - Ready for next scan
```

### CSS Animations

```css
/* Pulsing scan brackets */
@keyframes pulse-corners {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1.0; }
}

/* Success flash */
@keyframes success-flash {
  0% { opacity: 0; }
  20% { opacity: 0.5; }
  80% { opacity: 0.5; }
  100% { opacity: 0; }
}

/* Checkmark scale-in */
@keyframes checkmark-in {
  0% { transform: scale(0.5); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1.0); opacity: 1; }
}
```

---

## Dev Notes

### Haptic Feedback Implementation

```typescript
// lib/feedback/haptic.service.ts

export class HapticService {
  static vibrate(pattern: number | number[]): void {
    if (!navigator.vibrate) return;

    // Respect user preferences (check settings)
    const hapticsEnabled = localStorage.getItem('hapticsEnabled') !== 'false';
    if (!hapticsEnabled) return;

    navigator.vibrate(pattern);
  }

  static success(): void {
    this.vibrate(100); // Medium impact
  }

  static error(): void {
    this.vibrate([50, 50, 50]); // Error pattern
  }

  static detect(): void {
    this.vibrate(50); // Light impact
  }
}
```

### Battery Optimization

```typescript
// lib/scanner/battery-optimizer.ts

export class BatteryOptimizer {
  private idleTimeout: NodeJS.Timeout | null = null;
  private lastActivity: number = Date.now();
  private wakeLock: any = null;

  async requestWakeLock(): Promise<void> {
    try {
      if ('wakeLock' in navigator) {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
      }
    } catch (err) {
      console.warn('Wake lock failed:', err);
    }
  }

  releaseWakeLock(): void {
    if (this.wakeLock) {
      this.wakeLock.release();
      this.wakeLock = null;
    }
  }

  trackActivity(): void {
    this.lastActivity = Date.now();
    this.resetIdleTimeout();
  }

  private resetIdleTimeout(): void {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }

    this.idleTimeout = setTimeout(() => {
      this.onIdle();
    }, 60000); // 60 seconds
  }

  private onIdle(): void {
    // Show "Still scanning?" prompt
    // Reduce frame rate or pause scanning
    console.log('Scanner idle detected');
  }

  getIdleTime(): number {
    return Date.now() - this.lastActivity;
  }
}
```

### Performance Monitoring

```typescript
// lib/scanner/performance-monitor.ts

export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 0;

  updateFPS(): void {
    this.frameCount++;
    const currentTime = performance.now();

    if (currentTime >= this.lastTime + 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
      this.frameCount = 0;
      this.lastTime = currentTime;

      if (this.fps < 20) {
        console.warn('Low FPS detected:', this.fps);
      }
    }
  }

  getFPS(): number {
    return this.fps;
  }

  async getBatteryLevel(): Promise<number | null> {
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        return battery.level;
      }
    } catch (err) {
      console.warn('Battery API unavailable');
    }
    return null;
  }
}
```

---

## Testing

### Visual Regression Tests
- [ ] Scanner overlay appearance
- [ ] Success animation sequence
- [ ] Error animation sequence
- [ ] Button layouts
- [ ] Status indicators

### Usability Tests
- [ ] Scan completion time (<2s)
- [ ] Error message clarity
- [ ] Button accessibility (size/contrast)
- [ ] Haptic feedback feel
- [ ] Audio cues volume

### Performance Tests
- [ ] Maintain 60fps UI
- [ ] Battery drain < 5%/hour
- [ ] Memory usage stable
- [ ] No memory leaks (1hr test)
- [ ] Smooth animations

### Accessibility Tests
- [ ] Screen reader compatibility
- [ ] Keyboard navigation
- [ ] High contrast mode
- [ ] Reduced motion support
- [ ] Color blind friendly

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-09-30 | BMAD SM Agent | Initial sharded story from CHK-003 |

---

*Sharded from CHK-003 (5 pts) - Part 2 of 2*
*Depends on: CHK-003a - Camera API & QR Detection (3 pts)*
*Generated by BMAD SM Agent*