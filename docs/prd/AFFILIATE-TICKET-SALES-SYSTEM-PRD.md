# Product Requirements Document: Affiliate Ticket Sales System

**Document Version:** 1.0
**Created:** 2025-10-02
**Product Manager:** PM Agent
**Project:** Events SteppersLife Platform
**Epic:** Affiliate & Reseller Management

---

## Executive Summary

This PRD defines the requirements for an Affiliate Ticket Sales System that enables event organizers to recruit, manage, and track affiliates who sell tickets on their behalf. Affiliates purchase tickets at wholesale prices and resell them up to a maximum retail price set by the organizer, earning the difference as their commission. The system supports flexible payment terms, comprehensive tracking, and detailed reporting for all stakeholders.

### Business Objectives
1. **Expand ticket distribution channels** beyond direct sales
2. **Increase ticket sales volume** by 25-40% for events using affiliates
3. **Reduce organizer marketing costs** by leveraging affiliate networks
4. **Enable pay-later terms** for trusted affiliates to reduce barrier to entry
5. **Provide full transparency** with tracking and reporting for all parties

### Success Metrics
- **Adoption Rate:** 20% of event organizers enable affiliate sales within 3 months
- **Sales Volume:** Affiliate sales represent 15%+ of total ticket sales
- **Affiliate Retention:** 60%+ of affiliates make repeat purchases across multiple events
- **Payment Collection:** 95%+ collection rate on pay-later terms
- **User Satisfaction:** 4.5+ star rating from both organizers and affiliates

---

