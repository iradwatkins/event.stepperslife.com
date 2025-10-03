# 🧪 MANUAL TESTING GUIDE
## Events SteppersLife Platform - Pre-Launch Testing

**Purpose:** Verify all critical MVP features work end-to-end before launch
**Estimated Time:** 45-60 minutes
**Prerequisites:** Access to 2 email accounts (for transfer testing)

---

## 🚀 GETTING STARTED

### 1. Start the Development Server

```bash
cd /root/websites/events-stepperslife
PORT=3004 npm run dev
```

Wait for:
```
✓ Ready in XXXms
○ Local:        http://localhost:3004
```

### 2. Open Browser
Navigate to: `http://localhost:3004`

---

## ✅ TEST SUITE 1: USER AUTHENTICATION

### Test 1.1: New User Registration
**Time:** 3 minutes

1. Click **"Get Started"** or **"Sign Up"** button
2. Navigate to `/auth/register`
3. Fill in:
   - **Name:** Test Organizer
   - **Email:** organizer@test.com
   - **Password:** Password123!
   - **Confirm Password:** Password123!
4. Click **"Create Account"**

**Expected Result:**
- ✅ Redirected to email verification page
- ✅ Check email for verification link
- ✅ Click link and verify account
- ✅ Redirected to login

### Test 1.2: User Login
**Time:** 1 minute

1. Go to `/auth/login`
2. Enter:
   - **Email:** organizer@test.com
   - **Password:** Password123!
3. Click **"Sign In"**

**Expected Result:**
- ✅ Successfully logged in
- ✅ Redirected to `/dashboard`
- ✅ See welcome message with your name

---

## ✅ TEST SUITE 2: EVENT CREATION

### Test 2.1: Create a Test Event
**Time:** 5 minutes

