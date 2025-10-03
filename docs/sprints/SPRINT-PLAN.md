# Sprint Plan: Affiliate & Staff Systems
## Events SteppersLife Platform

**Total Duration:** 14 sprints (28 weeks)
**Sprint Length:** 2 weeks each
**Team Velocity Target:** 25-30 story points per sprint

---

## Phase 1: Affiliate Ticket Sales System
**Duration:** Sprints 1-7 (14 weeks)
**Total Story Points:** 192

---

### Sprint 1: Foundation & Core Registration
**Duration:** 2 weeks
**Sprint Goal:** Establish affiliate registration and approval workflow

#### Stories
| Story ID | Title | Points |
|----------|-------|--------|
| AFF-001 | Affiliate Registration | 5 |
| AFF-002 | Admin Affiliate Approval Workflow | 5 |
| AFF-003 | Affiliate Profile Management | 3 |
| AFF-006 | Configure Pay-Later Commission Model | 5 |
| AFF-026 | Affiliate Support Portal | 5 |

**Total Points:** 23

#### Key Deliverables
- [ ] Affiliate registration form with validation
- [ ] Admin approval dashboard
- [ ] Email notification system
- [ ] Profile management interface
- [ ] Commission configuration UI
- [ ] Basic support portal

#### Dependencies
- Extend existing User model
- Create Affiliate and CommissionRule models
- Set up email service

#### Risks & Mitigation
- **Risk:** Tax ID encryption complexity
- **Mitigation:** Use established encryption library (crypto-js or similar)
- **Risk:** Email delivery issues
- **Mitigation:** Implement retry logic and fallback to admin notifications

---

### Sprint 2: Ticket Assignment & Inventory
**Duration:** 2 weeks
**Sprint Goal:** Enable event organizers to assign tickets to affiliates

#### Stories
| Story ID | Title | Points |
|----------|-------|--------|
| AFF-004 | Assign Tickets to Affiliate (Pre-buy Model) | 8 |
| AFF-005 | Affiliate Payment for Assigned Tickets | 8 |
| AFF-007 | Generate Affiliate Tracking Links | 5 |
| AFF-010 | PIN Management | 3 |

**Total Points:** 24

#### Key Deliverables
- [ ] Ticket assignment interface
- [ ] Inventory locking mechanism
- [ ] Square payment integration for affiliate purchases
- [ ] Tracking link generator with UTM parameters
- [ ] QR code generation for links
- [ ] PIN setup and management

#### Dependencies
- Sprint 1 completion
- Square API access confirmed
- AffiliateTicketAssignment model created

#### Risks & Mitigation
- **Risk:** Concurrent inventory assignment conflicts
- **Mitigation:** Implement database-level locking and transaction handling
- **Risk:** Square payment failures
- **Mitigation:** Comprehensive error handling and webhook validation

---

### Sprint 3: Sales Tracking & Cash Payments
**Duration:** 2 weeks
**Sprint Goal:** Enable online and cash sales with affiliate attribution

#### Stories
| Story ID | Title | Points |
|----------|-------|--------|
| AFF-008 | Online Ticket Purchase with Affiliate Attribution | 8 |
| AFF-009 | Cash Payment with PIN Validation | 13 |

**Total Points:** 21

#### Key Deliverables
- [ ] Affiliate attribution middleware
- [ ] Cookie/session management for attribution
- [ ] Commission calculation service
- [ ] Cash payment mobile interface
- [ ] PIN validation system
- [ ] Offline cash sale queueing
- [ ] QR ticket generation for cash sales

#### Dependencies
- Sprint 2 completion
- Mobile-optimized UI components
- SMS service integration (Twilio)

#### Risks & Mitigation
- **Risk:** Attribution cookie loss during checkout
- **Mitigation:** Multiple backup methods (session, local storage)
- **Risk:** Offline queue sync failures
- **Mitigation:** Extensive testing and conflict resolution logic

---

### Sprint 4: Affiliate Dashboard & Reporting
**Duration:** 2 weeks
**Sprint Goal:** Provide affiliates with comprehensive sales visibility

#### Stories
| Story ID | Title | Points |
|----------|-------|--------|
| AFF-011 | Affiliate Sales Dashboard | 8 |
| AFF-012 | Transaction History | 5 |
| AFF-013 | Earnings Summary & Projections | 5 |
| AFF-022 | Affiliate Marketing Resources | 5 |

