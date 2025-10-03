# Affiliate Ticket Sales System - User Stories

## Epic 1: Affiliate Registration & Management

### AFF-001: Affiliate Registration
**As a** potential affiliate
**I want** to register for an affiliate account
**So that** I can start selling event tickets

**Acceptance Criteria:**
- [ ] Registration form includes: name, email, phone, business name (optional), tax ID (EIN/SSN), payment method preference
- [ ] Email validation and uniqueness check
- [ ] Password requirements: min 8 characters, 1 uppercase, 1 number, 1 special character
- [ ] Terms of service and affiliate agreement acceptance
- [ ] Confirmation email sent upon registration
- [ ] Account created in "PENDING" status awaiting admin approval
- [ ] All required fields validated on client and server side
- [ ] Tax ID format validation (XXX-XX-XXXX for SSN, XX-XXXXXXX for EIN)

**Story Points:** 5

**Dependencies:** None

**Technical Notes:**
- Extend Prisma User model with affiliate fields
- Create new Affiliate model with relationship to User
- Use NextAuth.js for authentication
- Implement email verification flow
- Store tax ID encrypted at rest

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Integration tests for API endpoints
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

### AFF-002: Admin Affiliate Approval Workflow
**As an** event organizer/admin
**I want** to review and approve/reject affiliate applications
**So that** I can control who sells tickets for my events

**Acceptance Criteria:**
- [ ] Admin dashboard shows all pending affiliate applications
- [ ] View affiliate details: name, contact info, business info, tax ID (masked)
- [ ] Approve button changes status to "ACTIVE" and sends approval email
- [ ] Reject button with required reason field, sends rejection email
- [ ] Email templates for approval/rejection with professional formatting
- [ ] Notification badge shows count of pending applications
- [ ] Filter by status: Pending, Active, Suspended, Rejected
- [ ] Search by name or email
- [ ] Bulk actions support (approve/reject multiple)

**Story Points:** 5

**Dependencies:** AFF-001

**Technical Notes:**
- Create admin API endpoints for approval workflow
- Email templates using React Email or similar
- Real-time notifications using WebSocket or polling
- Audit log for approval/rejection actions

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Integration tests for API endpoints
- [ ] Email templates tested
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

### AFF-003: Affiliate Profile Management
**As an** affiliate
**I want** to view and update my profile information
**So that** I can keep my account details current

**Acceptance Criteria:**
- [ ] View all profile information except password
- [ ] Edit contact information (name, email, phone)
- [ ] Edit business information
- [ ] Update payment preferences
- [ ] Update tax ID (requires admin re-verification)
- [ ] Change password with current password verification
- [ ] Upload profile photo (optional)
- [ ] Success/error messages for all updates
- [ ] Email notification on critical changes (email, tax ID, payment method)

**Story Points:** 3

**Dependencies:** AFF-001

**Technical Notes:**
- Secure file upload for profile photos
- Email change requires verification
- Tax ID change triggers admin notification
- Rate limiting on profile updates

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

## Epic 2: Ticket Assignment & Inventory

### AFF-004: Assign Tickets to Affiliate (Pre-buy Model)
**As an** event organizer
**I want** to assign tickets to affiliates at wholesale price
**So that** affiliates can pre-purchase inventory

