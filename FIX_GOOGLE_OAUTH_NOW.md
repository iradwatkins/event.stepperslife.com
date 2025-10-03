# URGENT: Fix Google OAuth Authentication

## Current Problem
The Google OAuth Client ID `1005568460502-4h3cmguropt2lnf8qetqmruupvr3j1rp.apps.googleusercontent.com` returns:
> "The OAuth client was not found"

This means the OAuth credentials are invalid or don't exist in Google Cloud Console.

## Immediate Action Required

### Step 1: Access Google Cloud Console
1. Open: https://console.cloud.google.com/apis/credentials
2. Sign in with your Google account (use iradwatkins@gmail.com if that's the account owner)

### Step 2: Check for Existing OAuth Clients
Look for any OAuth 2.0 Client IDs in the credentials list:
- If you see one, click on it and skip to Step 4
- If none exist, continue to Step 3

### Step 3: Create New OAuth 2.0 Client ID
1. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
2. If prompted to configure consent screen first:
   - Choose "External" user type
   - App name: "Stepperslife Events"
   - User support email: your email
   - Add authorized domain: `stepperslife.com`
   - Save and continue
3. For OAuth client:
   - Application type: **Web application**
   - Name: "Stepperslife Events Web Client"

### Step 4: Configure Authorized URLs
**CRITICAL: Add these EXACT URLs (no trailing slashes!)**

**Authorized JavaScript origins:**
```
https://events.stepperslife.com
http://localhost:3004
```

**Authorized redirect URIs:**
```
https://events.stepperslife.com/api/auth/callback/google
http://localhost:3004/api/auth/callback/google
```

### Step 5: Save and Copy Credentials
1. Click **"CREATE"** or **"SAVE"**
2. A popup will show your credentials:
   - **Client ID**: Copy this entire string
   - **Client secret**: Copy this entire string
3. Keep this window open!

### Step 6: Update Production Server

Save these credentials in a temporary file first:
```bash
# Create a file called new-oauth.txt with:
GOOGLE_CLIENT_ID=<paste-your-new-client-id-here>
GOOGLE_CLIENT_SECRET=<paste-your-new-client-secret-here>
```

Then I will:
1. SSH into the production server
2. Update `/root/websites/events-stepperslife/.env.production.local`
3. Restart the application
4. Test the login

## Verification Steps

After updating credentials:
1. Visit: https://events.stepperslife.com/auth/login
2. Click "Sign in with Google"
3. You should see Google's login page
4. After login, you should be redirected back to events.stepperslife.com

## Alternative: Use Different OAuth Provider

If Google OAuth continues to fail, consider:
1. **Email/Password Authentication** - Already implemented, just needs to be enabled
2. **GitHub OAuth** - Easier to set up, developer-friendly
3. **Magic Link Email** - Send login links via email

## Current Status
- ✅ Production server is running
- ✅ HTTPS/SSL is working
- ✅ NextAuth is configured
- ❌ Google OAuth credentials are invalid
- ⏳ Waiting for valid credentials to complete setup

## SSH Access for Updates
Once you have the new credentials, I can update the production server:
```bash
ssh root@72.60.28.175
# Password: Bobby321&Gloria321Watkins?
cd /root/websites/events-stepperslife
# Update .env.production.local with new credentials
pm2 restart events-stepperslife
```

---
**IMPORTANT**: Do NOT proceed with testing until you've obtained valid Google OAuth credentials from Google Cloud Console.