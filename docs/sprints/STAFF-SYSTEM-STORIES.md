# Staff QR Scanning System - User Stories

## Epic 1: Staff Management

### STAFF-001: Assign Staff to Event
**As an** event organizer
**I want** to assign staff members to my events
**So that** they can help with check-in operations

**Acceptance Criteria:**
- [ ] Select event from list
- [ ] Add staff by email address
- [ ] Assign role: Door Scanner, Check-in Staff, Lead Staff, Coordinator
- [ ] Set permissions per role (scan, manual check-in, override, reports)
- [ ] Multiple staff can be assigned to same event
- [ ] Staff receive invitation email with access code
- [ ] Display list of assigned staff
- [ ] Remove staff assignment
- [ ] Resend invitation if needed
- [ ] Set event-specific notes for staff

**Story Points:** 5

**Dependencies:** None (uses existing User model)

**Technical Notes:**
- Create EventStaff model (junction table: Event + User + Role)
- Create StaffRole enum
- Permission matrix by role
- Email invitation service
- Generate 6-digit access code per assignment
- Code expiry (7 days default)

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Email templates tested
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

### STAFF-002: Staff Invitation & Access Code
**As a** staff member
**I want** to receive an invitation with access code
**So that** I can access the event check-in system

**Acceptance Criteria:**
- [ ] Email contains event name, date, venue
- [ ] Email contains role assignment
- [ ] Email contains 6-digit access code
- [ ] Access code is unique per staff-event assignment
- [ ] Code expires after 7 days
- [ ] Link to check-in portal included
- [ ] Instructions for first-time users
- [ ] Mobile-friendly email template
- [ ] Option to add event to calendar (ICS file)
- [ ] Contact information for support

**Story Points:** 3

**Dependencies:** STAFF-001

**Technical Notes:**
- Email template with event details
- Access code generation (6-digit, numeric)
- Store access code hashed
- Calendar invite generation (ICS format)
- Link to staff portal with code pre-filled
- Email delivery service

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Email rendering tested (multiple clients)
- [ ] Calendar invite tested
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

### STAFF-003: Staff Login with Access Code
**As a** staff member
**I want** to log in with my access code
**So that** I can start checking in attendees

**Acceptance Criteria:**
- [ ] Enter email and 6-digit access code
- [ ] Code validation (must match email + event)
- [ ] Code expiry check (within 7 days)
- [ ] Session created on successful login
- [ ] Redirect to event check-in dashboard
- [ ] Remember device option (30-day cookie)
- [ ] Rate limiting (3 attempts per 15 minutes)
- [ ] Error messages for invalid code, expired code
- [ ] Mobile-optimized login page
- [ ] Support for multiple active sessions (different devices)
- [ ] Auto-logout after inactivity (configurable)

**Story Points:** 5

**Dependencies:** STAFF-002

**Technical Notes:**
- Staff session management (separate from user auth)
- Access code hashing for security
- Rate limiting per email
- Device fingerprinting for "remember me"
- Session storage (Redis recommended)
- Activity tracking for auto-logout

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Security testing (code validation, rate limiting)
- [ ] Session management tested
- [ ] Manual testing on mobile
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

### STAFF-004: Staff Role Permissions
**As a** system
**I want** to enforce role-based permissions
**So that** staff can only perform authorized actions

**Acceptance Criteria:**
- [ ] **Door Scanner**: Scan QR codes only, view basic ticket info
- [ ] **Check-in Staff**: Scan QR codes, manual search, check-in by name
- [ ] **Lead Staff**: All Check-in Staff permissions + view statistics, bulk operations
- [ ] **Coordinator**: All permissions + manage other staff, export data, configure settings
- [ ] Permission checks on all API endpoints
- [ ] UI elements hidden based on permissions
- [ ] Error message if unauthorized action attempted
- [ ] Audit log for permission violations
- [ ] Admin can customize permissions per role (future)

**Story Points:** 5

**Dependencies:** STAFF-003

**Technical Notes:**
- RBAC middleware for API routes
- Permission constants/enums
- Frontend permission checking hooks
- Audit logging system
- Permission matrix documentation
- Role hierarchy enforcement

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Integration tests for RBAC
- [ ] Permission violations tested
- [ ] Manual testing with different roles
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

