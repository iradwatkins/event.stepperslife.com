#!/bin/bash
# Run this script FROM YOUR LOCAL MACHINE to upload files to VPS

echo "📤 Uploading modified files to VPS..."
echo ""

# Set variables
VPS="root@72.60.28.175"
VPS_PATH="/root/websites/events-stepperslife"
LOCAL_DIR="/Users/irawatkins/Desktop/File Cabinet/original 3/event.stepperslife.com"

echo "Uploading to: $VPS:$VPS_PATH"
echo ""

# Upload modified files one by one
echo "1/6 Uploading package.json..."
scp "$LOCAL_DIR/package.json" "$VPS:$VPS_PATH/package.json"

echo "2/6 Uploading convex-client-provider.tsx..."
scp "$LOCAL_DIR/components/convex-client-provider.tsx" "$VPS:$VPS_PATH/components/convex-client-provider.tsx"

echo "3/6 Uploading app/page.tsx..."
scp "$LOCAL_DIR/app/page.tsx" "$VPS:$VPS_PATH/app/page.tsx"

echo "4/6 Uploading app/organizer/events/page.tsx..."
scp "$LOCAL_DIR/app/organizer/events/page.tsx" "$VPS:$VPS_PATH/app/organizer/events/page.tsx"

echo "5/6 Uploading app/organizer/events/create/page.tsx..."
scp "$LOCAL_DIR/app/organizer/events/create/page.tsx" "$VPS:$VPS_PATH/app/organizer/events/create/page.tsx"

echo "6/6 Uploading convex/events/queries.ts..."
scp "$LOCAL_DIR/convex/events/queries.ts" "$VPS:$VPS_PATH/convex/events/queries.ts"

echo "7/7 Uploading .env.local..."
scp "$LOCAL_DIR/.env.local" "$VPS:$VPS_PATH/.env.local"

echo ""
echo "✅ All files uploaded!"
echo ""
echo "Next steps:"
echo "1. SSH to your server: ssh $VPS"
echo "2. Go to directory: cd $VPS_PATH"
echo "3. Remove middleware: rm -f middleware.ts"
echo "4. Install deps: npm install"
echo "5. Deploy Convex: npx convex deploy --prod"
echo "6. Build: npm run build"
echo "7. Restart: pm2 restart events-stepperslife"
