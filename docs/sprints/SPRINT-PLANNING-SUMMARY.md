# Sprint Planning Summary: Affiliate & Staff Systems
## Events SteppersLife Platform

**Date:** 2025-10-02
**Scrum Master:** [Assigned as SM agent]
**Planning Duration:** Comprehensive sprint planning session
**Status:** ✅ Ready for Development Kickoff

---

## Executive Summary

This document summarizes the comprehensive sprint planning effort for two major feature systems for the Events SteppersLife platform:

1. **Affiliate Ticket Sales System** (Release 1.0)
2. **Staff QR Scanning System** (Release 2.0)

### Key Metrics
- **Total User Stories:** 60
- **Total Story Points:** 387
- **Total Sprints:** 14 (28 weeks / ~6.5 months)
- **Total Epics:** 19
- **Team Velocity Target:** 25-30 points per sprint

### Deliverables Created
1. ✅ **AFFILIATE-SYSTEM-STORIES.md** - 30 user stories (192 points)
2. ✅ **STAFF-SYSTEM-STORIES.md** - 30 user stories (195 points)
3. ✅ **SPRINT-PLAN.md** - 14 detailed sprint plans
4. ✅ **PRODUCT-BACKLOG.md** - Prioritized backlog with epics

---

## Phase 1: Affiliate Ticket Sales System

### Overview
**Duration:** Sprints 1-7 (14 weeks)
**Total Stories:** 30
**Total Points:** 192
**Target Release:** End of Week 14

### Business Value
Enable event organizers to:
- Recruit and approve affiliates
- Assign tickets at wholesale prices (pre-buy model)
- Enable commission-based sales (pay-later model)
- Track sales with unique affiliate links
- Accept cash payments with PIN validation
- Automate payouts via Stripe Connect
- Generate 1099 tax forms
- Provide comprehensive sales analytics

### Sprint Breakdown

#### Sprint 1: Foundation & Core Registration (23 pts)
**Focus:** Registration, approval, and commission setup
- Affiliate registration with tax ID
- Admin approval workflow
- Profile management
- Commission configuration
- Support portal foundation

#### Sprint 2: Ticket Assignment & Inventory (24 pts)
**Focus:** Inventory management and tracking
- Assign tickets to affiliates
- Square payment integration
- Affiliate tracking link generation
- PIN management

#### Sprint 3: Sales Tracking & Cash Payments (21 pts)
**Focus:** Multi-channel sales attribution
- Online sales with affiliate attribution
- Cash payment with PIN validation
- Offline mode for cash sales
- QR ticket generation

#### Sprint 4: Affiliate Dashboard & Reporting (23 pts)
**Focus:** Affiliate self-service analytics
- Sales dashboard with charts
- Transaction history
- Earnings projections
- Marketing resource library

#### Sprint 5: Admin Management & Oversight (28 pts)
**Focus:** Program management and engagement
- Admin affiliate management
- Sales analytics dashboard
- Manual commission adjustments
- Notification system
- Leaderboard and gamification

#### Sprint 6: Stripe Connect & Payouts (26 pts)
**Focus:** Automated payment distribution
- Stripe Connect onboarding
- Automated weekly payouts
- Payout history and statements
- Retry logic for failures

#### Sprint 7: Tax Compliance & Launch (50 pts)
**Focus:** Compliance, testing, and documentation
- 1099-NEC generation
- W-9 management
- Refund handling
- Comprehensive testing (85%+ coverage)
- UAT with real affiliates
- Complete documentation

### Key Features Delivered

#### For Affiliates
- ✅ Self-service registration and onboarding
- ✅ Multiple sales models (pre-buy and commission)
- ✅ Tracking links with QR codes
- ✅ Mobile cash payment interface
- ✅ Real-time sales dashboard
- ✅ Automated weekly payouts
- ✅ Tax form generation
- ✅ Marketing resources

#### For Event Organizers
- ✅ Affiliate approval workflow
- ✅ Ticket assignment interface
- ✅ Commission configuration
- ✅ Sales analytics dashboard
- ✅ Manual adjustment capability
- ✅ Comprehensive reporting
- ✅ Affiliate performance tracking

#### For System
- ✅ Square payment integration
- ✅ Stripe Connect integration
- ✅ Email notification system
- ✅ SMS ticket delivery
- ✅ Offline cash sale queueing
- ✅ Automated payout scheduler
- ✅ Tax compliance automation