**Acceptance Criteria:**
- [ ] Select event and ticket type
- [ ] Enter number of tickets to assign
- [ ] Set wholesale price per ticket (must be < retail price)
- [ ] Calculate total cost and display prominently
- [ ] Affiliate receives email notification with assignment details
- [ ] Tickets marked as "ASSIGNED" in inventory
- [ ] Generate unique tracking codes for assigned tickets
- [ ] Transaction recorded in affiliate account
- [ ] Prevent over-assignment (can't exceed available inventory)
- [ ] Support multiple assignments to same affiliate

**Story Points:** 8

**Dependencies:** AFF-001, AFF-002

**Technical Notes:**
- Create AffiliateTicketAssignment model
- Link to existing Ticket and Event models
- Implement inventory locking mechanism
- Generate UUID-based tracking codes
- Transaction atomicity (inventory + assignment + notification)

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Integration tests for inventory locking
- [ ] Edge case testing (concurrent assignments)
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

### AFF-005: Affiliate Payment for Assigned Tickets
**As an** affiliate
**I want** to pay for my assigned tickets
**So that** I can activate them for sale

**Acceptance Criteria:**
- [ ] View all pending (unpaid) ticket assignments
- [ ] See wholesale price, quantity, and total cost
- [ ] Pay via Square integration (card or ACH)
- [ ] Payment confirmation screen with receipt
- [ ] Tickets change from "ASSIGNED" to "ACTIVE" status
- [ ] Email receipt sent to affiliate
- [ ] Payment recorded in transaction history
- [ ] Support partial payments for large orders
- [ ] Payment deadline notification (e.g., 48 hours)
- [ ] Auto-cancellation if payment not received by deadline

**Story Points:** 8

**Dependencies:** AFF-004

**Technical Notes:**
- Integrate with existing Square payment system
- Create Payment model linked to AffiliateTicketAssignment
- Implement payment webhook handling
- Scheduled job for payment deadline enforcement
- Support payment plans for large orders

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Integration tests with Square sandbox
- [ ] Payment failure scenarios tested
- [ ] Manual testing with test cards
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

### AFF-006: Configure Pay-Later Commission Model
**As an** event organizer
**I want** to set up commission-based ticket sales
**So that** affiliates can sell without pre-purchasing

**Acceptance Criteria:**
- [ ] Enable/disable pay-later model per event
- [ ] Set commission percentage (0-100%)
- [ ] Set commission as fixed amount per ticket (alternative to percentage)
- [ ] Preview earnings calculation
- [ ] Apply commission rules to ticket types
- [ ] Default commission settings at organization level
- [ ] Override commission per affiliate (special rates)
- [ ] Display commission structure on affiliate portal
- [ ] Minimum payout threshold configuration
- [ ] Commission calculation preview tool

**Story Points:** 5

**Dependencies:** AFF-001, AFF-002

**Technical Notes:**
- Create CommissionRule model
- Support both percentage and fixed amount
- Hierarchy: Event > Affiliate > Organization defaults
- Store commission rules with assignment/sale records
- Historical tracking for audit purposes

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Commission calculation tests
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

## Epic 3: Sales Tracking & Attribution

### AFF-007: Generate Affiliate Tracking Links
**As an** affiliate
**I want** to get unique tracking links for events
**So that** I can promote tickets and get credit for sales

**Acceptance Criteria:**
- [ ] List all events available for promotion
- [ ] Generate unique tracking link per event
- [ ] UTM parameters automatically included (source=affiliate, medium=referral, campaign=event-id, content=affiliate-id)
- [ ] Copy to clipboard functionality
- [ ] QR code generation for sharing
- [ ] Short URL option (e.g., evt.st/abc123)
- [ ] Track link clicks and conversion rate
- [ ] Social media preview card customization
- [ ] Multiple links per event (different campaigns)
- [ ] Link analytics dashboard

**Story Points:** 5

**Dependencies:** AFF-001, AFF-002

**Technical Notes:**
- Create AffiliateLink model
- URL shortener service (internal or third-party)
- UTM parameter parsing on ticket pages
- Click tracking middleware
- QR code generation using qrcode.js
- Open Graph metadata for social sharing

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Click tracking tested
- [ ] QR codes tested on mobile
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

### AFF-008: Online Ticket Purchase with Affiliate Attribution
**As a** customer
**I want** to purchase tickets through an affiliate link
**So that** my purchase is credited to the affiliate

**Acceptance Criteria:**
- [ ] Affiliate ID captured from URL parameters
- [ ] Affiliate ID stored in session/cookie (7-day expiry)
- [ ] Attribution persists through checkout flow
- [ ] Display affiliate name on confirmation page (optional)
- [ ] Record affiliate ID in Order record
- [ ] Calculate commission at time of purchase
- [ ] Commission recorded in AffiliateEarning table
- [ ] Handle cases where affiliate link expires
- [ ] Multi-touch attribution (last-click wins)
- [ ] Test mode for debugging attribution

**Story Points:** 8

**Dependencies:** AFF-007

**Technical Notes:**
- Middleware for affiliate parameter extraction
- Cookie/session management with secure flags
- Update existing Order model with affiliate fields
- Create AffiliateEarning model
- Commission calculation service
- Attribution expiry job

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Integration tests for full flow
- [ ] Cookie handling tested across browsers
- [ ] Attribution accuracy validated
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

### AFF-009: Cash Payment with PIN Validation
**As an** affiliate
**I want** to accept cash payments and validate with my PIN
**So that** I can sell tickets in person

**Acceptance Criteria:**
- [ ] Affiliate has 4-digit PIN (set in profile, never displayed)
- [ ] Mobile-optimized payment form
- [ ] Select event and ticket quantity
- [ ] Enter customer name and email (optional)
- [ ] Enter 4-digit PIN to confirm sale
- [ ] PIN validated in real-time
- [ ] Sale recorded immediately upon validation
- [ ] Generate ticket QR code and send to customer email
- [ ] SMS option for ticket delivery (if phone provided)
- [ ] Receipt displayed on screen for customer
- [ ] Failed PIN attempts logged (rate limiting after 3 fails)
- [ ] Offline mode: queue transaction, sync when online

**Story Points:** 13

**Dependencies:** AFF-007

**Technical Notes:**
- PIN stored as bcrypt hash
- Rate limiting per affiliate (3 attempts per 15 min)
- Create CashSale model
- QR ticket generation service
- SMS integration (Twilio)
- Service worker for offline support
- IndexedDB for queued transactions
- Sync service for offline transactions

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Integration tests for PIN validation
- [ ] Offline mode tested extensively
- [ ] Security testing (PIN handling)
- [ ] Rate limiting tested
- [ ] Manual testing on mobile devices
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

### AFF-010: PIN Management
**As an** affiliate
**I want** to set and change my 4-digit PIN
**So that** I can secure my cash sales

**Acceptance Criteria:**
- [ ] Set initial PIN during onboarding
- [ ] Change PIN from profile page
- [ ] Current PIN required to change
- [ ] New PIN entered twice for confirmation
- [ ] PIN must be 4 digits, numeric only
- [ ] Cannot reuse last 3 PINs
- [ ] Email notification on PIN change
- [ ] Forgot PIN flow (requires admin approval)
- [ ] PIN strength indicator (warn against 0000, 1234, etc.)
- [ ] Lock account after 5 failed change attempts

**Story Points:** 3

**Dependencies:** AFF-009

**Technical Notes:**
- Store PIN history (hashed)
- Email notification service
- Admin approval workflow for PIN reset
- Common PIN blacklist (0000, 1234, 1111, etc.)

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Security testing
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

## Epic 4: Affiliate Dashboard & Reporting

### AFF-011: Affiliate Sales Dashboard
**As an** affiliate
**I want** to view my sales performance
**So that** I can track my earnings

**Acceptance Criteria:**
- [ ] Display total sales count (all time)
- [ ] Display total earnings (all time)
- [ ] Display pending earnings (not yet paid)
- [ ] Display paid earnings
- [ ] Current month sales and earnings
- [ ] Previous month comparison
- [ ] Sales by event (table with sorting)
- [ ] Sales by date range filter
- [ ] Sales by method (online vs cash)
- [ ] Conversion rate from clicks to sales
- [ ] Chart: Sales over time (last 30 days)
- [ ] Chart: Earnings breakdown by event
- [ ] Export to CSV

**Story Points:** 8

**Dependencies:** AFF-008, AFF-009

**Technical Notes:**
- Aggregate queries for performance
- Caching layer (Redis) for dashboard stats
- Chart library (Recharts or Chart.js)
- CSV export service
- Date range picker component
- Responsive design for mobile

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Performance testing (sub-2s load time)
- [ ] Chart rendering tested
- [ ] Export functionality tested
- [ ] Manual testing on mobile
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

### AFF-012: Transaction History
**As an** affiliate
**I want** to view detailed transaction history
**So that** I can audit my sales and earnings

**Acceptance Criteria:**
- [ ] List all transactions (sales, payouts, adjustments)
- [ ] Filter by type: Sales, Payouts, Refunds, Adjustments
- [ ] Filter by date range
- [ ] Search by customer name or order ID
- [ ] Each transaction shows: date, type, event, amount, commission, status
- [ ] Click transaction for full details
- [ ] Pagination (25 per page)
- [ ] Sort by any column
- [ ] Export filtered results to CSV
- [ ] Download receipts/invoices per transaction

**Story Points:** 5

**Dependencies:** AFF-011

**Technical Notes:**
- Create unified transaction view (sales + payouts)
- Efficient pagination with cursor-based approach
- PDF generation for receipts
- Advanced filtering with query builder
- Transaction detail modal

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Performance testing with 10k+ records
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

### AFF-013: Earnings Summary & Projections
**As an** affiliate
**I want** to see earnings projections
**So that** I can plan my sales activities

**Acceptance Criteria:**
- [ ] Current period earnings (MTD)
- [ ] Projected monthly earnings based on current pace
- [ ] Top-performing events
- [ ] Upcoming event opportunities
- [ ] Earnings goal setting
- [ ] Goal progress tracker
- [ ] Best selling days/times heatmap
- [ ] Recommendations for improvement
- [ ] Historical earnings comparison (YoY, MoM)
- [ ] Lifetime earnings milestone badges

**Story Points:** 5

**Dependencies:** AFF-011

**Technical Notes:**
- Projection algorithm based on historical data
- Goal tracking model
- Heatmap visualization
- Analytics engine for recommendations
- Badge/achievement system

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Projection accuracy validated
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

## Epic 5: Admin Management & Oversight

### AFF-014: Admin Affiliate Management Dashboard
**As an** event organizer
**I want** to manage all affiliates in one place
**So that** I can oversee my affiliate program

**Acceptance Criteria:**
- [ ] List all affiliates with status badges
- [ ] Filter by status: Active, Pending, Suspended
- [ ] Search by name, email, or ID
- [ ] View affiliate details (click to expand)
- [ ] Suspend/reactivate affiliate accounts
- [ ] View affiliate sales summary
- [ ] View affiliate earnings summary
- [ ] Export affiliate list to CSV
- [ ] Bulk actions: Suspend, Activate, Export
- [ ] Sort by various metrics (sales, earnings, join date)
- [ ] Quick stats: Total affiliates, Active, Total sales by all

**Story Points:** 5

**Dependencies:** AFF-002

**Technical Notes:**
- Admin API endpoints with role-based access
- Efficient queries with proper indexing
- Bulk action queue for large operations
- Real-time status updates

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] RBAC tested
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