### STAFF-005: Staff List & Management (Organizer View)
**As an** event organizer
**I want** to view and manage my event staff
**So that** I can control access and monitor activity

**Acceptance Criteria:**
- [ ] View all staff assigned to event
- [ ] See role, status (active/invited/expired), last activity
- [ ] Change staff role
- [ ] Remove staff from event
- [ ] Resend invitation email
- [ ] Deactivate staff access immediately
- [ ] View staff check-in statistics
- [ ] Filter by role or status
- [ ] Sort by name, role, activity
- [ ] Bulk actions (remove, resend invites)
- [ ] Export staff list

**Story Points:** 5

**Dependencies:** STAFF-001

**Technical Notes:**
- Staff management API endpoints
- Real-time activity tracking
- Efficient queries for staff list
- Bulk action implementation
- CSV export functionality

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Bulk actions tested
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

## Epic 2: QR Code Scanning

### STAFF-006: PWA Installation & Setup
**As a** staff member
**I want** to install the check-in app as a PWA
**So that** I can use it like a native app

**Acceptance Criteria:**
- [ ] PWA manifest configured (name, icons, colors)
- [ ] Service worker for offline support
- [ ] Install prompt for mobile devices
- [ ] Add to home screen instructions
- [ ] Splash screen on launch
- [ ] Standalone app mode (no browser UI)
- [ ] Offline indicator in UI
- [ ] App update notification
- [ ] iOS and Android support
- [ ] Icon sizes for all devices
- [ ] Background sync capability

**Story Points:** 8

**Dependencies:** STAFF-003

**Technical Notes:**
- PWA manifest.json
- Service worker with caching strategies
- Workbox for service worker management
- Background sync API
- Install prompt handling
- Icon generation (multiple sizes)
- Testing on real devices
- Push notification setup (optional)

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] PWA manifest validated
- [ ] Service worker tested
- [ ] Install tested on iOS and Android
- [ ] Offline mode verified
- [ ] Manual testing on real devices
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

### STAFF-007: Camera Access & QR Detection
**As a** staff member
**I want** to use my device camera to scan QR codes
**So that** I can quickly check in attendees

**Acceptance Criteria:**
- [ ] Request camera permission on first use
- [ ] Access device rear camera
- [ ] Real-time video preview
- [ ] Automatic QR code detection using @zxing/browser
- [ ] Visual feedback when QR code detected (highlight box)
- [ ] Scan speed <1 second from detection to validation
- [ ] Auto-focus optimization
- [ ] Handle poor lighting conditions
- [ ] Flashlight toggle (if device supports)
- [ ] Switch between front/rear camera
- [ ] Graceful fallback if camera unavailable
- [ ] Manual entry option (ticket ID)

**Story Points:** 13

**Dependencies:** STAFF-006

**Technical Notes:**
- @zxing/browser library for QR scanning
- MediaDevices API for camera access
- Canvas rendering for performance
- Debouncing for rapid scans
- Error handling for permission denial
- Torch/flashlight API (experimental)
- Camera selection UI
- Performance optimization (60fps target)
- Testing on various devices and browsers

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Performance tested (<1s scan time)
- [ ] Tested on 5+ device types
- [ ] Lighting conditions tested
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

### STAFF-008: QR Code Validation & Check-in
**As a** staff member
**I want** to validate scanned QR codes
**So that** I can verify ticket authenticity and check in attendees

**Acceptance Criteria:**
- [ ] Parse QR code data (ticket ID + verification token)
- [ ] API call to validate ticket
- [ ] Check ticket belongs to this event
- [ ] Check ticket not already used
- [ ] Check ticket not cancelled/refunded
- [ ] Visual feedback: Green screen + checkmark for valid
- [ ] Visual feedback: Red screen + X for invalid
- [ ] Audio feedback (beep) for valid/invalid (configurable)
- [ ] Display attendee name and ticket type
- [ ] Haptic feedback (vibration) on mobile
- [ ] Mark ticket as checked in
- [ ] Show check-in timestamp
- [ ] Support for duplicate scan warning (already checked in)
- [ ] Network error handling with retry

**Story Points:** 8

**Dependencies:** STAFF-007

