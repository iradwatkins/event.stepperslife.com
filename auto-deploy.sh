#!/bin/bash

# Automated Deploy Script with sshpass
set -e

VPS_HOST="root@72.60.28.175"
VPS_PASS="Bobby321&Gloria321Watkins?"
LOCAL_PATH="/Users/irawatkins/Desktop/event.stepperslife.com"
VPS_PATH="/root/websites/events-stepperslife"

echo "🚀 Deploying to Production: $VPS_HOST"
echo "📁 Local: $LOCAL_PATH"
echo "📁 Remote: $VPS_PATH"
echo ""

# Step 1: Sync files
echo "📦 Step 1/4: Syncing files to VPS..."
sshpass -p "$VPS_PASS" rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude 'STEPFILES' \
  --exclude 'DEPLOY_FILES' \
  --exclude '*.backup.*' \
  --exclude 'auto-deploy.sh' \
  -e "ssh -o StrictHostKeyChecking=no" \
  "$LOCAL_PATH/" "$VPS_HOST:$VPS_PATH/"

echo ""
echo "🔧 Step 2/4: Installing dependencies..."
sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no "$VPS_HOST" << 'ENDSSH'
cd /root/websites/events-stepperslife
npm install
ENDSSH

echo ""
echo "🏗️  Step 3/4: Building application..."
sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no "$VPS_HOST" << 'ENDSSH'
cd /root/websites/events-stepperslife
npm run build
ENDSSH

echo ""
echo "🔄 Step 4/4: Restarting PM2..."
sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no "$VPS_HOST" << 'ENDSSH'
cd /root/websites/events-stepperslife
pm2 restart events-stepperslife || pm2 start npm --name "events-stepperslife" -- start
pm2 save
ENDSSH

echo ""
echo "📊 Deployment Status:"
sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no "$VPS_HOST" "pm2 status"

echo ""
echo "✅ Deployment Complete!"
echo "🌐 Visit: https://event.stepperslife.com"
echo "📋 Organizer Dashboard: https://event.stepperslife.com/organizer/events"
