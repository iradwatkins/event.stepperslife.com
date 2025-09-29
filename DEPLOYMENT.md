# Events SteppersLife - Deployment Guide

## 🚀 Production Deployment

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Square account with production credentials
- Resend account for email services
- Domain name and SSL certificate

### Environment Configuration

#### 1. Square Payment Setup
Your Square credentials are already configured:

**Sandbox (Development):**
- Application ID: `sandbox-sq0idb--uxRoNAlmWg3C6w3ppztCg`
- Access Token: `EAAAl9Vnn8vt-OJ_Fz7-rSKJvOU9SIAUVqLLfpa1M3ufBnP-sUTBdXPmAF_4XAAo`
- Location ID: `LZN634J2MSXRY`

**Production:**
- Application ID: `sq0idp-XG8irNWHf98C62-iqOwH6Q`
- Access Token: `EAAAlwLSKasNtDyFEQ4mDkK9Ces5pQ9FQ4_kiolkTnjd-4qHlOx2K9-VrGC7QcOi`
- Location ID: `L0Q2YC1SPBGD8`

#### 2. Environment Variables Setup

Copy `.env.production` to `.env.local` and update:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/events_stepperslife_prod"

# NextAuth
NEXTAUTH_URL=https://events.stepperslife.com
NEXTAUTH_SECRET=your-secure-secret-here

# Square (Production)
NEXT_PUBLIC_SQUARE_APPLICATION_ID=sq0idp-XG8irNWHf98C62-iqOwH6Q
SQUARE_ACCESS_TOKEN=EAAAlwLSKasNtDyFEQ4mDkK9Ces5pQ9FQ4_kiolkTnjd-4qHlOx2K9-VrGC7QcOi
NEXT_PUBLIC_SQUARE_LOCATION_ID=L0Q2YC1SPBGD8
SQUARE_ENVIRONMENT=production

# Resend
RESEND_API_KEY=re_RJid1ide_12brJc6fbguPRU5WJzMDB6gQ
RESEND_FROM_EMAIL=noreply@events.stepperslife.com
```

### Deployment Steps

#### 1. Database Setup
```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate deploy

# Seed initial data (optional)
npx prisma db seed
```

#### 2. Build Application
```bash
# Build for production
npm run build

# Test production build locally
npm start
```

#### 3. Deploy to Production

**Option A: Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Option B: Docker**
```bash
# Build Docker image
docker build -t events-stepperslife .

# Run container
docker run -p 3004:3004 --env-file .env.local events-stepperslife
```

**Option C: VPS/Server**
```bash
# Use PM2 for process management
npm install -g pm2

# Start application
pm2 start npm --name "events-stepperslife" -- start
```

### Post-Deployment Checklist

#### 1. Square Payment Testing
- [ ] Test sandbox payments work correctly
- [ ] Verify webhook endpoints are configured
- [ ] Test production payments with small amounts
- [ ] Confirm refund processing works

#### 2. Email Configuration
- [ ] Verify Resend API key is active
- [ ] Test welcome emails
- [ ] Test ticket confirmation emails
- [ ] Test organizer notifications

#### 3. Security & Performance
- [ ] SSL certificate is installed
- [ ] HTTPS redirects are working
- [ ] Rate limiting is configured
- [ ] Error monitoring is active (Sentry)
- [ ] Database connections are secure

#### 4. Feature Testing
- [ ] User registration/login
- [ ] Event creation
- [ ] Ticket purchasing (free events)
- [ ] Ticket purchasing (paid events)
- [ ] Event check-in system
- [ ] Analytics dashboard
- [ ] Admin panel access

### Monitoring & Maintenance

#### Health Checks
- Application: `https://events.stepperslife.com/api/health`
- Database: Monitor connection pool usage
- Payments: Square dashboard notifications
- Emails: Resend delivery statistics

#### Performance Monitoring
- Use Next.js built-in analytics
- Monitor Core Web Vitals
- Track API response times
- Monitor database query performance

#### Security Updates
- Keep dependencies updated
- Monitor for security vulnerabilities
- Regular security audits
- Backup database regularly

### Square Webhook Configuration

Add these webhook endpoints in your Square Dashboard:

1. **Payment Events:**
   ```
   https://events.stepperslife.com/api/webhooks/square/payments
   ```

2. **Refund Events:**
   ```
   https://events.stepperslife.com/api/webhooks/square/refunds
   ```

### Domain Configuration

#### DNS Records
```
Type: A
Name: events
Value: [Your server IP]

Type: CNAME
Name: www.events
Value: events.stepperslife.com
```

#### SSL Certificate
Use Let's Encrypt or Cloudflare for free SSL:
```bash
# Certbot for Let's Encrypt
sudo certbot --nginx -d events.stepperslife.com
```

### Support & Troubleshooting

#### Common Issues

1. **Square Payment Errors**
   - Verify environment variables are set correctly
   - Check Square Dashboard for declined transactions
   - Ensure webhook URLs are accessible

2. **Email Delivery Issues**
   - Verify Resend API key permissions
   - Check domain authentication
   - Monitor Resend activity dashboard

3. **Database Connection Issues**
   - Verify connection string format
   - Check firewall settings
   - Monitor connection pool usage

#### Contact Information
- Technical Support: development@stepperslife.com
- Square Support: https://squareup.com/help
- Resend Support: https://resend.com/support

### Scaling Considerations

#### Database Optimization
- Implement read replicas for analytics
- Add database connection pooling
- Monitor slow queries and add indexes

#### Application Scaling
- Use CDN for static assets
- Implement Redis for session storage
- Consider horizontal scaling with load balancers

#### Cost Optimization
- Monitor Square transaction fees (2.9% + 30¢)
- Optimize Resend email usage
- Use Next.js Image Optimization
- Implement caching strategies