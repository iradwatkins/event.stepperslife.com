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
      // Square PRODUCTION (client-side)
      NEXT_PUBLIC_SQUARE_APPLICATION_ID: 'sq0idp-XG8irNWHf98C62-iqOwH6Q',
      NEXT_PUBLIC_SQUARE_LOCATION_ID: 'L0Q2YC1SPBGD8',
      NEXT_PUBLIC_SQUARE_ENVIRONMENT: 'production',
      // Square PRODUCTION (server-side)
      SQUARE_ACCESS_TOKEN: 'EAAAlwLSKasNtDyFEQ4mDkK9Ces5pQ9FQ4_kiolkTnjd-4qHlOx2K9-VrGC7QcOi',
      SQUARE_LOCATION_ID: 'L0Q2YC1SPBGD8',
      SQUARE_ENVIRONMENT: 'production',
      // App
      NEXT_PUBLIC_APP_URL: 'https://event.stepperslife.com',
      NEXT_PUBLIC_SITE_URL: 'https://events.stepperslife.com'
    }
  }]
};