**Total Points:** 23

#### Key Deliverables
- [ ] Interactive sales dashboard
- [ ] Charts and visualizations
- [ ] Transaction history with filtering
- [ ] Earnings projections
- [ ] Goal tracking system
- [ ] Marketing asset library
- [ ] Export functionality (CSV)

#### Dependencies
- Sprint 3 completion
- Charting library integrated (Recharts)
- Redis caching layer for performance

#### Risks & Mitigation
- **Risk:** Dashboard performance with large datasets
- **Mitigation:** Implement caching, pagination, and query optimization
- **Risk:** Asset storage costs
- **Mitigation:** Use CDN and optimize image sizes

---

### Sprint 5: Admin Management & Oversight
**Duration:** 2 weeks
**Sprint Goal:** Give event organizers full affiliate program control

#### Stories
| Story ID | Title | Points |
|----------|-------|--------|
| AFF-014 | Admin Affiliate Management Dashboard | 5 |
| AFF-015 | Admin Sales Overview Dashboard | 8 |
| AFF-016 | Manual Commission Adjustments | 5 |
| AFF-023 | Affiliate Notifications & Alerts | 5 |
| AFF-024 | Affiliate Leaderboard & Gamification | 5 |

**Total Points:** 28

#### Key Deliverables
- [ ] Admin affiliate management interface
- [ ] Sales analytics dashboard
- [ ] Commission adjustment workflow
- [ ] Email notification system
- [ ] Push notification setup (PWA)
- [ ] Leaderboard and badge system

#### Dependencies
- Sprint 4 completion
- WebSocket or polling for real-time updates
- Badge graphics and achievement logic

#### Risks & Mitigation
- **Risk:** Complex aggregation queries slow down admin dashboard
- **Mitigation:** Pre-calculate statistics with scheduled jobs
- **Risk:** Notification spam
- **Mitigation:** Smart batching and user preferences

---

### Sprint 6: Stripe Connect & Payouts
**Duration:** 2 weeks
**Sprint Goal:** Automate affiliate payouts via Stripe Connect

#### Stories
| Story ID | Title | Points |
|----------|-------|--------|
| AFF-017 | Stripe Connect Onboarding | 8 |
| AFF-018 | Automated Payout Processing | 13 |
| AFF-019 | Payout History & Statements | 5 |

**Total Points:** 26

#### Key Deliverables
- [ ] Stripe Connect OAuth integration
- [ ] KYC/onboarding flow
- [ ] Automated payout scheduler
- [ ] Payout retry logic
- [ ] Payout statement generation (PDF)
- [ ] Payout reconciliation

#### Dependencies
- Sprint 5 completion
- Stripe Connect account approved
- Test mode fully configured

#### Risks & Mitigation
- **Risk:** Stripe account verification delays for affiliates
- **Mitigation:** Clear documentation and support resources
- **Risk:** Payout failures not properly handled
- **Mitigation:** Comprehensive error handling and admin notifications
- **Risk:** Regulatory compliance issues
- **Mitigation:** Legal review of payout terms and conditions

---

### Sprint 7: Tax Compliance & Finishing Touches
**Duration:** 2 weeks
**Sprint Goal:** Complete tax compliance and system polish

#### Stories
| Story ID | Title | Points |
|----------|-------|--------|
| AFF-020 | 1099 Tax Form Generation | 8 |
| AFF-021 | Tax Settings & W-9 Management | 5 |
| AFF-025 | Refund Impact on Affiliate Earnings | 8 |
| AFF-027 | Comprehensive Integration Tests | 13 |
| AFF-028 | User Acceptance Testing (UAT) | 8 |
| AFF-029 | Affiliate User Documentation | 5 |
| AFF-030 | Admin User Documentation | 3 |

**Total Points:** 50 (High point sprint for final push)

#### Key Deliverables
- [ ] 1099-NEC form generation
- [ ] W-9 electronic signature
- [ ] Refund handling logic
- [ ] Complete test suite (>85% coverage)
- [ ] UAT with real affiliates
- [ ] Comprehensive documentation
- [ ] Video tutorials

#### Dependencies
- Sprint 6 completion
- IRS form templates
- E-signature service integration
- UAT participants recruited

