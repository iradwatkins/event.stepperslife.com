# Story: CHK-003a - Camera API & QR Detection

**Epic**: EPIC-006 - Mobile Check-in PWA
**Story Points**: 3
**Priority**: P1 (High)
**Status**: Not Started
**Parent Story**: CHK-003 (QR Scanner Camera - 5 pts)
**Dependencies**: CHK-001 (PWA Framework), TIX-003 (Ticket Validation)

---

## Story

**As an** event staff member at the entrance
**I want** to access my device camera and detect QR codes automatically
**So that** I can scan tickets quickly without manual data entry

**As a** developer implementing the scanner
**I want** reliable QR detection with proper camera controls
**So that** scanning works on all devices and lighting conditions

---

## Acceptance Criteria

### AC1: Camera Access & Permissions
**Given** user opens the check-in scanner
**When** they click "Start Scanning"
**Then** the system should:
- Request camera permission via `navigator.mediaDevices.getUserMedia()`
- Prefer back camera (facingMode: "environment")
- Handle permission granted → open camera view
- Handle permission denied → show instructions to enable
- Handle camera not available → suggest manual entry
- Display clear error messages for each scenario
- Remember permission choice (browser handles this)
- Initialize camera within 500ms after permission

### AC2: Camera Stream Configuration
**Given** camera permission is granted
**When** starting video stream
**Then** configure with:
```typescript
{
  video: {
    facingMode: { ideal: "environment" },
    width: { ideal: 1280 },
    height: { ideal: 720 },
    aspectRatio: { ideal: 16/9 },
    frameRate: { ideal: 30 }
  },
  audio: false
}
```

**And** the system should:
- Fall back to lower resolution if ideal not available
- Handle devices with only front camera
- Display video stream in full-screen view
- Maintain aspect ratio without distortion
- Auto-start scanning when stream active
- Release camera when scanner closes

### AC3: QR Code Detection with jsQR
**Given** camera stream is active
**When** QR code enters camera frame
**Then** the system should:
- Capture video frames at 30fps
- Process each frame for QR codes using jsQR
- Detect QR code within 1 second
- Parse QR code data immediately
- Validate QR contains ticket JSON
- Provide haptic feedback on detection (if supported)
- Display visual indicator (green border flash)
- Stop scanning temporarily (3s cooldown)
- Call ticket validation API
- Handle QR code detection errors gracefully

### AC4: Auto-Focus Control
**Given** camera supports focus capabilities
**When** scanning QR codes
**Then** the system should:
- Enable continuous auto-focus mode
- Focus on center of frame (where QR target is)
- Support tap-to-focus on touch devices
- Show focus indicator when adjusting
- Handle focus failures gracefully
- Work on devices without auto-focus

### AC5: Torch/Flashlight Control
**Given** device has flashlight capability
**When** user toggles torch
**Then** the system should:
- Check for torch support: `track.getCapabilities().torch`
- Display torch button if supported
- Toggle torch on/off with button press
- Remember torch preference in session
- Turn off torch when scanner closes
- Handle devices without torch (hide button)
- Show torch indicator when active

### AC6: Continuous Scanning Mode
**Given** staff is scanning multiple attendees
**When** in continuous scanning mode
**Then** the system should:
- Keep camera active between scans
- Automatically reset after validation (2 seconds)
- Maintain < 2 second per-person throughput
- Show scan count and rate
- Prevent duplicate scans (3s debounce)
- Allow manual stop/start
- Display scanning animation
- Show "Ready to scan" indicator

### AC7: Performance Optimization
**Given** continuous camera usage
**When** scanning for extended periods
**Then** optimize for:
- Process frames in Web Worker (non-blocking)
- Use requestAnimationFrame for smooth updates
- Skip frames if processing lags (drop to 15fps if needed)
- Optimize battery usage:
  - Lower frame rate when idle (no motion)
  - Release resources when backgrounded
  - Reduce video resolution in low-light
- Memory management (clear frame buffers)
- Maximum 5% battery drain per hour

---

## Tasks / Subtasks

### Camera Access Implementation
- [ ] Create camera manager service
  - [ ] File: `/lib/scanner/camera-manager.ts`
  - [ ] Request camera permissions
  - [ ] Handle getUserMedia API
  - [ ] Configure camera constraints
  - [ ] Manage video stream lifecycle
  - [ ] Release camera resources

- [ ] Build permission handler
  - [ ] Check permission status
  - [ ] Request permission
  - [ ] Handle denied/blocked states
  - [ ] Show permission instructions
  - [ ] Detect permission changes

