# Story: CHK-003 - QR Code Scanner with Camera

**Epic**: EPIC-006 - Mobile Check-in PWA
**Story Points**: 5
**Priority**: P1 (High)
**Status**: Draft
**Dependencies**: CHK-001 (PWA Framework), TIX-003 (Ticket Validation)

---

## Story

**As an** event staff member at the entrance
**I want to** quickly scan attendee QR codes using my device camera
**So that** check-in is fast and efficient without manual entry

---

## Acceptance Criteria

1. GIVEN I'm on the check-in screen
   WHEN I tap "Scan Ticket" button
   THEN the system should:
   - Request camera permission if not granted
   - Open camera view with QR code overlay
   - Show QR code target guide (frame)
   - Display cancel button
   - Initialize camera within 500ms
   - Auto-focus on QR codes in view

2. GIVEN camera is active and scanning
   WHEN a valid ticket QR code enters the frame
   THEN the system should:
   - Detect QR code within 1 second
   - Provide haptic feedback on detection
   - Parse QR code data automatically
   - Validate ticket immediately
   - Show success/error state
   - Close camera view on success
   - Auto-advance to next scan after 2s

3. GIVEN I'm scanning in low light conditions
   WHEN QR code is difficult to read
   THEN I should have:
   - Flashlight/torch toggle button
   - Brightness adjustment option
   - Clear visual feedback on detection issues
   - Manual focus tap option
   - Zoom in/out controls

4. GIVEN QR code contains valid ticket data
   WHEN scan is successful
   THEN the system should:
   - Display attendee name immediately
   - Show ticket type and seat info
   - Show green success indicator
   - Provide audio/haptic confirmation
   - Work in both online and offline mode
   - Log scan timestamp

5. GIVEN QR code is invalid or already used
   WHEN validation fails
   THEN the system should:
   - Show red error indicator
   - Display clear error message
   - Provide warning sound/vibration
   - Show ticket status (already checked-in, invalid, etc.)
   - Offer manual override option (for managers)
   - Allow rescan immediately

6. GIVEN I'm scanning continuously at entrance
   WHEN processing multiple attendees
   THEN scanner should:
   - Keep camera active between scans
   - Maintain < 2 second per-person throughput
   - Prevent duplicate scans (debounce 3s)
   - Show scan count and rate
   - Handle camera errors gracefully
   - Optimize battery usage

---

## Tasks / Subtasks

- [ ] Integrate QR code scanning library (AC: 1, 2)
  - [ ] Evaluate jsQR vs zxing-js
  - [ ] Install and configure chosen library
  - [ ] Create scanner wrapper component

- [ ] Implement camera access with permissions (AC: 1)
  - [ ] Request camera permission
  - [ ] Handle permission denied
  - [ ] Use MediaDevices API
  - [ ] Handle multiple cameras

- [ ] Create camera UI with scanning interface (AC: 1, 3)
  - [ ] Design full-screen scanner view
  - [ ] Add QR code target overlay
  - [ ] Create control buttons (cancel, torch, zoom)
  - [ ] Add scanning animation

- [ ] Add QR code detection logic (AC: 2)
  - [ ] Implement continuous scanning
  - [ ] Parse QR code data
  - [ ] Validate ticket format
  - [ ] Handle malformed codes

- [ ] Implement torch/flashlight control (AC: 3)
  - [ ] Detect torch capability
  - [ ] Toggle flashlight on/off
  - [ ] Remember torch preference
  - [ ] Handle devices without torch

- [ ] Add auto-focus and manual focus (AC: 3)
  - [ ] Enable continuous auto-focus
  - [ ] Add tap-to-focus
  - [ ] Optimize focus for QR codes
  - [ ] Visual focus indicators

- [ ] Create success/error feedback (AC: 4, 5)
  - [ ] Design success animation
  - [ ] Design error animation
  - [ ] Add haptic feedback
  - [ ] Add audio feedback (optional)

- [ ] Integrate with ticket validation API (AC: 4, 5)
  - [ ] Call validation endpoint
  - [ ] Handle online validation
  - [ ] Handle offline validation
  - [ ] Process validation response

- [ ] Implement scan debouncing (AC: 6)
  - [ ] Prevent duplicate scans
  - [ ] 3-second cooldown per ticket
  - [ ] Visual indication of debounce
  - [ ] Allow manual override

- [ ] Add zoom controls (AC: 3)
  - [ ] Implement pinch-to-zoom
  - [ ] Add zoom buttons (+/-)
  - [ ] Set min/max zoom levels
  - [ ] Smooth zoom transitions

- [ ] Optimize scanning performance (AC: 2, 6)
  - [ ] Reduce video processing overhead
  - [ ] Optimize frame rate (30fps)
  - [ ] Implement worker-based scanning
  - [ ] Minimize battery drain