#### Risks & Mitigation
- **Risk:** Tax form accuracy issues
- **Mitigation:** Legal/accounting review before production
- **Risk:** UAT reveals major issues
- **Mitigation:** Buffer time planned for fixes
- **Risk:** Documentation gaps
- **Mitigation:** Involve actual users in documentation review

#### Go-Live Checklist
- [ ] All critical bugs resolved
- [ ] UAT sign-off received
- [ ] Documentation published
- [ ] Training materials ready
- [ ] Monitoring and alerts configured
- [ ] Rollback plan documented
- [ ] Legal/compliance review complete

---

## Phase 2: Staff QR Scanning System
**Duration:** Sprints 8-14 (14 weeks)
**Total Story Points:** 195

---

### Sprint 8: Staff Management Foundation
**Duration:** 2 weeks
**Sprint Goal:** Establish staff assignment and access control

#### Stories
| Story ID | Title | Points |
|----------|-------|--------|
| STAFF-001 | Assign Staff to Event | 5 |
| STAFF-002 | Staff Invitation & Access Code | 3 |
| STAFF-003 | Staff Login with Access Code | 5 |
| STAFF-004 | Staff Role Permissions | 5 |
| STAFF-005 | Staff List & Management (Organizer View) | 5 |

**Total Points:** 23

#### Key Deliverables
- [ ] EventStaff model and associations
- [ ] Staff role hierarchy
- [ ] Access code generation and validation
- [ ] Email invitation system
- [ ] RBAC middleware
- [ ] Staff management interface

#### Dependencies
- Existing User and Event models
- Email service from Phase 1
- Role-based permission system

#### Risks & Mitigation
- **Risk:** Access code security vulnerabilities
- **Mitigation:** Use cryptographically secure random generation and hashing
- **Risk:** Permission logic complexity
- **Mitigation:** Comprehensive unit tests for all role combinations

---

### Sprint 9: PWA & Camera Setup
**Duration:** 2 weeks
**Sprint Goal:** Build PWA foundation and camera access

#### Stories
| Story ID | Title | Points |
|----------|-------|--------|
| STAFF-006 | PWA Installation & Setup | 8 |
| STAFF-007 | Camera Access & QR Detection | 13 |
| STAFF-024 | Dark Mode | 3 |

**Total Points:** 24

#### Key Deliverables
- [ ] PWA manifest and service worker
- [ ] Install prompts for iOS and Android
- [ ] Camera API integration
- [ ] @zxing/browser QR detection
- [ ] Visual QR code highlighting
- [ ] Flashlight toggle
- [ ] Dark mode theme

#### Dependencies
- Sprint 8 completion
- Device testing lab access
- Workbox for service worker management

#### Risks & Mitigation
- **Risk:** Camera permission denied by users
- **Mitigation:** Clear messaging and fallback to manual entry
- **Risk:** Poor QR detection in low light
- **Mitigation:** Flashlight feature and image enhancement
- **Risk:** iOS PWA limitations
- **Mitigation:** Document limitations and provide workarounds

---

### Sprint 10: QR Validation & Performance
**Duration:** 2 weeks
**Sprint Goal:** Complete scanning workflow with optimal performance

#### Stories
| Story ID | Title | Points |
|----------|-------|--------|
| STAFF-008 | QR Code Validation & Check-in | 8 |
| STAFF-009 | Scan Performance Optimization | 8 |
| STAFF-014 | Public Ticket Display | 8 |

**Total Points:** 24

#### Key Deliverables
- [ ] QR code signature verification
- [ ] Ticket validation API (sub-500ms)
- [ ] Visual/audio feedback system
- [ ] Performance optimizations
- [ ] Continuous scanning mode
- [ ] Public ticket view page
- [ ] Screen wake lock
- [ ] Brightness boost

#### Dependencies
- Sprint 9 completion
- Database indexing optimized
- CDN configured for static assets

#### Risks & Mitigation
- **Risk:** Validation API too slow under load
- **Mitigation:** Caching, database optimization, load balancing
- **Risk:** Continuous scanning drains battery
- **Mitigation:** Optimize camera usage and frame rate
- **Risk:** Screen brightness control not supported
- **Mitigation:** Graceful degradation with manual controls

---

### Sprint 11: Offline Mode & Sync
**Duration:** 2 weeks
**Sprint Goal:** Enable offline functionality with robust sync