### AFF-015: Admin Sales Overview Dashboard
**As an** event organizer
**I want** to see all affiliate sales across events
**So that** I can measure program performance

**Acceptance Criteria:**
- [ ] Total sales through affiliates (all time)
- [ ] Total commission paid
- [ ] Total commission pending
- [ ] Sales by event breakdown
- [ ] Sales by affiliate (top 10)
- [ ] Revenue impact analysis (affiliate vs direct)
- [ ] Monthly sales trend chart
- [ ] Commission expense tracking
- [ ] ROI calculator (commission vs ticket sales)
- [ ] Event-specific affiliate performance
- [ ] Export comprehensive report

**Story Points:** 8

**Dependencies:** AFF-014

**Technical Notes:**
- Complex aggregation queries
- Data warehouse consideration for large datasets
- Advanced charting with drill-down capability
- Scheduled report generation
- Caching strategy for performance

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Performance testing
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

### AFF-016: Manual Commission Adjustments
**As an** event organizer
**I want** to manually adjust affiliate commissions
**So that** I can handle special cases and corrections

**Acceptance Criteria:**
- [ ] View affiliate earnings summary
- [ ] Add positive adjustment (bonus)
- [ ] Add negative adjustment (correction)
- [ ] Required reason field for all adjustments
- [ ] Adjustment amount validation
- [ ] Affiliate notification email
- [ ] Adjustment recorded in transaction history
- [ ] Audit log of all adjustments
- [ ] Adjustment approval workflow (optional)
- [ ] Bulk adjustments support
- [ ] Adjustment reversal capability

