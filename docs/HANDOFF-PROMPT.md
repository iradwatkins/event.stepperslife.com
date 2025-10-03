# BMAD Agent Handoff - Affiliate & Staff Systems Implementation

**Date Created:** 2025-10-02
**Project:** Events SteppersLife - Affiliate Sales & Staff QR Scanning Systems
**Status:** Architecture & Sprint Planning Complete - Ready for Implementation
**Next Phase:** Development (Sprint 1 Start)

---

## 🎯 Quick Start Instructions

Copy the prompt below and paste it into your next Claude Code session:

---

## HANDOFF PROMPT (Copy Below)

```
You are working on the Events SteppersLife platform located at:
/root/websites/events-stepperslife

This is a Next.js 14 + TypeScript application running on port 3004 with Prisma + PostgreSQL.

CRITICAL: Follow the BMAD (Best Method Agent Decision) methodology defined in CLAUDE.md.
Transform into the appropriate BMAD agent for each task.

## What Has Been Completed

Two major systems have been fully architected and sprint-planned:

1. **Affiliate Ticket Sales System** - Allow affiliates to sell event tickets
2. **Staff QR Scanning System** - Mobile QR scanner for event check-in

Complete documentation exists in `/root/websites/events-stepperslife/docs/`

## Your Mission

Transform into the **dev** (developer) agent and begin Sprint 1 implementation of the Affiliate System.

Start by reading these documents IN THIS ORDER:

1. `/root/websites/events-stepperslife/docs/SYSTEM-INTEGRATION-OVERVIEW.md`
   - High-level overview of both systems and how they integrate

2. `/root/websites/events-stepperslife/docs/AFFILIATE-SALES-ARCHITECTURE.md`
   - Complete technical architecture for Affiliate System

3. `/root/websites/events-stepperslife/docs/sprints/SPRINT-PLAN.md`
   - 14-sprint breakdown with goals and deliverables

4. `/root/websites/events-stepperslife/docs/sprints/AFFILIATE-SYSTEM-STORIES.md`
   - 30 user stories with acceptance criteria for Affiliate System

5. `/root/websites/events-stepperslife/docs/sprints/PRODUCT-BACKLOG.md`
   - Prioritized backlog and dependencies

## Sprint 1 - Foundation (Week 1-2)

**Goal:** Set up affiliate system foundation with database, authentication, and basic CRUD

**Stories to Complete:**
- AFF-001 (5 pts): Affiliate Registration & Application
- AFF-002 (3 pts): Affiliate Approval Workflow
- AFF-003 (5 pts): Basic Affiliate Dashboard
- AFF-006 (5 pts): Event Organizer Affiliate Management UI
- AFF-026 (3 pts): Database Migrations & Schema

**Total:** 21 story points

## Step-by-Step Implementation Guide

### Step 1: Review Architecture (15 minutes)
Read the architecture documents listed above to understand:
- Database schema (Prisma models)
- API endpoints structure
- User roles and permissions
- Integration points with existing system

### Step 2: Database Setup (1-2 hours)
Story: AFF-026 - Database Migrations & Schema

Tasks:
- [ ] Add new Prisma models to `prisma/schema.prisma`:
  - Affiliate
  - AffiliateLink
  - AffiliateSale
  - AffiliatePayout
  - AffiliateTaxRecord
- [ ] Update existing models:
  - Add AFFILIATE to UserRole enum
  - Add affiliate fields to Ticket model
  - Add affiliate fields to Order model
  - Add affiliate fields to Event model
- [ ] Create migration: `npx prisma migrate dev --name add_affiliate_system`
- [ ] Generate Prisma client: `npx prisma generate`
- [ ] Verify migration in database

The exact schema is documented in:
`/root/websites/events-stepperslife/docs/AFFILIATE-SALES-ARCHITECTURE.md` (Section 4.1)

### Step 3: Affiliate Registration (4-6 hours)
Story: AFF-001 - Affiliate Registration & Application

Tasks:
- [ ] Create API endpoint: `app/api/affiliates/register/route.ts`
  - POST handler with email, name, phone validation
  - Create user with AFFILIATE role
  - Create affiliate record (status: PENDING)
  - Send verification email
  - Return success response

- [ ] Create registration page: `app/affiliate/register/page.tsx`
  - Form: email, firstName, lastName, phone, businessName
  - Validation (client + server)
  - Success/error handling
  - Redirect to "application pending" page

- [ ] Create email template: `lib/services/email.ts`
  - Add `sendAffiliateWelcomeEmail()` function
  - Template with next steps and approval timeline

Reference: AFFILIATE-SYSTEM-STORIES.md → AFF-001 for complete acceptance criteria

### Step 4: Affiliate Approval Workflow (2-4 hours)
Story: AFF-002 - Affiliate Approval Workflow

Tasks:
- [ ] Create admin API: `app/api/admin/affiliates/[affiliateId]/approve/route.ts`
  - POST handler to approve affiliate
  - Update affiliate.status = ACTIVE
  - Generate unique affiliate code
  - Send approval email with dashboard link

- [ ] Create admin UI: `app/admin/affiliates/page.tsx`
  - List pending affiliates
  - Approve/reject buttons
  - View application details
  - Filter by status

- [ ] Add approval email: `lib/services/email.ts`
  - sendAffiliateApprovalEmail() with login instructions

### Step 5: Basic Affiliate Dashboard (4-6 hours)
Story: AFF-003 - Basic Affiliate Dashboard

Tasks:
- [ ] Create dashboard page: `app/affiliate/dashboard/page.tsx`
  - Protected route (AFFILIATE role only)
  - Display affiliate stats (placeholder data for now)
  - Show affiliate code and tracking link
  - Navigation to other sections

- [ ] Create dashboard API: `app/api/affiliates/[affiliateId]/dashboard/route.ts`
  - GET handler returning stats
  - Total sales (0 for now)
  - Total earnings (0 for now)
  - Affiliate code and base tracking link

- [ ] Add RBAC helper: `lib/auth/rbac.ts`
  - requireAffiliateRole() middleware
  - checkAffiliateAccess() helper

### Step 6: Event Organizer Affiliate Management (4-6 hours)
Story: AFF-006 - Event Organizer Affiliate Management UI

Tasks:
- [ ] Create organizer page: `app/dashboard/events/[eventId]/affiliates/page.tsx`
  - List assigned affiliates for event
  - Add affiliate button
  - Set commission structure
  - View affiliate sales (placeholder)

- [ ] Create assignment API: `app/api/events/[eventId]/affiliates/route.ts`
  - GET: List affiliates for event
  - POST: Assign affiliate to event
  - PATCH: Update commission settings

- [ ] Add to event navigation: `app/dashboard/events/[eventId]/layout.tsx`
  - Add "Affiliates" tab

### Step 7: Testing & Documentation (2-3 hours)
- [ ] Manual testing of all flows
- [ ] Create test user accounts (admin, organizer, affiliate)
- [ ] Verify database migrations
- [ ] Test email sending (dev mode)
- [ ] Update README with setup instructions
- [ ] Document any deviations from original plan

## Definition of Done (Sprint 1)

✅ All database migrations applied successfully
✅ Affiliate can register and see "pending" status
✅ Admin can approve/reject affiliate applications
✅ Approved affiliates can log in and see basic dashboard
✅ Event organizers can assign affiliates to their events
✅ All APIs have proper authentication/authorization
✅ No TypeScript errors
✅ No console errors in browser
✅ Code follows existing project patterns
✅ Basic error handling in place

## Important Files to Reference

**Architecture:**
- `/root/websites/events-stepperslife/docs/AFFILIATE-SALES-ARCHITECTURE.md`
- `/root/websites/events-stepperslife/docs/STAFF-QR-SCANNING-ARCHITECTURE.md`
- `/root/websites/events-stepperslife/docs/SYSTEM-INTEGRATION-OVERVIEW.md`

**Sprint Planning:**
- `/root/websites/events-stepperslife/docs/sprints/SPRINT-PLAN.md`
- `/root/websites/events-stepperslife/docs/sprints/AFFILIATE-SYSTEM-STORIES.md`
- `/root/websites/events-stepperslife/docs/sprints/STAFF-SYSTEM-STORIES.md`
- `/root/websites/events-stepperslife/docs/sprints/PRODUCT-BACKLOG.md`

**Quick Reference:**
- `/root/websites/events-stepperslife/docs/AFFILIATE-SALES-QUICK-REFERENCE.md`
- `/root/websites/events-stepperslife/docs/AFFILIATE-BUSINESS-MODELS-COMPARISON.md`

**Existing Codebase:**
- `prisma/schema.prisma` - Database schema
- `lib/auth/auth.ts` - NextAuth configuration
- `lib/auth/rbac.ts` - Role-based access control
- `lib/services/email.ts` - Email service
- `app/api/` - API routes
- `app/dashboard/` - Organizer UI
- `app/admin/` - Admin UI

## Technical Notes

**Database:**
- PostgreSQL running on localhost:5435
- Database: events_stepperslife
- User: events_user
- Password: events_password (from .env.local)

**Development:**
- Run dev server: `npm run dev` (port 3004)
- Run migrations: `npx prisma migrate dev`
- Generate Prisma: `npx prisma generate`
- View database: `npx prisma studio`

**Authentication:**
- NextAuth.js is already configured
- Session-based auth
- Roles: SUPER_ADMIN, ADMIN, ORGANIZER, AFFILIATE (new), ATTENDEE

**Payments:**
- Square for ticket purchases (existing)
- Stripe Connect for affiliate payouts (to be set up later)

## BMAD Workflow

As you work, follow BMAD methodology:

1. **For implementation:** Transform into `dev` agent
2. **For testing:** Transform into `qa` agent
3. **For UI/UX questions:** Transform into `ux-expert` agent
4. **For architecture changes:** Transform into `architect` agent
5. **For sprint planning updates:** Transform into `sm` agent

Example:
"Transform into dev agent and implement AFF-001 (Affiliate Registration)"

## Questions to Ask If Stuck

1. "Show me the existing user registration flow in the codebase"
2. "What's the pattern for creating protected API routes?"
3. "How is email currently configured?"
4. "Show me an example of a dashboard page"
5. "What's the RBAC pattern for role-based access?"

## Success Criteria

By the end of Sprint 1, you should have:
1. A working affiliate registration flow
2. An admin approval interface
3. A basic affiliate dashboard
4. Event organizer can assign affiliates
5. All code committed and tested

## Next Steps After Sprint 1

Sprint 2 will cover:
- AFF-007: Event-Specific Affiliate Settings
- AFF-008: Unique Tracking Links with UTM Codes
- AFF-009: Affiliate Link Generator UI
- AFF-010: Link Performance Dashboard

But focus on Sprint 1 first!

## Ready to Start?

Say: "Transform into dev agent and begin Sprint 1. Start with reading SYSTEM-INTEGRATION-OVERVIEW.md to understand the full system architecture."
```