**Technical Notes:**
- QR code format: JSON with ticket ID + HMAC signature
- Validation API endpoint
- Optimistic UI updates
- Offline queue for failed requests
- Audio API for beeps
- Vibration API
- Visual feedback animations
- Network retry logic with exponential backoff
- Signature verification for security

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Integration tests for validation
- [ ] Security testing (signature verification)
- [ ] Network failure scenarios tested
- [ ] Manual testing on mobile
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

### STAFF-009: Scan Performance Optimization
**As a** staff member
**I want** the scanner to be extremely fast
**So that** I can process attendees quickly during rush periods

**Acceptance Criteria:**
- [ ] QR detection <500ms
- [ ] Validation API response <500ms
- [ ] Total scan-to-confirmation <1 second
- [ ] Continuous scanning mode (no need to reset)
- [ ] Prefetch event data on load
- [ ] Cache validated tickets locally
- [ ] Minimize DOM updates during scanning
- [ ] Optimize camera resolution (balance quality vs performance)
- [ ] Debounce rapid scans of same code (2-second window)
- [ ] Performance monitoring and logging
- [ ] Load testing with 100+ concurrent scanners

**Story Points:** 8

**Dependencies:** STAFF-008

**Technical Notes:**
- Performance profiling
- API response optimization (database indexing)
- Local caching strategy (IndexedDB)
- Web Workers for QR processing
- RequestAnimationFrame for camera rendering
- Lazy loading for non-critical features
- CDN for static assets
- Load testing tools (k6 or Artillery)
- Real device testing under load

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Performance benchmarks met (<1s total)
- [ ] Load testing completed (100+ users)
- [ ] Database queries optimized
- [ ] Cache hit rate >80%
- [ ] Manual testing on low-end devices
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

### STAFF-010: Offline Scanning & Sync
**As a** staff member
**I want** to scan tickets even without internet
**So that** I can continue working during connectivity issues

**Acceptance Criteria:**
- [ ] Detect online/offline status
- [ ] Offline indicator in UI
- [ ] Prefetch all event tickets on load (when online)
- [ ] Store ticket data in IndexedDB
- [ ] Validate tickets locally when offline
- [ ] Queue check-ins in IndexedDB when offline
- [ ] Automatic sync when connection restored
- [ ] Visual indication of pending syncs
- [ ] Manual sync trigger button
- [ ] Conflict resolution (ticket scanned on multiple devices offline)
- [ ] Show last sync timestamp
- [ ] Warn staff when working offline
- [ ] Limit offline mode to events with <1000 tickets

**Story Points:** 13

**Dependencies:** STAFF-008

**Technical Notes:**
- Online/offline event listeners
- IndexedDB for local storage
- Sync algorithm with conflict resolution
- Background Sync API (if supported)
- Merkle tree or version vectors for sync optimization
- Prefetch strategy (all ticket IDs + hashes)
- Efficient data compression
- Sync status UI component
- Testing offline scenarios extensively

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Offline mode tested extensively
- [ ] Sync conflict resolution tested
- [ ] Data integrity verified
- [ ] Manual testing with network toggling
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

## Epic 3: Manual Check-in

### STAFF-011: Manual Search & Check-in
**As a** check-in staff member
**I want** to search for attendees by name
**So that** I can help those without QR codes

**Acceptance Criteria:**
- [ ] Search input field (always accessible)
- [ ] Search by full name, partial name, email
- [ ] Real-time search results (debounced)
- [ ] Display matching attendees (name, ticket type, status)
- [ ] Filter by check-in status (not checked in, checked in, all)
- [ ] Click attendee to view full details
- [ ] Manual check-in button
- [ ] Confirmation dialog before check-in
- [ ] Check-in recorded with "manual" flag
- [ ] Staff member ID recorded for audit
- [ ] Search works offline (local data only)
- [ ] Pagination for large result sets
- [ ] No results message with suggestions

**Story Points:** 5

**Dependencies:** STAFF-004 (Check-in Staff permission)

**Technical Notes:**
- Search API with fuzzy matching
- Debouncing (300ms delay)
- Elasticsearch or PostgreSQL full-text search
- Efficient indexing on name and email fields
- Offline search using IndexedDB
- Pagination with infinite scroll or load more
- Audit trail for manual check-ins

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Search performance tested (sub-200ms)
- [ ] Offline search tested
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

