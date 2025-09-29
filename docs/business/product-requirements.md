# SteppersLife Events and Tickets System
## Product Requirements Document (PRD)
### Version 1.0

---

## Executive Summary

SteppersLife is a US-focused event ticketing platform designed to democratize event ticketing through transparent flat-fee pricing and direct payment processing. By leveraging Square's payment ecosystem and modern web technologies, we eliminate the pain of percentage-based fees while providing event organizers complete control over their customer relationships and cash flow.

---

## Goals and Background Context

### Goals
- Build a US-focused ticketing platform optimized for American event organizers and attendees
- Implement competitive flat-fee pricing in USD ($0.29-0.75 per ticket) to compete with Eventbrite's percentage-based fees
- Enable direct payment processing to organizers through Square/Cash App (no escrow complexity)
- Support comprehensive event types common in the US market (concerts, festivals, sporting events, conferences)
- Deliver superior mobile-first experience optimized for US consumer behavior and expectations
- Create sustainable revenue through flat-fee ticketing, white-label subscriptions, and value-added features
- Focus on US compliance requirements and payment methods preferred by American consumers

### Background Context

The US represents 38% of the global $68 billion online event ticketing market, making it the largest single market opportunity. American event organizers currently face high percentage-based fees from platforms like Eventbrite (up to 6.95% + payment processing), which become particularly painful for higher-priced tickets common in the US market ($30-150 range). SteppersLife will capture market share by offering a flat-fee model ($0.29 per ticket with prepaid credits or $0.75 pay-as-you-go) specifically tailored to US organizers. By focusing exclusively on the US market, we can optimize for American payment preferences, compliance requirements, and user expectations while avoiding the complexity of international operations.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2024-01-15 | 1.0 | Initial PRD Creation | Product Management |

---

## Requirements

### Functional Requirements (FR)

#### Core Platform Requirements
- **FR1**: Multi-tenant architecture supporting unlimited "box offices" with complete data isolation for US-based organizers
- **FR2**: Event creation wizard optimized for US event types (concerts, sports, festivals, conferences, theater)
- **FR3**: Ticket pricing in USD only with support for common US pricing strategies ($X.99 pricing, service fees)
- **FR4**: Real-time seat selection for US venue types (stadiums, theaters, arenas, convention centers) using WebSocket synchronization
- **FR5**: Checkout flow optimized for Square payment methods (credit/debit cards, Cash App Pay)

#### Square Payment Integration Requirements
- **FR6**: Square SDK integration for complete payment processing
- **FR7**: Cash App Pay integration for mobile-first payments
- **FR8**: Square Terminal API for box office POS systems
- **FR9**: Square Invoices for corporate and group bookings
- **FR10**: Instant transfers to organizers (1-2 business days standard, instant available)
- **FR11**: Square's fraud detection and chargeback protection
- **FR12**: Stored payment methods via Square's Card on File
- **FR13**: Recurring payments for season tickets via Square Subscriptions
- **FR14**: Square Loyalty integration for repeat attendees
- **FR15**: Square Gift Cards for venue merchandise
- **FR16**: Square's dispute management dashboard access for organizers

#### Event Management Requirements
- **FR17**: Support for single, recurring, and multi-day events
- **FR18**: Tiered ticket pricing with automatic price changes based on date/quantity
- **FR19**: Group booking functionality with bulk discounts
- **FR20**: Waitlist system with automatic notifications when tickets become available
- **FR21**: Ticket transfer and resale capabilities within platform guidelines
- **FR22**: Reserved seating charts for venues up to 5,000 seats initially

#### Check-in & Access Control
- **FR23**: Progressive Web App for mobile check-in with offline functionality
- **FR24**: QR code generation with secure validation and one-time use tokens
- **FR25**: Multiple check-in methods (QR scan, name search, confirmation number)
- **FR26**: Visual feedback system with clear valid/invalid indicators
- **FR27**: Multi-device synchronization for multiple entrance points
- **FR28**: Integration with external barcode scanners via web USB/Bluetooth

