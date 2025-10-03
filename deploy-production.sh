#!/bin/bash

echo "🚀 Deploying Events SteppersLife to Production"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as sudo (needed for nginx)
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}This script needs sudo privileges for nginx configuration${NC}"
    echo "Please run: sudo ./deploy-production.sh"
    exit 1
fi

echo -e "\n${GREEN}1. Building application for production...${NC}"
SENTRY_SUPPRESS_INSTRUMENTATION_FILE_WARNING=1 \
SENTRY_SUPPRESS_GLOBAL_ERROR_HANDLER_FILE_WARNING=1 \
NODE_ENV=production npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed! Please fix errors and try again.${NC}"
    exit 1
fi

echo -e "\n${GREEN}2. Setting up nginx configuration...${NC}"

# Copy nginx config to sites-available
cp nginx-events-stepperslife.conf /etc/nginx/sites-available/events.stepperslife.com

# Create symlink in sites-enabled
ln -sf /etc/nginx/sites-available/events.stepperslife.com /etc/nginx/sites-enabled/

# Test nginx configuration
nginx -t
if [ $? -ne 0 ]; then
    echo -e "${RED}Nginx configuration test failed!${NC}"
    exit 1
fi

echo -e "\n${GREEN}3. Setting up SSL certificate with Let's Encrypt...${NC}"
# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# Get SSL certificate
certbot --nginx -d events.stepperslife.com --non-interactive --agree-tos --email iradwatkins@gmail.com

echo -e "\n${GREEN}4. Starting production server with PM2...${NC}"
# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Stop any existing PM2 process
pm2 stop events-stepperslife 2>/dev/null

# Start the application with PM2
pm2 start npm --name "events-stepperslife" -- run start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup

echo -e "\n${GREEN}5. Reloading nginx...${NC}"
nginx -s reload

echo -e "\n${GREEN}✅ Deployment Complete!${NC}"
echo "=============================================="
echo "Your application should now be available at:"
echo -e "${GREEN}https://events.stepperslife.com${NC}"
echo ""
echo "Useful commands:"
echo "  pm2 status          - Check application status"
echo "  pm2 logs            - View application logs"
echo "  pm2 restart events-stepperslife - Restart application"
echo "  nginx -s reload     - Reload nginx configuration"
echo ""
echo "Test the deployment:"
echo "  curl https://events.stepperslife.com/health"