### STAFF-012: Attendee Detail View
**As a** check-in staff member
**I want** to view detailed attendee information
**So that** I can verify identity and handle issues

**Acceptance Criteria:**
- [ ] Display full name, email, phone
- [ ] Display ticket type, price paid, purchase date
- [ ] Display order ID and payment status
- [ ] Display check-in status and timestamp
- [ ] Display QR code (regenerate if lost)
- [ ] Show any special notes or accommodations
- [ ] Show refund/cancellation status
- [ ] Action buttons: Check-in, Email ticket, Print
- [ ] Edit attendee notes (staff notes)
- [ ] View check-in history (if multiple entries)
- [ ] Contact organizer button
- [ ] Close/back button

**Story Points:** 5

**Dependencies:** STAFF-011

**Technical Notes:**
- Detail view modal or slide-out panel
- QR code regeneration service
- Email resend functionality
- Print-friendly view (CSS)
- Notes storage in database
- Responsive design for mobile

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Email functionality tested
- [ ] Print view tested
- [ ] Manual testing on mobile
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

### STAFF-013: Bulk Check-in Operations
**As a** lead staff member
**I want** to perform bulk check-in operations
**So that** I can handle groups efficiently

**Acceptance Criteria:**
- [ ] Select multiple attendees from search results
- [ ] "Select All" option
- [ ] Bulk check-in button
- [ ] Confirmation dialog showing count
- [ ] Progress indicator during bulk operation
- [ ] Success/failure summary
- [ ] Handle partial failures gracefully
- [ ] Undo bulk check-in option
- [ ] Audit log for bulk operations
- [ ] Export selected attendees
- [ ] Maximum 100 attendees per bulk operation
- [ ] Requires Lead Staff or Coordinator role

**Story Points:** 8

**Dependencies:** STAFF-004, STAFF-011

**Technical Notes:**
- Checkbox selection UI
- Bulk API endpoint with batching
- Progress tracking (WebSocket or polling)
- Transaction handling for atomicity
- Undo functionality with time limit
- Role permission checks
- Audit logging service

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Bulk operations tested (100 items)
- [ ] Permission enforcement tested
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

## Epic 4: Public Ticket View

### STAFF-014: Public Ticket Display
**As an** attendee
**I want** to display my ticket QR code on my phone
**So that** staff can scan it easily

**Acceptance Criteria:**
- [ ] Public URL (no authentication required)
- [ ] Large QR code centered on screen
- [ ] High contrast for scanning (black on white)
- [ ] Full-screen mode option
- [ ] Brightness boost on load (mobile)
- [ ] Prevent screen sleep during display
- [ ] Display attendee name
- [ ] Display event name, date, venue
- [ ] Display ticket type
- [ ] Refresh button (regenerate QR)
- [ ] Show check-in status (if already checked in)
- [ ] "Add to Wallet" button (Apple Wallet, Google Pay)
- [ ] Share ticket via email/SMS
- [ ] Responsive design (mobile-first)

**Story Points:** 8

**Dependencies:** None (standalone feature)

**Technical Notes:**
- Public API endpoint for ticket retrieval
- URL includes ticket ID + secure token
- QR code generation (server-side for consistency)
- Wake Lock API to prevent screen sleep
- Screen brightness control (where supported)
- Apple Wallet pass generation (.pkpass)
- Google Pay pass generation
- Share API for native sharing
- Security: Rate limiting, token expiry

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] QR code rendering tested
- [ ] Screen wake tested on devices
- [ ] Wallet integration tested
- [ ] Manual testing on mobile
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

### STAFF-015: Email Ticket with QR Code
**As an** attendee
**I want** to receive my ticket via email
**So that** I can access it easily

**Acceptance Criteria:**
- [ ] Email sent immediately after purchase
- [ ] Email contains QR code image (embedded)
- [ ] Email contains ticket details (name, event, date, venue)
- [ ] Link to public ticket view page
- [ ] "Add to Calendar" button
- [ ] Terms and conditions link
- [ ] Event organizer contact information
- [ ] Mobile-friendly email template
- [ ] Resend ticket option (from order history)
- [ ] Multiple tickets in one email (for group purchases)
- [ ] PDF attachment option

