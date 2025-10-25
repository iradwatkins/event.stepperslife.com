# Manual Edits Required on VPS

After running the automated script, verify these two files were updated correctly:

## 1. app/organizer/events/page.tsx

Find the function `OrganizerEventsPage` (around line 17) and ensure it looks like this:

```typescript
export default function OrganizerEventsPage() {
  // TESTING MODE: Commented out authentication check
  // const currentUser = useQuery(api.users.queries.getCurrentUser);
  const events = useQuery(api.events.queries.getOrganizerEvents);

  const isLoading = events === undefined;

  // TESTING MODE: Skip auth check
  // if (!currentUser) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
  //       <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
  //         <p className="text-gray-600 mb-4">Please sign in to access your organizer dashboard.</p>
  //         <Link href="/login" className="text-blue-600 hover:underline font-medium">
  //           Sign In
  //         </Link>
  //       </div>
  //     </div>
  //   );
  // }
```

**How to edit:**
```bash
nano app/organizer/events/page.tsx
```

1. Comment out line: `const currentUser = useQuery(api.users.queries.getCurrentUser);`
2. Comment out the entire `if (!currentUser)` block
3. Save (Ctrl+O, Enter, Ctrl+X)

---

## 2. convex/events/queries.ts

Find the `getOrganizerEvents` function and replace it with:

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

**How to edit:**
```bash
nano convex/events/queries.ts
```

1. Find the `getOrganizerEvents` export
2. Remove any authentication logic (ctx.auth.getUserIdentity(), etc.)
3. Make it return all events without filtering by user
4. Save (Ctrl+O, Enter, Ctrl+X)

---

## Quick Verification Commands

After editing, verify the changes:

```bash
# Check that next-auth is NOT in package.json
grep "next-auth" package.json
# Should return nothing

# Check convex-client-provider has no next-auth
grep "next-auth" components/convex-client-provider.tsx
# Should return nothing

# Check .env.local exists
cat .env.local | grep CONVEX_URL
# Should show: NEXT_PUBLIC_CONVEX_URL=https://combative-viper-389.convex.cloud
```

---

## After Manual Edits - Rebuild and Restart

```bash
npm run build
pm2 restart events-stepperslife
pm2 logs events-stepperslife --lines 50
```