#### Stories
| Story ID | Title | Points |
|----------|-------|--------|
| STAFF-010 | Offline Scanning & Sync | 13 |
| STAFF-015 | Email Ticket with QR Code | 5 |
| STAFF-021 | Check-in Notes & Issues | 5 |

**Total Points:** 23

#### Key Deliverables
- [ ] IndexedDB storage layer
- [ ] Offline ticket validation
- [ ] Sync queue and conflict resolution
- [ ] Background Sync API integration
- [ ] Email ticket delivery
- [ ] Check-in notes system
- [ ] Photo attachment support

#### Dependencies
- Sprint 10 completion
- Service worker from Sprint 9
- Background Sync API support checked

#### Risks & Mitigation
- **Risk:** Sync conflicts with concurrent updates
- **Mitigation:** Last-write-wins with admin override capability
- **Risk:** IndexedDB quota exceeded
- **Mitigation:** Data cleanup and size monitoring
- **Risk:** Offline validation inaccurate
- **Mitigation:** Prefetch all ticket data on login

---

### Sprint 12: Manual Check-in & Search
**Duration:** 2 weeks
**Sprint Goal:** Provide comprehensive manual check-in capabilities

#### Stories
| Story ID | Title | Points |
|----------|-------|--------|
| STAFF-011 | Manual Search & Check-in | 5 |
| STAFF-012 | Attendee Detail View | 5 |
| STAFF-013 | Bulk Check-in Operations | 8 |
| STAFF-022 | VIP & Special Accommodations | 5 |

**Total Points:** 23

#### Key Deliverables
- [ ] Search interface with fuzzy matching
- [ ] Attendee detail modal
- [ ] QR code regeneration
- [ ] Bulk check-in interface
- [ ] VIP flagging system
- [ ] Special accommodation tracking
- [ ] Undo functionality

#### Dependencies
- Sprint 11 completion
- Elasticsearch or PostgreSQL full-text search
- Bulk operation queue system

#### Risks & Mitigation
- **Risk:** Search performance with large events
- **Mitigation:** Indexed search with pagination
- **Risk:** Bulk operations timeout
- **Mitigation:** Queue-based processing with progress tracking
- **Risk:** Accidental bulk check-ins
- **Mitigation:** Confirmation dialog and undo feature

---

### Sprint 13: Real-time Tracking & Multi-device Sync
**Duration:** 2 weeks
**Sprint Goal:** Enable real-time collaboration across devices

#### Stories
| Story ID | Title | Points |
|----------|-------|--------|
| STAFF-016 | Real-time Check-in Dashboard | 8 |
| STAFF-017 | Staff Activity Tracking | 5 |
| STAFF-018 | Check-in History & Audit Log | 5 |
| STAFF-019 | Multi-device Synchronization | 13 |
| STAFF-020 | Collision Detection & Warnings | 5 |

**Total Points:** 36 (High point sprint)

#### Key Deliverables
- [ ] WebSocket server with Socket.io
- [ ] Real-time dashboard with charts
- [ ] Staff activity monitoring
- [ ] Comprehensive audit logging
- [ ] Multi-device sync mechanism
- [ ] Duplicate check-in warnings
- [ ] Fraud detection alerts

#### Dependencies
- Sprint 12 completion
- WebSocket infrastructure (Socket.io)
- Redis for pub/sub (recommended)

#### Risks & Mitigation
- **Risk:** WebSocket connection instability
- **Mitigation:** Fallback to polling, automatic reconnection
- **Risk:** High server load with many concurrent connections
- **Mitigation:** Load testing and scaling strategy
- **Risk:** Message queue overload during peak times
- **Mitigation:** Message batching and throttling

---

### Sprint 14: Polish, Testing & Documentation
**Duration:** 2 weeks
**Sprint Goal:** Complete testing, documentation, and final polish

#### Stories
| Story ID | Title | Points |
|----------|-------|--------|
| STAFF-023 | Multi-language Support | 8 |
| STAFF-025 | Comprehensive Integration Tests | 13 |
| STAFF-026 | Performance & Load Testing | 8 |
| STAFF-027 | Security Testing & Audit | 8 |
| STAFF-028 | Cross-browser & Device Testing | 5 |
| STAFF-029 | Staff User Documentation | 5 |
| STAFF-030 | Organizer Documentation | 3 |