**Story Points:** 5

**Dependencies:** STAFF-014

**Technical Notes:**
- Email template with embedded QR code
- QR code generation as image (PNG)
- Calendar invite generation (ICS)
- PDF generation library
- Email delivery service with retry logic
- Tracking for email opens (optional)

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Email rendering tested (multiple clients)
- [ ] QR code visibility verified
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

## Epic 5: Real-time Tracking & Statistics

### STAFF-016: Real-time Check-in Dashboard
**As a** lead staff member
**I want** to see real-time check-in statistics
**So that** I can monitor event progress

**Acceptance Criteria:**
- [ ] Display total tickets sold
- [ ] Display total checked in
- [ ] Display percentage checked in
- [ ] Display tickets remaining to check in
- [ ] Real-time updates (WebSocket or polling)
- [ ] Chart: Check-ins over time (last hour)
- [ ] Breakdown by ticket type
- [ ] Current check-in rate (attendees per minute)
- [ ] Estimated completion time
- [ ] Peak times indicator
- [ ] Export statistics to CSV
- [ ] Auto-refresh every 10 seconds
- [ ] Mobile-optimized view

**Story Points:** 8

**Dependencies:** STAFF-008, STAFF-011

**Technical Notes:**
- WebSocket for real-time updates (Socket.io)
- Fallback to polling if WebSocket unavailable
- Charting library (Recharts, Chart.js)
- Aggregation queries optimized for performance
- Caching layer (Redis) for statistics
- Mobile-responsive design

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Real-time updates tested
- [ ] Performance tested with high traffic
- [ ] Manual testing on mobile
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

### STAFF-017: Staff Activity Tracking
**As a** coordinator
**I want** to see staff activity and performance
**So that** I can manage the team effectively

**Acceptance Criteria:**
- [ ] List all active staff members
- [ ] Show online/offline status
- [ ] Show total check-ins per staff member
- [ ] Show average check-in time per staff member
- [ ] Show last activity timestamp
- [ ] Filter by role
- [ ] Sort by various metrics
- [ ] Individual staff detail view
- [ ] Export staff activity report
- [ ] Real-time updates
- [ ] Performance leaderboard (optional)
- [ ] Idle time tracking

**Story Points:** 5

**Dependencies:** STAFF-016

**Technical Notes:**
- Activity tracking on each action
- Real-time status updates (heartbeat)
- Performance metrics calculation
- Coordinator permission enforcement
- Export functionality

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Activity tracking tested
- [ ] Permission checks verified
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

### STAFF-018: Check-in History & Audit Log
**As a** coordinator
**I want** to view check-in history and audit logs
**So that** I can investigate issues and disputes

**Acceptance Criteria:**
- [ ] List all check-in events
- [ ] Filter by date/time range
- [ ] Filter by staff member
- [ ] Filter by check-in method (scan vs manual)
- [ ] Search by attendee name or ticket ID
- [ ] Display: Timestamp, attendee, staff, method, device
- [ ] Display duplicate check-in attempts
- [ ] Display failed validation attempts
- [ ] Export audit log to CSV
- [ ] Pagination for large datasets
- [ ] Sort by any column
- [ ] Detail view for each check-in event

**Story Points:** 5

**Dependencies:** STAFF-008, STAFF-011

**Technical Notes:**
- Comprehensive audit logging model
- Efficient indexing for queries
- Date range filtering
- CSV export with streaming for large datasets
- Retention policy (keep for 2 years)

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Query performance tested
- [ ] Large dataset tested (10k+ records)
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

## Epic 6: Multi-device Sync & Collaboration

### STAFF-019: Multi-device Synchronization
**As a** staff member
**I want** changes to sync across devices instantly
**So that** all staff see consistent data

**Acceptance Criteria:**
- [ ] Check-in on one device reflects immediately on all devices
- [ ] WebSocket broadcasting for real-time sync
- [ ] Fallback to polling (10-second interval) if WebSocket fails
- [ ] Sync status indicator (synced, syncing, error)
- [ ] Conflict resolution: Server state wins
- [ ] Manual refresh button
- [ ] Offline changes sync when back online
- [ ] Visual notification on data update
- [ ] Optimistic UI updates
- [ ] Connection status indicator
- [ ] Reconnection handling