### Technical Highlights

**Models Created:**
- Affiliate
- AffiliateTicketAssignment
- CommissionRule
- AffiliateLink
- AffiliateEarning
- CashSale
- AffiliateAdjustment

**Integrations:**
- Square Payments API
- Stripe Connect API
- SendGrid/Postmark Email
- Twilio SMS
- DocuSign (optional for W-9)

**Infrastructure:**
- Redis for caching
- IndexedDB for offline cash sales
- S3 for marketing assets
- Scheduled jobs for payouts

---

## Phase 2: Staff QR Scanning System

### Overview
**Duration:** Sprints 8-14 (14 weeks)
**Total Stories:** 30
**Total Points:** 195
**Target Release:** End of Week 28

### Business Value
Enable event organizers to:
- Assign staff to events with role-based access
- Provide mobile PWA for rapid check-in
- Support offline scanning during connectivity issues
- Track real-time check-in statistics
- Enable multi-device collaboration
- Provide attendees with mobile-friendly tickets

### Sprint Breakdown

#### Sprint 8: Staff Management Foundation (23 pts)
**Focus:** Staff assignment and access control
- Assign staff to events
- Email invitations with access codes
- Access code login
- Role-based permissions (4 roles)
- Staff management interface

#### Sprint 9: PWA & Camera Setup (24 pts)
**Focus:** Mobile app foundation
- PWA manifest and service worker
- Camera API integration
- QR code detection with @zxing/browser
- Dark mode support

#### Sprint 10: QR Validation & Performance (24 pts)
**Focus:** Core scanning functionality
- QR code validation and signature verification
- Sub-1-second scan performance
- Public ticket display page
- Screen wake lock and brightness boost

#### Sprint 11: Offline Mode & Sync (23 pts)
**Focus:** Reliability and communication
- Offline scanning with IndexedDB
- Automatic sync when online
- Email ticket delivery
- Check-in notes and issues

#### Sprint 12: Manual Check-in & Search (23 pts)
**Focus:** Attendee lookup and bulk operations
- Search by name/email
- Attendee detail view
- Bulk check-in operations
- VIP and special accommodations

#### Sprint 13: Real-time Tracking & Multi-device Sync (36 pts)
**Focus:** Collaboration and visibility
- Real-time check-in dashboard
- Staff activity tracking
- Audit logging
- WebSocket-based multi-device sync
- Duplicate check-in warnings

#### Sprint 14: Polish, Testing & Documentation (50 pts)
**Focus:** Quality, localization, and launch
- Multi-language support (English, Spanish)
- Comprehensive integration tests
- Performance and load testing (100+ concurrent users)
- Security audit
- Cross-browser/device testing
- Complete documentation

### Key Features Delivered

#### For Staff Members
- ✅ Mobile PWA (installable)
- ✅ Camera-based QR scanning (<1s)
- ✅ Offline mode with sync
- ✅ Manual search and check-in
- ✅ Bulk operations
- ✅ Notes and issue reporting
- ✅ Dark mode

#### For Event Organizers
- ✅ Staff assignment with roles
- ✅ Real-time check-in dashboard
- ✅ Staff activity monitoring
- ✅ Comprehensive audit logs
- ✅ Export capabilities

#### For Attendees
- ✅ Public ticket view page
- ✅ Large QR code display
- ✅ Email ticket delivery
- ✅ Screen brightness optimization
- ✅ Add to Wallet (Apple/Google)

#### For System
- ✅ WebSocket real-time sync
- ✅ Offline-first architecture
- ✅ Multi-device collaboration
- ✅ Collision detection
- ✅ Fraud prevention
- ✅ Performance optimization

### Technical Highlights

**Models Created:**
- EventStaff
- StaffRole (enum)
- CheckinNote
- CheckinEvent (audit log)
- StaffActivity

**Technologies:**
- PWA with Workbox
- @zxing/browser for QR scanning
- IndexedDB for offline storage
- Socket.io for WebSocket
- Background Sync API
- Wake Lock API

**Infrastructure:**
- WebSocket server (Socket.io)
- Redis for pub/sub
- CDN for PWA assets
- Background job queue

---

## Key Success Metrics

