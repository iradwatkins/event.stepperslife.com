# Story: SEC-001 - Two-Factor Authentication (2FA)

**Epic**: EPIC-012 - Performance & Security
**Story Points**: 5
**Priority**: E2 (Medium)
**Status**: Draft
**Dependencies**: US-002 (User Login), SMS service, Email service

---

## Story

**As a** security-conscious user
**I want to** enable two-factor authentication on my account
**So that** my account is protected even if my password is compromised

---

## Acceptance Criteria

1. GIVEN I want to enable 2FA on my account
   WHEN I access security settings
   THEN I should see 2FA setup options:
   - TOTP authenticator apps (Google Authenticator, Authy)
   - SMS-based codes (backup option)
   - Recovery codes for account recovery
   - Clear setup instructions for each method

2. GIVEN I choose to set up TOTP authentication
   WHEN I scan the QR code with my authenticator app
   THEN I should:
   - See the QR code and manual entry key
   - Enter verification code from my app
   - Receive confirmation that 2FA is enabled
   - Get downloadable recovery codes
   - See 2FA status in account settings

3. GIVEN I have 2FA enabled
   WHEN I log into my account
   THEN I should:
   - Enter username/password as normal
   - Be prompted for 2FA code
   - Enter 6-digit code from authenticator
   - Successfully authenticate with valid code
   - See error message for invalid codes
   - Have option to use recovery code if needed

4. GIVEN I need to use a recovery code
   WHEN my authenticator is unavailable
   THEN I should:
   - Have option to "Use Recovery Code"
   - Enter one of my saved recovery codes
   - Successfully authenticate
   - See that recovery code is now used/invalid
   - Be reminded to generate new recovery codes

5. GIVEN I want to disable 2FA
   WHEN I access security settings
   THEN I should:
   - Enter current password for verification
   - Enter current 2FA code confirmation
   - See warning about reduced security
   - Successfully disable 2FA after confirmation
   - Receive email notification of security change

6. GIVEN I'm an organizer handling sensitive data
   WHEN platform security policies are enforced
   THEN 2FA should:
   - Be strongly recommended for organizer accounts
   - Be required for accounts with high transaction volumes
   - Be mandatory for admin/support staff
   - Include audit logging for 2FA events

---

## Tasks / Subtasks

- [ ] Implement TOTP (Time-based One-Time Password) system (AC: 2, 3)
  - [ ] Install TOTP library (otpauth or speakeasy)
  - [ ] Generate TOTP secrets
  - [ ] Verify TOTP codes

- [ ] Create QR code generation for authenticator setup (AC: 2)
  - [ ] Generate QR codes with TOTP URI
  - [ ] Display QR code in UI
  - [ ] Provide manual entry key

- [ ] Build 2FA setup and management UI (AC: 1, 2, 5)
  - [ ] Create 2FA settings page
  - [ ] Build setup wizard
  - [ ] Add disable 2FA flow

- [ ] Implement SMS backup code system (AC: 1)
  - [ ] Integrate SMS service (Twilio)
  - [ ] Send 6-digit SMS codes
  - [ ] Verify SMS codes

- [ ] Create recovery code generation and validation (AC: 2, 4)
  - [ ] Generate 10 recovery codes
  - [ ] Store hashed recovery codes
  - [ ] Validate and mark as used

- [ ] Add 2FA requirement to login flow (AC: 3)
  - [ ] Modify login flow for 2FA
  - [ ] Prompt for 2FA code
  - [ ] Validate TOTP/SMS codes

- [ ] Implement 2FA bypass for recovery scenarios (AC: 4)
  - [ ] Add recovery code option
  - [ ] Validate recovery codes
  - [ ] Track usage

- [ ] Create audit logging for 2FA events (AC: 6)
  - [ ] Log 2FA setup
  - [ ] Log 2FA disable
  - [ ] Log failed 2FA attempts
  - [ ] Log recovery code usage

- [ ] Add 2FA status to user profiles (AC: 2)
  - [ ] Show 2FA enabled status
  - [ ] Display setup method
  - [ ] Show recovery codes remaining

- [ ] Implement 2FA enforcement policies (AC: 6)
  - [ ] Require 2FA for organizers
  - [ ] Require 2FA for admins
  - [ ] Enforce on high-value accounts

- [ ] Create 2FA backup and recovery documentation (AC: 1, 4)
  - [ ] Write user documentation
  - [ ] Create setup guides
  - [ ] Document recovery process

- [ ] Add 2FA metrics and monitoring (AC: 6)
  - [ ] Track 2FA adoption rate
  - [ ] Monitor failed attempts
  - [ ] Alert on suspicious patterns

---

## Dev Notes

### Architecture References

**Two-Factor Authentication** (`docs/architecture/security-architecture.md`):
- TOTP using SHA-1 algorithm (RFC 6238)
- 30-second time window
- 6-digit codes
- SMS as backup method (with rate limiting)
- 10 single-use recovery codes per account

**Security Best Practices** (`docs/architecture/security-architecture.md`):
- TOTP secrets stored encrypted
- Recovery codes stored hashed (bcrypt)
- Rate limiting on 2FA attempts (5 per 15 minutes)
- Account lockout after 10 failed 2FA attempts
- Email notification on 2FA changes

**2FA Requirements by Role** (`docs/architecture/security-architecture.md`):
- Attendees: Optional (recommended)
- Organizers: Strongly recommended
- High-volume organizers (>$10k/month): Required
- Admins: Required
- Support staff: Required

**Database Schema** (`prisma/schema.prisma`):
```prisma
model User {
  // ... existing fields
  twoFactorEnabled    Boolean  @default(false)
  twoFactorSecret     String?  // Encrypted TOTP secret
  twoFactorBackupCodes Json?   // Hashed recovery codes
  twoFactorMethod     TwoFactorMethod?
  phoneNumber         String?
  phoneNumberVerified Boolean  @default(false)
}

enum TwoFactorMethod {
  TOTP
  SMS
}

model TwoFactorAuditLog {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  action      String   // 'ENABLED', 'DISABLED', 'LOGIN_SUCCESS', 'LOGIN_FAIL', 'RECOVERY_USED'
  method      TwoFactorMethod?
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())

  @@index([userId, createdAt])
}
```

**Source Tree** (`docs/architecture/source-tree.md`):
```
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── 2fa/
│   │           ├── setup/route.ts
│   │           ├── verify/route.ts
│   │           ├── disable/route.ts
│   │           └── recovery/route.ts
│   ├── login/
│   │   └── 2fa/page.tsx
│   └── settings/
│       └── security/page.tsx
├── components/
│   └── auth/
│       ├── TwoFactorSetup.tsx
│       ├── TwoFactorVerify.tsx
│       ├── RecoveryCodes.tsx
│       └── QRCodeDisplay.tsx
└── lib/
    └── auth/
        ├── totp.ts
        ├── recovery-codes.ts
        └── 2fa-audit.ts
```

### Testing

**Testing Requirements for this story**:
- Unit tests for TOTP generation and verification
- Unit tests for recovery code generation
- Unit tests for time window validation
- Integration test for 2FA setup API
- Integration test for 2FA verification API
- E2E test for enabling 2FA
- E2E test for logging in with 2FA
- E2E test for using recovery codes
- E2E test for disabling 2FA
- Test SMS delivery (sandbox)
- Test rate limiting
- Test account lockout
- Security audit for TOTP implementation
- Test QR code generation
- Test audit logging

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