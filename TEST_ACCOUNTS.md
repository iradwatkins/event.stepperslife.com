# Test Accounts Documentation

## Testing Authentication

### Super Admin Accounts
The following email addresses are automatically assigned SUPER_ADMIN role when they sign in:
- `iradwatkins@gmail.com`
- `bobbygwatkins@gmail.com`

### Testing Methods

#### 1. Magic Link Authentication (Recommended for Testing)
This method doesn't require passwords:

1. Go to https://events.stepperslife.com/auth/login
2. Enter one of the test email addresses
3. Click "Send Magic Link"
4. Check the email inbox for the magic link
5. Click the link to authenticate

#### 2. Google OAuth (Requires Fix)
Currently broken - requires valid Google OAuth credentials to be configured in Google Cloud Console.

### Testing Different User Roles

To test with different roles, use these approaches:

1. **Super Admin**: Use `iradwatkins@gmail.com` or `bobbygwatkins@gmail.com`
2. **Regular User**: Use any other valid email address
3. **Admin**: Can be assigned manually in the database after user creation

### Automated Testing

For automated testing without exposing credentials:

```javascript
// Use environment variables for sensitive data
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';

// For production testing, use magic links instead of passwords
await signIn('email', {
  email: TEST_EMAIL,
  redirect: false
});
```

### Security Notes

- NEVER commit passwords to the repository
- Use environment variables for sensitive data
- For automated tests, use mock authentication in test environment
- Magic links are the safest way to test authentication in production

### Local Development Testing

For local development, you can:
1. Use the magic link system (emails will be logged to console in dev mode)
2. Create test accounts with known credentials locally
3. Use environment variables to store test credentials locally

### Environment Variables for Testing

Create a `.env.test.local` file (NOT committed to git):
```env
TEST_SUPER_ADMIN_EMAIL=iradwatkins@gmail.com
TEST_REGULAR_USER_EMAIL=test@example.com
```

Then reference these in your test scripts without exposing the actual values.