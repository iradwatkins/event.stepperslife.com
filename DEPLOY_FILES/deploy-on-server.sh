#!/bin/bash
# Run this script ON THE VPS SERVER after uploading the DEPLOY_FILES folder

set -e

echo "🚀 Deploying updates to production..."

cd /root/websites/events-stepperslife

# Backup
echo "📦 Creating backup..."
BACKUP_DIR="/root/websites/backups/events-stepperslife-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r . "$BACKUP_DIR"
echo "✅ Backup created at: $BACKUP_DIR"

# Remove middleware.ts if it exists
if [ -f "middleware.ts" ]; then
  echo "🗑️  Removing middleware.ts..."
  rm middleware.ts
fi

# Stop PM2 during updates
echo "⏸️  Stopping PM2..."
pm2 stop events-stepperslife || true

# Install dependencies (this will remove next-auth)
echo "📦 Installing dependencies..."
npm install

# Initialize/Deploy Convex
echo "🔧 Deploying Convex functions..."
echo "⚠️  IMPORTANT: You'll need to login to Convex if not already authenticated"
echo "Press ENTER to continue with Convex deployment, or Ctrl+C to skip..."
read

npx convex deploy --prod

# Build application
echo "🏗️  Building Next.js application..."
npm run build

# Restart PM2
echo "🔄 Restarting PM2..."
pm2 restart events-stepperslife || pm2 start npm --name "events-stepperslife" -- start
pm2 save

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "📝 Recent logs:"
pm2 logs events-stepperslife --lines 20 --nostream

echo ""
echo "🌐 Application should be live at: https://event.stepperslife.com"
echo ""
echo "To view live logs: pm2 logs events-stepperslife"
