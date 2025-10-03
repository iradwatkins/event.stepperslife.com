# Google OAuth Configuration for events.stepperslife.com

## Required Google Cloud Console Settings

To make Google OAuth work properly with your application, you need to configure the following in your Google Cloud Console:

### 1. Go to Google Cloud Console
- Visit: https://console.cloud.google.com/
- Select your project or create a new one
- Navigate to "APIs & Services" > "Credentials"

### 2. OAuth 2.0 Client Configuration

Find your OAuth 2.0 Client ID (the one with Client ID: `1005568460502-4h3cmguropt2lnf8qetqmruupvr3j1rp.apps.googleusercontent.com`)

### 3. Add Authorized JavaScript Origins
Add ALL of these origins:
```
https://events.stepperslife.com
http://localhost:3004
http://localhost:3000
```

### 4. Add Authorized Redirect URIs
Add ALL of these redirect URIs:
```
https://events.stepperslife.com/api/auth/callback/google
http://localhost:3004/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

### 5. OAuth Consent Screen
Make sure your OAuth consent screen is configured with:
- App name: Stepperslife Events
- User support email: (your email)
- Authorized domains: stepperslife.com
- Application homepage: https://events.stepperslife.com

### 6. Save Changes
Click "Save" after making all changes.

## Important Notes

1. **Changes may take 5-10 minutes to propagate** in Google's systems
2. The Configuration error occurs when the redirect URI doesn't match what's configured in Google
3. For local development, you might need to access the site via http://localhost:3004 instead of the production URL
4. The production URL (https://events.stepperslife.com) will only work if:
   - DNS is properly configured
   - SSL certificate is valid
   - The domain is actually pointing to your server

## Testing Authentication

After configuring Google OAuth:

1. **For Local Development:**
   - Access: http://localhost:3004/auth/login
   - Click "Sign in with Google"
   - Should redirect back to localhost:3004 after authentication

2. **For Production:**
   - Access: https://events.stepperslife.com/auth/login
   - Click "Sign in with Google"
   - Should redirect back to events.stepperslife.com after authentication

## Current Configuration in .env.local

```env
NEXTAUTH_URL=https://events.stepperslife.com
GOOGLE_CLIENT_ID=1005568460502-4h3cmguropt2lnf8qetqmruupvr3j1rp.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

## Troubleshooting

If you still get Configuration errors:
1. Check that all redirect URIs are exactly as shown above (no trailing slashes)
2. Verify the Client ID and Secret match in both Google Console and .env.local
3. Clear browser cookies and try again
4. Check server logs for more detailed error messages