**Total Points:** 50 (Final push sprint)

#### Key Deliverables
- [ ] Spanish translation complete
- [ ] Comprehensive test suite (>85% coverage)
- [ ] Load testing report (100+ concurrent users)
- [ ] Security audit report
- [ ] Browser compatibility matrix
- [ ] User documentation with videos
- [ ] Organizer documentation
- [ ] Quick reference cards

#### Dependencies
- Sprint 13 completion
- Translation service (Lokalise/Crowdin)
- Load testing tools (k6, Artillery)
- Security audit tools
- BrowserStack for device testing

#### Risks & Mitigation
- **Risk:** Translation quality issues
- **Mitigation:** Native speaker review
- **Risk:** Load testing reveals scalability issues
- **Mitigation:** Planned buffer for optimization
- **Risk:** Security vulnerabilities discovered
- **Mitigation:** Time allocated for fixes before launch

#### Go-Live Checklist
- [ ] All critical bugs resolved
- [ ] Load testing passed (100+ concurrent users)
- [ ] Security audit passed
- [ ] Documentation complete
- [ ] Training sessions conducted
- [ ] Monitoring configured
- [ ] Incident response plan ready
- [ ] Rollback plan tested

---

## Overall Project Timeline

### Phase 1: Affiliate System
- **Sprints 1-7:** 14 weeks
- **Launch Target:** End of Week 14

### Phase 2: Staff System
- **Sprints 8-14:** 14 weeks
- **Launch Target:** End of Week 28

### Total Project Duration
- **14 sprints / 28 weeks / ~6.5 months**

---

## Resource Requirements

### Development Team
- **2-3 Full-stack Developers**
- **1 Frontend Specialist** (for PWA and mobile optimization)
- **1 Backend Specialist** (for real-time sync and scaling)
- **1 QA Engineer** (full-time from Sprint 4)
- **1 Product Owner** (part-time)
- **1 Scrum Master/PM** (part-time)

### Infrastructure
- **Development Environment:** Next.js on Vercel/similar
- **Database:** PostgreSQL (Supabase or managed service)
- **Caching:** Redis for sessions and real-time features
- **File Storage:** S3 or similar for assets
- **Email:** SendGrid or similar transactional email service
- **SMS:** Twilio for ticket delivery
- **Payments:** Square (existing) + Stripe Connect (new)
- **Monitoring:** Sentry for errors, Vercel Analytics or similar
- **CDN:** Vercel or Cloudflare

### Third-party Services
- **Stripe Connect:** Affiliate payouts
- **Square:** Payment processing
- **SendGrid/Postmark:** Email delivery
- **Twilio:** SMS delivery
- **BrowserStack:** Device testing
- **Lokalise/Crowdin:** Translation management

---

## Risk Management

### High-Risk Areas

#### Technical Risks
1. **Offline Sync Complexity** (STAFF-010, STAFF-019)
   - Complex conflict resolution
   - Data consistency challenges
   - Mitigation: Extensive testing, simple conflict rules

2. **Real-time Performance** (STAFF-016, STAFF-019)
   - WebSocket scalability
   - Database load under concurrent usage
   - Mitigation: Load testing, Redis pub/sub, database optimization

3. **QR Scanning Performance** (STAFF-007, STAFF-009)
   - Device fragmentation
   - Lighting conditions
   - Mitigation: Extensive device testing, flashlight feature

#### Business Risks
1. **Stripe Connect Approval**
   - Platform approval may take time
   - Mitigation: Apply early, have fallback manual payout plan

2. **Tax Compliance**
   - 1099 form accuracy critical
   - Mitigation: Legal review, accounting consultation

3. **User Adoption**
   - Affiliates may resist new system
   - Mitigation: Thorough training, excellent support

#### Schedule Risks
1. **Dependency Bottlenecks**
   - Some stories highly dependent on previous work
   - Mitigation: Clear sprint goals, regular dependency review

2. **Testing Time**
   - UAT and device testing time-intensive
   - Mitigation: Recruit testers early, parallelize testing

---

## Success Metrics

### Affiliate System
- **Adoption Rate:** 50+ active affiliates within 3 months
- **Sales Volume:** 20% of ticket sales through affiliates
- **Payout Success Rate:** >99% automated payouts succeed
- **Support Tickets:** <5 support tickets per 100 transactions