### Affiliate System KPIs
- **Adoption Rate:** 50+ active affiliates within 3 months
- **Sales Volume:** 20% of ticket sales through affiliates
- **Payout Success:** >99% automated payouts succeed
- **Support Efficiency:** <5 support tickets per 100 transactions
- **User Satisfaction:** 4.5+ star rating from affiliates

### Staff System KPIs
- **Scan Speed:** <1 second from QR detection to confirmation
- **System Uptime:** 99.9% during event hours
- **Offline Success:** 95%+ offline check-ins sync successfully
- **User Satisfaction:** 4.5+ star rating from staff
- **Check-in Efficiency:** 50% reduction in check-in time vs manual

---

## Risk Analysis

### High-Risk Items Identified

#### Technical Risks
1. **Offline Sync Complexity** (STAFF-010, STAFF-019)
   - **Risk:** Data conflicts with concurrent offline updates
   - **Mitigation:** Simple last-write-wins strategy, extensive testing
   - **Contingency:** Admin override for critical conflicts

2. **Real-time Performance** (STAFF-016, STAFF-019)
   - **Risk:** WebSocket not scaling under load
   - **Mitigation:** Redis pub/sub, load balancing, connection pooling
   - **Contingency:** Fallback to polling

3. **QR Scanning Performance** (STAFF-007, STAFF-009)
   - **Risk:** Poor performance on low-end devices
   - **Mitigation:** Extensive device testing, optimization
   - **Contingency:** Manual entry always available

4. **Stripe Connect Approval** (AFF-017)
   - **Risk:** Platform approval delays
   - **Mitigation:** Apply early in Sprint 1
   - **Contingency:** Manual payout process temporarily

#### Business Risks
1. **Tax Compliance Accuracy** (AFF-020)
   - **Risk:** Incorrect 1099 forms create legal issues
   - **Mitigation:** Legal review, accounting consultation
   - **Contingency:** Manual form generation for first year

2. **User Adoption**
   - **Risk:** Affiliates resist new system
   - **Mitigation:** Thorough training, excellent onboarding
   - **Contingency:** Extended onboarding support

#### Schedule Risks
1. **UAT Delays** (AFF-028, STAFF-28)
   - **Risk:** Critical issues found during UAT
   - **Mitigation:** Internal testing before UAT
   - **Contingency:** Buffer time in final sprints

---

## Resource Requirements

### Development Team
**Minimum Team Size:** 4-6 people

**Recommended Composition:**
- **2-3 Full-stack Developers** (TypeScript, React, Node.js, PostgreSQL)
- **1 Frontend Specialist** (PWA, mobile optimization, performance)
- **1 Backend Specialist** (WebSocket, real-time systems, scaling)
- **1 QA Engineer** (automated testing, device testing)
- **1 Product Owner** (part-time, 20-40%)
- **1 Scrum Master** (part-time, 20-40%)

**Optional:**
- **1 UI/UX Designer** (for advanced interactions)
- **1 DevOps Engineer** (for infrastructure optimization)

### Infrastructure & Services

#### Required Services
- **Hosting:** Vercel, Netlify, or AWS/GCP
- **Database:** PostgreSQL (Supabase, AWS RDS, or similar)
- **Caching:** Redis (Upstash, Redis Cloud, or AWS ElastiCache)
- **File Storage:** S3 or Cloudflare R2
- **Email:** SendGrid, Postmark, or AWS SES
- **SMS:** Twilio
- **Payment Processing:** Square (existing) + Stripe Connect (new)
- **Monitoring:** Sentry, Vercel Analytics, or Datadog
- **CDN:** Cloudflare or Vercel Edge Network

#### Estimated Monthly Costs (Production)
- Hosting: $50-200
- Database: $25-100
- Redis: $10-50
- File Storage: $5-20
- Email: $10-50 (volume-based)
- SMS: $20-100 (volume-based)
- Monitoring: $25-100
- **Total:** $145-620/month (scales with usage)

### Third-party Accounts Needed
- ✅ Stripe Connect (merchant account)
- ✅ Square API access (confirm existing)
- ✅ SendGrid or Postmark
- ✅ Twilio account
- ⚠️ BrowserStack (for device testing, can use free tier)
- ⚠️ Lokalise/Crowdin (for translations, optional)

---

## Testing Strategy