**Story Points:** 5

**Dependencies:** AFF-014

**Technical Notes:**
- Create AffiliateAdjustment model
- Two-factor authentication for large adjustments
- Comprehensive audit logging
- Email notification template
- Adjustment approval workflow (configurable)

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Audit logging tested
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

## Epic 6: Payouts & Tax Compliance

### AFF-017: Stripe Connect Onboarding
**As an** affiliate
**I want** to connect my Stripe account
**So that** I can receive automated payouts

**Acceptance Criteria:**
- [ ] Stripe Connect OAuth flow
- [ ] Link existing Stripe account or create new
- [ ] Verify identity (Stripe KYC)
- [ ] Display connection status
- [ ] Disconnect/reconnect capability
- [ ] Store Stripe account ID securely
- [ ] Handle onboarding errors gracefully
- [ ] Test mode for development
- [ ] Support for multiple payout countries
- [ ] Payout method display (bank account info)

**Story Points:** 8

**Dependencies:** AFF-001

**Technical Notes:**
- Stripe Connect Express accounts
- OAuth implementation
- Webhook handling for account status
- Secure storage of Stripe account IDs
- Country-specific requirements handling
- Test mode with Stripe test accounts

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Integration tests with Stripe sandbox
- [ ] Error scenarios tested
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

