# Admin Login Credentials

## Server Configuration Fixed ✅

### Problem Identified
After removing Google OAuth, all SUPER_ADMIN users had no password hashes in the database. They were created via OAuth and had no way to log in with email/password credentials.

### Solution Applied
Added password hashes to all admin accounts using bcrypt (12 rounds).

---

## Admin Accounts

### Primary Admin
- **Email:** `iradwatkins@gmail.com`
- **Password:** `SteppersAdmin2025!`
- **Role:** SUPER_ADMIN
- **Status:** ✅ Active & Verified

### Secondary Admins
- **Email:** `bobbygwatkins@gmail.com`
- **Password:** `SteppersAdmin2025!`
- **Role:** SUPER_ADMIN
- **Status:** ✅ Active & Verified

- **Email:** `thestepperslife@gmail.com`
- **Password:** `SteppersAdmin2025!`
- **Role:** ATTENDEE (can be upgraded)
- **Status:** ✅ Active & Verified

---

## Test Accounts (QA)

- **Email:** `qatest@example.com`
- **Email:** `qatest2@example.com`
- **Email:** `test@example.com`
- **Note:** These have existing passwords from testing

---

## Authentication Configuration

✅ **Login Method:** Email + Password (Credentials Provider)
✅ **Session Strategy:** JWT
✅ **Password Hashing:** bcryptjs (12 rounds)
✅ **Session Duration:** 7 days
✅ **Session Refresh:** Every 24 hours
✅ **Role Refresh:** Every 5 minutes

---

## Testing Login

1. Navigate to: https://events.stepperslife.com/auth/login
2. Enter admin email and password
3. Should redirect to: `/dashboard`

### Expected Flow
```
Login Page → Enter Credentials → Authenticate → Redirect to Dashboard
```

---

## Security Notes

⚠️ **IMPORTANT:** Change these default passwords immediately in production!

### To Change Admin Password:
```javascript
// In Node.js console or script:
const bcrypt = require('bcryptjs');
const newPasswordHash = bcrypt.hashSync('YourNewSecurePassword123!', 12);

// Then update in database:
UPDATE users
SET "passwordHash" = 'paste_hash_here'
WHERE email = 'admin@example.com';
```

---

## What Was Removed

❌ Google OAuth (GoogleProvider)
❌ PrismaAdapter (not needed for credentials)
❌ Account linking logic
❌ OAuth-specific callbacks
❌ Email verification auto-updates

## What Remains

✅ Credentials authentication (email/password)
✅ JWT sessions
✅ Role-based access control
✅ Session refresh logic
✅ Clean auth configuration

---

## Files Modified

- [lib/auth/auth.config.ts](lib/auth/auth.config.ts) - Cleaned from 294 to 154 lines
- [app/auth/login/page.tsx](app/auth/login/page.tsx) - Email/password form
- Database: Added passwordHash to admin users

---

## Verification

✅ Login page loads correctly
✅ Credentials provider registered
✅ Password hashes verified
✅ Authentication flow tested
✅ Admin accounts accessible

**Status:** Server configuration is now correct and functional.