#### Marketing & Communications
- **FR29**: Email system compliant with CAN-SPAM Act requirements
- **FR30**: SMS notifications via Twilio with TCPA compliance
- **FR31**: Social media integration for event sharing (Facebook, Instagram, Twitter/X)
- **FR32**: Automated email sequences for confirmations, reminders, follow-ups
- **FR33**: Attendee segmentation for targeted communications
- **FR34**: White-label options with custom domain support ($10/month)

#### Reporting & Analytics
- **FR35**: Real-time sales dashboard with revenue tracking
- **FR36**: Attendee demographics and purchase behavior analytics
- **FR37**: Financial reconciliation reports integrated with Square data
- **FR38**: Custom report builder for organizers
- **FR39**: Data export capabilities (CSV, Excel, PDF)
- **FR40**: Heat maps for multi-day and recurring events

### Non-Functional Requirements (NFR)

- **NFR1**: 99.9% uptime with automated monitoring and alerting
- **NFR2**: Support 10,000 concurrent users on single VPS instance
- **NFR3**: Page load times under 1.5 seconds on US 4G/5G networks
- **NFR4**: ADA compliance following WCAG 2.1 Level AA standards
- **NFR5**: US privacy law compliance (CCPA for California, state-specific requirements)
- **NFR6**: PCI DSS compliance through Square's certified infrastructure
- **NFR7**: English-only interface with US date formats (MM/DD/YYYY) and 12-hour time
- **NFR8**: Database backup every 6 hours with 30-day retention
- **NFR9**: Support for major US browsers (Chrome 90+, Safari 14+, Firefox 88+, Edge 90+)
- **NFR10**: Mobile responsive design supporting iOS 14+ and Android 10+

---

## User Interface Design Goals

### Design System & Theme

- **Color System**: OKLCH color space with custom theme variables
- **Component Library**: shadcn/ui with tailored theme configuration
- **CSS Framework**: Tailwind CSS v4 with OKLCH support
- **Theme Support**: Full light/dark mode with system preference detection
- **Border Radius**: 1.3rem for consistent rounded corners
- **Typography**: Open Sans (sans-serif), Georgia (serif), Menlo (monospace)

### Theme Colors (OKLCH)

#### Primary Brand
- Light Mode: `oklch(0.6723 0.1606 244.9955)` (Blue)
- Dark Mode: `oklch(0.6692 0.1607 245.0110)` (Blue)

#### System Colors
- **Background**: Pure white/black for maximum contrast
- **Cards**: Subtle off-white/dark gray for depth
- **Destructive**: `oklch(0.6188 0.2376 25.7658)` for errors
- **Success**: Green shades for confirmations
- **Warning**: Amber for cautions

### Key UI Components

#### Organizer Dashboard
- Real-time sales ticker with animation
- Revenue cards with trend indicators
- Interactive charts using provided chart colors
- Quick action buttons for common tasks
- Event calendar view with heat map overlay

#### Event Creation Wizard
- Step-by-step progress indicator
- Auto-save with visual confirmation
- Live preview of event page
- Inline validation with helpful error messages
- Contextual help tooltips

#### Ticket Purchase Flow
- Single-column checkout on mobile
- Clear pricing breakdown before payment
- Square payment form embedded securely
- Progress indicator showing checkout steps
- Trust badges and security indicators

#### Mobile Check-in App (PWA)
- Large scan button (minimum 44x44px touch target)
- Full-screen QR scanner interface
- Offline mode indicator badge
- Clear success/failure animations
- Quick stats dashboard for event staff

### Responsive Breakpoints
- **Mobile**: 320px - 640px (primary focus)
- **Tablet**: 640px - 1024px
- **Desktop**: 1024px - 1280px
- **Wide**: 1280px+