### Test Coverage Goals
- **Unit Tests:** >80% code coverage
- **Integration Tests:** All critical user flows
- **E2E Tests:** Happy paths for both systems
- **Performance Tests:** Load testing for 100+ concurrent users
- **Security Tests:** OWASP top 10 vulnerabilities
- **Device Tests:** Top 10 devices + browsers

### Testing Phases

#### Sprint-level Testing (Continuous)
- Developer writes unit tests with feature
- Peer review includes test review
- QA performs manual exploratory testing
- Automated tests run in CI/CD

#### Pre-Release Testing (Sprint 7 & 14)
- UAT with 5-10 real users
- Performance benchmarking
- Security audit
- Cross-browser/device testing
- Load testing simulation
- Penetration testing

### Testing Tools
- **Unit/Integration:** Jest, Testing Library
- **E2E:** Playwright or Cypress
- **Load Testing:** k6, Artillery, or JMeter
- **Security:** Snyk, npm audit, OWASP ZAP
- **Device Testing:** BrowserStack
- **API Testing:** Postman/Newman

---

## Documentation Deliverables

### User Documentation (Both Systems)
✅ **Affiliate Documentation:**
- Getting started guide
- How to generate tracking links
- How to accept cash payments
- Dashboard guide
- Payout and tax information
- Troubleshooting
- FAQ
- Video tutorials

✅ **Staff Documentation:**
- Getting started for staff
- How to scan QR codes
- How to work offline
- Manual check-in guide
- Troubleshooting
- FAQ
- Video tutorials
- Quick reference card

✅ **Organizer Documentation:**
- How to set up affiliate program
- How to assign staff
- How to configure commissions
- How to monitor sales/check-ins
- How to export reports
- Best practices
- Security recommendations

### Technical Documentation
- **API Documentation:** OpenAPI/Swagger specs
- **Architecture Diagrams:** System design docs
- **Database Schema:** ERD and migration docs
- **Deployment Guide:** Infrastructure setup
- **Runbook:** Incident response procedures
- **Developer Onboarding:** Setup instructions

---

## Sprint Ceremonies & Cadence

### Daily (15 minutes)
- **Daily Standup**
  - What I completed yesterday
  - What I'm working on today
  - Any blockers

### Weekly
- **Backlog Refinement** (1-2 hours)
  - Groom upcoming stories
  - Estimate new stories
  - Clarify acceptance criteria

### Bi-weekly (Sprint Boundaries)
- **Sprint Planning** (2-3 hours)
  - Review sprint goal
  - Commit to sprint backlog
  - Break down stories into tasks

- **Sprint Review/Demo** (1-2 hours)
  - Demo completed work
  - Gather stakeholder feedback
  - Update product backlog

- **Sprint Retrospective** (1 hour)
  - What went well
  - What to improve
  - Action items

---

## Deployment Strategy

### Environment Strategy
1. **Development:** Feature branches, continuous deployment
2. **Staging:** Main branch, after PR merge
3. **Production:** Tagged releases, manual deployment gate

### Release Process

#### Affiliate System (End of Sprint 7)
1. Code freeze 2 days before release
2. Final UAT sign-off
3. Database migration dry-run
4. Deploy to production during low-traffic window
5. Monitor for 24 hours
6. Gradual rollout (feature flags if needed)

#### Staff System (End of Sprint 14)
1. Same process as Affiliate System
2. Additional: PWA cache warming
3. WebSocket server scaling verification
4. Real-device smoke testing post-deployment

### Rollback Plan
- Database migrations are reversible
- Previous Docker image tagged and ready
- Feature flags allow instant disable
- Rollback window: 15 minutes or less

---

## Next Steps for Development Team

### Immediate Actions (Week 1)

#### Day 1-2: Setup & Onboarding
- [ ] Review all sprint planning documents
- [ ] Set up project management tool (Jira/Linear/GitHub Projects)
- [ ] Create team Slack workspace/channels
- [ ] Assign team roles and responsibilities
- [ ] Schedule all sprint ceremonies

#### Day 3-4: Technical Setup
- [ ] Initialize code repository (monorepo structure recommended)
- [ ] Set up development environment
- [ ] Configure CI/CD pipeline (GitHub Actions, CircleCI, etc.)
- [ ] Provision infrastructure (dev, staging environments)
- [ ] Set up error tracking (Sentry)
- [ ] Configure database (PostgreSQL + Prisma)