### AFF-018: Automated Payout Processing
**As a** system
**I want** to automatically process payouts to affiliates
**So that** earnings are distributed on schedule

**Acceptance Criteria:**
- [ ] Weekly payout schedule (configurable)
- [ ] Minimum payout threshold ($50 default, configurable)
- [ ] Calculate total pending earnings per affiliate
- [ ] Exclude earnings from events not yet completed
- [ ] Initiate Stripe transfer to connected account
- [ ] Record payout transaction
- [ ] Update earnings status to "PAID"
- [ ] Send payout confirmation email
- [ ] Handle payout failures (retry logic)
- [ ] Admin notification for failed payouts
- [ ] Payout hold period (7 days default for refund buffer)
- [ ] Manual payout trigger (admin override)

**Story Points:** 13

**Dependencies:** AFF-017

**Technical Notes:**
- Scheduled job (cron or queue-based)
- Stripe Transfer API
- Transaction atomicity critical
- Retry mechanism with exponential backoff
- Idempotency keys for Stripe calls
- Payout reconciliation service
- Admin notification system
- Configurable payout schedules per event

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Integration tests with Stripe sandbox
- [ ] Failure scenarios tested thoroughly
- [ ] Retry logic tested
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

### AFF-019: Payout History & Statements
**As an** affiliate
**I want** to view my payout history
**So that** I can track my payments

**Acceptance Criteria:**
- [ ] List all payouts with dates and amounts
- [ ] Filter by date range
- [ ] Filter by status: Pending, Completed, Failed
- [ ] Each payout shows: date, amount, method, status, transaction ID
- [ ] Click payout for detailed breakdown
- [ ] Show sales included in each payout
- [ ] Download payout statement (PDF)
- [ ] Show next scheduled payout date and estimated amount
- [ ] Dispute/inquiry button for payout issues
- [ ] Payout notification preferences

