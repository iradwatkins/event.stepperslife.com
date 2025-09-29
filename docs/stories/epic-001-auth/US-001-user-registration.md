# Story: US-001 - User Registration with Email Verification

**Epic**: EPIC-001 - User Authentication & Management
**Story Points**: 5
**Priority**: P0 (Critical)
**Status**: Draft

---

## Story

**As a** event attendee or organizer
**I want to** create an account with email verification
**So that** I can securely access the platform and my purchase history

---

## Acceptance Criteria

1. GIVEN I am on the registration page
   WHEN I enter a valid email address
   AND I enter a password meeting requirements (8+ chars, 1 uppercase, 1 number, 1 special)
   AND I agree to the terms of service
   AND I click "Create Account"
   THEN I should receive a verification email within 2 minutes
   AND I should see a confirmation message to check my email
   AND my account should be created with "unverified" status
   AND I should be redirected to a verification pending page

2. GIVEN I click the verification link in my email
   WHEN I access the verification URL
   THEN my account status should change to "verified"
   AND I should be redirected to the login page
   AND I should see a success message "Email verified successfully"

3. GIVEN I try to register with an already registered email
   WHEN I submit the registration form
   THEN I should see an error "This email is already registered"
   AND no duplicate account should be created
   AND I should see a link to the login page

4. GIVEN I enter invalid email format
   WHEN I try to submit the form
   THEN I should see real-time validation error "Please enter a valid email address"
   AND the form should not submit

5. GIVEN I enter a weak password
   WHEN I focus away from the password field
   THEN I should see password strength indicator
   AND requirements list showing what's missing

6. GIVEN the verification email expires (24 hours)
   WHEN I try to use the expired link
   THEN I should see "Verification link expired"
   AND have option to request new verification email

---

## Tasks / Subtasks

- [ ] Set up NextAuth.js with credentials provider (AC: 1)
  - [ ] Install NextAuth.js dependencies
  - [ ] Configure NextAuth.js options
  - [ ] Create API route for NextAuth

- [ ] Implement Argon2 password hashing (AC: 1)
  - [ ] Install argon2 package
  - [ ] Create password hashing utility
  - [ ] Add password validation regex

- [ ] Create user registration API endpoint (AC: 1, 3)
  - [ ] Create /api/auth/register endpoint
  - [ ] Implement duplicate email check
  - [ ] Add rate limiting (5 attempts per IP/hour)

- [ ] Design registration form with validation (AC: 1, 4, 5)
  - [ ] Create registration form component
  - [ ] Add form validation with Zod
  - [ ] Implement password strength indicator
  - [ ] Add real-time email validation

- [ ] Set up email service (SendGrid) integration (AC: 1, 2, 6)
  - [ ] Configure SendGrid API keys
  - [ ] Create email template for verification
  - [ ] Implement email sending function

- [ ] Create email verification system with tokens (AC: 2, 6)
  - [ ] Generate secure verification tokens
  - [ ] Store tokens in database with expiration
  - [ ] Create verification endpoint
  - [ ] Handle token expiration logic

- [ ] Create PostgreSQL user table with Prisma schema (AC: 1)
  - [ ] Define User model in schema.prisma
  - [ ] Add email verification fields
  - [ ] Run Prisma migrations

- [ ] Add audit logging for registration events (AC: 1, 3)
  - [ ] Log successful registrations
  - [ ] Log failed registration attempts
  - [ ] Log verification events

---

## Dev Notes

### Architecture References

**Database Schema** (`docs/architecture/system-overview.md`):
- PostgreSQL 15 with Prisma ORM
- User table must include: id, email, password (hashed), emailVerified, verificationToken, verificationTokenExpiry, createdAt, updatedAt

**Authentication** (`docs/architecture/security-architecture.md`):
- NextAuth.js with JWT
- Argon2 for password hashing (NOT bcrypt)
- Password requirements: 8+ characters, 1 uppercase, 1 number, 1 special character

**Email System** (`docs/architecture/system-overview.md`):
- SendGrid for transactional emails
- Email templates stored in `/emails` directory
- Rate limiting: 5 registration attempts per IP per hour

**Source Tree** (`docs/architecture/source-tree.md`):
```
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── [...nextauth]/route.ts
│   │       └── register/route.ts
│   └── register/page.tsx
├── components/
│   └── auth/
│       └── RegistrationForm.tsx
├── lib/
│   ├── auth.ts
│   ├── email.ts
│   └── validation.ts
└── emails/
    └── verification-email.tsx
```

### Testing

**Test Standards** (`docs/architecture/coding-standards.md`):
- Test file location: `__tests__/auth/registration.test.ts`
- Use Jest for unit tests
- Use Playwright for E2E tests
- Minimum 80% code coverage required
- Test file naming: `{feature}.test.ts`

**Testing Requirements for this story**:
- Unit tests for password validation
- Unit tests for email validation
- Integration test for registration API
- E2E test for complete registration flow
- E2E test for email verification flow
- Test rate limiting functionality
- Test duplicate email handling

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2024-01-15 | 1.0 | Initial story creation | SM Agent |

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