#### Day 5: Sprint 1 Kickoff
- [ ] Detailed Sprint 1 story refinement
- [ ] Create technical design docs for AFF-001, AFF-002
- [ ] Assign stories to developers
- [ ] Set up first daily standup

### Week 2-3: Sprint 1 Execution
- [ ] Begin development on assigned stories
- [ ] Daily standups
- [ ] Mid-sprint backlog refinement
- [ ] Code reviews and testing

### Week 4: Sprint 1 Completion
- [ ] Complete all Sprint 1 stories
- [ ] Sprint review/demo
- [ ] Sprint retrospective
- [ ] Sprint 2 planning

### Third-party Setup (Parallel Track)
- [ ] Apply for Stripe Connect platform account (can take 1-2 weeks)
- [ ] Confirm Square API sandbox and production access
- [ ] Set up SendGrid/Postmark account
- [ ] Set up Twilio account with test numbers
- [ ] Acquire test devices for mobile testing

---

## Success Criteria for Launch

### Affiliate System Launch (Sprint 7)
**Must-Have (Go/No-Go):**
- [ ] All P0 stories completed and tested
- [ ] UAT sign-off from 5+ test affiliates
- [ ] >85% automated test coverage
- [ ] Security audit passed (no critical vulnerabilities)
- [ ] Stripe Connect integration tested in production
- [ ] Legal review of terms, W-9 forms, and 1099 generation
- [ ] Documentation published and accessible
- [ ] Support process and team ready

**Nice-to-Have:**
- [ ] All P1 stories completed
- [ ] Video tutorials produced
- [ ] Leaderboard functional

### Staff System Launch (Sprint 14)
**Must-Have (Go/No-Go):**
- [ ] All P0 stories completed and tested
- [ ] PWA installable on iOS and Android
- [ ] QR scanning <1 second average
- [ ] Offline mode tested extensively
- [ ] Load testing passed (100+ concurrent scanners)
- [ ] Security audit passed
- [ ] Cross-browser testing completed (Chrome, Safari, Firefox, Edge)
- [ ] Documentation published
- [ ] Staff training materials ready

**Nice-to-Have:**
- [ ] Multi-language support (Spanish)
- [ ] All P1 stories completed
- [ ] Dark mode functional

---

## Stakeholder Communication Plan

### Weekly Updates (Email/Dashboard)
**Audience:** Leadership, Product Owner, Key Stakeholders
**Format:**
- Sprint progress (velocity, burndown)
- Stories completed this week
- Stories planned for next week
- Blockers or risks
- Key decisions needed

### Bi-weekly Sprint Reviews
**Audience:** All stakeholders, team members
**Format:**
- Live demo of completed features
- Q&A session
- Feedback collection
- Roadmap updates

### Monthly Executive Summary
**Audience:** C-level, Board members
**Format:**
- High-level progress (% complete)
- Major milestones achieved
- Budget and timeline status
- Key risks and mitigation
- Strategic recommendations

---

## Contingency Plans

### If Velocity is Lower Than Expected
1. **After Sprint 2:** Re-estimate remaining backlog
2. **Options:**
   - Reduce scope (move P1 stories to Phase 3)
   - Extend timeline (add sprints)
   - Increase team size (add developers)
   - Simplify complex features

### If Critical Dependency Fails
**Stripe Connect Approval Delayed:**
- Implement manual payout process
- CSV export for batch transfers
- Defer AFF-017, AFF-018 to post-launch

**Browser Camera API Not Supported:**
- Emphasize manual entry workflow
- Provide barcode scanner hardware option
- Document limitations clearly

### If Major Bug Found in Production
1. Incident response team activated
2. Assess severity and impact
3. Options:
   - Hotfix if minor
   - Rollback if major
   - Feature flag disable if critical
4. Post-mortem and prevention plan

---

## Long-term Roadmap (Post-Release 2.0)

### Phase 3: Enhancements & Optimization (Months 7-9)
- Advanced affiliate analytics
- Multi-tier affiliate levels
- Affiliate mobile app
- Advanced fraud detection
- NFC badge scanning
- Seating chart integration

### Phase 4: Enterprise Features (Months 10-12)
- White-label solutions
- Custom branding
- SSO integration
- Advanced RBAC
- API for third-party integrations
- Multi-venue support