## Table of Contents
1. [User Personas](#user-personas)
2. [User Stories & Acceptance Criteria](#user-stories--acceptance-criteria)
3. [Feature Specifications](#feature-specifications)
4. [Business Rules & Logic](#business-rules--logic)
5. [Data Model Overview](#data-model-overview)
6. [User Flows](#user-flows)
7. [Security & Fraud Prevention](#security--fraud-prevention)
8. [Technical Requirements](#technical-requirements)
9. [Analytics & Reporting](#analytics--reporting)
10. [Edge Cases & Error Handling](#edge-cases--error-handling)
11. [Phase 1 MVP vs Future Enhancements](#phase-1-mvp-vs-future-enhancements)
12. [Open Questions & Assumptions](#open-questions--assumptions)

---

## 1. User Personas

### 1.1 Event Organizer (Primary User)
**Profile:**
- Name: Sarah, Dance Event Promoter
- Age: 32-45
- Experience: Runs 6-12 events per year
- Pain Points:
  - Struggles to reach new audiences
  - High marketing costs
  - Needs help selling tickets for mid-sized events (100-500 attendees)

**Goals:**
- Expand ticket distribution without upfront marketing spend
- Maintain control over pricing and brand
- Track which affiliates drive the most sales
- Get paid immediately, manage affiliate payment terms
- Reduce no-shows by having affiliates accountable for their sales

**Technical Proficiency:** Medium (comfortable with web dashboards)

---

### 1.2 Affiliate Seller (Primary User)
**Profile:**
- Name: Marcus, Dance Instructor & Community Influencer
- Age: 25-40
- Experience: Teaches 3-5 classes per week, has 500-2000 followers
- Pain Points:
  - Wants to monetize his audience
  - Doesn't want to front large amounts of cash
  - Needs easy tools to share tickets
  - Wants transparent tracking of sales

**Goals:**
- Earn extra income by selling tickets to students and followers
- Access pay-later terms to avoid cash flow issues
- Get unique links that are easy to share on social media
- See real-time sales performance
- Get paid quickly and reliably

**Technical Proficiency:** Medium (uses social media daily, comfortable with apps)

---

### 1.3 Ticket Buyer (End Customer)
**Profile:**
- Name: Jessica, Dance Enthusiast
- Age: 21-50
- Experience: Attends 2-5 events per year

**Goals:**
- Buy tickets easily through trusted source (their instructor/friend)
- Same price as buying direct (or better)
- Legitimate tickets with QR codes
- Easy refund process if needed

**Concerns:**
- Is this a legitimate ticket?
- Will I get the same customer service?
- What if the affiliate disappears?

**Technical Proficiency:** Medium to High

---

### 1.4 Platform Admin (Secondary User)
**Profile:**
- Name: Admin Team
- Role: Platform operations and support

**Goals:**
- Monitor affiliate program health
- Detect fraud and prevent abuse
- Resolve disputes between organizers and affiliates
- Track platform-wide performance metrics
- Ensure payment compliance and tax reporting

**Technical Proficiency:** High

---

## 2. User Stories & Acceptance Criteria

### Epic: Affiliate Program Setup

#### US-AFF-001: Enable Affiliate Program for Event
**As an** event organizer
**I want to** enable affiliate ticket sales for my event
**So that** I can expand my distribution channels

**Acceptance Criteria:**
- [ ] Organizer can toggle "Enable Affiliate Sales" on event settings page
- [ ] Organizer sets wholesale price per ticket type (must be ≤ retail price)
- [ ] Organizer sets maximum retail price affiliates can charge
- [ ] Organizer defines payment terms: "Pay Now" or "Net 30/60" with credit limit
- [ ] Organizer sets affiliate inventory allocation limit (max tickets per affiliate)
- [ ] Organizer can set ticket return deadline (e.g., 48 hours before event)
- [ ] System validates wholesale price < max retail price
- [ ] Changes saved successfully with confirmation message

**Business Rules:**
- Wholesale price must be at least $1 less than max retail price (minimum margin)
- Max retail price cannot exceed the event's public ticket price
- Payment terms can only be changed before any affiliate purchases inventory
- Default payment term is "Pay Now" if not specified

---

#### US-AFF-002: Configure Affiliate Application Settings
**As an** event organizer
**I want to** configure affiliate application requirements
**So that** I can control who can sell my tickets

**Acceptance Criteria:**
- [ ] Organizer can enable "Auto-approve affiliates" or "Manual review required"
- [ ] Organizer can set minimum requirements (e.g., "Must have sold X tickets previously")
- [ ] Organizer can write custom application questions (up to 5 questions)
- [ ] Organizer can view affiliate approval queue with filtering
- [ ] System shows affiliate's profile, past performance, and ratings

**Business Rules:**
- First-time affiliates always require manual approval regardless of auto-approve setting
- Affiliates with chargebacks or fraud flags cannot be auto-approved
- Organizer can block specific affiliates from applying

---

### Epic: Affiliate Registration & Onboarding

#### US-AFF-003: Affiliate Registration
**As a** potential affiliate
**I want to** register as an affiliate on the platform
**So that** I can start selling tickets

**Acceptance Criteria:**
- [ ] User can access "Become an Affiliate" page from event detail page
- [ ] User completes profile: Name, Email, Phone, Social Media Links, Bio
- [ ] User uploads profile photo and cover image (optional)
- [ ] User provides payment information (bank account for ACH payouts)
- [ ] User provides tax information (W-9 for US, equivalent for international)
- [ ] User agrees to Affiliate Terms of Service
- [ ] System validates all required fields before submission
- [ ] User receives confirmation email after registration

**Business Rules:**
- Email must be unique and verified
- Phone number must be verified via SMS
- Bank account verified via micro-deposits or Plaid integration
- Tax ID required for affiliates expecting >$600/year in earnings (US)
- Profile must be 80% complete to apply to sell for events

---

#### US-AFF-004: Apply to Sell for Specific Event
**As a** registered affiliate
**I want to** apply to sell tickets for a specific event
**So that** I can earn commission

**Acceptance Criteria:**
- [ ] Affiliate browses events with affiliate programs enabled
- [ ] Affiliate sees wholesale price, max retail price, and potential margin
- [ ] Affiliate clicks "Apply to Sell" and completes application
- [ ] Affiliate answers organizer's custom questions if required
- [ ] Affiliate indicates requested inventory quantity
- [ ] Affiliate sees estimated earnings based on requested inventory
- [ ] System submits application for organizer review (if manual approval)
- [ ] Affiliate receives email notification on approval/rejection

**Business Rules:**
- Affiliate cannot request more than organizer's per-affiliate inventory limit
- Application shows payment terms (pay now vs net 30/60)
- Affiliate cannot apply for events in the past or events with <7 days until start
- Affiliate can only have one active application per event

---

#### US-AFF-005: Organizer Reviews Affiliate Applications
**As an** event organizer
**I want to** review and approve/reject affiliate applications
**So that** I maintain quality control

**Acceptance Criteria:**
- [ ] Organizer sees pending applications in dashboard with badges/notifications
- [ ] Organizer views affiliate profile, past performance, ratings, and answers
- [ ] Organizer can see affiliate's request: inventory quantity, payment terms
- [ ] Organizer can approve with full or partial inventory allocation
- [ ] Organizer can approve with modified payment terms (pay now vs net 30/60)
- [ ] Organizer can reject with optional reason message
- [ ] Affiliate receives notification of decision via email and in-app
- [ ] Approved affiliates immediately get access to purchase inventory

**Business Rules:**
- Approval/rejection must happen within 48 hours or application auto-expires
- Organizer can set different credit limits per affiliate for pay-later terms
- Once approved, affiliate has 24 hours to claim inventory before allocation expires

---

### Epic: Affiliate Inventory Management

#### US-AFF-006: Affiliate Purchases Inventory (Pay Now)
**As an** approved affiliate
**I want to** purchase ticket inventory at wholesale price
**So that** I can resell tickets

**Acceptance Criteria:**
- [ ] Affiliate sees approved inventory allocation in dashboard
- [ ] Affiliate selects quantity to purchase (up to approved allocation)
- [ ] System shows wholesale price, total cost, and potential revenue at max retail
- [ ] Affiliate enters payment information (card or ACH)
- [ ] System processes payment immediately
- [ ] Upon successful payment, tickets allocated to affiliate's inventory
- [ ] System reduces event's available ticket count
- [ ] Affiliate receives confirmation email with invoice
- [ ] Affiliate can now access unique tracking links

**Business Rules:**
- Payment must clear before inventory is allocated
- Failed payment removes affiliate's inventory allocation
- Affiliate can purchase in multiple transactions up to approved allocation
- Wholesale purchase is non-refundable to affiliate (only returnable per return policy)
- Transaction fees (if any) clearly displayed before payment

---

#### US-AFF-007: Affiliate Claims Inventory (Pay Later - Net 30/60)
**As an** approved affiliate with pay-later terms
**I want to** claim ticket inventory without immediate payment
**So that** I can avoid cash flow issues

**Acceptance Criteria:**
- [ ] Affiliate sees "Pay Later" option if approved for credit terms
- [ ] Affiliate selects quantity to claim (up to credit limit)
- [ ] System shows wholesale price, total amount, and due date (Net 30 or Net 60)
- [ ] Affiliate signs promissory note/agreement electronically
- [ ] System immediately allocates tickets to affiliate's inventory
- [ ] System creates accounts receivable record for organizer
- [ ] Affiliate sees "Amount Owed" and "Due Date" in dashboard
- [ ] System sends payment reminders 7 days before, 1 day before, and on due date

**Business Rules:**
- Credit limit set by organizer on per-affiliate basis
- Affiliate cannot claim more inventory if they have overdue invoices
- Late payments incur 1.5% monthly interest charge
- 30+ days late results in affiliate suspension platform-wide
- Organizer can revoke credit terms at any time for future purchases

---

#### US-AFF-008: Affiliate Returns Unsold Inventory
**As an** affiliate
**I want to** return unsold tickets before the deadline
**So that** I can minimize losses

**Acceptance Criteria:**
- [ ] Affiliate sees "Return Tickets" option in inventory management
- [ ] System shows return deadline (e.g., 48 hours before event)
- [ ] Affiliate selects quantity to return (only unsold tickets)
- [ ] System confirms return and calculates refund amount
- [ ] For "Pay Now" affiliates: Refund processed to original payment method
- [ ] For "Pay Later" affiliates: Amount owed reduced by return value
- [ ] Returned tickets go back to event's general inventory pool
- [ ] Affiliate receives confirmation email

**Business Rules:**
- Returns only allowed before organizer-defined deadline
- Sold tickets cannot be returned (but can be refunded through normal process)
- Return processing fee: 5% of wholesale price (to discourage over-claiming)
- Minimum return quantity: 5 tickets or 10% of claimed inventory (whichever is less)
- Affiliates with >30% return rate across multiple events flagged for review

---

### Epic: Affiliate Sales Process

#### US-AFF-009: Generate Unique Tracking Links
**As an** affiliate
**I want to** get unique tracking links for my inventory
**So that** I can share them and earn credit for sales

**Acceptance Criteria:**
- [ ] System generates unique affiliate code (e.g., AFF-ABC123)
- [ ] Affiliate sees personalized event landing page URL
- [ ] Affiliate can generate short links (e.g., evnt.life/ABC123)
- [ ] Affiliate can create custom UTM parameters for different channels
- [ ] Affiliate can generate QR code for physical marketing
- [ ] System tracks link clicks in real-time
- [ ] Affiliate sees preview of landing page with their branding

**Business Rules:**
- Affiliate code must be unique platform-wide
- Links expire when inventory is depleted or event passes
- Attribution cookie lasts 30 days from first click
- Last-click attribution model (if customer clicks multiple affiliate links)
- Links cannot be shared in prohibited channels (spam, adult content, etc.)

---

#### US-AFF-010: Customer Purchases via Affiliate Link
**As a** ticket buyer
**I want to** purchase tickets through an affiliate link
**So that** I can support my friend/instructor

**Acceptance Criteria:**
- [ ] Customer clicks affiliate link and lands on event page
- [ ] Page shows "Referred by [Affiliate Name]" with profile photo
- [ ] Customer sees ticket price (at or below max retail set by organizer)
- [ ] Affiliate can optionally set custom price between wholesale and max retail
- [ ] Customer completes purchase flow (same as standard checkout)
- [ ] System attributes sale to affiliate via tracking cookie
- [ ] Customer receives standard confirmation email and ticket QR codes
- [ ] Affiliate sees sale appear in real-time dashboard
- [ ] Organizer sees sale with affiliate attribution in their dashboard

**Business Rules:**
- Customer cannot pay more than organizer's max retail price
- If affiliate link is expired/invalid, customer sees regular event page
- Attribution overrides if customer previously clicked different affiliate link
- Customer can use discount codes in combination with affiliate links
- Sale counted against affiliate's inventory allocation
- Payment processed through standard Square integration

---

#### US-AFF-011: Affiliate Sets Custom Pricing
**As an** affiliate
**I want to** set my selling price between wholesale and max retail
**So that** I can optimize for volume or profit

**Acceptance Criteria:**
- [ ] Affiliate navigates to pricing settings for their inventory
- [ ] System shows wholesale cost, max retail allowed, and current selling price
- [ ] Affiliate adjusts selling price with slider or input field
- [ ] System validates price is between wholesale and max retail
- [ ] Affiliate sees estimated margin and potential earnings
- [ ] Price change takes effect immediately for new sales
- [ ] Affiliate can set different prices for different ticket types (if applicable)

**Business Rules:**
- Selling price must be ≥ wholesale price + $0.50 minimum margin
- Selling price must be ≤ organizer's max retail price
- Price changes don't affect in-progress transactions
- Affiliate can change price maximum 3 times per day (to prevent gaming)
- System logs all price changes for audit trail

---

### Epic: Payment & Settlement

#### US-AFF-012: Affiliate Payment Settlement (Immediate Payout)
**As an** affiliate
**I want to** receive payment immediately when I make a sale
**So that** I have predictable cash flow

**Acceptance Criteria:**
- [ ] When customer completes purchase, system calculates affiliate earnings
- [ ] Affiliate earnings = (Selling Price - Wholesale Price) - Platform Fee
- [ ] For "Pay Now" affiliates: Earnings added to available balance immediately
- [ ] For "Pay Later" affiliates: Earnings offset against amount owed first
- [ ] Once affiliate has ≥$25 available balance, payout eligible
- [ ] Affiliate can trigger manual payout or wait for auto-payout (weekly)
- [ ] Payout processed via ACH to affiliate's verified bank account
- [ ] Payout appears in bank account within 3-5 business days
- [ ] Affiliate receives payout confirmation email with breakdown

**Business Rules:**
- Minimum payout threshold: $25
- Platform fee: 3% of affiliate's margin (to cover transaction costs)
- Payouts held if affiliate has open disputes or fraud flags
- Chargebacks deducted from future earnings or available balance
- Tax reporting: 1099-NEC issued for affiliates earning >$600/year (US)

---

#### US-AFF-013: Affiliate Pays Organizer (Pay Later Settlement)
**As an** affiliate with pay-later terms
**I want to** pay my invoice before the due date
**So that** I maintain good standing

**Acceptance Criteria:**
- [ ] Affiliate sees "Invoices Due" in dashboard with amounts and due dates
- [ ] Affiliate can pay full invoice or partial payment
- [ ] System shows total owed, amount paid, and remaining balance
- [ ] Affiliate enters payment method (card or ACH)
- [ ] System processes payment and updates balance immediately
- [ ] Organizer receives notification of payment
- [ ] System generates receipt for affiliate's records
- [ ] If paid in full by due date, affiliate eligible for future credit terms

**Business Rules:**
- Partial payments applied to oldest invoices first
- Late payments (past due date) incur 1.5% monthly interest
- 15 days late: Reminder email + SMS
- 30 days late: Affiliate suspended, cannot claim new inventory
- 60 days late: Debt sent to collections, affiliate banned from platform
- Early payment incentives: 2% discount if paid within 7 days (optional per organizer)

---

#### US-AFF-014: Organizer Receives Settlement
**As an** event organizer
**I want to** receive payment for affiliate sales
**So that** I have cash flow for event expenses

**Acceptance Criteria:**
- [ ] For "Pay Now" affiliates: Organizer receives wholesale price immediately
- [ ] For "Pay Later" affiliates: Organizer receives payment on invoice due date
- [ ] Organizer sees "Affiliate Revenue" broken down by payment status
- [ ] Dashboard shows: Received, Pending (Pay Later), Overdue
- [ ] Organizer can see accounts receivable aging report
- [ ] Organizer can send payment reminders to affiliates with overdue invoices
- [ ] Platform handles collections for 60+ day overdue accounts
- [ ] Settlement deposited to organizer's Square account on standard schedule

**Business Rules:**
- Organizer receives wholesale price only (affiliate's margin stays with affiliate)
- Platform charges organizer standard processing fee (2.9% + $0.30)
- Organizer bears risk of non-payment for pay-later affiliates
- Platform offers optional "Guaranteed Payment" service for 1% fee
- Organizer can opt to sell affiliate debt to platform at 70% value

---

### Epic: Refunds & Cancellations

#### US-AFF-015: Customer Requests Refund for Affiliate-Sold Ticket
**As a** ticket buyer who purchased via affiliate
**I want to** request a refund
**So that** I can get my money back if I can't attend

**Acceptance Criteria:**
- [ ] Customer initiates refund through standard refund process
- [ ] System identifies ticket was sold by affiliate
- [ ] Refund processed to customer per event's refund policy
- [ ] System notifies both organizer and affiliate of refund
- [ ] Wholesale cost clawed back from affiliate's future earnings
- [ ] If affiliate has insufficient balance, creates negative balance
- [ ] Ticket returned to affiliate's inventory if before return deadline
- [ ] Otherwise, ticket marked as refunded and not resellable

**Business Rules:**
- Refund amount to customer is what they paid (affiliate's selling price)
- Affiliate loses their margin (difference between selling price and wholesale)
- Wholesale cost deducted from affiliate's available balance or next payout
- Organizer refunds customer but recovers wholesale cost from affiliate
- If affiliate account negative and inactive >60 days, debt written off
- Refund fees (if any) split between organizer and affiliate proportionally

---

#### US-AFF-016: Event Cancellation - Affiliate Impact
**As an** event organizer
**I want to** cancel an event with active affiliate sales
**So that** I can handle the situation properly

**Acceptance Criteria:**
- [ ] Organizer initiates event cancellation from dashboard
- [ ] System identifies all affiliate-sold tickets
- [ ] System calculates total refunds owed to customers
- [ ] System calculates amounts to recover from affiliates
- [ ] All customers receive full refunds automatically
- [ ] Affiliates receive notification of cancellation
- [ ] For "Pay Now" affiliates: Wholesale cost refunded minus processing fees
- [ ] For "Pay Later" affiliates: Amount owed reduced to $0
- [ ] Affiliates lose earned margin (non-refundable)
- [ ] Organizer sees reconciliation report

**Business Rules:**
- Full refunds to all customers regardless of affiliate terms
- Affiliates forfeit margin earned on all sales
- "Pay Now" affiliates receive wholesale refund minus 5% restocking fee
- "Pay Later" affiliates' debt forgiven in full
- Affiliates with >3 event cancellations within 6 months flagged
- Platform may withhold portion of refund if fraud suspected

---

### Epic: Dashboards & Reporting

#### US-AFF-017: Affiliate Sales Dashboard
**As an** affiliate
**I want to** see my sales performance
**So that** I can track earnings and optimize my efforts

**Acceptance Criteria:**
- [ ] Affiliate sees personalized dashboard with key metrics:
  - Total tickets sold
  - Total revenue generated
  - Total earnings (margin)
  - Available balance for payout
  - Pending payouts
  - Amount owed to organizers (if pay-later)
- [ ] Affiliate sees breakdown by event
- [ ] Affiliate sees sales over time (chart/graph)
- [ ] Affiliate sees conversion rate (clicks → sales)
- [ ] Affiliate sees top-performing marketing channels (UTM tracking)
- [ ] Affiliate can filter by date range
- [ ] Affiliate can export reports as CSV/PDF

**Display Metrics:**
- **Conversion Rate:** (Sales ÷ Link Clicks) × 100
- **Average Ticket Value:** Total Revenue ÷ Tickets Sold
- **Earnings Per Click (EPC):** Total Earnings ÷ Link Clicks
- **Profit Margin %:** (Earnings ÷ Revenue) × 100

---

#### US-AFF-018: Organizer Affiliate Management Dashboard
**As an** event organizer
**I want to** see affiliate performance for my event
**So that** I can identify top performers and optimize my program

**Acceptance Criteria:**
- [ ] Organizer sees affiliate program overview:
  - Total affiliates (approved, pending, rejected)
  - Total tickets sold via affiliates
  - Total affiliate revenue (wholesale)
  - Percentage of event sales from affiliates
- [ ] Organizer sees leaderboard of top-performing affiliates
- [ ] Organizer sees individual affiliate details:
  - Tickets sold, revenue, inventory status
  - Payment status (paid, owed, overdue)
  - Refund rate
  - Customer feedback on affiliate
- [ ] Organizer can compare affiliate performance (side-by-side)
- [ ] Organizer can see accounts receivable aging for pay-later affiliates
- [ ] Organizer can export affiliate sales report

**Business Rules:**
- Real-time data updates every 5 minutes
- Historical data retained for 2 years
- Organizer cannot see affiliate's actual margins (only wholesale revenue)
- Organizer can see affiliate contact info for approved affiliates only

---

#### US-AFF-019: Platform Admin Affiliate Analytics
**As a** platform admin
**I want to** monitor affiliate program health
**So that** I can detect fraud and optimize the platform

**Acceptance Criteria:**
- [ ] Admin sees platform-wide metrics:
  - Total affiliates registered
  - Total events with affiliate programs
  - Total affiliate sales volume
  - Platform revenue from affiliate fees
- [ ] Admin sees fraud detection alerts:
  - Affiliates with high refund rates (>15%)
  - Affiliates with suspicious purchasing patterns
  - Affiliates with multiple declined payments
  - Organizers with high affiliate rejection rates
- [ ] Admin can search/filter affiliates by status, performance, flags
- [ ] Admin can manually suspend or ban affiliates
- [ ] Admin can see tax reporting summary (1099 generation)
- [ ] Admin can see payout reconciliation report

**Fraud Detection Triggers:**
- Refund rate >20% (yellow flag), >35% (red flag)
- Same IP/device purchasing through multiple affiliate links
- Affiliate self-purchasing through own links
- Payment failures >3 in 30 days
- Customer complaints about affiliate >2

---

### Epic: Marketing & Promotional Tools

#### US-AFF-020: Affiliate Marketing Asset Library
**As an** affiliate
**I want to** access marketing materials provided by the organizer
**So that** I can promote the event effectively

**Acceptance Criteria:**
- [ ] Organizer can upload marketing assets (images, videos, copy)
- [ ] Affiliate can browse asset library for events they're approved for
- [ ] Affiliate can download assets with one click
- [ ] Assets automatically include affiliate tracking link
- [ ] Pre-sized graphics for social media platforms (IG, FB, Twitter, TikTok)
- [ ] Email templates with editable sections
- [ ] Sample social media post copy with hashtags
- [ ] Affiliate can preview assets before downloading

**Business Rules:**
- Assets respect organizer's brand guidelines
- Affiliate cannot modify organizer's logos or core branding
- Assets include disclaimer "Ticket reseller - prices may vary"
- Organizer can revoke access to assets if misused
- Asset library optional - organizer can skip if not providing materials

---

#### US-AFF-021: Promotional Discount Codes for Affiliates
**As an** event organizer
**I want to** create affiliate-specific discount codes
**So that** I can incentivize early sales or reward top performers

**Acceptance Criteria:**
- [ ] Organizer creates promo code tied to specific affiliate
- [ ] Discount applies on top of affiliate's selling price (organizer absorbs discount)
- [ ] Affiliate sees available promo codes in dashboard
- [ ] Affiliate can share promo code with tracking link
- [ ] Customer applies code at checkout, sees discount
- [ ] System tracks promo code usage and attributes to affiliate
- [ ] Organizer sets code expiration date and usage limits

**Business Rules:**
- Discount reduces organizer's wholesale revenue, not affiliate's margin
- Affiliate cannot create their own codes (only organizer)
- Codes stackable with affiliate pricing (unless organizer disallows)
- Codes tracked separately in reporting

---

### Epic: Notifications & Communication

#### US-AFF-022: Affiliate Notification System
**As an** affiliate
**I want to** receive timely notifications about my sales and account
**So that** I stay informed

**Notification Types:**
1. **Application Status:** Approved, rejected, or pending review
2. **Sale Notification:** Real-time alert when ticket sold via your link
3. **Payment Reminders:** Invoice due soon, invoice overdue
4. **Payout Confirmation:** Payout processed successfully
5. **Inventory Alerts:** Running low on inventory, allocation expiring
6. **Event Updates:** Event canceled, rescheduled, or details changed
7. **Return Deadline:** Approaching deadline to return unsold tickets
8. **Performance Milestones:** Reached sales goals, bonuses unlocked

**Delivery Channels:**
- [ ] In-app notifications (bell icon with badge count)
- [ ] Email (configurable per notification type)
- [ ] SMS for critical alerts (payment overdue, event canceled)
- [ ] Push notifications (future: mobile app)

**User Control:**
- Affiliate can configure notification preferences
- Can opt out of non-critical notifications
- Cannot opt out of legal/compliance notifications

---

#### US-AFF-023: Organizer-Affiliate Messaging
**As an** event organizer
**I want to** message my affiliates directly
**So that** I can provide updates and support

**Acceptance Criteria:**
- [ ] Organizer can send broadcast message to all affiliates for an event
- [ ] Organizer can send message to individual affiliate
- [ ] Organizer can filter and message affiliate segments (e.g., top performers)
- [ ] Messages appear in recipient's dashboard inbox
- [ ] Email copy sent to recipient's registered email
- [ ] Affiliates can reply to organizer messages
- [ ] Message history retained for reference

**Business Rules:**
- No spam or promotional content unrelated to the event
- Messages logged and available to platform admin for dispute resolution
- Organizer cannot message affiliates they've rejected (privacy protection)
- Rate limit: 10 broadcast messages per event

---

## 3. Feature Specifications

### 3.1 Affiliate Registration & Profile

**Affiliate Profile Data Model:**
```typescript
interface AffiliateProfile {
  id: string; // UUID
  userId: string; // Links to User account
  status: 'active' | 'suspended' | 'banned';

  // Personal Info
  firstName: string;
  lastName: string;
  displayName: string; // Public facing
  email: string; // Verified
  phone: string; // Verified
  profilePhoto: string | null; // URL
  coverImage: string | null; // URL
  bio: string; // Max 500 chars

  // Social Media
  instagramHandle?: string;
  facebookUrl?: string;
  tiktokHandle?: string;
  websiteUrl?: string;

  // Payment Info
  bankAccountId: string; // Encrypted, linked to payment processor
  taxIdType: 'SSN' | 'EIN' | 'ITIN' | 'VAT' | 'Other';
  taxId: string; // Encrypted
  taxIdVerified: boolean;

  // Performance Metrics
  totalSales: number; // All-time tickets sold
  totalRevenue: number; // All-time gross revenue
  totalEarnings: number; // All-time net earnings
  averageRefundRate: number; // Percentage
  rating: number; // 1-5 stars (from organizer feedback)
  reviewCount: number;

  // Reputation Flags
  fraudFlags: string[]; // Array of flag reasons
  chargebackCount: number;
  overdueInvoiceCount: number;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
  termsAcceptedAt: Date;
  termsVersion: string;
}
```

**Verification Requirements:**
- **Email Verification:** 6-digit code sent to email, must verify within 24 hours
- **Phone Verification:** SMS code, required for account activation
- **Identity Verification (KYC):** Required for affiliates expecting >$600/year earnings (US)
  - Driver's license or government ID upload
  - Stripe Identity or Persona for verification
- **Bank Account Verification:** Plaid instant verification or micro-deposit confirmation
- **Tax Information:** W-9 form (US) or W-8BEN (international), collected via HelloSign/DocuSign

**Profile Completion Requirements:**
- Minimum 80% complete to apply for events
- Required fields: Name, Email (verified), Phone (verified), Payment method, Tax info
- Optional but recommended: Profile photo, Bio, Social media links

---

### 3.2 Affiliate Application & Approval

**Application Data Model:**
```typescript
interface AffiliateApplication {
  id: string;
  affiliateId: string;
  eventId: string;
  organizerId: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';

  // Application Details
  requestedInventory: number; // Number of tickets
  requestedPaymentTerms: 'pay_now' | 'net_30' | 'net_60';
  message: string; // Optional message to organizer
  customAnswers: {
    questionId: string;
    question: string;
    answer: string;
  }[];

  // Organizer Decision
  approvedInventory?: number; // May be less than requested
  approvedPaymentTerms?: 'pay_now' | 'net_30' | 'net_60';
  approvedCreditLimit?: number; // For pay-later terms
  rejectionReason?: string;

  // Timestamps
  appliedAt: Date;
  reviewedAt?: Date;
  expiresAt: Date; // 48 hours from appliedAt if not reviewed

  // Metadata
  affiliateRatingAtApplication: number;
  affiliateTotalSalesAtApplication: number;
}
```

**Application Workflow:**
1. Affiliate submits application with requested inventory and payment terms
2. Organizer receives notification (email + in-app)
3. Organizer reviews within 48 hours or application auto-expires
4. Organizer approves (with full or partial allocation) or rejects
5. Affiliate receives notification of decision
6. If approved, affiliate has 24 hours to claim inventory before allocation expires
7. Claimed inventory locked to affiliate until sold, returned, or event passes

**Auto-Approval Logic (If Enabled by Organizer):**
- Affiliate must have:
  - ≥4.0 star rating
  - ≥10 tickets sold historically
  - <10% refund rate
  - No fraud flags
  - No overdue invoices
- Only applies for "Pay Now" payment terms
- Auto-approve capped at 50% of organizer's per-affiliate inventory limit

---

### 3.3 Inventory Management

**Affiliate Inventory Data Model:**
```typescript
interface AffiliateInventory {
  id: string;
  affiliateId: string;
  eventId: string;
  ticketTypeId: string;
  organizerId: string;

  // Inventory Details
  wholesalePrice: number; // Price affiliate pays per ticket
  maxRetailPrice: number; // Maximum price affiliate can charge customer
  currentSellingPrice: number; // Affiliate's chosen selling price

  // Quantities
  allocatedQuantity: number; // Total tickets allocated to affiliate
  soldQuantity: number; // Tickets successfully sold
  availableQuantity: number; // Allocated - Sold - Returned
  returnedQuantity: number; // Tickets returned to general pool

  // Payment Terms
  paymentTerms: 'pay_now' | 'net_30' | 'net_60';
  paymentStatus: 'paid' | 'pending' | 'overdue';
  amountOwed: number; // For pay-later terms
  dueDate?: Date; // For pay-later terms

  // Return Policy
  returnDeadline: Date; // Set by organizer
  returnFeePercentage: number; // Default 5%

  // Tracking
  affiliateCode: string; // Unique code for this affiliate-event combo
  trackingUrl: string; // Full URL with tracking params
  shortUrl: string; // Shortened URL (e.g., evnt.life/ABC123)
  qrCodeUrl: string; // URL to downloadable QR code image

  // Metadata
  createdAt: Date;
  expiresAt: Date; // Event end date + 7 days for reconciliation
}
```

**Inventory Allocation Logic:**
- When affiliate approved and claims inventory:
  1. Reduce event's `availableTickets` count by allocated quantity
  2. Create `AffiliateInventory` record
  3. Generate unique `affiliateCode` and tracking URLs
  4. If "Pay Now": Process payment before allocation
  5. If "Pay Later": Create invoice and accounts receivable entry

**Inventory Return Logic:**
- Affiliate can return unsold tickets before `returnDeadline`
- Return fee: 5% of wholesale price per ticket (configurable by organizer)
- Returned tickets:
  - If "Pay Now": Refund = (Wholesale Price × Quantity) - Return Fee
  - If "Pay Later": Reduce `amountOwed` by (Wholesale Price × Quantity) - Return Fee
- Returned inventory goes back to event's general pool
- Minimum return quantity: Lesser of 5 tickets or 10% of allocated inventory

---

### 3.4 Tracking & Attribution

**Tracking Link Structure:**
```
https://events.stepperslife.com/events/[eventId]?aff=[affiliateCode]&utm_source=affiliate&utm_medium=[medium]&utm_campaign=[campaign]
```

**Short URL Structure:**
```
https://evnt.life/[shortCode]
```

**Tracking Data Model:**
```typescript
interface AffiliateTracking {
  id: string;
  affiliateInventoryId: string;
  affiliateId: string;
  eventId: string;

  // Visitor Data
  visitorId: string; // Fingerprint or cookie ID
  ipAddress: string; // Anonymized for privacy
  userAgent: string;
  referrer: string;

  // Attribution Data
  clickedAt: Date;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;

  // Conversion Data
  convertedAt?: Date; // Date of purchase
  orderId?: string; // If converted
  ticketQuantity?: number;
  saleAmount?: number;
  affiliateEarning?: number;

  // Device & Location
  device: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
  country: string;
  region: string;
  city: string;
}
```

**Attribution Rules:**
- **Cookie Duration:** 30 days from initial click
- **Attribution Model:** Last-click (most recent affiliate link before purchase)
- **Cross-Device:** Not supported in MVP (future enhancement)
- **Self-Purchase Prevention:** Block affiliate from purchasing through own link
- **Link Override:** If customer clicks multiple affiliate links, last one wins

**Click Tracking:**
- Logged asynchronously (non-blocking)
- Click data stored for 90 days
- Aggregate metrics calculated nightly (for performance)

**Conversion Tracking:**
- When order completed, system checks for attribution cookie
- If valid affiliate cookie found:
  1. Link order to affiliate
  2. Deduct from affiliate's available inventory
  3. Calculate affiliate earnings
  4. Create payout record
  5. Send real-time notification to affiliate

---

### 3.5 Pricing & Margin Calculation

**Pricing Business Rules:**
1. **Wholesale Price:**
   - Set by organizer per ticket type
   - Must be ≥$5 and ≤(Max Retail - $1)
   - Cannot be changed after affiliates have claimed inventory

2. **Max Retail Price:**
   - Set by organizer per ticket type
   - Must be ≤ event's public ticket price
   - Must be ≥(Wholesale Price + $1)
   - Can be changed by organizer, affects new sales only

3. **Affiliate Selling Price:**
   - Set by affiliate between (Wholesale + $0.50) and Max Retail
   - Can be changed up to 3 times per day
   - Changes apply to new sales immediately
   - Default: Max Retail Price (maximize margin)

**Margin Calculation:**
```typescript
// Gross Margin
grossMargin = sellingPrice - wholesalePrice;

// Platform Fee (charged to affiliate)
platformFee = grossMargin * 0.03; // 3% of margin

// Net Earnings
netEarnings = grossMargin - platformFee;
```

**Example Scenarios:**

**Scenario 1: Pay Now, Full Price**
- Wholesale: $50
- Max Retail: $100
- Affiliate Selling Price: $100
- Gross Margin: $50
- Platform Fee: $1.50
- Net Earnings: $48.50

**Scenario 2: Pay Later, Discounted Price**
- Wholesale: $50
- Max Retail: $100
- Affiliate Selling Price: $75
- Gross Margin: $25
- Platform Fee: $0.75
- Net Earnings: $24.25

**Fee Structure:**
- **Platform Fee:** 3% of affiliate's gross margin
- **Payment Processing Fee:** Paid by customer (2.9% + $0.30, standard Square rates)
- **Return Fee:** 5% of wholesale price (for returned inventory)
- **Late Payment Interest:** 1.5% per month on overdue invoices

---

### 3.6 Payment Processing & Settlement

**Payment Flows:**

**Flow 1: Pay Now Affiliate + Customer Purchase**
1. Customer completes checkout at affiliate's selling price
2. Square processes payment from customer
3. Platform receives full payment (selling price + processing fee)
4. System calculates affiliate net earnings
5. Affiliate earnings added to available balance immediately
6. Wholesale amount transferred to organizer (standard settlement)
7. Platform retains platform fee

**Flow 2: Pay Later Affiliate + Customer Purchase**
1. Customer completes checkout at affiliate's selling price
2. Square processes payment from customer
3. Platform receives full payment
4. System calculates affiliate net earnings
5. If affiliate has outstanding invoice:
   - Deduct wholesale cost from affiliate earnings
   - Remainder added to affiliate available balance
   - Update invoice balance
6. If no outstanding invoice:
   - Full earnings added to affiliate available balance
7. Wholesale amount transferred to organizer
8. Platform retains platform fee

**Flow 3: Affiliate Pays Invoice (Pay Later)**
1. Affiliate initiates payment from dashboard
2. Affiliate enters payment amount (full or partial)
3. Square processes payment from affiliate's card/bank
4. Payment applied to oldest invoice first
5. Invoice status updated (paid, partially paid, pending)
6. Wholesale amount transferred to organizer
7. Affiliate receives receipt

**Payout Schedule:**
- **Immediate Payout:** Available when balance ≥$25 (affiliate-initiated)
- **Auto-Payout:** Weekly on Fridays for balances ≥$25
- **Payout Method:** ACH bank transfer (3-5 business days)
- **Payout Holding:** 7-day hold for first 3 payouts (fraud prevention)

**Settlement Data Model:**
```typescript
interface AffiliatePayout {
  id: string;
  affiliateId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';

  // Amount Details
  amount: number; // Net payout amount
  currency: 'USD';

  // Related Transactions
  orderIds: string[]; // Orders included in this payout
  totalGrossEarnings: number;
  totalPlatformFees: number;
  totalRefunds: number; // Deducted from payout

  // Payment Details
  paymentMethod: 'ach' | 'wire' | 'paypal';
  bankAccountId: string;
  externalPaymentId?: string; // From payment processor

  // Timestamps
  requestedAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  failureReason?: string;

  // Metadata
  createdAt: Date;
}
```

---

### 3.7 Refund Handling

**Refund Scenarios:**

**Scenario 1: Customer Refund (Before Event)**
1. Customer requests refund via standard process
2. System identifies ticket was sold by affiliate
3. Refund approved per event's refund policy
4. Customer receives full refund (selling price)
5. Affiliate's gross margin deducted from available balance
6. Wholesale cost clawed back from organizer's settlement
7. If affiliate balance negative, added to "owed" amount
8. Ticket returned to affiliate inventory if before return deadline

**Scenario 2: Event Cancellation**
1. Organizer cancels event
2. System identifies all affiliate-sold tickets
3. All customers refunded automatically (full selling price)
4. For "Pay Now" affiliates:
   - Wholesale cost refunded minus 5% restocking fee
   - Margin forfeited (non-refundable)
5. For "Pay Later" affiliates:
   - Outstanding invoices reduced to $0
   - Margin forfeited
6. Inventory allocations cancelled
7. Reconciliation report generated for all parties

**Scenario 3: Chargeback on Affiliate Sale**
1. Customer files chargeback with bank
2. Square notifies platform of chargeback
3. Chargeback amount + $15 fee deducted from organizer's settlement
4. Platform claws back affiliate's margin from available balance
5. Wholesale cost recovered from organizer (already deducted)
6. Affiliate's chargeback count incremented
7. If affiliate has ≥3 chargebacks in 6 months, account flagged for review

**Refund Data Model:**
```typescript
interface AffiliateRefund {
  id: string;
  orderId: string;
  affiliateId: string;
  eventId: string;
  organizerId: string;

  // Refund Details
  refundType: 'customer_request' | 'event_cancellation' | 'chargeback';
  refundAmount: number; // Amount refunded to customer
  affiliateMarginClawback: number; // Deducted from affiliate
  wholesaleRecovery: number; // Recovered from organizer

  // Status
  status: 'pending' | 'completed' | 'failed';
  processedAt?: Date;

  // Impact
  affiliateBalanceAdjustment: number; // Negative number
  organizerBalanceAdjustment: number; // Negative number

  // Metadata
  initiatedBy: string; // User ID who initiated
  reason: string;
  createdAt: Date;
}
```

---

## 4. Business Rules & Logic

### 4.1 Inventory Management Rules

| Rule | Description | Enforcement |
|------|-------------|-------------|
| **Allocation Limit** | Organizer sets max tickets per affiliate | System validates at application time |
| **Inventory Reservation** | Allocated tickets reduce event's available count | Atomic transaction when inventory claimed |
| **Expiration** | Unclaimed allocation expires after 24 hours | Cron job runs hourly to expire allocations |
| **Return Deadline** | Returns only allowed before organizer-defined deadline | UI blocks returns after deadline |
| **Minimum Return** | Lesser of 5 tickets or 10% of allocation | Validation at return submission |
| **Return Fee** | 5% of wholesale price per ticket (configurable) | Calculated at return time |
| **Over-Allocation Prevention** | Cannot allocate more than event capacity | Lock at event level during allocation |

---

### 4.2 Pricing & Discount Rules

| Rule | Description | Enforcement |
|------|-------------|-------------|
| **Wholesale Floor** | Wholesale price ≥$5 | Validation when organizer sets pricing |
| **Wholesale Ceiling** | Wholesale price ≤(Max Retail - $1) | Validation when organizer sets pricing |
| **Selling Price Range** | (Wholesale + $0.50) ≤ Selling Price ≤ Max Retail | Validation when affiliate sets price |
| **Price Change Limit** | Affiliate can change price max 3x per day | Rate limiting in API |
| **Price Change Scope** | Price changes apply to new sales only | No retroactive price adjustments |
| **Discount Code Stacking** | Affiliate links + promo codes allowed unless organizer blocks | Configurable per event |
| **Dynamic Pricing** | Not allowed in MVP (future feature) | N/A |

---

### 4.3 Payment & Credit Rules

| Rule | Description | Enforcement |
|------|-------------|-------------|
| **Credit Eligibility** | Organizer manually approves per affiliate | Organizer sets credit limit during application review |
| **Credit Limit** | Max amount affiliate can owe at any time | System validates before allowing inventory claim |
| **Payment Terms** | Net 30 or Net 60 from claim date | Due date calculated at claim time |
| **Late Payment Interest** | 1.5% per month on overdue balance | Applied automatically via nightly cron job |
| **Suspension Threshold** | 30 days overdue = account suspended | Automated suspension via cron job |
| **Ban Threshold** | 60 days overdue = sent to collections, account banned | Automated escalation |
| **Early Payment Discount** | Optional 2% discount if paid within 7 days | Configurable by organizer |
| **Earnings Offset** | Earnings offset against owed amount first | Automatic when customer purchase processed |

---

### 4.4 Payout Rules

| Rule | Description | Enforcement |
|------|-------------|-------------|
| **Minimum Payout** | $25 threshold | UI blocks payout requests below threshold |
| **Payout Holding Period** | 7-day hold on first 3 payouts | System checks payout count before processing |
| **Dispute Hold** | Payouts paused if open disputes or fraud flags | Automated check before payout |
| **Negative Balance Block** | Cannot request payout with negative balance | Validation at payout request |
| **Auto-Payout Schedule** | Weekly on Fridays for balances ≥$25 | Cron job every Friday at 12pm ET |
| **Payout Method** | ACH bank transfer only (MVP) | Limited to verified bank accounts |

---

### 4.5 Refund & Cancellation Rules

| Rule | Description | Enforcement |
|------|-------------|-------------|
| **Customer Refund Policy** | Follows event's standard refund policy | Same rules as non-affiliate sales |
| **Margin Forfeiture** | Affiliate forfeits margin on all refunds | Automatic clawback from balance |
| **Wholesale Recovery** | Organizer's wholesale amount refunded (minus fees) | Automatic adjustment to organizer settlement |
| **Event Cancellation** | All tickets refunded, affiliates lose margin | Automated bulk refund process |
| **Restocking Fee** | 5% on wholesale refunds for event cancellation | Applied to "Pay Now" affiliates only |
| **Pay-Later Debt Forgiveness** | Outstanding invoices forgiven on event cancellation | Automatic write-off |
| **Chargeback Penalty** | $15 fee + margin clawback | Deducted from affiliate balance |

---

### 4.6 Fraud Prevention Rules

| Rule | Description | Enforcement |
|------|-------------|-------------|
| **Self-Purchase Block** | Affiliates cannot buy through own link | IP/cookie/fingerprint detection |
| **Refund Rate Threshold** | >15% refund rate = yellow flag, >35% = red flag | Automated flagging via nightly analytics |
| **Chargeback Threshold** | ≥3 chargebacks in 6 months = review | Automated review queue |
| **Return Rate Threshold** | >30% return rate across events = flag | Automated flagging |
| **Payment Failure Threshold** | >3 payment failures in 30 days = suspension | Automated suspension |
| **Application Spam Prevention** | Max 1 application per event per affiliate | Database unique constraint |
| **Link Sharing Restrictions** | Links cannot be shared in spam/adult content | Manual review on complaint |
| **Velocity Checks** | Max 10 applications per day per affiliate | Rate limiting |

---

## 5. Data Model Overview

### 5.1 Core Entities

```typescript
// Affiliate Profile
AffiliateProfile {
  id, userId, status, personalInfo, paymentInfo, metrics, flags
}

// Affiliate Application
AffiliateApplication {
  id, affiliateId, eventId, status, requestedInventory,
  approvedInventory, paymentTerms, dates
}

// Affiliate Inventory
AffiliateInventory {
  id, affiliateId, eventId, ticketTypeId, pricing,
  quantities, paymentTerms, tracking, dates
}

// Affiliate Sale (extends Order)
AffiliateSale {
  orderId, affiliateId, affiliateInventoryId,
  affiliateEarning, attributionData
}

// Affiliate Payout
AffiliatePayout {
  id, affiliateId, amount, orderIds, status,
  paymentMethod, dates
}

// Affiliate Invoice (for Pay-Later)
AffiliateInvoice {
  id, affiliateId, eventId, amountDue, dueDate,
  status, payments, dates
}

// Affiliate Tracking
AffiliateTracking {
  id, affiliateInventoryId, visitorId, clickData,
  conversionData, attribution
}

// Affiliate Refund
AffiliateRefund {
  id, orderId, affiliateId, refundType, amounts,
  status, dates
}
```

### 5.2 Database Schema Extensions

**New Tables:**
1. `affiliate_profiles` - Affiliate account data
2. `affiliate_applications` - Applications to sell for events
3. `affiliate_inventory` - Inventory allocations per affiliate-event
4. `affiliate_sales` - Links orders to affiliates
5. `affiliate_payouts` - Payout transactions
6. `affiliate_invoices` - Pay-later invoices
7. `affiliate_invoice_payments` - Payments on invoices
8. `affiliate_tracking` - Click and conversion tracking
9. `affiliate_refunds` - Refund transactions
10. `affiliate_marketing_assets` - Organizer-provided marketing materials

**Modified Tables:**
1. `events` - Add fields:
   - `affiliateProgramEnabled: boolean`
   - `affiliateWholesalePrice: number`
   - `affiliateMaxRetailPrice: number`
   - `affiliatePaymentTerms: string[]`
   - `affiliateInventoryLimit: number`
   - `affiliateReturnDeadline: Date`
   - `affiliateAutoApprove: boolean`

2. `orders` - Add fields:
   - `affiliateId?: string`
   - `affiliateInventoryId?: string`
   - `affiliateEarning?: number`
   - `isAffiliateSale: boolean`

3. `tickets` - Add fields:
   - `affiliateId?: string`
   - `soldViaAffiliate: boolean`

---

### 5.3 Relationships

```
User 1:1 AffiliateProfile
AffiliateProfile 1:N AffiliateApplication
AffiliateProfile 1:N AffiliateInventory
AffiliateProfile 1:N AffiliatePayout
AffiliateProfile 1:N AffiliateInvoice

Event 1:N AffiliateApplication
Event 1:N AffiliateInventory

AffiliateInventory 1:N AffiliateSale
AffiliateInventory 1:N AffiliateTracking

Order 1:1 AffiliateSale (optional)
Order 1:1 AffiliateRefund (optional)

AffiliateInvoice 1:N AffiliateInvoicePayment
```

---

## 6. User Flows

### 6.1 Affiliate Onboarding Flow

```
1. User clicks "Become an Affiliate" on event page
2. User redirected to registration page
3. User completes profile:
   - Personal info (name, email, phone)
   - Social media links
   - Bio
4. User verifies email (6-digit code)
5. User verifies phone (SMS code)
6. User adds payment info:
   - Bank account via Plaid
   - Tax information (W-9)
7. System verifies identity (Stripe Identity)
8. Profile created, status: "active"
9. User can now apply to sell for events
```

---

### 6.2 Affiliate Application & Approval Flow

```
1. Affiliate browses events with affiliate programs
2. Affiliate clicks "Apply to Sell" on event page
3. Affiliate sees application form:
   - Wholesale price, max retail, margin
   - Payment terms available
   - Inventory limit
4. Affiliate enters:
   - Requested inventory quantity
   - Preferred payment terms
   - Message to organizer (optional)
   - Answers to custom questions
5. Affiliate submits application
6. System notifies organizer (email + in-app)
7. Organizer reviews application:
   - Views affiliate profile, ratings, history
   - Approves with full/partial inventory
   - Or rejects with reason
8. System notifies affiliate of decision
9. If approved, affiliate has 24 hours to claim inventory
```

---

### 6.3 Inventory Purchase Flow (Pay Now)

```
1. Affiliate navigates to "My Events" dashboard
2. Affiliate clicks "Claim Inventory" for approved event
3. System shows:
   - Approved quantity
   - Wholesale price per ticket
   - Total cost
   - Potential revenue at max retail
4. Affiliate confirms quantity to purchase
5. Affiliate enters payment method (card or ACH)
6. System processes payment via Square
7. If successful:
   - Inventory allocated to affiliate
   - Event's available tickets reduced
   - Tracking links generated
   - Confirmation email sent
8. Affiliate can now share tracking links
```

---

### 6.4 Inventory Claim Flow (Pay Later)

```
1. Affiliate navigates to "My Events" dashboard
2. Affiliate clicks "Claim Inventory" for approved event
3. System shows:
   - Approved quantity
   - Wholesale price per ticket
   - Payment terms (Net 30 or Net 60)
   - Due date
4. Affiliate reviews and signs agreement electronically
5. System immediately:
   - Allocates inventory to affiliate
   - Creates invoice with due date
   - Generates tracking links
   - Sends confirmation email
6. Affiliate sees "Amount Owed" and "Due Date" in dashboard
7. Affiliate can share tracking links immediately
```

---

### 6.5 Customer Purchase via Affiliate Link Flow

```
1. Customer clicks affiliate's tracking link
2. System sets attribution cookie (30-day expiration)
3. Customer lands on event page with affiliate badge
4. Customer sees ticket price (affiliate's selling price)
5. Customer adds tickets to cart
6. Customer proceeds to checkout
7. System applies affiliate attribution to order
8. Customer completes payment via Square
9. System:
   - Creates order
   - Generates tickets with QR codes
   - Attributes sale to affiliate
   - Deducts from affiliate's inventory
   - Calculates affiliate earnings
   - Adds earnings to affiliate balance
   - Sends confirmation to customer
   - Notifies affiliate of sale (real-time)
10. Customer receives tickets via email
11. Affiliate sees sale in dashboard
```

---

### 6.6 Affiliate Payout Flow

```
1. Affiliate navigates to "Payouts" in dashboard
2. Affiliate sees available balance: $127.50
3. Affiliate clicks "Request Payout"
4. System shows:
   - Available balance
   - Breakdown of earnings
   - Payout method (ACH to bank account)
   - Estimated arrival (3-5 business days)
5. Affiliate confirms payout request
6. System:
   - Creates payout record
   - Initiates ACH transfer via Square
   - Updates balance to $0
   - Sends confirmation email
7. Payout status: "Processing"
8. After 3-5 days:
   - Funds arrive in affiliate's bank account
   - Payout status: "Completed"
   - Affiliate receives completion email
```

---

### 6.7 Refund Flow (Affiliate Sale)

```
1. Customer requests refund via standard process
2. Organizer approves refund
3. System identifies order was affiliate sale
4. System:
   - Refunds customer (full selling price)
   - Calculates affiliate margin clawback
   - Deducts margin from affiliate balance
   - If balance negative, creates debt
   - Returns ticket to affiliate inventory (if before return deadline)
   - Adjusts organizer's settlement
   - Creates refund record
5. System notifies:
   - Customer: Refund processed
   - Affiliate: Sale refunded, margin deducted
   - Organizer: Refund issued, settlement adjusted
6. Affiliate sees:
   - Refunded sale in dashboard
   - Balance adjustment
```

---

## 7. Security & Fraud Prevention

### 7.1 Identity Verification

**Affiliate Verification Requirements:**
1. **Email Verification:** Required for all affiliates
   - 6-digit code sent via email
   - Must verify within 24 hours
   - Re-verification required if email changed

2. **Phone Verification:** Required for all affiliates
   - SMS code to mobile number
   - Required before first inventory claim
   - Re-verification if phone changed

3. **Identity Verification (KYC):** Required for affiliates expecting >$600/year
   - Driver's license or passport upload
   - Selfie verification
   - Stripe Identity or Persona integration
   - Manual review for flagged cases

4. **Bank Account Verification:** Required for payouts
   - Plaid instant verification (preferred)
   - Or micro-deposit verification (2-3 business days)
   - Account ownership must match affiliate name

5. **Tax Information:** Required for US affiliates expecting >$600/year
   - W-9 form for US citizens/residents
   - W-8BEN for international affiliates
   - Collected via HelloSign/DocuSign integration
   - Validated against IRS database

---

### 7.2 Fraud Detection

**Real-Time Fraud Checks:**

1. **Self-Purchase Detection:**
   - Check if purchaser's IP matches affiliate's IP
   - Check if purchaser's device fingerprint matches affiliate's
   - Check if purchaser's email/phone matches affiliate's
   - Block transaction if match detected, notify admin

2. **Link Sharing Abuse:**
   - Monitor for spam link sharing (>100 links/hour)
   - Detect link sharing in prohibited channels (automated scraping)
   - Block affiliate account if detected

3. **Velocity Checks:**
   - Max 10 applications per day per affiliate
   - Max 50 tracking link generations per day per affiliate
   - Max 3 price changes per day per affiliate
   - Rate limiting with backoff

4. **Payment Fraud:**
   - Check for repeated payment failures (>3 in 30 days)
   - Check for chargebacks (≥3 in 6 months = flag)
   - Check for suspicious payment patterns (e.g., same card used by multiple affiliates)

**Batch Fraud Detection (Nightly Jobs):**

1. **Refund Rate Analysis:**
   - Calculate refund rate per affiliate
   - Yellow flag: >15% refund rate
   - Red flag: >35% refund rate
   - Auto-suspend: >50% refund rate

2. **Return Rate Analysis:**
   - Calculate return rate per affiliate
   - Flag: >30% return rate across multiple events
   - Review: Pattern of claiming max inventory then returning

3. **Performance Anomalies:**
   - Detect affiliates with unusually high conversion rates (>50%)
   - Detect affiliates with no refunds/returns (suspicious)
   - Manual review for outliers

4. **Collusion Detection:**
   - Check for affiliates sharing bank accounts
   - Check for affiliates with same IP/device
   - Check for circular referrals between affiliates

**Fraud Response Actions:**
1. **Yellow Flag:** Manual review queue, no immediate action
2. **Red Flag:** Account flagged, payout hold, manual review required
3. **Auto-Suspend:** Account suspended, cannot claim new inventory, payouts held
4. **Ban:** Account permanently banned, outstanding balance collection initiated

---

### 7.3 Data Security

**PII Protection:**
- Affiliate tax IDs encrypted at rest (AES-256)
- Bank account details encrypted and tokenized
- PCI-DSS compliance for payment data
- HTTPS/TLS for all data in transit
- Role-based access control for admin access to PII

**Attribution Security:**
- Affiliate codes cryptographically generated (collision-resistant)
- Tracking cookies HttpOnly, Secure, SameSite=Lax
- Attribution data anonymized after 90 days
- IP addresses hashed for privacy compliance

**API Security:**
- Rate limiting on all affiliate endpoints
- JWT authentication for affiliate API access
- API key rotation every 90 days
- Audit logging for all sensitive actions

---

### 7.4 Compliance

**Tax Compliance:**
- 1099-NEC issued to US affiliates earning >$600/year
- Tax forms generated and filed by January 31
- Affiliates can download tax forms from dashboard year-round
- International tax forms (W-8BEN) collected and stored

**GDPR Compliance:**
- Affiliate data export available on request
- Account deletion supported (soft delete with retention policy)
- Cookie consent for tracking links (EU visitors)
- Data retention: 7 years for tax records, 2 years for performance data

**AML/KYC Compliance:**
- Affiliates flagged if earning >$10,000/month
- Enhanced due diligence for high-volume affiliates
- Transaction monitoring for suspicious patterns
- SAR filing if fraud detected

**Payment Compliance:**
- PCI-DSS Level 1 compliance (via Square)
- No storage of raw card data
- Tokenization for all payment methods
- Strong Customer Authentication (SCA) for EU

---

## 8. Technical Requirements

### 8.1 Backend Requirements

**New API Endpoints:**

```
// Affiliate Management
POST   /api/affiliates/register
GET    /api/affiliates/profile
PATCH  /api/affiliates/profile
POST   /api/affiliates/verify-email
POST   /api/affiliates/verify-phone
POST   /api/affiliates/add-payment-method

// Applications
POST   /api/affiliates/applications
GET    /api/affiliates/applications/:id
GET    /api/affiliates/my-applications
PATCH  /api/organizers/applications/:id/approve
PATCH  /api/organizers/applications/:id/reject

// Inventory
POST   /api/affiliates/inventory/claim
GET    /api/affiliates/inventory
PATCH  /api/affiliates/inventory/:id/pricing
POST   /api/affiliates/inventory/:id/return

// Tracking
POST   /api/affiliates/tracking/click
GET    /api/affiliates/tracking/stats
POST   /api/affiliates/tracking/generate-link

// Sales & Orders
GET    /api/affiliates/sales
GET    /api/affiliates/earnings
GET    /api/organizers/events/:eventId/affiliate-sales

// Payouts
POST   /api/affiliates/payouts/request
GET    /api/affiliates/payouts
GET    /api/affiliates/balance

// Invoices (Pay-Later)
GET    /api/affiliates/invoices
POST   /api/affiliates/invoices/:id/pay

// Admin
GET    /api/admin/affiliates
PATCH  /api/admin/affiliates/:id/suspend
PATCH  /api/admin/affiliates/:id/ban
GET    /api/admin/affiliates/fraud-queue
```

**Background Jobs (Cron):**
1. **Expire Applications:** Hourly, expire applications >48 hours old
2. **Expire Inventory Allocations:** Hourly, expire unclaimed allocations >24 hours
3. **Calculate Metrics:** Nightly at 2am, recalculate affiliate performance metrics
4. **Fraud Detection:** Nightly at 3am, run fraud detection algorithms
5. **Auto-Payouts:** Weekly on Fridays at 12pm ET, process auto-payouts
6. **Invoice Reminders:** Daily at 9am, send payment reminders
7. **Late Payment Interest:** Monthly on 1st, apply interest to overdue invoices
8. **Tax Form Generation:** Annually on January 15, generate 1099 forms
9. **Return Deadline Enforcement:** Hourly, close return windows as deadlines pass
10. **Affiliate Cleanup:** Monthly, soft-delete inactive affiliates (no sales in 12 months)

**Performance Requirements:**
- Tracking click logged asynchronously (<100ms response time)
- Affiliate dashboard loads in <2 seconds
- Real-time sale notifications delivered within 5 seconds
- Payout processing completed within 24 hours
- Support 10,000 concurrent affiliates
- Support 1,000 affiliate sales per minute

---

### 8.2 Frontend Requirements

**New Pages:**

1. **Affiliate Registration Page** (`/affiliates/register`)
   - Multi-step form (profile, verification, payment)
   - Progress indicator
   - Inline validation

2. **Affiliate Dashboard** (`/affiliates/dashboard`)
   - Metrics overview cards
   - Sales chart
   - Recent sales table
   - Quick actions (request payout, apply to events)

3. **Affiliate Events Page** (`/affiliates/events`)
   - List of events available for affiliate sales
   - Filter by date, location, payment terms
   - Apply to sell CTA

4. **Affiliate Application Page** (`/affiliates/apply/:eventId`)
   - Application form
   - Wholesale/retail pricing preview
   - Potential earnings calculator

5. **Affiliate Inventory Management** (`/affiliates/inventory`)
   - List of claimed inventory by event
   - Pricing controls
   - Tracking link generation
   - Return inventory action

6. **Affiliate Sales Dashboard** (`/affiliates/sales`)
   - Detailed sales list
   - Filters (date range, event, status)
   - Export CSV functionality

7. **Affiliate Earnings & Payouts** (`/affiliates/payouts`)
   - Available balance display
   - Payout history
   - Request payout CTA

8. **Affiliate Invoices** (`/affiliates/invoices`)
   - List of outstanding invoices
   - Pay invoice action
   - Payment history

9. **Organizer Affiliate Management** (`/dashboard/events/:eventId/affiliates`)
   - Affiliate program settings
   - Application approval queue
   - Affiliate performance leaderboard
   - Sales by affiliate report

10. **Admin Affiliate Management** (`/admin/affiliates`)
    - Global affiliate search
    - Fraud queue
    - Suspend/ban actions
    - Tax reporting tools

**UI Components:**
- Affiliate badge/label (on event pages)
- Earnings calculator widget
- Tracking link generator with copy-to-clipboard
- QR code display and download
- Affiliate profile card
- Application status badge
- Payout status indicator
- Invoice payment modal

---

### 8.3 Third-Party Integrations

| Service | Purpose | Integration Points |
|---------|---------|-------------------|
| **Plaid** | Bank account verification | Affiliate payout setup |
| **Stripe Identity** | Identity verification (KYC) | Affiliate registration |
| **HelloSign/DocuSign** | Tax form collection (W-9, W-8BEN) | Affiliate registration |
| **Square Payments** | Payment processing | Affiliate inventory purchase, customer checkout |
| **Square Payouts** | ACH payouts to affiliates | Payout processing |
| **Twilio** | SMS verification | Phone number verification |
| **SendGrid** | Transactional emails | Notifications, confirmations |
| **Bitly** (or self-hosted) | Short URL generation | Tracking link shortening |
| **QR Code Library** | QR code generation | Tracking QR codes |
| **Analytics (Mixpanel/Amplitude)** | Affiliate behavior tracking | Performance analytics |

---

### 8.4 Database Performance Considerations

**Indexes Required:**
```sql
-- Affiliate lookups
CREATE INDEX idx_affiliates_user_id ON affiliate_profiles(user_id);
CREATE INDEX idx_affiliates_status ON affiliate_profiles(status);

-- Application queries
CREATE INDEX idx_applications_event_id ON affiliate_applications(event_id);
CREATE INDEX idx_applications_affiliate_id ON affiliate_applications(affiliate_id);
CREATE INDEX idx_applications_status ON affiliate_applications(status);

-- Inventory queries
CREATE INDEX idx_inventory_affiliate_id ON affiliate_inventory(affiliate_id);
CREATE INDEX idx_inventory_event_id ON affiliate_inventory(event_id);
CREATE INDEX idx_inventory_code ON affiliate_inventory(affiliate_code);

-- Tracking lookups
CREATE INDEX idx_tracking_visitor_id ON affiliate_tracking(visitor_id);
CREATE INDEX idx_tracking_affiliate_id ON affiliate_tracking(affiliate_id);
CREATE INDEX idx_tracking_converted ON affiliate_tracking(converted_at) WHERE converted_at IS NOT NULL;

-- Sales queries
CREATE INDEX idx_sales_affiliate_id ON affiliate_sales(affiliate_id);
CREATE INDEX idx_sales_order_id ON affiliate_sales(order_id);

-- Payout queries
CREATE INDEX idx_payouts_affiliate_id ON affiliate_payouts(affiliate_id);
CREATE INDEX idx_payouts_status ON affiliate_payouts(status);
```

**Caching Strategy:**
- Affiliate profile: Redis cache, 1-hour TTL
- Affiliate inventory: Redis cache, 5-minute TTL
- Event affiliate settings: Redis cache, 1-hour TTL
- Tracking attribution: Redis cache, 30-day TTL
- Dashboard metrics: Pre-computed nightly, cached in Redis

**Database Partitioning:**
- `affiliate_tracking` partitioned by month (for performance)
- `affiliate_sales` partitioned by event date
- Archive old tracking data (>90 days) to cold storage

---

## 9. Analytics & Reporting

### 9.1 Affiliate Dashboard Metrics

**Overview Card:**
- Total Tickets Sold (all-time)
- Total Revenue Generated (all-time)
- Total Earnings (all-time)
- Available Balance
- Pending Payouts
- Amount Owed (if pay-later)

**Performance Metrics:**
- Conversion Rate (sales ÷ clicks)
- Average Ticket Value
- Earnings Per Click (EPC)
- Profit Margin %

**Recent Activity:**
- Last 10 sales (event, date, amount earned)
- Pending applications
- Upcoming payment due dates

**Charts:**
- Sales over time (daily, weekly, monthly)
- Revenue by event (pie chart)
- Earnings trend (line chart)

---

### 9.2 Organizer Affiliate Dashboard Metrics

**Overview Card:**
- Total Affiliates (approved, pending, rejected)
- Total Affiliate Sales (tickets)
- Total Affiliate Revenue (wholesale)
- % of Total Sales via Affiliates
- Outstanding Receivables (pay-later affiliates)

**Affiliate Leaderboard:**
- Rank affiliates by tickets sold
- Rank by revenue generated
- Rank by conversion rate

**Individual Affiliate Details:**
- Name, profile photo, contact
- Tickets sold, revenue, refund rate
- Payment status (paid, owed, overdue)
- Inventory status (sold, available, returned)

**Accounts Receivable Aging:**
- Current (not due yet)
- 1-30 days overdue
- 31-60 days overdue
- 61+ days overdue (collections)

**Charts:**
- Affiliate sales over time
- Top 10 affiliates by revenue
- Affiliate sales vs direct sales comparison

---

### 9.3 Platform Admin Analytics

**Platform-Wide Metrics:**
- Total Affiliates (active, suspended, banned)
- Total Events with Affiliate Programs
- Total Affiliate Sales Volume ($)
- Platform Revenue from Affiliate Fees
- Average Affiliate Earning Per Sale

**Fraud & Risk Metrics:**
- Affiliates in fraud queue
- Total refund rate (affiliate sales)
- Total chargeback rate (affiliate sales)
- Total overdue invoices ($)
- Bad debt write-offs ($)

**Tax Reporting:**
- Affiliates requiring 1099 (>$600 earnings)
- Total 1099 payout amount
- International affiliates requiring W-8BEN

**Performance Benchmarks:**
- Median affiliate conversion rate
- Top 10% affiliate conversion rate
- Median earnings per affiliate
- Affiliate retention rate (% active after 6 months)

---

### 9.4 Exportable Reports

**For Affiliates:**
1. **Sales Report:** All sales with details (event, date, customer, amount, earnings) - CSV/PDF
2. **Earnings Statement:** Breakdown of earnings, fees, payouts - PDF
3. **Tax Summary:** Annual earnings for tax filing (pre-1099 data) - PDF

**For Organizers:**
1. **Affiliate Sales Report:** All affiliate sales for event - CSV
2. **Affiliate Performance Report:** Leaderboard with metrics - PDF
3. **Accounts Receivable Report:** Outstanding invoices by affiliate - CSV/PDF

**For Admins:**
1. **Fraud Queue Report:** All flagged affiliates with details - CSV
2. **Tax Reporting Summary:** 1099 data for all affiliates - CSV
3. **Platform Revenue Report:** Affiliate fee revenue breakdown - CSV

---

## 10. Edge Cases & Error Handling

### 10.1 Inventory Edge Cases

| Edge Case | Scenario | Handling |
|-----------|----------|----------|
| **Overselling** | Affiliate's inventory depleted but customer clicks old link | Show "Tickets no longer available via this affiliate" + redirect to general event page |
| **Event Sold Out** | Event sells out while affiliate has inventory | Affiliate notified, option to return inventory for full refund |
| **Price Mismatch** | Organizer changes max retail price after affiliate sets pricing | Affiliate notified, must adjust selling price or accept lower margin |
| **Inventory Expiration** | Affiliate doesn't claim within 24 hours of approval | Allocation expires, returned to general pool, affiliate can reapply |
| **Return After Deadline** | Affiliate attempts return after deadline | System blocks, shows error message with deadline |
| **Partial Return** | Affiliate wants to return less than minimum | System blocks, shows minimum return quantity |

---

### 10.2 Payment Edge Cases

| Edge Case | Scenario | Handling |
|-----------|----------|----------|
| **Payment Failure (Pay Now)** | Card declined during inventory purchase | Transaction fails, no inventory allocated, affiliate notified |
| **Insufficient Funds (Pay Now)** | ACH payment rejected | Transaction fails, notify affiliate, retry option |
| **Negative Balance** | Refund exceeds available balance | Balance goes negative, deducted from next earnings, affiliate notified |
| **Payout Failure** | ACH payout rejected (invalid account) | Payout marked failed, affiliate notified, must update bank account |
| **Chargeback After Payout** | Customer files chargeback after affiliate already paid out | Affiliate balance goes negative, debt collection initiated |
| **Partial Payment (Pay Later)** | Affiliate pays less than full invoice | Applied to oldest invoice, remaining balance still due |
| **Late Payment** | Invoice overdue by 1 day | Interest applied, reminder sent, no suspension yet |
| **Very Late Payment** | Invoice overdue by 30+ days | Account suspended, cannot claim new inventory, debt collection |

---

### 10.3 Refund Edge Cases

| Edge Case | Scenario | Handling |
|-----------|----------|----------|
| **Refund After Event** | Customer requests refund after event ended | Follows standard refund policy (likely denied), same process |
| **Multiple Refunds** | Affiliate has multiple refunded sales in short time | Fraud flag triggered, manual review, potential suspension |
| **Chargeback on Refunded Sale** | Customer gets refund then files chargeback | Chargeback disputed, affiliate protected (already refunded) |
| **Event Cancellation + Pay Later** | Event canceled, affiliate owes money | Debt forgiven, invoices set to $0, wholesale refunded minus restocking fee |
| **Partial Refund** | Customer wants partial refund (e.g., 1 of 5 tickets) | Supported, affiliate margin clawed back proportionally |

---

### 10.4 Attribution Edge Cases

| Edge Case | Scenario | Handling |
|-----------|----------|----------|
| **Cookie Blocked** | Customer has cookies disabled | Attribution fails, sale not attributed to affiliate, logged as error |
| **Cross-Device Purchase** | Click on mobile, purchase on desktop | Not attributed in MVP (future enhancement: fingerprinting) |
| **Multiple Affiliate Links** | Customer clicks Affiliate A then Affiliate B link | Last-click wins (Affiliate B gets credit) |
| **Self-Purchase Attempt** | Affiliate tries to buy via own link | Blocked, error message, logged for fraud review |
| **Link Expiration** | Customer clicks link after event ended | Attribution cookie still set but purchase blocked (event ended) |
| **Bot Traffic** | Bots click affiliate links en masse | Bot detection, clicks not counted, affiliate notified if egregious |

---

### 10.5 Account Edge Cases

| Edge Case | Scenario | Handling |
|-----------|----------|----------|
| **Duplicate Application** | Affiliate applies multiple times for same event | System prevents (DB constraint), shows existing application |
| **Suspended Account** | Affiliate tries to apply while suspended | Blocked, error message explaining suspension reason |
| **Banned Affiliate** | Banned affiliate creates new account | Detection via email/phone/bank account, new account auto-banned |
| **Inactive Affiliate** | No sales in 12+ months | Account soft-deleted, can reactivate on login |
| **Organizer Deletes Event** | Event deleted while affiliates have inventory | All affiliates notified, inventory refunded, invoices forgiven |
| **Affiliate Deletes Account** | Affiliate with outstanding debt deletes account | Soft delete, debt collection continues, account cannot be reactivated |

---

## 11. Phase 1 MVP vs Future Enhancements

### 11.1 Phase 1 MVP Scope (Q1 2026 Launch)

**Core Features (MUST HAVE):**
- ✅ Affiliate registration and profile management
- ✅ Event organizer enables affiliate program per event
- ✅ Affiliate application and organizer approval workflow
- ✅ "Pay Now" inventory purchasing
- ✅ "Pay Later" (Net 30/60) inventory claiming
- ✅ Unique tracking link generation
- ✅ Customer purchase via affiliate link with attribution
- ✅ Affiliate sales dashboard (basic metrics)
- ✅ Organizer affiliate management dashboard
- ✅ Affiliate payout system (ACH, weekly auto-payout)
- ✅ Invoice management for pay-later affiliates
- ✅ Refund handling (customer refund, event cancellation)
- ✅ Basic fraud detection (self-purchase blocking, refund rate alerts)
- ✅ Admin tools (fraud queue, affiliate suspension/ban)

**Integrations (MVP):**
- ✅ Square Payments (inventory purchase, customer checkout)
- ✅ Square Payouts (ACH to affiliates)
- ✅ Plaid (bank verification)
- ✅ Twilio (SMS verification)
- ✅ SendGrid (email notifications)
- ✅ Stripe Identity (KYC verification)

**Out of Scope for MVP:**
- ❌ Multi-tier affiliates (sub-affiliates)
- ❌ Promotional discount codes for affiliates (use standard promo codes)
- ❌ Marketing asset library (affiliates create own materials)
- ❌ Advanced analytics (conversion funnel, attribution modeling)
- ❌ Mobile app (web-only for MVP)
- ❌ International payouts (US only for MVP)
- ❌ Dynamic pricing for affiliates
- ❌ Affiliate messaging system (use email for MVP)
- ❌ Performance bonuses/gamification
- ❌ Affiliate reputation/review system

---

### 11.2 Phase 2 Enhancements (Q2-Q3 2026)

**Enhanced Analytics & Reporting:**
- Conversion funnel analysis (click → view → add to cart → purchase)
- Multi-touch attribution modeling (first-click, last-click, linear)
- A/B testing for affiliate landing pages
- Cohort analysis (affiliate retention by signup month)
- Predictive analytics (sales forecasting per affiliate)

**Marketing Tools:**
- Affiliate marketing asset library
  - Pre-sized social media graphics
  - Email templates
  - Video promotional content
- Promo code generation for affiliates
- Customizable landing pages per affiliate
- Email drip campaigns for affiliates

**Performance Incentives:**
- Tiered commission structure (sell more, earn higher margin)
- Performance bonuses (e.g., $500 bonus for 100 tickets sold)
- Leaderboard with prizes
- Affiliate badges and achievements (gamification)
- Referral bonuses (recruit other affiliates)

**Communication:**
- In-platform messaging (organizer ↔ affiliate)
- Broadcast announcements to affiliates
- Affiliate support chat
- Community forum for affiliates

---

### 11.3 Phase 3 Advanced Features (Q4 2026+)

**Multi-Tier Affiliates:**
- Sub-affiliate recruitment
- Multi-level commission splits (e.g., Tier 1: 40%, Tier 2: 10%)
- Network building and team management
- Genealogy tree visualization

**Mobile Applications:**
- iOS app for affiliates
- Android app for affiliates
- Push notifications for sales
- QR code scanning for in-person sales

**International Expansion:**
- Multi-currency support
- International payout methods (PayPal, Wise, Payoneer)
- VAT/GST handling for international sales
- Localization (Spanish, French, Portuguese)

**Advanced Fraud Prevention:**
- Machine learning fraud detection
- Behavioral anomaly detection
- Cross-device fingerprinting for attribution
- Affiliate reputation scoring algorithm

**Marketplace Features:**
- Public affiliate marketplace (affiliates can browse all events)
- Affiliate ratings and reviews (from organizers)
- Verified badge for top-performing affiliates
- Featured affiliate listings (paid placement)

**Enterprise Features:**
- White-label affiliate platform for large organizers
- Custom commission structures per event
- Dedicated affiliate manager (human support)
- SLA guarantees for payouts
- Custom reporting and API access

---

## 12. Open Questions & Assumptions

### 12.1 Open Questions Requiring Stakeholder Input

**Business Model Questions:**
1. **Platform Fee Structure:**
   - Should platform charge affiliates 3% of margin, or organizers a % of wholesale?
   - Should there be a flat fee per affiliate sale instead of percentage?
   - Should first-time affiliates get discounted fees to encourage adoption?

2. **Payment Terms Flexibility:**
   - Should organizers set custom payment terms (e.g., Net 45, Net 90)?
   - Should there be a default credit limit, or always custom per affiliate?
   - Should early payment discounts be mandatory or optional?

3. **Return Policy:**
   - Is 5% return fee reasonable, or should it be higher/lower?
   - Should return deadline be configurable per event or platform-wide default?
   - Should affiliates with low return rates get fee waivers (incentive)?

4. **Payout Timing:**
   - Is weekly auto-payout acceptable, or should it be daily/monthly?
   - Should first-time affiliates have payout holds, or trust immediately?
   - Should large payouts (>$5,000) require manual approval?

5. **Affiliate Approval:**
   - Should there be platform-level affiliate approval before event-level?
   - Should affiliates with fraud flags be allowed to apply at all?
   - Should organizers see affiliate's performance with competitors?

**Technical Questions:**
6. **Attribution Window:**
   - Is 30-day cookie acceptable, or should it be longer (60/90 days)?
   - Should we support cross-device attribution in MVP or Phase 2?
   - Should there be an option for first-click vs last-click attribution?

7. **Inventory Allocation:**
   - Should unclaimed inventory return to pool, or stay reserved longer?
   - Should affiliates be able to "pre-reserve" inventory for future events?
   - Should there be a waitlist if organizer's inventory limit reached?

8. **Pricing Changes:**
   - Should organizers be able to change wholesale price after affiliates purchase?
   - Should affiliates be notified of max retail price changes?
   - Should there be price change freeze period (e.g., 7 days before event)?

**Legal & Compliance Questions:**
9. **Tax Implications:**
   - Who is responsible for sales tax on affiliate sales (organizer or affiliate)?
   - Should platform collect tax forms upfront or only when threshold reached?
   - How to handle international tax compliance (outside US)?

10. **Liability:**
    - Who is liable if affiliate misrepresents event or uses fraudulent marketing?
    - What happens if affiliate violates event's brand guidelines?
    - Should there be affiliate insurance or bond requirements?

11. **Chargebacks:**
    - Should organizer or platform absorb chargeback risk for affiliate sales?
    - Should affiliates have chargeback insurance option?
    - What's the escalation process for repeat chargebacks?

---

### 12.2 Documented Assumptions

**Business Assumptions:**
1. **Target Audience:** Dance event organizers (steppers community) are primary users
2. **Average Event Size:** 100-500 attendees, ticket prices $20-$100
3. **Affiliate Profile:** Dance instructors, influencers, community leaders with 500-2000 followers
4. **Adoption Rate:** 20% of organizers will enable affiliate programs within 3 months
5. **Sales Volume:** Affiliates will drive 15-20% of total ticket sales for enabled events
6. **Payment Terms Usage:** 60% of affiliates will use "Pay Now", 40% will use "Pay Later"

**Technical Assumptions:**
7. **Platform:** Existing Next.js/TypeScript platform with Prisma ORM
8. **Payment Processor:** Square Payments already integrated
9. **Scale:** System should support 10,000 affiliates and 1,000 sales/minute
10. **Mobile:** Mobile-responsive web is sufficient for MVP (no native app)

**Financial Assumptions:**
11. **Platform Fee:** 3% of affiliate's gross margin is sustainable
12. **Payment Processing:** Square fees (2.9% + $0.30) apply to all transactions
13. **Payout Costs:** ACH payouts free or minimal cost via Square
14. **Bad Debt:** 5% of pay-later invoices will become uncollectible (reserved)

**User Behavior Assumptions:**
15. **Conversion Rate:** Average affiliate conversion rate 5-10% (clicks to sales)
16. **Refund Rate:** Affiliate sales will have <10% refund rate
17. **Return Rate:** Affiliates will return <15% of claimed inventory
18. **Payout Frequency:** Most affiliates will request payout weekly (auto-payout)

**Regulatory Assumptions:**
19. **Tax Reporting:** 1099-NEC required for US affiliates earning >$600/year
20. **KYC Requirements:** Identity verification required for affiliates earning >$600/year
21. **GDPR:** Cookie consent required for EU visitors on tracking links
22. **PCI-DSS:** Square handles PCI compliance, platform does not store card data

---

### 12.3 Decisions Needed Before Development

**Priority 1 (Blocking MVP Development):**
- [ ] **Confirm platform fee model:** 3% of affiliate margin vs other options
- [ ] **Confirm payment terms options:** Net 30/60 only or custom terms allowed?
- [ ] **Confirm payout schedule:** Weekly auto-payout vs other options
- [ ] **Confirm attribution window:** 30 days vs other duration
- [ ] **Confirm minimum payout threshold:** $25 vs other amount
- [ ] **Confirm return fee:** 5% vs other percentage

**Priority 2 (Can be decided during development):**
- [ ] **Auto-approval criteria:** What metrics qualify affiliates for auto-approval?
- [ ] **Fraud detection thresholds:** What refund/return rates trigger flags?
- [ ] **Credit limit defaults:** What's default credit limit for pay-later affiliates?
- [ ] **Marketing asset library:** Include in MVP or defer to Phase 2?
- [ ] **International support:** US-only MVP or support other countries?

**Priority 3 (Post-MVP decisions):**
- [ ] **Multi-tier affiliates:** Include in roadmap or not?
- [ ] **Mobile apps:** Build native apps or mobile web sufficient?
- [ ] **White-label option:** Offer to enterprise customers or not?
- [ ] **Performance bonuses:** Gamification and incentives in Phase 2?

---

## 13. Success Criteria & Launch Checklist

### 13.1 Success Criteria

**Quantitative Metrics (6 Months Post-Launch):**
- ✅ ≥100 affiliates registered
- ✅ ≥20% of events enable affiliate program
- ✅ ≥15% of ticket sales via affiliates
- ✅ ≥60% affiliate retention rate (active after 6 months)
- ✅ ≥95% invoice collection rate (pay-later affiliates)
- ✅ <5% refund rate on affiliate sales
- ✅ <2% chargeback rate on affiliate sales
- ✅ ≥4.5/5 star rating from affiliates
- ✅ ≥4.5/5 star rating from organizers

**Qualitative Metrics:**
- ✅ Positive feedback from beta affiliates on ease of use
- ✅ Organizers report reduced marketing costs
- ✅ Affiliates report timely and accurate payouts
- ✅ No major fraud or abuse incidents
- ✅ Support ticket volume manageable (<10/day for affiliate issues)

---

### 13.2 Pre-Launch Checklist

**Development Complete:**
- [ ] All API endpoints implemented and tested
- [ ] All UI pages/components built and responsive
- [ ] Payment integrations tested (Square purchase, payout)
- [ ] Bank verification integration tested (Plaid)
- [ ] Identity verification integration tested (Stripe Identity)
- [ ] Email notifications configured and tested (SendGrid)
- [ ] SMS verification configured and tested (Twilio)
- [ ] Tracking system tested (click → attribution → sale)
- [ ] Fraud detection algorithms implemented and tested
- [ ] Admin tools functional (suspend, ban, fraud queue)

**Testing Complete:**
- [ ] Unit tests: 80%+ code coverage
- [ ] Integration tests: All critical user flows
- [ ] End-to-end tests: Full affiliate journey (register → sell → payout)
- [ ] Load testing: 1,000 concurrent users, 1,000 sales/minute
- [ ] Security testing: Penetration test, vulnerability scan
- [ ] Browser testing: Chrome, Safari, Firefox, Edge
- [ ] Mobile testing: iOS Safari, Android Chrome

**Legal & Compliance:**
- [ ] Affiliate Terms of Service drafted and reviewed by legal
- [ ] Privacy Policy updated to reflect affiliate data collection
- [ ] Cookie Policy updated for tracking links
- [ ] Tax form collection process tested (W-9, W-8BEN)
- [ ] 1099 generation process tested
- [ ] GDPR compliance verified (cookie consent, data export)
- [ ] PCI-DSS compliance verified (via Square)

**Documentation:**
- [ ] Affiliate onboarding guide (how to get started)
- [ ] Organizer guide (how to enable and manage affiliate program)
- [ ] Admin guide (how to manage fraud, suspensions, tax reporting)
- [ ] API documentation (if applicable)
- [ ] FAQ for affiliates
- [ ] FAQ for organizers

**Operations:**
- [ ] Customer support trained on affiliate system
- [ ] Support documentation created (how to handle affiliate issues)
- [ ] Fraud response playbook created
- [ ] Escalation process defined (for disputes, chargebacks)
- [ ] Monitoring and alerting configured (uptime, errors, fraud)

**Marketing & Launch:**
- [ ] Beta program invitations sent to 20-30 affiliates
- [ ] Organizer outreach (email campaign to enable affiliate program)
- [ ] Landing page created (affiliates.stepperslife.com)
- [ ] Marketing materials created (how-to videos, case studies)
- [ ] Press release drafted (if applicable)
- [ ] Launch announcement scheduled (email, social media)

---

### 13.3 Post-Launch Monitoring (First 30 Days)

**Daily Monitoring:**
- [ ] System uptime and error rates
- [ ] Affiliate registrations (target: 3-5/day)
- [ ] Applications submitted and approved (target: 80% approval rate)
- [ ] Sales via affiliates (target: 50+ sales/week)
- [ ] Payout processing success rate (target: 100%)
- [ ] Fraud alerts (target: <5/week)
- [ ] Support tickets (target: <10/day)

**Weekly Review:**
- [ ] Affiliate satisfaction feedback (survey)
- [ ] Organizer satisfaction feedback (survey)
- [ ] Top 10 affiliates by sales (outreach and case studies)
- [ ] Fraud incidents and resolutions
- [ ] Payment collection rate (pay-later affiliates)
- [ ] Bug reports and prioritization
- [ ] Feature requests and roadmap updates

**Monthly Review:**
- [ ] Compare actuals vs success criteria targets
- [ ] Revenue analysis (platform fees collected)
- [ ] Cost analysis (payment processing, payouts, fraud losses)
- [ ] Retention analysis (% of affiliates still active)
- [ ] Product roadmap adjustment based on feedback
- [ ] Phase 2 planning and prioritization

---

## 14. Conclusion & Next Steps

This PRD defines a comprehensive Affiliate Ticket Sales System that will:
1. **Expand Distribution:** Enable event organizers to leverage affiliate networks for ticket sales
2. **Reduce Friction:** Offer flexible payment terms (pay now or pay later) to affiliates
3. **Ensure Transparency:** Provide detailed tracking and reporting for all stakeholders
4. **Maintain Quality:** Implement robust fraud prevention and quality controls
5. **Drive Revenue:** Create new revenue streams via platform fees on affiliate transactions

**Immediate Next Steps:**
1. **Stakeholder Review:** Share this PRD with leadership and key stakeholders for feedback
2. **Decision Making:** Resolve all Priority 1 open questions (Section 12.3)
3. **Technical Design:** Architect agent creates detailed technical specification document
4. **Resource Allocation:** PM secures dev, design, and QA resources for project
5. **Timeline Creation:** SM creates sprint plan and sets target launch date (Q1 2026)
6. **Beta Recruitment:** Begin recruiting 20-30 beta affiliates for testing

**Recommended Launch Timeline:**
- **Week 1-2:** Stakeholder review and decision making
- **Week 3-4:** Technical design and database schema
- **Week 5-12:** Development (8 weeks)
- **Week 13-14:** QA and bug fixes
- **Week 15-16:** Beta testing with 20-30 affiliates
- **Week 17:** Launch preparation (documentation, training, marketing)
- **Week 18:** Public launch 🚀

**Target Launch Date:** **Q1 2026 (March 1, 2026)**

---

**Document Approval:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Manager | PM Agent | ___________ | 2025-10-02 |
| Engineering Lead | ___________ | ___________ | ___________ |
| Design Lead | ___________ | ___________ | ___________ |
| Legal/Compliance | ___________ | ___________ | ___________ |
| Executive Sponsor | ___________ | ___________ | ___________ |

---

**Appendix:**
- A. Competitive Analysis (Eventbrite, Ticketmaster affiliate programs)
- B. User Research Findings (interviews with potential affiliates)
- C. Financial Model (revenue projections, cost analysis)
- D. Detailed Wireframes (UI mockups for all pages)
- E. API Specification (detailed endpoint documentation)
- F. Database Schema (complete ERD)

---

**End of PRD**

*This is a living document and will be updated as requirements evolve and decisions are made.*