### UI Development Stack
- **Testing**: Puppeteer for automated E2E testing
- **DevTools**: Chrome DevTools integration for debugging
- **Design Bridge**: Drawbridge for design-to-code workflow
- **Component Server**: shadcn-ui-mcp-server for rapid development

---

## Success Metrics

### Year 1 Goals
- **Active Organizers**: 250 by month 6, 500 by month 12
- **Tickets Processed**: 100,000 total
- **Gross Merchandise Value**: $4.5M in ticket sales
- **Platform Revenue**: $75,000 (ticket fees + subscriptions)
- **Average Ticket Price**: $45
- **Platform Uptime**: 99.9%
- **Customer Support Response**: <4 hours

### Year 2 Goals
- **Active Organizers**: 2,000
- **Tickets Processed**: 500,000
- **GMV**: $22.5M
- **Platform Revenue**: $400,000
- **White-label Clients**: 25
- **Market Presence**: Active events in all 50 states
- **NPS Score**: >50

### Year 3 Goals
- **Active Organizers**: 5,000
- **Tickets Processed**: 2,000,000
- **GMV**: $90M
- **Platform Revenue**: $1.7M
- **Enterprise Clients**: 10 major venues/promoters
- **Market Share**: 0.5% of US online ticketing

### Key Performance Indicators
- **Organizer Metrics**: Retention rate >80%, Monthly active rate >60%
- **Transaction Metrics**: Payment success rate >95%, Checkout conversion >3%
- **Technical Metrics**: API response time <200ms, Zero critical security incidents
- **Financial Metrics**: Customer acquisition cost <$50, Lifetime value >$500

---

## Technical Assumptions

### Infrastructure Architecture
- **Hosting**: Self-hosted on Hostinger VPS
  - Initial: 8 vCPU, 32GB RAM, 500GB NVMe SSD
  - Scaling: Vertical scaling to 16 vCPU, 64GB RAM as needed
  - Location: US data center for low latency
  - Backup VPS in different region for disaster recovery

### Technology Stack
- **Framework**: Next.js 14+ with App Router
- **Runtime**: Node.js 20 LTS
- **Database**: PostgreSQL 15 with Prisma ORM
- **Cache**: Redis 7 for sessions and real-time data
- **Search**: PostgreSQL full-text search (initially), Elasticsearch (future)
- **Queue**: Bull MQ for background jobs
- **Real-time**: Socket.io for WebSocket management
- **API**: tRPC for type-safe communication
- **File Storage**: Local disk initially, S3-compatible storage later

### Payment Processing
- **Primary**: Square SDK (single integration point)
  - Online Payments API for web transactions
  - Cash App Pay SDK for mobile payments
  - Terminal API for box office
  - Invoices API for group sales
  - Subscriptions API for recurring
- **Rates**: 2.6% + 10¢ online, 2.6% + 10¢ Cash App Pay
- **Payouts**: Direct to organizer's Square account

### Development & Deployment
- **Package Manager**: pnpm for efficiency
- **Build**: Next.js standalone output
- **Process Manager**: PM2 for Node.js
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt auto-renewal
- **Monitoring**: Uptime Kuma (self-hosted)
- **Logging**: Winston with daily rotation
- **Backups**: Automated PostgreSQL dumps every 6 hours

### Third-party Services
- **Email**: SendGrid (transactional), Mailgun (marketing)
- **SMS**: Twilio with 10DLC registration
- **CDN**: Cloudflare (free tier initially)
- **Analytics**: Plausible (privacy-focused, self-hosted)
- **Error Tracking**: Sentry (self-hosted)
- **Maps**: Mapbox for venue selection

### Security Measures
- **Authentication**: NextAuth.js with JWT
- **Authorization**: Role-based access control (RBAC)
- **Encryption**: TLS 1.3 for transit, AES-256 for sensitive data at rest
- **Rate Limiting**: 100 requests/minute per IP
- **DDoS Protection**: Cloudflare + Nginx rate limiting
- **Secrets Management**: Environment variables with .env.vault
- **Audit Logging**: All critical actions logged with user/IP/timestamp