**Story Points:** 13

**Dependencies:** STAFF-010, STAFF-016

**Technical Notes:**
- WebSocket implementation (Socket.io)
- Room-based broadcasting (per event)
- Conflict resolution algorithm
- Optimistic updates with rollback
- Connection state management
- Reconnection with exponential backoff
- Event-driven architecture
- Testing with multiple concurrent connections

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Integration tests with multiple clients
- [ ] Conflict scenarios tested
- [ ] Network failure recovery tested
- [ ] Manual testing with 10+ devices
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

### STAFF-020: Collision Detection & Warnings
**As a** staff member
**I want** to be warned about duplicate check-ins
**So that** I can prevent errors and fraud

**Acceptance Criteria:**
- [ ] Detect if ticket scanned within last 5 seconds on another device
- [ ] Display warning modal: "This ticket was just scanned by [Staff Name]"
- [ ] Option to proceed or cancel
- [ ] Log duplicate scan attempts
- [ ] Flag suspicious patterns (same ticket scanned 3+ times in 1 minute)
- [ ] Notify coordinator of suspicious activity
- [ ] Display duplicate check-in indicator in ticket detail
- [ ] Configurable time window for duplicate detection
- [ ] Override capability for coordinators
- [ ] Audit trail for overrides

**Story Points:** 5

**Dependencies:** STAFF-019

**Technical Notes:**
- Real-time duplicate detection
- WebSocket notifications
- Configurable time window
- Fraud detection algorithm
- Alert system for coordinators
- Override permission checks

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Duplicate detection tested
- [ ] Alert system tested
- [ ] Manual testing with multiple devices
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

## Epic 7: Advanced Features

### STAFF-021: Check-in Notes & Issues
**As a** check-in staff member
**I want** to add notes to check-ins
**So that** I can document issues or special requests

**Acceptance Criteria:**
- [ ] Add note during or after check-in
- [ ] Note types: General, Issue, VIP, Accommodation
- [ ] Rich text formatting (optional)
- [ ] Attach photo (optional)
- [ ] Flag as urgent
- [ ] Notes visible to all staff
- [ ] Notes visible to coordinator
- [ ] Filter check-ins by note type
- [ ] Search notes by keyword
- [ ] Edit/delete own notes (within 15 minutes)
- [ ] Coordinator can edit/delete any note
- [ ] Notification to coordinator for urgent notes

**Story Points:** 5

**Dependencies:** STAFF-012

**Technical Notes:**
- CheckinNote model
- Rich text editor (optional - TipTap or similar)
- Image upload and storage
- Notification service for urgent notes
- Permission-based edit/delete
- Full-text search on notes

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Image upload tested
- [ ] Notification tested
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

### STAFF-022: VIP & Special Accommodations
**As a** check-in staff member
**I want** to see VIP and special accommodation flags
**So that** I can provide appropriate service

**Acceptance Criteria:**
- [ ] VIP badge displayed prominently on ticket
- [ ] Special accommodation flags (wheelchair, dietary, etc.)
- [ ] Visual indicator during scan (different color/sound)
- [ ] Detailed accommodation notes visible
- [ ] Ability to mark ticket as VIP (coordinator only)
- [ ] VIP list view
- [ ] Filter check-ins by VIP status
- [ ] Alert staff when VIP arrives
- [ ] Export VIP list
- [ ] Accommodation checklist per attendee

**Story Points:** 5

**Dependencies:** STAFF-012

**Technical Notes:**
- VIP and accommodation flags in Ticket model
- Visual/audio feedback customization
- Real-time alerts for VIP check-ins
- Accommodation tracking system
- Export functionality

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Visual indicators tested
- [ ] Alerts tested
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

### STAFF-023: Multi-language Support
**As a** staff member
**I want** to use the app in my preferred language
**So that** I can work more efficiently

**Acceptance Criteria:**
- [ ] Language selector in settings
- [ ] Support for: English, Spanish (initial)
- [ ] All UI text translated
- [ ] All error messages translated
- [ ] All email templates in selected language
- [ ] Language preference saved per user
- [ ] Right-to-left (RTL) support (future)
- [ ] Date/time formatting per locale
- [ ] Number formatting per locale
- [ ] Translation coverage >95%

