# Affiliate Ticket Sales System - Documentation Index

**Project:** Events SteppersLife Platform
**Feature:** Affiliate Ticket Sales System
**Status:** Design Complete - Ready for Implementation
**Created:** 2025-10-02

---

## Documentation Overview

This folder contains the complete technical architecture and business documentation for the Affiliate Ticket Sales System. The system enables event organizers to recruit affiliates (promoters/salespeople) who sell tickets on their behalf, with support for both online and cash payment transactions.

---

## 📚 Document Index

### 1. **AFFILIATE-SALES-ARCHITECTURE.md** (Main Document)
**Read this first** - Complete technical architecture covering:
- Data model (Prisma schema additions)
- Core workflows (registration, sales, payouts)
- API endpoints (complete reference)
- Security considerations (PIN validation, fraud prevention)
- Integration points (Square, Stripe, existing systems)
- Implementation phases (14-week roadmap)

**Best for:** Developers, architects, technical leads

---

### 2. **AFFILIATE-SALES-QUICK-REFERENCE.md**
**Quick lookup guide** with:
- System overview diagrams
- Two sales models explained
- Core entities summary
- Payment flows
- Security features
- Commission calculation formulas
- API endpoint list
- Implementation checklist

**Best for:** Quick reference, onboarding new developers

---

### 3. **AFFILIATE-SALES-SYSTEM-DIAGRAM.md**
**Visual architecture** including:
- System layer diagrams (presentation → database)
- Data flow diagrams (online sale, cash sale, pre-buy, payout)
- Security architecture visualization
- Technology stack summary

**Best for:** Visual learners, stakeholder presentations

---

### 4. **AFFILIATE-BUSINESS-MODELS-COMPARISON.md**
**Business model guide** covering:
- Pre-Buy vs Pay-Later comparison
- Detailed examples with numbers
- Commission structures
- Decision matrix for organizers/affiliates
- Real-world scenarios
- Financial modeling
- Recommended configuration

**Best for:** Business stakeholders, product managers, organizers

---

## 🎯 Quick Start Guide

### For Developers Starting Implementation

1. **Read** `AFFILIATE-SALES-ARCHITECTURE.md` (full document)
2. **Review** database schema section
3. **Set up** development environment:
   ```bash
   # Install dependencies (if not already installed)
   npm install

   # Create .env.local with required variables
   cp .env.example .env.local

   # Add affiliate-specific env vars:
   STRIPE_CONNECT_CLIENT_ID=...
   AFFILIATE_PIN_SALT_ROUNDS=12
   ```
4. **Run** database migrations (Phase 1)
5. **Begin** Phase 1 implementation (Foundation)

### For Product Managers

1. **Read** `AFFILIATE-BUSINESS-MODELS-COMPARISON.md`
2. **Decide** which model to start with (recommendation: Pay-Later)
3. **Define** commission structure
4. **Review** Phase 1-2 requirements in architecture doc
5. **Coordinate** with development team

### For Business Stakeholders

1. **Read** Executive Summary in `AFFILIATE-SALES-ARCHITECTURE.md`
2. **Review** business models comparison
3. **Understand** revenue impact and commission structures
4. **Review** implementation timeline (14 weeks)

---

## 🔑 Key Concepts

### Two Sales Models

1. **Pre-Buy Model**
   - Affiliate buys tickets upfront at wholesale price
   - Sells at retail price, keeps difference
   - Higher profit, higher risk for affiliate
   - Immediate cash flow for organizer

2. **Pay-Later Model**
   - Affiliate sells first, pays organizer later
   - Commission-based (% or fixed amount)
   - Lower risk for affiliate
   - Delayed payment for organizer

### Cash Payment Feature

- Both organizers AND affiliates can accept cash
- 4-digit PIN validation required
- Prevents fraud and unauthorized sales
- Full audit trail maintained

### Key Benefits

**For Organizers:**
- Expand sales reach through affiliate network
- No upfront marketing cost
- Performance-based commissions
- Built-in fraud prevention

**For Affiliates:**
- Earn commission on ticket sales
- Flexible online + offline selling
- No technical barriers
- Simple mobile dashboard

**For Customers:**
- More purchasing options
- Trusted local sellers
- Same tickets, same price
- Secure QR code delivery

---

## 📊 System Features