**Story Points:** 5

**Dependencies:** AFF-018

**Technical Notes:**
- Payout detail aggregation
- PDF generation with detailed breakdown
- Email notification service
- Support ticket integration for disputes

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] PDF generation tested
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

### AFF-020: 1099 Tax Form Generation
**As an** affiliate
**I want** to receive a 1099 form
**So that** I can file my taxes correctly

**Acceptance Criteria:**
- [ ] Generate 1099-NEC form for US affiliates earning >$600
- [ ] Include all W-9 information from registration
- [ ] Calculate total annual earnings
- [ ] Generate PDF form matching IRS format
- [ ] Email form to affiliate by January 31st
- [ ] Download form from affiliate dashboard anytime
- [ ] Form available for previous 3 years
- [ ] International affiliates: Tax form not required message
- [ ] Admin can regenerate forms if corrections needed
- [ ] Batch generation for all affiliates
- [ ] IRS submission ready format (optional)

**Story Points:** 8

**Dependencies:** AFF-018

**Technical Notes:**
- 1099-NEC form template
- PDF generation library
- Tax year calculation logic
- Scheduled job for annual generation
- Secure storage for tax documents
- Encryption for sensitive tax data
- Email delivery with read receipts
- Compliance with IRS regulations

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Form accuracy validated
- [ ] Legal/compliance review
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

### AFF-021: Tax Settings & W-9 Management
**As an** affiliate
**I want** to update my tax information
**So that** my 1099 forms are accurate

**Acceptance Criteria:**
- [ ] View current W-9 information
- [ ] Update tax ID (EIN or SSN)
- [ ] Update business classification
- [ ] Update business name
- [ ] Update mailing address
- [ ] Sign W-9 electronically
- [ ] Download signed W-9
- [ ] Changes require admin approval
- [ ] Email notification on approval/rejection
- [ ] Historical W-9 versions stored
- [ ] Backup withholding status display

**Story Points:** 5

**Dependencies:** AFF-020

**Technical Notes:**
- Electronic signature integration (DocuSign or similar)
- W-9 version tracking
- Admin approval workflow
- Encrypted storage for tax documents
- IRS W-9 form format compliance

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] E-signature tested
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

## Epic 7: Marketing & Communication

### AFF-022: Affiliate Marketing Resources
**As an** affiliate
**I want** to access marketing materials
**So that** I can effectively promote events

**Acceptance Criteria:**
- [ ] Library of promotional images per event
- [ ] Social media post templates
- [ ] Email template copy
- [ ] Event description and highlights
- [ ] Hashtag recommendations
- [ ] Logo assets (various sizes)
- [ ] Brand guidelines
- [ ] Download individual assets
- [ ] Download all event assets as ZIP
- [ ] Preview images before download
- [ ] Copy social media text with one click
- [ ] Asset search and filter

**Story Points:** 5

**Dependencies:** AFF-007

**Technical Notes:**
- Asset storage (S3 or similar)
- ZIP generation service
- Image optimization for web
- CDN for asset delivery
- Template management system
- Copy-to-clipboard API

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Asset upload tested
- [ ] Download functionality tested
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

### AFF-023: Affiliate Notifications & Alerts
**As an** affiliate
**I want** to receive timely notifications
**So that** I stay informed about my sales and program updates

**Acceptance Criteria:**
- [ ] Email notification for each sale
- [ ] Daily sales summary email (opt-in)
- [ ] Weekly earnings report
- [ ] Payout processed notification
- [ ] New event available for promotion
- [ ] Event date approaching reminder
- [ ] Ticket inventory low warning
- [ ] Program updates and announcements
- [ ] Commission structure changes
- [ ] Notification preferences page
- [ ] In-app notification center
- [ ] Push notifications (PWA)

**Story Points:** 5

**Dependencies:** AFF-008, AFF-009, AFF-018