- [ ] Add continuous scanning mode (AC: 6)
  - [ ] Keep camera active
  - [ ] Auto-advance after success
  - [ ] Show scan statistics
  - [ ] Implement scan queue

- [ ] Handle camera errors gracefully (AC: 6)
  - [ ] Camera not found
  - [ ] Permission denied
  - [ ] Camera in use
  - [ ] Hardware errors

- [ ] Create scanning statistics display (AC: 6)
  - [ ] Show scans per minute
  - [ ] Display total scans
  - [ ] Calculate average time
  - [ ] Show success rate

---

## Dev Notes

### Architecture References

**Camera API** (`docs/architecture/pwa-architecture.md`):
- MediaDevices.getUserMedia() for camera access
- Video stream processing with Canvas API
- Worker-based QR detection to avoid blocking UI
- requestAnimationFrame for smooth scanning

**QR Library Selection** (`docs/architecture/technical-decisions.md`):
- **jsQR**: Lightweight (43KB), fast, pure JavaScript
- **zxing-js**: More robust, larger (200KB), WASM-based
- **Recommendation**: Start with jsQR, upgrade to zxing if needed
- Both support worker-based processing

**Performance Targets** (`docs/architecture/performance.md`):
- Camera initialization: < 500ms
- QR detection: < 1 second
- Per-person throughput: < 2 seconds
- Frame processing: 30fps minimum
- Battery impact: < 5% per hour of continuous use

**Camera Constraints**:
```typescript
const constraints = {
  video: {
    facingMode: { ideal: "environment" }, // Back camera preferred
    width: { ideal: 1280 },
    height: { ideal: 720 },
    aspectRatio: { ideal: 16/9 },
    frameRate: { ideal: 30 }
  },
  audio: false
};
```

**QR Code Format** (`docs/architecture/ticket-system.md`):
```typescript
interface TicketQRCode {
  version: "1.0";
  ticketId: string;
  eventId: string;
  signature: string; // HMAC for validation
}
```

**Scanner Component Architecture**:
```typescript
// components/check-in/QRScanner.tsx
interface QRScannerProps {
  onScan: (data: string) => void;
  onError: (error: Error) => void;
  onClose: () => void;
  continuous?: boolean; // Keep scanning after success
}

// Scanner state machine
enum ScannerState {
  IDLE = "idle",
  REQUESTING_PERMISSION = "requesting_permission",
  INITIALIZING = "initializing",
  SCANNING = "scanning",
  PROCESSING = "processing",
  SUCCESS = "success",
  ERROR = "error"
}
```

**Source Tree** (`docs/architecture/source-tree.md`):
```
src/
├── app/
│   └── check-in/
│       └── scan/page.tsx
├── components/
│   └── check-in/
│       ├── QRScanner.tsx
│       ├── ScannerOverlay.tsx
│       ├── ScannerControls.tsx
│       └── ScanResult.tsx
├── lib/
│   └── scanner/
│       ├── qr-detector.ts
│       ├── camera-manager.ts
│       ├── torch-control.ts
│       └── scanner-utils.ts
├── hooks/
│   └── useQRScanner.ts
└── workers/
    └── qr-scanner.worker.ts
```

**PWA-Specific Considerations**:
- Cache QR library for offline use
- Handle iOS Safari camera quirks
- Prevent screen sleep during scanning
- Handle app backgrounding/foregrounding
- Maintain camera state across PWA lifecycle

**Battery Optimization**:
- Use lower resolution when possible (640x480 is often sufficient)
- Reduce frame rate when no motion detected
- Release camera when app backgrounded
- Implement idle timeout (60s)
- Optimize video processing pipeline

**Low Light Handling**:
- Auto-enable torch in dark environments
- Increase exposure compensation
- Lower frame rate for better exposure
- Provide visual feedback on light levels

**Error Recovery**:
- Camera permission denied → Guide to settings
- Camera not found → Suggest manual entry
- Camera in use → Prompt to close other apps
- QR detection failures → Adjust positioning guide

### Testing

**Testing Requirements for this story**:
- Unit tests for QR code parsing
- Unit tests for camera utilities
- Integration test for scanner component
- Integration test with ticket validation
- E2E test for complete scan workflow
- E2E test for error scenarios
- Test on iOS Safari (camera quirks)
- Test on Android Chrome
- Test with various QR code sizes
- Test in low light conditions
- Test with damaged/partial QR codes
- Test torch functionality
- Test zoom functionality
- Test continuous scanning mode
- Performance test (scans per minute)
- Battery drain testing
- Test offline scanning
- Test rapid successive scans

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