### Core Features (MVP)
- ✅ Affiliate registration & approval
- ✅ Unique tracking links for online sales
- ✅ Cash sale recording with PIN validation
- ✅ Real-time commission tracking
- ✅ Affiliate dashboard with analytics
- ✅ Organizer dashboard (sales by affiliate)
- ✅ Automated payout processing

### Advanced Features (Future Phases)
- 📅 Pre-buy inventory management
- 📅 Tiered commission structures
- 📅 1099 tax reporting
- 📅 Fraud detection system
- 📅 Mobile app for affiliates
- 📅 Advanced analytics & reporting

---

## 🗄️ Database Schema Summary

### New Tables (6)
1. `affiliates` - Affiliate profiles
2. `affiliate_links` - Tracking links
3. `affiliate_ticket_inventory` - Pre-buy inventory
4. `affiliate_sales` - All sales tracking
5. `affiliate_payouts` - Payout records
6. `affiliate_1099_records` - Tax reporting

### Modified Tables (4)
1. `users` - Add AFFILIATE role
2. `events` - Add affiliate settings
3. `orders` - Add affiliate tracking
4. `ticket_types` - Add wholesale pricing

### Total Impact
- **New tables:** 6
- **Modified tables:** 4
- **New enums:** 6
- **New API endpoints:** ~20
- **New permissions:** 5

---

## 🛠️ Technology Stack

### Backend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** NextAuth.js (existing)
- **Payments:** Square + Stripe Connect

### Frontend
- **Framework:** React 18 (Server Components)
- **Styling:** Tailwind CSS
- **Components:** Shadcn UI
- **Forms:** React Hook Form + Zod

### Security
- **PIN Hashing:** bcrypt (cost factor: 12)
- **Rate Limiting:** Custom middleware
- **Fraud Detection:** Rule-based engine
- **Audit Logging:** PostgreSQL + Sentry

### Third-Party Services
- **Square:** Credit card processing
- **Stripe Connect:** Affiliate payouts
- **Resend:** Email delivery
- **Vercel:** Hosting & deployment

---

## 📅 Implementation Timeline

### Phase 1: Foundation (Weeks 1-2)
- Database setup
- Authentication & permissions
- Basic API endpoints
- Admin approval UI

### Phase 2: Online Sales (Weeks 3-4)
- Link tracking system
- Enhanced purchase flow
- Affiliate dashboard
- Analytics

### Phase 3: Cash Sales (Weeks 5-6)
- PIN management
- Cash sale recording
- Security & rate limiting
- Mobile UI

### Phase 4: Pre-Buy Inventory (Weeks 7-8)
- Inventory management
- Payment processing
- Real-time tracking

### Phase 5: Payouts (Weeks 9-10)
- Stripe Connect onboarding
- Automated payouts
- Settlement system

### Phase 6: Tax Reporting (Weeks 11-12)
- W-9 collection
- 1099 generation
- IRS compliance

### Phase 7: Analytics (Weeks 13-14)
- Advanced reporting
- Fraud detection
- Performance optimization

**Total Duration:** 14 weeks (3.5 months)

---

## 🔒 Security Highlights

### PIN Security
- 4-digit numeric PIN
- Bcrypt hashing (never plaintext)
- Rate limiting (3 attempts / 15 min)
- Account lockout after 5 failures
- Forced rotation every 90 days

### Fraud Prevention
- Velocity checks (max sales/hour)
- IP address tracking
- Self-referral detection
- Admin review queue
- Audit trail for all transactions

### Payment Security
- PCI-compliant (Square/Stripe)
- No raw card storage
- 3D Secure support
- Escrow period for new affiliates

---

## 📈 Success Metrics

### KPIs to Track

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Active Affiliates | 50+ | Count of APPROVED status |
| Monthly Sales Volume | $50k+ | Sum of affiliate_sales.total |
| Average Commission | $500/mo | Avg per affiliate |
| Conversion Rate | 5%+ | Conversions / Clicks |
| Payout Success Rate | 99%+ | Successful / Total payouts |
| Cash Validation Success | 98%+ | Valid PINs / Attempts |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Square account (Sandbox/Production)
- Stripe account with Connect enabled
- Resend account for emails