**Technical Notes:**
- Email template library
- Notification preference model
- Queue-based email delivery
- Push notification service (Web Push API)
- In-app notification storage
- Notification aggregation/batching

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Email templates tested
- [ ] Push notifications tested
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

### AFF-024: Affiliate Leaderboard & Gamification
**As an** affiliate
**I want** to see how I rank against other affiliates
**So that** I'm motivated to sell more

**Acceptance Criteria:**
- [ ] Leaderboard: Top 10 affiliates by sales volume (current month)
- [ ] Leaderboard: Top 10 affiliates by earnings (current month)
- [ ] Leaderboard: Top 10 affiliates all-time
- [ ] Display current user's rank
- [ ] Anonymous mode option (hide names)
- [ ] Filter by event or time period
- [ ] Achievement badges (milestones: 10, 50, 100, 500 sales)
- [ ] Display badges on profile
- [ ] Shareable achievement graphics
- [ ] Monthly contest announcements
- [ ] Prize/reward system for top performers

**Story Points:** 5

**Dependencies:** AFF-011

**Technical Notes:**
- Leaderboard calculation service (cached)
- Badge system with unlock conditions
- Social sharing integration
- Contest management interface (admin)
- Real-time rank updates (optional)

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Leaderboard accuracy tested
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

## Epic 8: Refunds & Customer Support

### AFF-025: Refund Impact on Affiliate Earnings
**As a** system
**I want** to handle refunds correctly
**So that** affiliate earnings are adjusted appropriately

**Acceptance Criteria:**
- [ ] When customer requests refund, identify affiliate sale
- [ ] If sale attributed to affiliate, mark earning as "REFUNDED"
- [ ] If commission already paid, create negative adjustment
- [ ] Deduct refunded amount from future payouts
- [ ] Notify affiliate of refund impact
- [ ] Show refunded transactions in transaction history
- [ ] Admin can override refund impact (keep commission)
- [ ] Partial refunds handled proportionally
- [ ] Refund statistics in affiliate dashboard
- [ ] Grace period: No commission impact if refund within 24h (configurable)

**Story Points:** 8

**Dependencies:** AFF-018

**Technical Notes:**
- Refund webhook handling
- Earning status management
- Negative balance tracking
- Notification service integration
- Admin override capability
- Grace period configuration

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Refund scenarios tested
- [ ] Edge cases covered
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

### AFF-026: Affiliate Support Portal
**As an** affiliate
**I want** to get help when I have issues
**So that** I can resolve problems quickly

**Acceptance Criteria:**
- [ ] FAQ section for common questions
- [ ] Search FAQ by keyword
- [ ] Submit support ticket
- [ ] Ticket categories: Technical, Payment, Sales, Account
- [ ] Attach screenshots to tickets
- [ ] View ticket status and history
- [ ] Email updates on ticket responses
- [ ] Live chat option (business hours)
- [ ] Knowledge base articles
- [ ] Video tutorials
- [ ] Contact information for urgent issues

**Story Points:** 5

**Dependencies:** AFF-001

**Technical Notes:**
- Support ticket system
- File upload for attachments
- Email integration for responses
- Live chat integration (optional)
- Knowledge base CMS
- Video hosting (YouTube or Vimeo)

**Definition of Done:**
- [ ] Code written and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Ticket system tested
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner acceptance

---

## Epic 9: Testing & Quality Assurance

### AFF-027: Comprehensive Integration Tests
**As a** developer
**I want** comprehensive integration tests
**So that** the affiliate system is reliable

**Acceptance Criteria:**
- [ ] Test full registration flow
- [ ] Test approval workflow
- [ ] Test ticket assignment and payment
- [ ] Test online sales with attribution
- [ ] Test cash sales with PIN
- [ ] Test payout processing
- [ ] Test refund handling
- [ ] Test commission calculations
- [ ] Test Stripe Connect integration
- [ ] Test notification delivery
- [ ] Test admin dashboards
- [ ] >85% code coverage

**Story Points:** 13