---

## User Personas

### Primary: Event Organizer "Sarah"
- **Role**: Music venue owner/promoter
- **Events**: 10-20 events/month, $25-75 tickets
- **Pain Points**: High Eventbrite fees eating margins, lack of customer data access
- **Needs**: Low fees, quick payouts, customer analytics, easy staff training
- **Success Criteria**: Save $500+/month on fees, get paid within 2 days

### Secondary: Attendee "Mike"
- **Demographics**: 25-40, urban, tech-savvy
- **Behavior**: Buys 5-10 tickets/year, primarily mobile
- **Preferences**: Quick checkout, Apple Pay, digital tickets
- **Pain Points**: Hidden fees at checkout, complicated purchase process
- **Success Criteria**: Transparent pricing, 2-minute checkout, easy ticket access

### Tertiary: Box Office Staff "Jennifer"
- **Role**: Venue employee handling door sales and check-in
- **Environment**: Often outdoors, varying connectivity, multiple entrances
- **Needs**: Fast check-in, offline capability, simple interface
- **Pain Points**: Slow systems, confused customers, payment processing
- **Success Criteria**: 5-second check-in, works offline, handles cash sales

---

## Competitive Analysis

### vs Eventbrite

#### Our Advantages
- Flat fee ($0.29-0.75) vs percentage (3.7-6.95% + $1.79)
- Direct payouts vs held funds
- No platform discovery competing with organizer marketing
- Simpler, cleaner interface

#### Their Advantages
- Market dominance and brand recognition
- Built-in discovery marketplace
- Extensive integration ecosystem
- Global reach

### vs TicketMaster

#### Our Advantages
- Transparent pricing (no hidden fees)
- Self-service model (no contracts)
- Lower fees for small-mid events
- Better organizer tools

#### Their Advantages
- Venue exclusivity deals
- Primary ticketing for major artists
- Massive marketing budget
- Secondary market integration

### vs Square (Direct)

#### Our Advantages
- Purpose-built for events (not generic)
- Specialized features (reserved seating, waitlists)
- Event-specific reporting
- Check-in apps and access control

#### Why We Use Square Infrastructure
- Leverage their payment expertise
- Benefit from their security/compliance
- Direct integration with organizer's existing Square account
- Reduced development complexity

---

## Risk Assessment & Mitigation

### Technical Risks

#### VPS Failure
- **Risk**: Single point of failure with Hostinger VPS
- **Mitigation**: Daily backups, standby VPS ready, 1-hour recovery time objective

#### Payment Processing Dependency
- **Risk**: Square outage affects all transactions
- **Mitigation**: Status page integration, clear communication, offline backup for check-ins

#### Scaling Limitations
- **Risk**: VPS can't handle viral event
- **Mitigation**: CDN for static assets, database read replicas, queue system for peaks

### Business Risks

#### Slow Adoption
- **Risk**: Organizers reluctant to switch platforms
- **Mitigation**: Free tier for small events, migration assistance, referral incentives

#### Competitive Response
- **Risk**: Eventbrite matches our pricing
- **Mitigation**: Focus on user experience, direct payouts, superior support

#### Regulatory Changes
- **Risk**: New laws affecting ticketing industry
- **Mitigation**: Legal counsel on retainer, adaptable terms of service

### Security Risks

#### Data Breach
- **Risk**: Customer payment or personal data exposed
- **Mitigation**: PCI compliance via Square, encryption, security audits

#### Fraud/Scalping
- **Risk**: Automated buying, fake events
- **Mitigation**: Rate limiting, CAPTCHA, organizer verification

---

## Implementation Roadmap

### Phase 1: MVP (Months 1-2)
**Goal**: Basic ticket sales functionality
- Core event creation (single events only)
- Square payment integration (cards only)
- Basic ticket types (GA, VIP)
- Email confirmations
- Simple organizer dashboard
- QR code tickets