### Environment Variables
```bash
# Existing
DATABASE_URL=...
NEXTAUTH_SECRET=...
SQUARE_ACCESS_TOKEN=...
STRIPE_SECRET_KEY=...

# New for Affiliate System
STRIPE_CONNECT_CLIENT_ID=...
AFFILIATE_PIN_SALT_ROUNDS=12
AFFILIATE_MIN_PAYOUT=25.00
```

### Initial Setup
```bash
# 1. Install dependencies
npm install

# 2. Run migrations
npx prisma migrate dev --name add-affiliate-system

# 3. Seed initial data (optional)
npx prisma db seed

# 4. Start development server
npm run dev
```

### First Affiliate Test
```bash
# 1. Create test affiliate
POST /api/affiliates/apply
{
  "businessName": "Test Affiliate",
  "pin": "1234"
}

# 2. Admin approves
POST /api/admin/affiliates/{id}/approve
{
  "approved": true,
  "commissionType": "PERCENTAGE",
  "commissionValue": 15
}

# 3. Create affiliate link
POST /api/events/{eventId}/affiliates/{affiliateId}/link
{
  "commissionType": "PERCENTAGE",
  "commissionValue": 15
}

# 4. Test purchase with affiliate code
POST /api/events/{eventId}/purchase
{
  ...purchase data...,
  "affiliateCode": "GENERATED_CODE"
}
```

---

## 📞 Support & Questions

### Development Team
- **Architect:** Winston (BMAD Architect Agent)
- **Documentation:** Complete in `/docs` folder
- **Code Location:** TBD (to be implemented)

### Resources
- Main Architecture: `AFFILIATE-SALES-ARCHITECTURE.md`
- Quick Reference: `AFFILIATE-SALES-QUICK-REFERENCE.md`
- Visual Diagrams: `AFFILIATE-SALES-SYSTEM-DIAGRAM.md`
- Business Models: `AFFILIATE-BUSINESS-MODELS-COMPARISON.md`

### Need Help?
1. Check the appropriate documentation file
2. Review code comments (when implemented)
3. Consult the development team
4. Refer to Prisma schema for data structure

---

## ✅ Pre-Implementation Checklist

Before starting development, ensure:

- [ ] All documentation reviewed and approved
- [ ] Business model chosen (Pre-Buy, Pay-Later, or both)
- [ ] Commission structure defined
- [ ] Development environment ready
- [ ] Database backup created
- [ ] Stripe Connect account configured
- [ ] Email templates prepared
- [ ] Testing plan created
- [ ] Staging environment available
- [ ] Team onboarded and trained

---

## 🎓 Learning Path

### For New Team Members

**Week 1: Understanding**
- Read all documentation (4 files)
- Review existing codebase
- Understand current order/payment flow
- Study Prisma schema

**Week 2: Planning**
- Review Phase 1 requirements
- Set up development environment
- Create test accounts (Square, Stripe)
- Plan database migrations

**Week 3: Implementation**
- Begin Phase 1 coding
- Daily standups with team
- Code reviews
- Testing

**Ongoing:**
- Follow implementation phases
- Regular testing
- Documentation updates
- Security reviews

---

## 📝 Notes

### Design Principles
1. **Simplicity First** - Start with core features, add complexity later
2. **User-Friendly** - Easy for affiliates to use (even non-technical)
3. **Secure by Default** - PIN validation, audit trails, fraud detection
4. **Scalable** - Designed for 1000+ affiliates, 10k+ sales
5. **Flexible** - Supports multiple business models and commission structures

### Future Enhancements (Post-MVP)
- Multi-level affiliate (referral chains)
- Affiliate recruitment bonuses
- Custom branding for affiliate links
- Social media integration
- White-label affiliate portals
- Advanced fraud detection (ML-based)
- Mobile app (iOS/Android)

---

## 📄 Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-02 | Initial architecture complete | Winston (Architect) |

---

## 🔗 Related Documentation

- **Main Project README:** `/README.md`
- **API Documentation:** `/docs/API.md` (to be created)
- **Database Schema:** `/prisma/schema.prisma`
- **Environment Variables:** `/.env.example`

---

**Last Updated:** 2025-10-02
**Status:** ✅ Ready for Review & Implementation
**Next Step:** Begin Phase 1 - Foundation (Week 1-2)

---

For questions or clarification, refer to the detailed architecture document or contact the development team.