**Dependencies:** All AFF stories

**Technical Notes:**
- Jest + Testing Library
- Stripe test mode
- Test database seeding
- Mock external services
- CI/CD integration
- Performance benchmarks

**Definition of Done:**
- [ ] All tests written and passing
- [ ] Code coverage >85%
- [ ] CI/CD pipeline configured
- [ ] Performance benchmarks established
- [ ] Documentation updated

---

### AFF-028: User Acceptance Testing (UAT)
**As a** Product Owner
**I want** to conduct UAT with real affiliates
**So that** the system meets user needs

**Acceptance Criteria:**
- [ ] Recruit 5-10 test affiliates
- [ ] Create UAT test plan
- [ ] Set up UAT environment
- [ ] Conduct guided testing sessions
- [ ] Collect feedback via surveys
- [ ] Document bugs and issues
- [ ] Prioritize fixes
- [ ] Retest after fixes
- [ ] Get sign-off from test group
- [ ] Create UAT report

**Story Points:** 8

**Dependencies:** All AFF stories

**Technical Notes:**
- UAT environment provisioning
- Test data preparation
- Feedback collection tools
- Bug tracking integration
- Session recording tools

**Definition of Done:**
- [ ] UAT completed with 5+ users
- [ ] Critical bugs resolved
- [ ] Feedback documented
- [ ] Sign-off received
- [ ] Report published

---

## Epic 10: Documentation & Training

### AFF-029: Affiliate User Documentation
**As an** affiliate
**I want** comprehensive documentation
**So that** I can use the system effectively

**Acceptance Criteria:**
- [ ] Getting started guide
- [ ] Registration and approval process
- [ ] How to generate tracking links
- [ ] How to accept cash payments
- [ ] How to read your dashboard
- [ ] How to get paid
- [ ] Tax information guide
- [ ] Troubleshooting guide
- [ ] FAQ
- [ ] Video tutorials for key workflows
- [ ] Mobile app guide
- [ ] Best practices for selling

**Story Points:** 5

**Dependencies:** All AFF stories

**Technical Notes:**
- Documentation platform (GitBook, Docusaurus)
- Screenshot automation
- Video recording and editing
- SEO optimization
- Multi-language support (future)

**Definition of Done:**
- [ ] All sections written
- [ ] Screenshots added
- [ ] Videos recorded
- [ ] Peer reviewed
- [ ] Published and accessible

---

### AFF-030: Admin User Documentation
**As an** event organizer
**I want** admin documentation
**So that** I can manage my affiliate program

**Acceptance Criteria:**
- [ ] How to set up affiliate program
- [ ] How to approve affiliates
- [ ] How to assign tickets
- [ ] How to configure commissions
- [ ] How to monitor sales
- [ ] How to manage payouts
- [ ] How to handle disputes
- [ ] How to generate reports
- [ ] How to make adjustments
- [ ] Best practices guide
- [ ] Security recommendations

**Story Points:** 3

**Dependencies:** All AFF stories

**Technical Notes:**
- Same platform as user documentation
- Admin-specific workflows
- Security considerations
- Role-based access guide

**Definition of Done:**
- [ ] All sections written
- [ ] Screenshots added
- [ ] Peer reviewed
- [ ] Published and accessible

---

## Summary Statistics

**Total Stories:** 30
**Total Story Points:** 192

**By Epic:**
- Epic 1 (Registration & Management): 13 points
- Epic 2 (Ticket Assignment): 21 points
- Epic 3 (Sales Tracking): 29 points
- Epic 4 (Dashboard & Reporting): 18 points
- Epic 5 (Admin Management): 18 points
- Epic 6 (Payouts & Tax): 39 points
- Epic 7 (Marketing & Communication): 15 points
- Epic 8 (Refunds & Support): 13 points
- Epic 9 (Testing & QA): 21 points
- Epic 10 (Documentation): 8 points

**Estimated Timeline:** 7-8 sprints (14-16 weeks)