1. From Dashboard, click **"Create Event"** card
2. Or go to `/dashboard/events/create`
3. Fill in event details:
   - **Event Name:** Test Stepping Event
   - **Description:** Testing refund and transfer features
   - **Start Date:** [Tomorrow's date]
   - **End Date:** [Tomorrow's date + 2 hours]
   - **Event Type:** General Admission
   - **Ticket Types:** Add one:
     - Name: General Admission
     - Price: $25.00
     - Quantity: 100
4. Click **"Create Event"**

**Expected Result:**
- ✅ Event created successfully
- ✅ Redirected to event details or event list
- ✅ Event appears in "My Events"

### Test 2.2: Publish the Event
**Time:** 1 minute

1. Go to `/dashboard/events`
2. Find your test event
3. Click **"Manage"** or **"View Details"**
4. If event is DRAFT, click **"Publish"** button

**Expected Result:**
- ✅ Event status changes to PUBLISHED
- ✅ Event is now visible to public (check `/events`)

---

## ✅ TEST SUITE 3: TICKET PURCHASE FLOW

### Test 3.1: Browse and Purchase Ticket
**Time:** 5 minutes

1. **Log out** from organizer account
2. Go to `/events` (public page)
3. Find your "Test Stepping Event"
4. Click to view event details
5. Click **"Get Tickets"** or **"Buy Now"**
6. Select quantity: **1 ticket**
7. Click **"Proceed to Checkout"**
8. Fill in Square payment form (use Square test card):
   - **Card Number:** 4111 1111 1111 1111
   - **Expiry:** Any future date (e.g., 12/25)
   - **CVV:** 123
   - **ZIP:** 12345
9. Click **"Pay $25.00"**

**Expected Result:**
- ✅ Payment processes successfully
- ✅ Redirected to success page
- ✅ See order confirmation
- ✅ Receive confirmation email with ticket

### Test 3.2: Verify Ticket in Dashboard
**Time:** 2 minutes

1. Click on user menu (top right)
2. Click **"My Tickets"**
3. OR go to `/dashboard/tickets`

**Expected Result:**
- ✅ See your purchased ticket
- ✅ Ticket status: **VALID**
- ✅ See event details
- ✅ See **"Transfer"** and **"Refund"** buttons

---

## ✅ TEST SUITE 4: TICKET REFUND FLOW (CRITICAL!)

### Test 4.1: Request Refund
**Time:** 3 minutes

1. From `/dashboard/tickets`, find your ticket
2. Click **"Refund"** button
3. Refund dialog opens

**Step 1: Eligibility Check**
- ✅ Dialog shows "Checking eligibility..."
- ✅ After few seconds, shows refund details:
  - Original price: $25.00
  - Refund fee: $2.50 (10%)
  - Refund amount: $22.50

**Step 2: Confirm Refund**
4. Read the warnings
5. (Optional) Enter reason: "Testing refund feature"
6. Click **"Request Refund"**

**Step 3: Processing**
- ✅ Shows "Processing refund..."
- ✅ Spinner appears

**Step 4: Success**
- ✅ Success message appears
- ✅ Shows refund amount
- ✅ Shows Square refund ID

**Expected Result:**
- ✅ Ticket status changes to **CANCELLED**
- ✅ Ticket disappears from "Upcoming" tab
- ✅ Refund shows in "Past" tab
- ✅ Receive refund confirmation email
- ✅ Check Square dashboard - refund should be visible

### Test 4.2: Verify Refund in Square
**Time:** 2 minutes

1. Go to Square Dashboard (sandbox)
2. Navigate to **Payments → Refunds**
3. Find your refund

**Expected Result:**
- ✅ Refund appears in Square
- ✅ Amount matches: $22.50
- ✅ Status: Completed or Processing

---

## ✅ TEST SUITE 5: TICKET TRANSFER FLOW (CRITICAL!)

### Test 5.1: Purchase Second Ticket
**Time:** 3 minutes

1. Go back to `/events`
2. Purchase another ticket (same event)
3. Use same Square test card
4. Verify ticket appears in `/dashboard/tickets`

### Test 5.2: Initiate Transfer (Sender)
**Time:** 3 minutes

1. From `/dashboard/tickets`, find your **new** ticket
2. Click **"Transfer"** button
3. Transfer dialog opens

**Step 1: Transfer Form**
4. Enter recipient email: **attendee@test.com**
   (Use a real email you can access!)
5. (Optional) Add message: "Here's your ticket for the event!"
6. Read transfer details:
   - 48-hour expiration
   - QR code will be regenerated
   - Cannot be undone after acceptance
7. Click **"Send Transfer"**

**Step 2: Processing**
- ✅ Shows "Sending transfer..."
- ✅ Spinner appears

**Step 3: Success**
- ✅ Success message appears
- ✅ Shows transfer ID
- ✅ Shows expiration time
- ✅ Instructions for recipient

**Expected Result:**
- ✅ Transfer sent successfully
- ✅ Ticket status may show "Transfer Pending" (if implemented)
- ✅ Email sent to attendee@test.com

### Test 5.3: Accept Transfer (Recipient)
**Time:** 5 minutes

1. Check email at **attendee@test.com**
2. Look for email: "You've received a ticket transfer"
3. Click **"Accept Transfer"** link in email
4. Opens: `/tickets/transfer/accept?transferId=XXX`

**On Transfer Accept Page:**
5. See transfer details:
   - Event name
   - Ticket type
   - Sender name/email
   - Personal message (if provided)
   - Expiration time
6. See two buttons: **"Accept"** and **"Decline"**

**Accept the Transfer:**
7. Click **"Accept Transfer"** button
8. Wait for processing

**Expected Result:**
- ✅ Success message: "Transfer accepted!"
- ✅ New QR code generated
- ✅ Ticket now belongs to recipient
- ✅ Both sender and recipient receive confirmation emails
- ✅ If recipient has account, ticket appears in their `/dashboard/tickets`

### Test 5.4: Verify Transfer Completion
**Time:** 2 minutes

1. **As sender (organizer@test.com):**
   - Go to `/dashboard/tickets`
   - Verify ticket is gone or shows "Transferred"

2. **As recipient (attendee@test.com):**
   - Create account if needed
   - Go to `/dashboard/tickets`
   - Verify ticket now appears
   - Verify new QR code is different from original

**Expected Result:**
- ✅ Ticket ownership transferred
- ✅ New QR code generated
- ✅ Old QR code invalidated
- ✅ Audit log created

---

## ✅ TEST SUITE 6: EVENT CANCELLATION (CRITICAL!)

### Test 6.1: Cancel Event with Tickets
**Time:** 5 minutes

**Prerequisites:** Event must have at least one valid ticket

1. Log in as organizer (organizer@test.com)
2. Go to `/dashboard/events`
3. Click **"Manage"** on your test event
4. Go to `/dashboard/events/[eventId]/manage`
5. Find **"Cancel Event"** button (usually in header, red button)
6. Click **"Cancel Event"**

**Step 1: Confirmation Screen**
- ✅ Dialog opens showing:
  - Event name
  - Number of tickets sold
  - Warning about refunds
  - "This action cannot be undone"

7. Click **"Continue"**

**Step 2: Cancellation Details**
8. Fill in:
   - **Reason:** "Testing cancellation feature" (min 10 chars)
   - ☑️ **Refund all tickets** (checked by default)
   - ☑️ **Notify attendees** (checked by default)
9. Type event name to confirm: **"Test Stepping Event"**
10. Click **"Cancel Event"**

**Step 3: Processing**
- ✅ Shows "Cancelling event..."
- ✅ Processing refunds...
- ✅ Sending emails...

**Step 4: Success**
11. See success screen with summary:
   - Tickets affected: X
   - Refunds processed: X
   - Emails sent: X
   - Any failed refunds (hopefully 0)

**Expected Result:**
- ✅ Event status: **CANCELLED**
- ✅ All tickets invalidated
- ✅ All attendees refunded
- ✅ All attendees receive cancellation email
- ✅ Refunds appear in Square dashboard
- ✅ Tickets in "My Tickets" show as cancelled

### Test 6.2: Verify Cancellation Impact
**Time:** 3 minutes

1. **Check Event Visibility:**
   - Go to `/events` (public)
   - Event should NOT appear in listings (or show as cancelled)

2. **Check Attendee Tickets:**
   - Log in as attendee
   - Go to `/dashboard/tickets`
   - Ticket should show status: **CANCELLED**
   - "Refund" and "Transfer" buttons should be disabled

3. **Check Emails:**
   - Verify cancellation email received
   - Contains reason
   - Contains refund information

**Expected Result:**
- ✅ Event no longer bookable
- ✅ All tickets invalidated
- ✅ Refunds processed
- ✅ Emails delivered

---

## ✅ TEST SUITE 7: ACCOUNT DELETION

### Test 7.1: Delete Account (No Active Events)
**Time:** 3 minutes

**Important:** Only test with attendee account (no active events)

1. Log in as attendee (attendee@test.com)
2. Go to `/dashboard/settings`
3. Click **"System"** tab
4. Scroll to **"Danger Zone"**
5. Click **"Delete Account"** button

**In Delete Modal:**
6. See warning about consequences:
   - All data will be deleted
   - Cannot be undone
   - Active tickets/events prevent deletion
7. Type your email to confirm: **attendee@test.com**
8. (Optional) Enter deletion reason
9. Click **"Delete Forever"**

**Expected Result:**
- ✅ Processing message appears
- ✅ Account soft-deleted (status: INACTIVE, deletedAt set)
- ✅ Logged out immediately
- ✅ Redirected to login page
- ✅ Cannot log in again with same credentials

### Test 7.2: Attempt Deletion with Active Event
**Time:** 2 minutes

1. Log in as organizer (with active events)
2. Go to Settings → System → Danger Zone
3. Try to delete account

**Expected Result:**
- ✅ Error message: "Cannot delete account with active events"
- ✅ Shows count of active events
- ✅ Deletion blocked

---

## ✅ TEST SUITE 8: EMAIL NOTIFICATIONS

### Test 8.1: Verify All Emails Sent
**Time:** 5 minutes

Check your email inbox for:

1. ✅ **Registration:** Welcome email with verification link
2. ✅ **Email Verification:** Confirmation email
3. ✅ **Order Confirmation:** After ticket purchase
4. ✅ **Ticket PDF:** Attached to order confirmation
5. ✅ **Transfer Notification:** To recipient
6. ✅ **Transfer Accepted:** To both sender and recipient
7. ✅ **Refund Confirmation:** After refund request
8. ✅ **Event Cancellation:** To all attendees

**For Each Email:**
- ✅ Opens correctly
- ✅ No broken links
- ✅ Contains correct information
- ✅ Attachments work (tickets)
- ✅ From address: noreply@events.stepperslife.com

---

## ✅ TEST SUITE 9: UI/UX TESTING

### Test 9.1: Navigation & Discoverability
**Time:** 5 minutes

1. **Header Navigation:**
   - ✅ Logo links to home
   - ✅ "Browse Events" works
   - ✅ User menu opens (top right)
   - ✅ "My Tickets" link appears in menu
   - ✅ "Dashboard" link works

2. **Dashboard Quick Actions:**
   - ✅ "My Tickets" card appears
   - ✅ Clicking opens `/dashboard/tickets`
   - ✅ All quick action cards work

3. **My Tickets Page:**
   - ✅ Shows all user tickets
   - ✅ Filter tabs work (Upcoming, Past, All)
   - ✅ Each ticket shows correct status
   - ✅ Action buttons appear on valid tickets

### Test 9.2: Error Handling
**Time:** 3 minutes

1. **Invalid Refund:**
   - Try to refund already-refunded ticket
   - ✅ Shows error message

2. **Invalid Transfer:**
   - Try to transfer to invalid email
   - ✅ Shows validation error

3. **Payment Failure:**
   - Use declined test card: 4000 0000 0000 0002
   - ✅ Shows payment failed message

---

## ✅ TEST SUITE 10: SQUARE INTEGRATION

### Test 10.1: Verify Square Transactions
**Time:** 5 minutes

1. Go to Square Dashboard (sandbox):
   - https://squareup.com/dashboard
   - Login with your Square sandbox credentials

2. **Check Payments:**
   - Navigate to "Payments"
   - ✅ See all test purchases
   - ✅ Correct amounts ($25.00)
   - ✅ Correct descriptions

3. **Check Refunds:**
   - Navigate to "Payments" → "Refunds"
   - ✅ See all test refunds
   - ✅ Correct refund amounts ($22.50)
   - ✅ Status: Completed

4. **Check Reconciliation:**
   - Net amount should match:
     - Purchases: $25.00 × N
     - Refunds: -$22.50 × M
     - Net: (N × 25) - (M × 22.50)

**Expected Result:**
- ✅ All transactions appear in Square
- ✅ Amounts match
- ✅ No duplicate charges
- ✅ Refunds processed correctly

---

## 🐛 BUG REPORTING TEMPLATE

If you find any issues during testing, document them:

```markdown
**Bug Title:** [Short description]

**Severity:** [Critical / High / Medium / Low]

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshots:**
[If applicable]

**Browser/Environment:**
- Browser: [Chrome/Firefox/Safari]
- Version: [Browser version]
- OS: [Windows/Mac/Linux]

**Additional Notes:**
[Any other relevant information]
```

---

## ✅ FINAL CHECKLIST

Before declaring "MVP Ready for Launch":

### Critical Features
- [ ] User registration and login works
- [ ] Event creation works
- [ ] Ticket purchase works (Square integration)
- [ ] Ticket refund works end-to-end
- [ ] Ticket transfer works end-to-end
- [ ] Event cancellation works
- [ ] Account deletion works
- [ ] My Tickets page displays correctly

### Email Notifications
- [ ] All emails sending correctly
- [ ] No broken links in emails
- [ ] Correct sender address
- [ ] Attachments work

### Square Integration
- [ ] Payments processing
- [ ] Refunds processing
- [ ] Transactions appear in Square dashboard
- [ ] Amounts correct

### UI/UX
- [ ] Navigation is clear
- [ ] "My Tickets" is discoverable
- [ ] Dialogs open and close correctly
- [ ] Error messages are helpful
- [ ] Loading states work

### Edge Cases
- [ ] Cannot refund cancelled ticket
- [ ] Cannot transfer cancelled ticket
- [ ] Cannot delete account with active events
- [ ] Cannot accept expired transfer

---

## 🎓 TROUBLESHOOTING

### Issue: Emails not sending
**Solution:**
```bash
# Check RESEND_API_KEY in .env.local
# Verify from email: noreply@events.stepperslife.com
# Check Resend dashboard for delivery status
```

### Issue: Square payment fails
**Solution:**
```bash
# Use Square test cards:
# Success: 4111 1111 1111 1111
# Decline: 4000 0000 0000 0002
# Check SQUARE_ENVIRONMENT=sandbox
```

### Issue: Database error
**Solution:**
```bash
# Check database is running:
docker ps | grep postgres

# Run migrations:
npx prisma migrate deploy
```

### Issue: Build fails
**Solution:**
```bash
# Clear Next.js cache:
rm -rf .next
npm run build
```

---

## 🚀 AFTER TESTING

Once all tests pass:

1. **Document Results:**
   - Note any bugs found
   - Create issues for non-critical bugs
   - Fix critical bugs immediately

2. **Update Status:**
   - Mark all tests as passed
   - Update MVP status to "Testing Complete"

3. **Prepare for Launch:**
   - Switch to production environment
   - Update Square to production keys
   - Configure production database
   - Set up monitoring (Sentry)
   - Deploy!

---

**Testing Guide Version:** 1.0
**Last Updated:** October 1, 2025
**Next Review:** After first production deployment