### Phase 5: Scale & Performance (Month 13+)
- Multi-currency support
- Multi-language expansion
- Advanced analytics with ML
- Predictive insights
- Native mobile apps (iOS/Android)

---

## Conclusion

### Summary of Achievements
This comprehensive sprint planning effort has delivered:

1. **60 Detailed User Stories** - Complete with acceptance criteria, story points, dependencies, and technical notes
2. **14 Sprint Plans** - Each with clear goals, deliverables, and risk mitigation
3. **19 Epic Groupings** - Organized by functional area and business value
4. **Prioritized Backlog** - Ready for immediate execution
5. **Risk Analysis** - With mitigation strategies for all high-risk items
6. **Resource Plan** - Team composition and infrastructure requirements
7. **Testing Strategy** - Comprehensive quality assurance approach
8. **Documentation Plan** - User and technical documentation scope

### Readiness Assessment
**Status: ✅ READY FOR SPRINT 1 KICKOFF**

**Green Lights:**
- ✅ Clear product vision and business value
- ✅ Well-defined user stories with testable criteria
- ✅ Realistic story point estimates
- ✅ Dependencies identified and manageable
- ✅ Risk mitigation strategies in place
- ✅ Resource requirements documented
- ✅ Testing and QA plan established

**Yellow Flags (Monitor):**
- ⚠️ Stripe Connect approval timeline uncertain
- ⚠️ Offline sync complexity may require additional spike
- ⚠️ Device fragmentation for PWA testing extensive
- ⚠️ Two 50-point sprints (7 and 14) are high-risk

**Mitigation for Yellow Flags:**
- Apply for Stripe Connect in Week 1
- Conduct technical spike for sync in Sprint 10
- Allocate budget for BrowserStack or device lab
- Plan buffer time in final sprints for overflow

### Team Readiness Checklist
Before Sprint 1 begins, ensure:
- [ ] All team members have read sprint planning docs
- [ ] Development environments are set up
- [ ] Project management tool is configured
- [ ] CI/CD pipeline is initialized
- [ ] Communication channels established
- [ ] Sprint ceremonies scheduled
- [ ] Product Owner availability confirmed
- [ ] Third-party accounts applied for

### Final Recommendation
**PROCEED WITH SPRINT 1**

This project is well-scoped, thoroughly planned, and ready for execution. The team should:

1. **Begin Sprint 1 immediately** with the Foundation & Core Registration stories
2. **Maintain discipline** around sprint ceremonies and Definition of Done
3. **Communicate proactively** when blockers or risks arise
4. **Stay agile** and be prepared to adjust based on velocity learnings
5. **Focus on quality** - the testing and documentation stories are not negotiable

**Expected Outcomes:**
- **In 14 weeks:** Fully functional Affiliate Ticket Sales System
- **In 28 weeks:** Complete platform with Staff QR Scanning System
- **Long-term:** Foundation for multi-million dollar ticketing platform

---

## Appendix: File Locations

All sprint planning documents are located at:
```
/root/websites/events-stepperslife/docs/sprints/
```

**Files Created:**
1. **AFFILIATE-SYSTEM-STORIES.md** - 30 user stories, 192 points
2. **STAFF-SYSTEM-STORIES.md** - 30 user stories, 195 points
3. **SPRINT-PLAN.md** - 14 detailed sprint plans
4. **PRODUCT-BACKLOG.md** - Prioritized backlog with epics
5. **SPRINT-PLANNING-SUMMARY.md** - This document

**Total Documentation:** 5 comprehensive documents, ~25,000 words

---

## Contact & Questions

**For Questions About:**
- Sprint planning methodology → Scrum Master
- User story details → Product Owner
- Technical approach → Lead Developer
- Testing strategy → QA Lead
- Infrastructure → DevOps Engineer

**Next Planning Session:** End of Sprint 1 (Week 2)
**Next Backlog Review:** Weekly refinement starting Week 1

---

**Document Status:** ✅ Complete and Ready for Distribution
**Approval Required From:**
- [ ] Product Owner
- [ ] Engineering Lead
- [ ] Project Sponsor
- [ ] Key Stakeholders

**Once Approved:** Distribute to all team members and begin Sprint 1!

---

*Generated by: Scrum Master (SM) Agent - BMAD Methodology*
*Date: 2025-10-02*
*Version: 1.0*
*Next Review: End of Sprint 1*
