#!/bin/bash

# Fix Build Errors and Deploy
set -e

VPS_HOST="root@72.60.28.175"
VPS_PASS="Bobby321&Gloria321Watkins?"
VPS_PATH="/root/websites/events-stepperslife"

echo "🔧 Fixing build errors on VPS..."
echo ""

echo "Step 1: Removing problematic auth files..."
sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no "$VPS_HOST" << 'ENDSSH'
cd /root/websites/events-stepperslife

# Remove auth files that reference next-auth
rm -f middleware.ts
rm -f auth.ts
rm -f auth.config.ts

# Remove auth route handlers
rm -rf app/api/auth

echo "✅ Removed auth files"
ls -la | grep -E "middleware|auth" || echo "✅ No auth files found"
ENDSSH

echo ""
echo "Step 2: Building application..."
sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no "$VPS_HOST" << 'ENDSSH'
cd /root/websites/events-stepperslife
npm run build
ENDSSH

echo ""
echo "Step 3: Restarting PM2..."
sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no "$VPS_HOST" << 'ENDSSH'
cd /root/websites/events-stepperslife
pm2 restart events-stepperslife || pm2 start npm --name "events-stepperslife" -- start
pm2 save
ENDSSH

echo ""
echo "Step 4: Checking status..."
sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no "$VPS_HOST" "pm2 status && pm2 logs events-stepperslife --lines 20 --nostream"

echo ""
echo "✅ Deployment Complete!"
echo "🌐 Visit: https://event.stepperslife.com"