- [ ] Implement error handling
  - [ ] NotAllowedError: Permission denied
  - [ ] NotFoundError: No camera available
  - [ ] NotReadableError: Camera in use
  - [ ] OverconstrainedError: Constraints failed
  - [ ] AbortError: User/browser stopped stream

### QR Detection Engine
- [ ] Install jsQR library
  - [ ] `npm install jsqr`
  - [ ] Lightweight (~43KB)
  - [ ] Pure JavaScript
  - [ ] No WASM dependencies

- [ ] Create QR detector service
  - [ ] File: `/lib/scanner/qr-detector.ts`
  - [ ] Capture video frames to canvas
  - [ ] Process with jsQR
  - [ ] Extract QR code data
  - [ ] Validate data format
  - [ ] Parse JSON payload

- [ ] Build frame processing loop
  - [ ] Use requestAnimationFrame
  - [ ] Maintain 30fps target
  - [ ] Drop frames if lagging
  - [ ] Clear canvas between frames
  - [ ] Optimize canvas operations

- [ ] Implement Web Worker processing
  - [ ] File: `/workers/qr-scanner.worker.ts`
  - [ ] Offload QR detection to worker
  - [ ] Post frame data to worker
  - [ ] Receive detection results
  - [ ] Handle worker errors
  - [ ] Fallback to main thread if worker fails

### Camera Controls
- [ ] Build torch/flashlight control
  - [ ] File: `/lib/scanner/torch-control.ts`
  - [ ] Check torch capability
  - [ ] Apply torch constraint
  - [ ] Toggle torch on/off
  - [ ] Handle unsupported devices
  - [ ] Persist torch state

- [ ] Implement auto-focus
  - [ ] Enable continuous auto-focus
  - [ ] Implement tap-to-focus
  - [ ] Apply focus constraints
  - [ ] Handle focus modes
  - [ ] Show focus indicators

- [ ] Add manual focus control
  - [ ] Expose focus distance (if supported)
  - [ ] Slider for manual focus
  - [ ] Reset to auto-focus
  - [ ] Show focus value

### React Components
- [ ] Create QRScanner component
  - [ ] File: `/components/check-in/QRScanner.tsx`
  - [ ] Video element for stream
  - [ ] Canvas for frame capture
  - [ ] Scanner overlay/viewfinder
  - [ ] Control buttons
  - [ ] Status indicators

- [ ] Build scanner overlay
  - [ ] Component: `/components/check-in/ScannerOverlay.tsx`
  - [ ] QR code target guide (frame)
  - [ ] Scanning animation
  - [ ] Detection feedback
  - [ ] Instructions text
  - [ ] Torch button

- [ ] Create scanner controls
  - [ ] Component: `/components/check-in/ScannerControls.tsx`
  - [ ] Close/cancel button
  - [ ] Torch toggle
  - [ ] Manual entry fallback
  - [ ] Settings button

### Custom React Hook
- [ ] Build useQRScanner hook
  - [ ] File: `/hooks/useQRScanner.ts`
  - [ ] Manage scanner state
  - [ ] Handle camera lifecycle
  - [ ] Process QR detections
  - [ ] Return scanner controls
  - [ ] Handle cleanup

### Validation Integration
- [ ] Connect to validation API
  - [ ] Call TIX-003a validation endpoint
  - [ ] Handle online validation
  - [ ] Handle offline validation
  - [ ] Show validation results
  - [ ] Display attendee info
  - [ ] Handle validation errors

---

## Dev Notes

### jsQR Library Usage

```typescript
// lib/scanner/qr-detector.ts

import jsQR from 'jsqr';

export class QRDetectorService {
  private video: HTMLVideoElement;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  constructor(video: HTMLVideoElement) {
    this.video = video;
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d')!;
  }

  detectQRCode(): string | null {
    // Set canvas size to video size
    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;

    // Draw current video frame to canvas
    this.context.drawImage(
      this.video,
      0, 0,
      this.canvas.width,
      this.canvas.height
    );

    // Get image data
    const imageData = this.context.getImageData(
      0, 0,
      this.canvas.width,
      this.canvas.height
    );

    // Detect QR code
    const code = jsQR(
      imageData.data,
      imageData.width,
      imageData.height,
      {
        inversionAttempts: "dontInvert"
      }
    );

    if (code) {
      return code.data;
    }

    return null;
  }
}
```

### Camera Manager Service