**Story Points:** 8

**Dependencies:** None (can be added to any story)

**Technical Notes:**
- i18n library (next-i18next or react-intl)
- Translation files (JSON)
- Translation management platform (Lokalise, Crowdin)
- Locale detection
- Fallback to English
- Translation key coverage testing

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] All text translated
- [ ] Translation accuracy verified
- [ ] Manual testing in all languages
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

### STAFF-024: Dark Mode
**As a** staff member
**I want** to use dark mode
**So that** I can reduce eye strain in low light

**Acceptance Criteria:**
- [ ] Dark mode toggle in settings
- [ ] Dark theme applied to all screens
- [ ] High contrast maintained for QR scanning
- [ ] Camera preview not affected
- [ ] Preference saved per user
- [ ] System theme detection (auto mode)
- [ ] Smooth theme transition
- [ ] All colors accessible (WCAG AA)
- [ ] Charts/graphs adjusted for dark mode

**Story Points:** 3

**Dependencies:** None (UI enhancement)

**Technical Notes:**
- CSS variables for theming
- Theme context/provider
- localStorage for preference
- System preference detection (prefers-color-scheme)
- Color contrast validation
- Chart theme configuration

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Accessibility tested
- [ ] Manual testing on all screens
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

## Epic 8: Testing & Quality Assurance

### STAFF-025: Comprehensive Integration Tests
**As a** developer
**I want** comprehensive integration tests
**So that** the staff system is reliable

**Acceptance Criteria:**
- [ ] Test staff assignment flow
- [ ] Test access code generation and login
- [ ] Test QR scanning and validation
- [ ] Test offline mode and sync
- [ ] Test manual check-in flow
- [ ] Test bulk operations
- [ ] Test real-time sync between devices
- [ ] Test permission enforcement
- [ ] Test all API endpoints
- [ ] Test WebSocket connections
- [ ] >85% code coverage

**Story Points:** 13

**Dependencies:** All STAFF stories

**Technical Notes:**
- Jest + Testing Library
- Playwright for E2E tests
- Mock camera API
- Mock WebSocket server
- Test database seeding
- CI/CD integration
- Performance benchmarks
- Device/browser matrix testing

**Definition of Done:**
- [ ] All tests written and passing
- [ ] Code coverage >85%
- [ ] CI/CD pipeline configured
- [ ] Performance benchmarks established
- [ ] Documentation updated

---

### STAFF-026: Performance & Load Testing
**As a** system administrator
**I want** to ensure the system handles high load
**So that** it works during peak check-in times

**Acceptance Criteria:**
- [ ] Load test with 100 concurrent scanners
- [ ] Load test with 500 concurrent public ticket views
- [ ] Load test with 1000+ check-ins in 5 minutes
- [ ] Database query performance profiling
- [ ] API endpoint response time benchmarks (<500ms p95)
- [ ] WebSocket message latency benchmarks (<100ms)
- [ ] Memory leak testing
- [ ] Offline sync performance with queued data
- [ ] Identify and fix bottlenecks
- [ ] Document performance SLAs

**Story Points:** 8

**Dependencies:** STAFF-025

**Technical Notes:**
- Load testing tools (k6, Artillery, JMeter)
- Database query analysis (EXPLAIN)
- APM tools (New Relic, Datadog)
- Profiling tools (Chrome DevTools)
- Stress testing scenarios
- Scalability recommendations

**Definition of Done:**
- [ ] Load tests executed successfully
- [ ] Performance SLAs documented
- [ ] Bottlenecks identified and resolved
- [ ] Scalability plan created
- [ ] Documentation updated

---

### STAFF-027: Security Testing & Audit
**As a** security engineer
**I want** to audit the system for vulnerabilities
**So that** attendee data is protected

**Acceptance Criteria:**
- [ ] Access code security tested
- [ ] Session management audited
- [ ] RBAC enforcement verified
- [ ] QR code signature validation tested
- [ ] SQL injection testing
- [ ] XSS prevention verified
- [ ] CSRF protection tested
- [ ] Rate limiting tested
- [ ] Data encryption verified
- [ ] API authentication tested
- [ ] Penetration testing conducted
- [ ] Security issues prioritized and fixed