---

## End of Handoff Prompt

---

## Additional Context for Human Review

**What the Next Agent Needs to Know:**
1. All architecture is complete and documented
2. Sprint planning has 60 user stories across 14 sprints
3. Starting with Affiliate System (Sprint 1-7), then Staff System (Sprint 8-14)
4. Each sprint is 2 weeks with 25-30 story points
5. Database schema is defined in architecture docs
6. API contracts are documented
7. User flows are mapped out

**What Has NOT Been Started:**
- No code has been written yet
- No database migrations created
- No API endpoints built
- No UI components created
- This is a greenfield implementation on top of existing platform

**Critical Success Factors:**
1. Follow the sprint plan in order (dependencies matter)
2. Complete Definition of Done for each story
3. Test as you go (don't accumulate technical debt)
4. Use BMAD methodology (transform into appropriate agent)
5. Reference architecture docs frequently
6. Ask questions if something is unclear

**Estimated Timeline:**
- Sprint 1: 2 weeks (21 points)
- Total Affiliate System: 14 weeks (7 sprints)
- Total Staff System: 14 weeks (7 sprints)
- Grand Total: 28 weeks (~6.5 months)

**Team Recommendation:**
- 3-4 developers
- 1 QA engineer (can be part-time)
- 1 product owner (existing stakeholder)
- Scrum Master (can be tech lead)

---

## Files Created During This Session

**Architecture (6 files):**
1. AFFILIATE-SYSTEM-README.md
2. AFFILIATE-SALES-ARCHITECTURE.md
3. AFFILIATE-SALES-QUICK-REFERENCE.md
4. AFFILIATE-SALES-SYSTEM-DIAGRAM.md
5. AFFILIATE-BUSINESS-MODELS-COMPARISON.md
6. AFFILIATE-DOCUMENTATION-INDEX.md

**Staff System (1 file):**
7. STAFF-QR-SCANNING-ARCHITECTURE.md

**Integration (1 file):**
8. SYSTEM-INTEGRATION-OVERVIEW.md

**Sprint Planning (5 files):**
9. sprints/AFFILIATE-SYSTEM-STORIES.md
10. sprints/STAFF-SYSTEM-STORIES.md
11. sprints/SPRINT-PLAN.md
12. sprints/PRODUCT-BACKLOG.md
13. sprints/SPRINT-PLANNING-SUMMARY.md

**Handoff (1 file):**
14. HANDOFF-PROMPT.md (this file)

**Total:** 14 comprehensive documentation files

---

## Verification Checklist

Before handing off, verify:
- ✅ All architecture documents are complete
- ✅ All sprint planning documents are complete
- ✅ User stories have acceptance criteria
- ✅ Dependencies are documented
- ✅ Database schema is defined
- ✅ API contracts are specified
- ✅ File structure is documented
- ✅ BMAD methodology is explained
- ✅ Next steps are clear

**Status: READY FOR HANDOFF ✅**

---

*Created by: Winston (BMAD Architect Agent)*
*Date: 2025-10-02*
*For: Events SteppersLife Platform*