### Staff System
- **Scan Speed:** <1 second from QR detection to confirmation
- **Uptime:** 99.9% during event hours
- **Offline Success:** 95%+ offline check-ins sync successfully
- **User Satisfaction:** 4.5+ stars from staff users

---

## Sprint Ceremonies

### Daily Standup (15 minutes)
- What did you complete yesterday?
- What will you work on today?
- Any blockers?

### Sprint Planning (2-3 hours)
- Review sprint goal
- Story refinement
- Point estimation
- Commitment to sprint backlog

### Sprint Review/Demo (1-2 hours)
- Demo completed stories to stakeholders
- Gather feedback
- Update product backlog

### Sprint Retrospective (1 hour)
- What went well?
- What could be improved?
- Action items for next sprint

### Backlog Refinement (1-2 hours, mid-sprint)
- Refine upcoming stories
- Technical spike planning
- Dependency identification

---

## Definition of Done (DoD)

### Story-level DoD
- [ ] Code written following style guide
- [ ] Peer reviewed and approved
- [ ] Unit tests written (>80% coverage for new code)
- [ ] Integration tests for critical paths
- [ ] Manual testing completed
- [ ] Documentation updated (inline comments, README)
- [ ] Deployed to staging environment
- [ ] Product Owner acceptance

### Sprint-level DoD
- [ ] All story-level DoD met
- [ ] Sprint demo completed
- [ ] Retrospective action items documented
- [ ] No critical bugs in staging
- [ ] Performance benchmarks met
- [ ] Security scan passed

### Release-level DoD
- [ ] All sprint-level DoD met
- [ ] UAT completed and signed off
- [ ] User documentation published
- [ ] Training materials ready
- [ ] Monitoring and alerts configured
- [ ] Rollback plan tested
- [ ] Legal/compliance review complete
- [ ] Go-live checklist complete

---

## Change Management

### Story Point Re-estimation
- Stories can be re-pointed during refinement if complexity changes
- Requires team consensus
- Document reason for change

### Scope Changes
- New stories can be added to backlog anytime
- Mid-sprint additions require:
  - Product Owner approval
  - Team capacity check
  - Removal of equal-point stories if at capacity

### Sprint Goal Changes
- Sprint goals are fixed once sprint starts
- Emergency changes require:
  - Stakeholder approval
  - Team agreement
  - Documentation of reason

---

## Communication Plan

### Stakeholder Updates
- **Weekly:** Sprint progress email to leadership
- **Bi-weekly:** Sprint review with stakeholders
- **Monthly:** Metrics dashboard review

### Team Communication
- **Daily:** Standup (Slack or in-person)
- **Continuous:** Slack for async communication
- **As needed:** Pairing sessions, technical discussions

### Documentation
- **Living:** This sprint plan (updated as needed)
- **Per Sprint:** Sprint goals and outcomes
- **Per Release:** Release notes for users

---

## Appendix

### Story Point Reference
- **1 point:** 1-2 hours
- **2 points:** 2-4 hours
- **3 points:** 4-8 hours (half day to full day)
- **5 points:** 1-2 days
- **8 points:** 2-3 days
- **13 points:** 3-5 days (consider breaking down)

### Velocity Tracking
| Sprint | Committed | Completed | Variance |
|--------|-----------|-----------|----------|
| 1 | 23 | TBD | TBD |
| 2 | 24 | TBD | TBD |
| ... | ... | ... | ... |

### Technical Debt Log
- Track technical debt items
- Prioritize in backlog refinement
- Allocate 10-20% of velocity to debt reduction

---

## Next Steps After Planning

1. **Team Onboarding**
   - Review sprint plan with full team
   - Clarify roles and responsibilities
   - Set up development environments

2. **Sprint 1 Kickoff**
   - Detailed story refinement for Sprint 1
   - Set up project board (Jira, Linear, GitHub Projects)
   - Initialize code repository

3. **Stakeholder Alignment**
   - Present plan to leadership
   - Confirm resource allocation
   - Set up regular check-ins

4. **Infrastructure Setup**
   - Provision development and staging environments
   - Set up CI/CD pipeline
   - Configure monitoring and error tracking

5. **Third-party Account Setup**
   - Stripe Connect application
   - Square API access confirmation
   - Email/SMS service accounts

**Ready to begin Sprint 1!** 🚀