### Phase 2: Core Features (Months 3-4)
**Goal**: Competitive feature parity
- Cash App Pay integration
- Recurring events support
- Tiered pricing and discounts
- Check-in PWA with offline mode
- Organizer team management
- Basic reporting

### Phase 3: Advanced Features (Months 5-6)
**Goal**: Differentiation features
- Reserved seating selection
- Waitlist functionality
- Square Terminal for box office
- Email marketing tools
- White-label options
- Advanced analytics

### Phase 4: Scale & Optimize (Months 7-8)
**Goal**: Prepare for growth
- Performance optimization
- Enhanced security measures
- A/B testing framework
- Referral program
- API documentation
- Enterprise features

### Phase 5: Market Expansion (Months 9-12)
**Goal**: Aggressive growth
- Marketing automation
- Venue partnerships
- Season ticket support
- Group booking tools
- Mobile app development
- Advanced fraud detection

---

## Dependencies

### External Dependencies
- Square API availability and stability
- Hostinger VPS reliability
- Twilio for SMS delivery
- SendGrid for email delivery
- Cloudflare for CDN/DDoS protection

### Internal Dependencies
- Technical co-founder or senior developer hire
- Initial funding for development and marketing
- Legal counsel for terms of service
- Customer support team by month 6
- Marketing specialist by month 4

---

## Open Questions

1. Should we build native mobile apps or stick with PWA?
2. What's our policy on ticket resales and transfers?
3. How do we handle refunds and cancellations?
4. Should we offer phone-based customer support?
5. What's our approach to event insurance?
6. How do we verify organizer identity and legitimacy?
7. Should we support merchandise sales alongside tickets?
8. What's our strategy for exclusive venue partnerships?

---

## Appendices

### Appendix A: Glossary
- **GMV**: Gross Merchandise Value (total ticket sales)
- **PWA**: Progressive Web App
- **VPS**: Virtual Private Server
- **SDK**: Software Development Kit
- **CCPA**: California Consumer Privacy Act
- **CAN-SPAM**: Controlling the Assault of Non-Solicited Pornography And Marketing
- **TCPA**: Telephone Consumer Protection Act
- **10DLC**: 10-Digit Long Code (for SMS)
- **RBAC**: Role-Based Access Control

### Appendix B: Technical Specifications
- Detailed API endpoints documentation (separate document)
- Database schema design (separate document)
- Security audit checklist (separate document)
- Square SDK integration guide (separate document)

### Appendix C: Compliance Requirements
- State-by-state tax collection requirements
- ADA accessibility guidelines
- Payment card industry standards
- Email marketing regulations
- SMS marketing compliance

### Appendix D: Pricing Strategy
- **Prepaid Credits**: $0.29 per ticket (minimum 100 tickets)
- **Pay-as-you-go**: $0.75 per ticket
- **White-label**: $10/month base + standard fees
- **Reserved Seating**: Additional $0.10 per seat
- **Season Tickets**: $5/month per subscription

---

## Document Control

- **Status**: APPROVED FOR DEVELOPMENT
- **Owner**: Product Management
- **Review Cycle**: Monthly
- **Last Updated**: January 15, 2024
- **Next Review**: February 15, 2024
- **Version Control**: Git repository

---

## Sign-off

This PRD has been reviewed and approved by:

- [ ] Product Manager - ___________________ Date: ___________
- [ ] Technical Lead - ___________________ Date: ___________
- [ ] UX Designer - ___________________ Date: ___________
- [ ] Business Stakeholder - ___________________ Date: ___________
- [ ] Legal Counsel - ___________________ Date: ___________
- [ ] Finance Lead - ___________________ Date: ___________

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2024-01-10 | PM Team | Initial draft |
| 0.2 | 2024-01-12 | Tech Lead | Added technical specifications |
| 0.3 | 2024-01-13 | UX Team | Updated UI/UX requirements |
| 1.0 | 2024-01-15 | PM Team | Final version for approval |

---

*End of Document*