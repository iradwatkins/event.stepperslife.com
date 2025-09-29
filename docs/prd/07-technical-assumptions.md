# SteppersLife Events and Tickets System
## Technical Assumptions
### Version 1.0

---

## Infrastructure Architecture

- **Hosting**: Self-hosted on Hostinger VPS
  - Initial: 8 vCPU, 32GB RAM, 500GB NVMe SSD
  - Scaling: Vertical scaling to 16 vCPU, 64GB RAM as needed
  - Location: US data center for low latency
  - Backup VPS in different region for disaster recovery

## Technology Stack

- **Framework**: Next.js 14+ with App Router
- **Runtime**: Node.js 20 LTS
- **Database**: PostgreSQL 15 with Prisma ORM
- **Cache**: Redis 7 for sessions and real-time data
- **Search**: PostgreSQL full-text search (initially), Elasticsearch (future)
- **Queue**: Bull MQ for background jobs
- **Real-time**: Socket.io for WebSocket management
- **API**: tRPC for type-safe communication
- **File Storage**: Local disk initially, S3-compatible storage later

## Payment Processing

- **Primary**: Square SDK (single integration point)
  - Online Payments API for web transactions
  - Cash App Pay SDK for mobile payments
  - Terminal API for box office
  - Invoices API for group sales
  - Subscriptions API for recurring
- **Rates**: 2.6% + 10¢ online, 2.6% + 10¢ Cash App Pay
- **Payouts**: Direct to organizer's Square account

## Development & Deployment

- **Package Manager**: pnpm for efficiency
- **Build**: Next.js standalone output
- **Process Manager**: PM2 for Node.js
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt auto-renewal
- **Monitoring**: Uptime Kuma (self-hosted)
- **Logging**: Winston with daily rotation
- **Backups**: Automated PostgreSQL dumps every 6 hours

## Third-party Services

- **Email**: SendGrid (transactional), Mailgun (marketing)
- **SMS**: Twilio with 10DLC registration
- **CDN**: Cloudflare (free tier initially)
- **Analytics**: Plausible (privacy-focused, self-hosted)
- **Error Tracking**: Sentry (self-hosted)
- **Maps**: Mapbox for venue selection

## Security Measures

- **Authentication**: NextAuth.js with JWT
- **Authorization**: Role-based access control (RBAC)
- **Encryption**: TLS 1.3 for transit, AES-256 for sensitive data at rest
- **Rate Limiting**: 100 requests/minute per IP
- **DDoS Protection**: Cloudflare + Nginx rate limiting
- **Secrets Management**: Environment variables with .env.vault
- **Audit Logging**: All critical actions logged with user/IP/timestamp

---

*Part of the complete PRD - See [Main PRD](../business/product-requirements.md)*