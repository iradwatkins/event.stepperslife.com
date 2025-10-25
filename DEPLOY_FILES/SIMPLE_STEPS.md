# Simplest Deployment Steps for VPS

## Step 1: SSH to Server

```bash
ssh root@72.60.28.175
# Password: Bobby321&Gloria321Watkins?
```

## Step 2: Navigate to Project

```bash
cd /root/websites/events-stepperslife
```

## Step 3: Backup Current Version

```bash
cp -r . ../backup-$(date +%Y%m%d-%H%M%S)
```

## Step 4: Remove Middleware

```bash
rm -f middleware.ts
```

## Step 5: Edit package.json

```bash
nano package.json
```

- Find line with: `"next-auth": "^5.0.0-beta.29",`
- Delete that entire line
- Save: Ctrl+O, Enter, Ctrl+X

## Step 6: Update Convex Provider

```bash
cat > components/convex-client-provider.tsx << 'EOF'
"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexProvider } from "convex/react";
import { ReactNode, useMemo } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convex = useMemo(() => new ConvexReactClient(convexUrl), []);

  return (
    <ConvexProvider client={convex}>
      {children}
    </ConvexProvider>
  );
}
EOF
```

## Step 7: Update app/page.tsx

```bash
nano app/page.tsx
```

Find line 5:
```typescript
import { useSession, signOut } from "next-auth/react";
```

Change to:
```typescript
// TESTING MODE: No authentication
// import { useSession, signOut } from "next-auth/react";
```

Find around line 18:
```typescript
  const { data: session, status } = useSession();
```

Change to:
```typescript
  // TESTING MODE: No authentication
  // const { data: session, status } = useSession();
  const session = null;
  const status = "unauthenticated";
```

Save: Ctrl+O, Enter, Ctrl+X

## Step 8: Update app/organizer/events/create/page.tsx

```bash
nano app/organizer/events/create/page.tsx
```

Find line 6:
```typescript
import { useSession } from "next-auth/react";
```

Change to:
```typescript
// TESTING MODE: No authentication
// import { useSession } from "next-auth/react";
```

Find around line 38:
```typescript
  const { data: session, status } = useSession();
```

Change to:
```typescript
  // TESTING MODE: No authentication
  // const { data: session, status } = useSession();
  const session = null;
  const status = "unauthenticated";
```

Save: Ctrl+O, Enter, Ctrl+X

## Step 9: Update app/organizer/events/page.tsx

```bash
nano app/organizer/events/page.tsx
```

Find around line 18:
```typescript
  const currentUser = useQuery(api.users.queries.getCurrentUser);
```

Change to:
```typescript
  // TESTING MODE: Commented out authentication check
  // const currentUser = useQuery(api.users.queries.getCurrentUser);
```

Find the entire `if (!currentUser)` block and comment it all out:
```typescript
  // TESTING MODE: Skip auth check
  // if (!currentUser) {
  //   return (
  //     ...entire block...
  //   );
  // }
```

Save: Ctrl+O, Enter, Ctrl+X

## Step 10: Update convex/events/queries.ts

```bash
nano convex/events/queries.ts
```

Find the `getOrganizerEvents` function. Replace the entire function with:

```typescript
/**
 * Get organizer's events
 * TESTING MODE: Returns all events (no authentication)
 */
export const getOrganizerEvents = query({
  args: {},
  handler: async (ctx) => {
    // TESTING MODE: No authentication required
    console.warn("[getOrganizerEvents] TESTING MODE - No authentication required");

    // Return all events for now
    const events = await ctx.db
      .query("events")
      .order("desc")
      .collect();

    return events;
  },
});
```

Save: Ctrl+O, Enter, Ctrl+X

## Step 11: Create .env.local

```bash
cat > .env.local << 'EOF'
# Production Environment Variables
# TESTING MODE - No authentication or payments

# ===== CONVEX (Database) =====
NEXT_PUBLIC_CONVEX_URL=https://combative-viper-389.convex.cloud
CONVEX_DEPLOYMENT=dev:combative-viper-389

# ===== APPLICATION =====
NEXT_PUBLIC_APP_URL=https://event.stepperslife.com
NODE_ENV=production
EOF
```

## Step 12: Install Dependencies

```bash
npm install
```

## Step 13: Deploy Convex

```bash
npx convex deploy --prod
```

If it asks you to login, follow the prompts.

## Step 14: Build Application

```bash
npm run build
```

## Step 15: Restart PM2

```bash
pm2 restart events-stepperslife
```

If it doesn't exist:
```bash
pm2 start npm --name "events-stepperslife" -- start
pm2 save
```

## Step 16: Check Status

```bash
pm2 status
pm2 logs events-stepperslife --lines 50
```

## Step 17: Test

Visit: **https://event.stepperslife.com**

Try:
- https://event.stepperslife.com/organizer/events
- https://event.stepperslife.com/organizer/events/create

Both should work without requiring login!

---

## If Something Goes Wrong

Restore from backup:
```bash
cd /root/websites
rm -rf events-stepperslife
cp -r backup-YYYYMMDD-HHMMSS events-stepperslife
cd events-stepperslife
pm2 restart events-stepperslife
```