```typescript
// lib/scanner/camera-manager.ts

export class CameraManager {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;

  async requestCamera(): Promise<MediaStream> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          aspectRatio: { ideal: 16/9 },
          frameRate: { ideal: 30 }
        },
        audio: false
      });

      return this.stream;
    } catch (error) {
      throw this.handleCameraError(error);
    }
  }

  attachToVideo(videoElement: HTMLVideoElement): void {
    if (!this.stream) {
      throw new Error('No camera stream available');
    }

    this.videoElement = videoElement;
    videoElement.srcObject = this.stream;
    videoElement.play();
  }

  async enableTorch(enabled: boolean): Promise<void> {
    if (!this.stream) return;

    const track = this.stream.getVideoTracks()[0];
    const capabilities = track.getCapabilities() as any;

    if (capabilities.torch) {
      await track.applyConstraints({
        advanced: [{ torch: enabled }]
      } as any);
    }
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
  }

  private handleCameraError(error: any): Error {
    if (error.name === 'NotAllowedError') {
      return new Error('Camera permission denied. Please enable camera access in settings.');
    } else if (error.name === 'NotFoundError') {
      return new Error('No camera found on this device.');
    } else if (error.name === 'NotReadableError') {
      return new Error('Camera is already in use by another application.');
    } else {
      return new Error('Failed to access camera: ' + error.message);
    }
  }
}
```

### useQRScanner Hook

```typescript
// hooks/useQRScanner.ts

import { useState, useEffect, useRef, useCallback } from 'react';
import { CameraManager } from '@/lib/scanner/camera-manager';
import { QRDetectorService } from '@/lib/scanner/qr-detector';

export function useQRScanner(onScan: (data: string) => void) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [torchEnabled, setTorchEnabled] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraManagerRef = useRef<CameraManager>();
  const detectorRef = useRef<QRDetectorService>();
  const animationFrameRef = useRef<number>();
  const lastScanRef = useRef<number>(0);

  const startScanning = useCallback(async () => {
    try {
      setError(null);
      const manager = new CameraManager();
      const stream = await manager.requestCamera();

      if (videoRef.current) {
        manager.attachToVideo(videoRef.current);
        cameraManagerRef.current = manager;
        detectorRef.current = new QRDetectorService(videoRef.current);

        // Wait for video to be ready
        await new Promise(resolve => {
          videoRef.current!.onloadedmetadata = resolve;
        });

        setIsScanning(true);
        startDetectionLoop();
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const stopScanning = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    cameraManagerRef.current?.stopCamera();
    setIsScanning(false);
  }, []);

  const toggleTorch = useCallback(async () => {
    const newState = !torchEnabled;
    await cameraManagerRef.current?.enableTorch(newState);
    setTorchEnabled(newState);
  }, [torchEnabled]);

  const startDetectionLoop = () => {
    const detect = () => {
      if (!detectorRef.current || !isScanning) return;

      const qrData = detectorRef.current.detectQRCode();

      if (qrData) {
        // Debounce scans (3 second cooldown)
        const now = Date.now();
        if (now - lastScanRef.current > 3000) {
          lastScanRef.current = now;
          onScan(qrData);

          // Provide haptic feedback
          if (navigator.vibrate) {
            navigator.vibrate(200);
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(detect);
    };

    detect();
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  return {
    videoRef,
    isScanning,
    error,
    torchEnabled,
    startScanning,
    stopScanning,
    toggleTorch
  };
}
```

---

## Testing

### Unit Tests
- [ ] Camera permission request handling
- [ ] QR code detection with valid codes
- [ ] QR code detection with invalid codes
- [ ] Frame processing performance
- [ ] Torch control functionality
- [ ] Camera stream lifecycle

### Integration Tests
- [ ] Complete scan workflow
- [ ] Permission denied flow
- [ ] Camera not available flow
- [ ] Torch toggle integration
- [ ] Validation API integration
- [ ] Continuous scanning mode

### Device Testing
- [ ] iOS Safari (camera quirks)
- [ ] Android Chrome
- [ ] Various QR code sizes
- [ ] Different lighting conditions
- [ ] Damaged/partial QR codes
- [ ] Devices with/without torch
- [ ] Front vs back camera

### Performance Tests
- [ ] Frame processing rate (30fps)
- [ ] Battery drain (<5%/hour)
- [ ] Memory usage stability
- [ ] Long-duration scanning
- [ ] Rapid successive scans

---

## Environment Variables

```bash
# Optional performance tuning
QR_SCAN_COOLDOWN_MS=3000
QR_FRAME_RATE=30
QR_VIDEO_WIDTH=1280
QR_VIDEO_HEIGHT=720
```

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-09-30 | BMAD SM Agent | Initial sharded story from CHK-003 |

---

*Sharded from CHK-003 (5 pts) - Part 1 of 2*
*Next: CHK-003b - Scanner UI & Performance (2 pts)*
*Generated by BMAD SM Agent*