**Story Points:** 8

**Dependencies:** All STAFF stories

**Technical Notes:**
- OWASP security testing guide
- Automated security scanning (Snyk, npm audit)
- Manual penetration testing
- Code review for security issues
- JWT security best practices
- Encryption at rest and in transit
- Security headers (CSP, HSTS, etc.)

**Definition of Done:**
- [ ] Security audit completed
- [ ] Critical vulnerabilities fixed
- [ ] Security report documented
- [ ] Best practices implemented
- [ ] Documentation updated

---

### STAFF-028: Cross-browser & Device Testing
**As a** QA engineer
**I want** to test on all major browsers and devices
**So that** all staff can use the system

**Acceptance Criteria:**
- [ ] Test on Chrome (desktop & mobile)
- [ ] Test on Firefox (desktop & mobile)
- [ ] Test on Safari (desktop & mobile)
- [ ] Test on Edge
- [ ] Test on iOS (iPhone, iPad)
- [ ] Test on Android (various devices)
- [ ] Camera functionality on all devices
- [ ] PWA installation on all platforms
- [ ] Offline mode on all browsers
- [ ] Document known limitations
- [ ] Fix critical compatibility issues

**Story Points:** 5

**Dependencies:** All STAFF stories

**Technical Notes:**
- BrowserStack or similar for testing
- Real device testing lab
- Automated cross-browser testing
- Polyfills for older browsers
- Feature detection and graceful degradation
- Browser compatibility matrix

**Definition of Done:**
- [ ] All browsers/devices tested
- [ ] Critical issues fixed
- [ ] Compatibility matrix documented
- [ ] Known limitations listed
- [ ] Documentation updated

---

## Epic 9: Documentation & Training

### STAFF-029: Staff User Documentation
**As a** staff member
**I want** comprehensive documentation
**So that** I can use the system effectively

**Acceptance Criteria:**
- [ ] Getting started guide for new staff
- [ ] How to log in with access code
- [ ] How to scan QR codes
- [ ] How to handle scanning issues
- [ ] How to perform manual check-in
- [ ] How to use search function
- [ ] How to add notes
- [ ] How to work offline
- [ ] Troubleshooting guide
- [ ] FAQ
- [ ] Video tutorials for key workflows
- [ ] Quick reference card (printable)

**Story Points:** 5

**Dependencies:** All STAFF stories

**Technical Notes:**
- Documentation platform (same as affiliate docs)
- Screenshot automation
- Video recording and editing
- Mobile-optimized documentation
- Printable PDF generation

**Definition of Done:**
- [ ] All sections written
- [ ] Screenshots added
- [ ] Videos recorded
- [ ] Peer reviewed
- [ ] Published and accessible

---

### STAFF-030: Organizer Documentation
**As an** event organizer
**I want** documentation for managing staff
**So that** I can set up and oversee check-in operations

**Acceptance Criteria:**
- [ ] How to assign staff to events
- [ ] How to set staff roles and permissions
- [ ] How to monitor check-in progress
- [ ] How to view staff activity
- [ ] How to handle check-in issues
- [ ] How to export reports
- [ ] Best practices for event check-in
- [ ] Troubleshooting guide
- [ ] Security recommendations
- [ ] Sample workflows for different event sizes

**Story Points:** 3

**Dependencies:** All STAFF stories

**Technical Notes:**
- Same platform as staff documentation
- Role-specific guides
- Sample scenarios and templates
- Integration with video tutorials

**Definition of Done:**
- [ ] All sections written
- [ ] Screenshots added
- [ ] Peer reviewed
- [ ] Published and accessible

---

## Summary Statistics

**Total Stories:** 30
**Total Story Points:** 195

**By Epic:**
- Epic 1 (Staff Management): 23 points
- Epic 2 (QR Code Scanning): 50 points
- Epic 3 (Manual Check-in): 18 points
- Epic 4 (Public Ticket View): 13 points
- Epic 5 (Real-time Tracking): 18 points
- Epic 6 (Multi-device Sync): 18 points
- Epic 7 (Advanced Features): 21 points
- Epic 8 (Testing & QA): 34 points
- Epic 9 (Documentation): 8 points

**Estimated Timeline:** 7 sprints (14 weeks)
