# Story: US-002 - Secure User Login with JWT Authentication

**Epic**: EPIC-001 - User Authentication & Management
**Story Points**: 3
**Priority**: P0 (Critical)
**Status**: Draft
**Dependencies**: US-001 (User Registration)

---

## Story

**As a** registered user
**I want to** log in securely with persistent sessions
**So that** I can access my account and maintain session across browser restarts

---

## Acceptance Criteria

1. GIVEN I have a verified account
   WHEN I enter correct email and password
   AND I click "Sign In"
   THEN I should be logged in successfully
   AND redirected to my intended destination or dashboard
   AND receive a JWT token valid for 7 days
   AND see my name/avatar in the header
   AND see logout option in user menu

2. GIVEN I enter incorrect email or password
   WHEN I click "Sign In"
   THEN I should see "Invalid email or password" error
   AND remain on the login page
   AND failed attempt should be logged with IP address
   AND no session should be created

3. GIVEN I have failed 5 login attempts in 15 minutes
   WHEN I try to login again from same IP
   THEN I should be temporarily locked out for 15 minutes
   AND see "Too many failed attempts. Try again in X minutes"
   AND lockout timer should display countdown

4. GIVEN I check "Remember me" option
   WHEN I successfully log in
   THEN my session should persist for 30 days
   AND I should remain logged in after browser restart
   AND JWT token should have extended expiration

5. GIVEN I am already logged in
   WHEN I visit the login page
   THEN I should be redirected to my dashboard
   AND see message "You are already logged in"

6. GIVEN my JWT token expires
   WHEN I make an authenticated request
   THEN I should be redirected to login page
   AND see message "Session expired. Please log in again"
   AND my intended action should be preserved for after login

---

## Tasks / Subtasks

- [ ] Set up JWT token generation and validation (AC: 1, 4)
  - [ ] Install JWT library (jose or jsonwebtoken)
  - [ ] Create token signing utility
  - [ ] Implement token verification middleware

- [ ] Implement secure session management (AC: 1, 4, 6)
  - [ ] Configure NextAuth session strategy
  - [ ] Set up session persistence
  - [ ] Implement token refresh mechanism

- [ ] Create login API endpoint (AC: 1, 2)
  - [ ] Create /api/auth/login endpoint
  - [ ] Implement password verification
  - [ ] Generate JWT on successful auth

- [ ] Design login form with validation (AC: 1, 2)
  - [ ] Create login form component
  - [ ] Add form validation
  - [ ] Implement error display

- [ ] Add remember me functionality (AC: 4)
  - [ ] Create remember me checkbox
  - [ ] Extend session duration logic
  - [ ] Store extended session preference

- [ ] Implement rate limiting for login attempts (AC: 3)
  - [ ] Set up rate limiter (5 attempts per 15 min)
  - [ ] Track failed attempts by IP
  - [ ] Create lockout mechanism

- [ ] Add account lockout mechanism (AC: 3)
  - [ ] Implement temporary lockout logic
  - [ ] Create countdown timer display
  - [ ] Send lockout notification

- [ ] Create session persistence logic (AC: 1, 4)
  - [ ] Configure secure cookie settings
  - [ ] Implement httpOnly and secure flags
  - [ ] Set proper SameSite attribute

- [ ] Implement automatic token refresh (AC: 6)
  - [ ] Create token refresh endpoint
  - [ ] Add client-side refresh logic
  - [ ] Handle refresh failures

- [ ] Add login attempt audit logging (AC: 2, 3)
  - [ ] Log successful logins
  - [ ] Log failed login attempts
  - [ ] Track IP addresses and timestamps

- [ ] Create middleware for protected routes (AC: 5, 6)
  - [ ] Build authentication middleware
  - [ ] Add redirect logic for unauthenticated users
  - [ ] Preserve intended destination

- [ ] Add redirect handling for expired sessions (AC: 6)
  - [ ] Detect expired tokens
  - [ ] Store return URL
  - [ ] Redirect to login with return parameter

---

## Dev Notes

### Architecture References

**Authentication** (`docs/architecture/security-architecture.md`):
- NextAuth.js with JWT strategy
- JWT tokens valid for 7 days (default) or 30 days (remember me)
- Automatic token refresh before expiration
- Rate limiting: 5 attempts per IP per 15 minutes

**Security** (`docs/architecture/security-architecture.md`):
- Argon2 password verification
- Account lockout after 5 failed attempts
- Audit logging for all authentication events
- IP address tracking for security monitoring

**Source Tree** (`docs/architecture/source-tree.md`):
```
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── [...nextauth]/route.ts
│   │       └── login/route.ts
│   └── login/page.tsx
├── components/
│   └── auth/
│       └── LoginForm.tsx
├── lib/
│   ├── auth.ts
│   ├── jwt.ts
│   ├── rate-limiter.ts
│   └── session.ts
└── middleware.ts
```

### Testing

**Testing Requirements for this story**:
- Unit tests for JWT generation and validation
- Unit tests for rate limiting logic
- Integration test for login API endpoint
- E2E test for complete login flow
- E2E test for remember me functionality
- E2E test for account lockout mechanism
- Test session expiration handling
- Test redirect preservation

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