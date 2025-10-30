module.exports = {
  apps: [{
    name: 'events-stepperslife',
    script: 'npm',
    args: 'start',
    cwd: '/root/websites/events-stepperslife',
    env: {
      NODE_ENV: 'production',
      PORT: '3004',
      // Convex
      NEXT_PUBLIC_CONVEX_URL: 'https://fearless-dragon-613.convex.cloud',
      CONVEX_DEPLOYMENT: 'dev:fearless-dragon-613',
      // Square SANDBOX (client-side) - TEST MODE
      NEXT_PUBLIC_SQUARE_APPLICATION_ID: 'sandbox-sq0idb--uxRoNAlmWg3C6w3ppztCg',
      NEXT_PUBLIC_SQUARE_LOCATION_ID: 'LZN634J2MSXRY',
      NEXT_PUBLIC_SQUARE_ENVIRONMENT: 'sandbox',
      // Square SANDBOX (server-side) - TEST MODE
      SQUARE_ACCESS_TOKEN: 'EAAAl9Vnn8vt-OJ_Fz7-rSKJvOU9SIAUVqLLfpa1M3ufBnP-sUTBdXPmAF_4XAAo',
      SQUARE_LOCATION_ID: 'LZN634J2MSXRY',
      SQUARE_ENVIRONMENT: 'sandbox',
      // Stripe TEST MODE (client-side)
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_51SIERp3Oaksg4w0LPFZKfaG7uBxqKxMysbnbaTf8pvZrszLSgagYWzerGJyUsitBYCNTmFQHKA5h3Zz1ooMNA2Vf00ZX9EBS7w',
      // Stripe TEST MODE (server-side)
      STRIPE_SECRET_KEY: 'sk_test_51SIERp3Oaksg4w0LObuIH6ZT8aZC7JfRw8D1MWSf9GWjrfUryYCwiIlezRAo1Xfpa0jYZG9rMJrePO5H00h3jnHe003AqTlqXC',
      STRIPE_ENVIRONMENT: 'test',
      // App
      NEXT_PUBLIC_APP_URL: 'https://event.stepperslife.com',
      NEXT_PUBLIC_SITE_URL: 'https://events.stepperslife.com'
    }
  }]
};
