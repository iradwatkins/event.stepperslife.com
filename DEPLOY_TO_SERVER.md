# Production Server Deployment Guide for events.stepperslife.com

## Prerequisites on Production Server
- Ubuntu/Debian Linux server
- Node.js 18+ installed
- nginx installed
- Domain pointing to server (events.stepperslife.com)
- PostgreSQL database

## Step 1: Transfer Files to Production Server

From your local machine, run:
```bash
# Create a deployment package
tar -czf events-deploy.tar.gz \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.git \
  .

# Transfer to your server (replace SERVER_IP with your actual server IP)
scp events-deploy.tar.gz root@SERVER_IP:/root/
```

## Step 2: On Production Server - Setup Application

SSH into your production server and run:

```bash
# 1. Extract files
cd /root
mkdir -p /var/www/events.stepperslife.com
cd /var/www/events.stepperslife.com
tar -xzf /root/events-deploy.tar.gz

# 2. Install dependencies
npm install --production

# 3. Build the application
NODE_ENV=production npm run build

# 4. Install PM2 if not installed
npm install -g pm2

# 5. Create production environment file
cat > .env.production.local << 'EOF'
NEXTAUTH_URL=https://events.stepperslife.com
NEXTAUTH_SECRET=syy97JoLn2e16jMdAguAGq6CH0g0OgcQezlvJT+2vW8=
GOOGLE_CLIENT_ID=1005568460502-4h3cmguropt2lnf8qetqmruupvr3j1rp.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/events_stepperslife_prod"
NODE_ENV=production
SQUARE_ACCESS_TOKEN=your_square_token
SQUARE_ENVIRONMENT=production
SQUARE_WEBHOOK_SIGNATURE_KEY=your_webhook_key
EOF

# 6. Update DATABASE_URL with your actual database credentials
nano .env.production.local
```

## Step 3: Setup Nginx Configuration

```bash
# 1. Create nginx configuration
cat > /etc/nginx/sites-available/events.stepperslife.com << 'EOF'
server {
    listen 80;
    server_name events.stepperslife.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name events.stepperslife.com;

    # SSL certificates will be added by certbot
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Next.js application
    location / {
        proxy_pass http://localhost:3004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # API routes - no caching
    location /api {
        proxy_pass http://localhost:3004;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /_next/static {
        proxy_pass http://localhost:3004;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, max-age=3600, immutable";
    }
}
EOF

# 2. Enable the site
ln -sf /etc/nginx/sites-available/events.stepperslife.com /etc/nginx/sites-enabled/

# 3. Test nginx configuration
nginx -t

# 4. Install SSL certificate with Let's Encrypt
apt update
apt install -y certbot python3-certbot-nginx
certbot --nginx -d events.stepperslife.com --non-interactive --agree-tos --email iradwatkins@gmail.com

# 5. Reload nginx
systemctl reload nginx
```

## Step 4: Start Application with PM2

```bash
# 1. Start the application
cd /var/www/events.stepperslife.com
NODE_ENV=production PORT=3004 pm2 start npm --name "events-stepperslife" -- run start

# 2. Save PM2 configuration
pm2 save

# 3. Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs

# 4. Check status
pm2 status
pm2 logs events-stepperslife
```

## Step 5: Verify Deployment

```bash
# 1. Test locally on server
curl http://localhost:3004

# 2. Test SSL certificate
curl https://events.stepperslife.com

# 3. Check nginx logs if issues
tail -f /var/log/nginx/error.log

# 4. Check PM2 logs
pm2 logs events-stepperslife
```

## Troubleshooting Commands

```bash
# Restart application
pm2 restart events-stepperslife

# View logs
pm2 logs events-stepperslife --lines 100

# Check nginx status
systemctl status nginx

# Check nginx error logs
tail -f /var/log/nginx/error.log

# Test nginx config
nginx -t

# Reload nginx
systemctl reload nginx

# Check what's running on port 3004
lsof -i:3004
```

## Important Notes

1. **Database**: Make sure PostgreSQL is running and accessible
2. **Environment Variables**: Update all credentials in .env.production.local
3. **Firewall**: Ensure ports 80 and 443 are open
4. **DNS**: Verify events.stepperslife.com points to your server IP

## Quick One-Line Deploy (after initial setup)

```bash
cd /var/www/events.stepperslife.com && \
git pull && \
npm install --production && \
NODE_ENV=production npm run build && \
pm2 restart events-stepperslife
```