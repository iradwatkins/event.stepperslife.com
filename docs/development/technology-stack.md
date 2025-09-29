# Technology Stack

## Core Technologies

### Frontend Framework

**Next.js 15.0.3** - Full-stack React framework

- App Router for file-based routing
- React Server Components for performance
- Built-in API routes
- Automatic code splitting
- Image optimization

### UI Framework

**React 18.3.1** - Component library

- Production-stable version
- Concurrent features
- Better performance
- Excellent ecosystem support

### Language

**TypeScript 5.9.2** - Type-safe JavaScript

- Static type checking
- Better IDE support
- Reduced runtime errors
- Self-documenting code

### Styling

**Tailwind CSS 3.4.15** - Utility-first CSS

- Rapid development
- Consistent design system
- Small production bundle
- Built-in dark mode support

### Component Library

**shadcn/ui** - Customizable components

- Built on Radix UI primitives
- Fully accessible (ARIA compliant)
- Owns the code (no external dependency)
- Tailwind CSS styled

### Animation & Interactions

**Framer Motion 12.23.12** - Production-ready animation library

- Declarative animations
- Gesture support
- Layout animations
- SVG animations
- Scroll-triggered animations
- Spring physics
- Performance optimized

## Backend Technologies

### Database

**PostgreSQL 15** - Relational database

- ACID compliance
- JSON/JSONB support for flexible data
- Full-text search capabilities
- Strong consistency for e-commerce

### ORM

**Prisma 6.15.0** - Type-safe database client

- Auto-generated TypeScript types
- Database migrations
- Query builder
- Connection pooling

### Authentication

**NextAuth.js 5.0.0-beta.29** - Authentication library

- Multiple provider support (Google, Email)
- Database sessions
- JWT tokens
- Role-based access control

### Caching

**Redis 7.0** - In-memory data store

- Session storage
- API response caching
- Rate limiting
- Pub/sub for real-time features

## Storage & Files

### Object Storage

**MinIO** - S3-compatible storage

- Self-hosted option
- Artwork file storage
- Image hosting
- Backup storage

### Image Processing

**Sharp 0.33.6** - High-performance image processing

- Automatic optimization
- Format conversion
- Responsive images
- Metadata extraction

## External Services

### CDN & Infrastructure

**Cloudflare** - Content delivery & security

- Global CDN (free tier)
- DDoS protection
- SSL certificates
- Edge caching
- Web Application Firewall
- DNS management
- Cloudflare Pages deployment option
- Workers for edge computing (100k requests/day free)
- R2 storage option (10GB free/month)

### Email Service

**Resend** - Transactional email

- React Email templates
- High deliverability
- Webhook events
- Email analytics
- 100 emails/day free tier

### Payment Processing

**Square SDK 43.0.1** - Payment gateway

- Credit card processing
- Digital wallets (including CashApp)
- Recurring payments
- PCI compliance
- Invoicing capabilities
- Payment links

### Analytics

**Google Analytics 4** - Web analytics

- User behavior tracking
- E-commerce tracking
- Custom events
- Conversion tracking
- Real-time analytics
- Audience insights

### Automation

**N8N** - Workflow automation

- Visual workflow builder
- Webhook triggers
- Custom integrations
- Self-hosted option
- 200+ integrations
- Custom code support

## Development Tools

### Package Manager

**npm 10.x** - Node package manager

- Dependency management
- Script runner
- Package publishing
- Workspaces support

### Build Tools

**Next.js CLI** - Build system

- Development server with HMR
- Production builds
- Static export
- API route compilation
- Turbopack support (experimental)

### Code Quality

#### Linting

**ESLint 8.57** - JavaScript linter

- Code style enforcement
- Error prevention
- Best practices
- Custom rules
- Next.js specific rules

#### Formatting

**Prettier 3.3.4** - Code formatter

- Consistent formatting
- Team standards
- Auto-format on save
- Tailwind CSS plugin

### Testing (Planned)

#### Unit Testing

**Jest 29.5** - Testing framework

- Component testing
- Utility testing
- Snapshot testing
- Coverage reports

#### Integration Testing

**React Testing Library 16.1.3** - Component testing

- User-centric tests
- Accessibility testing
- Event simulation
- Custom queries

#### E2E Testing

**Playwright 1.49.1** - Browser automation

- Cross-browser testing
- Visual regression
- API testing
- Mobile testing
- Parallel execution

## Infrastructure

### Deployment Platform

**Self-Hosted VPS** - Server infrastructure

- Full control over environment
- Docker containerization
- Cost-effective at scale
- Custom configurations
- Root access

### Container Management

**Docker & Docker Compose** - Containerization

- Service isolation
- Easy deployment
- Environment consistency
- Resource management
- Multi-stage builds

### Web Server

**Node.js 20.x LTS** - JavaScript runtime

- Server-side rendering
- API endpoints
- WebSocket support
- Native fetch API

### Process Manager

**PM2 5.4.x** - Node.js process manager

- Automatic restarts
- Load balancing
- Log management
- Monitoring dashboard
- Cluster mode

### Reverse Proxy

**Nginx 1.24** - Web server & proxy

- Load balancing
- SSL termination
- Static file serving
- Request routing
- Gzip compression
- Rate limiting

## Progressive Web App

### Service Worker

**Workbox 7.0** (via next-pwa) - PWA toolkit

- Offline support
- Background sync
- Push notifications
- Cache strategies
- Precaching
- Runtime caching

### Web Manifest

**PWA Manifest** - App metadata

- Install prompts
- App icons (multiple sizes)
- Theme colors
- Display modes (standalone)
- Orientation lock
- Shortcuts

## State Management

### Client State

**Zustand 5.0.4** - State management

- Simple API
- TypeScript support
- DevTools integration
- Persistence middleware
- No providers needed
- Minimal boilerplate

### Server State

**TanStack Query 5.62.0** - Server state management

- Data fetching
- Caching strategies
- Background refetching
- Optimistic updates
- Infinite queries
- Parallel queries

### Form State

**React Hook Form 7.55.1** - Form library

- Performance optimized
- Built-in validation
- TypeScript support
- Field arrays
- Watch API
- Controller components

## UI/UX Components

### Core UI Library

**Radix UI** - Unstyled accessible components

- Dialog, Popover, Dropdown
- Accordion, Tabs, Toggle
- Slider, Switch, Checkbox
- Toast, Tooltip, Avatar
- Navigation Menu
- Scroll Area

### Icons

**Lucide React 0.456.0** - Icon library

- 1400+ icons
- Tree-shakeable
- Customizable size/color
- TypeScript support
- Consistent style

### Utility Libraries

**clsx 2.1.1** - Class name utility

- Conditional classes
- Dynamic class names
- Removes falsy values

**tailwind-merge 2.6.0** - Tailwind class merger

- Resolves conflicts
- Optimizes class lists
- Type-safe

### Date Handling

**date-fns 4.2.0** - Date utility library

- Tree-shakeable
- Immutable
- I18n support
- TypeScript support
- No moment.js bloat

## Security

### Input Validation

**Zod 3.24.2** - Schema validation

- Runtime type checking
- Error messages
- Transform functions
- Composable schemas
- Async validation
- Custom validators

### CORS

**Next.js Middleware** - Cross-origin control

- Request filtering
- Header management
- Origin validation
- Rate limiting
- Bot protection

### Environment Variables

**dotenv 16.4.7** - Environment management

- Secret management
- Configuration separation
- Development/production configs
- .env.local support

### SSL/TLS

**Let's Encrypt** (via Cloudflare) - SSL certificates

- Free SSL certificates
- Automatic renewal
- Full encryption (end-to-end)
- HSTS support

### Security Headers

**Next.js Security Headers** - HTTP security

- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Referrer Policy
- Permissions Policy

## Monitoring & Logging

### Application Logs

**Winston 3.17.0** - Logging library

- Multiple transports
- Log levels
- Structured logging
- File rotation
- Query logs

### Uptime Monitoring

**UptimeRobot** - Availability monitoring

- 5-minute checks
- 50 monitors free
- Email alerts
- Public status page
- Response time tracking

### Performance Monitoring

**Web Vitals** - Performance metrics

- Core Web Vitals
- First Contentful Paint
- Time to Interactive
- Cumulative Layout Shift
- Custom metrics

### Error Tracking (Optional)

**Sentry** (Free tier) - Error monitoring

- Real-time alerts
- Performance monitoring
- Release tracking
- User context
- Source maps

## Version Control & CI/CD

### Version Control

**Git** - Source control

- Branch management
- Code review
- History tracking
- Semantic versioning

### Repository Hosting

**GitHub** - Code hosting

- Pull requests
- Issues tracking
- Actions CI/CD
- Documentation
- Project boards
- Discussions

### CI/CD

**GitHub Actions** - Automation

- Automated testing
- Build verification
- Deployment pipeline
- Security scanning
- Dependency updates
- Release automation

## Database Tools

### Migrations

**Prisma Migrate** - Database migrations

- Version control for schema
- Rollback support
- Development migrations
- Production migrations

### Seeding

**Prisma Seed** - Database seeding

- Development data
- Test fixtures
- Demo content

### Backup

**pg_dump** - PostgreSQL backup

- Automated backups
- Point-in-time recovery
- Compression support

## Dependencies Summary

### Production Dependencies

```json
{
  "next": "15.0.3",
  "react": "18.3.1",
  "react-dom": "18.3.1",
  "typescript": "5.9.2",
  "@prisma/client": "6.15.0",
  "next-auth": "5.0.0-beta.29",
  "tailwindcss": "3.4.15",
  "autoprefixer": "10.4.20",
  "postcss": "8.4.49",
  "zustand": "5.0.4",
  "@tanstack/react-query": "5.62.0",
  "zod": "3.24.2",
  "react-hook-form": "7.55.1",
  "@hookform/resolvers": "3.10.2",
  "framer-motion": "12.23.12",
  "date-fns": "4.2.0",
  "sharp": "0.33.6",
  "resend": "4.0.3",
  "@react-email/components": "0.0.31",
  "square": "43.0.1",
  "@radix-ui/react-accordion": "1.2.2",
  "@radix-ui/react-alert-dialog": "1.1.4",
  "@radix-ui/react-avatar": "1.1.2",
  "@radix-ui/react-checkbox": "1.1.3",
  "@radix-ui/react-dialog": "1.1.4",
  "@radix-ui/react-dropdown-menu": "2.1.4",
  "@radix-ui/react-label": "2.1.1",
  "@radix-ui/react-navigation-menu": "1.2.2",
  "@radix-ui/react-popover": "1.1.4",
  "@radix-ui/react-progress": "1.1.1",
  "@radix-ui/react-radio-group": "1.2.2",
  "@radix-ui/react-scroll-area": "1.2.2",
  "@radix-ui/react-select": "2.1.4",
  "@radix-ui/react-separator": "1.1.1",
  "@radix-ui/react-slider": "1.2.2",
  "@radix-ui/react-switch": "1.1.2",
  "@radix-ui/react-tabs": "1.1.2",
  "@radix-ui/react-toast": "1.2.4",
  "@radix-ui/react-toggle": "1.1.1",
  "@radix-ui/react-toggle-group": "1.1.1",
  "@radix-ui/react-tooltip": "1.1.5",
  "lucide-react": "0.456.0",
  "clsx": "2.1.1",
  "tailwind-merge": "2.6.0",
  "class-variance-authority": "0.7.1",
  "redis": "4.7.0",
  "ioredis": "5.4.2",
  "minio": "8.0.2",
  "next-pwa": "5.6.0",
  "winston": "3.17.0",
  "dotenv": "16.4.7",
  "bcryptjs": "2.4.3",
  "jsonwebtoken": "9.0.2",
  "uuid": "11.0.5",
  "slugify": "1.7.0",
  "nanoid": "5.0.9"
}
```

### Development Dependencies

```json
{
  "@types/node": "22.13.7",
  "@types/react": "18.3.14",
  "@types/react-dom": "18.3.5",
  "@types/bcryptjs": "2.4.6",
  "@types/jsonwebtoken": "9.0.7",
  "@types/uuid": "10.0.0",
  "eslint": "8.57.1",
  "eslint-config-next": "15.0.3",
  "eslint-plugin-react": "7.37.2",
  "eslint-plugin-react-hooks": "5.0.0",
  "@typescript-eslint/parser": "8.20.0",
  "@typescript-eslint/eslint-plugin": "8.20.0",
  "prettier": "3.3.4",
  "prettier-plugin-tailwindcss": "0.6.10",
  "prisma": "6.15.0",
  "jest": "29.5.0",
  "@testing-library/react": "16.1.3",
  "@testing-library/jest-dom": "6.6.3",
  "@testing-library/user-event": "14.6.0",
  "playwright": "1.49.1",
  "@playwright/test": "1.49.1",
  "msw": "2.7.0",
  "cross-env": "7.0.3",
  "husky": "9.1.7",
  "lint-staged": "15.3.0",
  "commitizen": "4.3.1",
  "@commitlint/cli": "19.7.0",
  "@commitlint/config-conventional": "19.7.0"
}
```

## Technology Decisions Rationale

### Why Next.js?

- Full-stack capabilities in one framework
- Excellent SEO with SSR/SSG
- Built-in optimizations
- Great developer experience
- Strong community support
- App Router for modern React patterns

### Why PostgreSQL?

- ACID compliance crucial for e-commerce
- Complex queries for reporting
- JSON support for flexible product data
- Proven reliability at scale
- Full-text search capabilities
- Strong data integrity

### Why Prisma?

- Type safety across stack
- Excellent migration system
- Great developer experience
- Active development and community
- Intuitive schema definition
- Built-in query optimization

### Why Tailwind CSS?

- Rapid prototyping
- Consistent design system
- Small production bundle
- Maintainable styles
- Excellent IDE support
- Works perfectly with shadcn/ui

### Why Framer Motion?

- Production-ready animations
- Declarative API
- Performance optimized
- Gesture support
- Layout animations
- Great documentation

### Why Zustand?

- Simpler than Redux
- TypeScript first
- Small bundle size (8KB)
- No providers needed
- DevTools support
- Easy persistence

### Why MinIO?

- S3 compatibility
- Self-hosted option
- Cost-effective
- Good performance
- Easy scaling
- Multi-tenancy support

### Why Cloudflare?

- Generous free tier
- Global CDN
- DDoS protection included
- Edge computing capabilities
- Zero egress fees
- Excellent performance

## Performance Targets

### Core Web Vitals

- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Contentful Paint (FCP)**: < 1.5s
- **Time to Interactive (TTI)**: < 3.5s

### Application Metrics

- **API Response Time**: < 200ms (p95)
- **Database Query Time**: < 100ms (p95)
- **Image Load Time**: < 1s (optimized)
- **Cart Operations**: < 100ms
- **Search Results**: < 500ms
- **Bundle Size**: < 300KB (gzipped)

## Security Best Practices

### Application Security

- Input validation on all endpoints
- SQL injection prevention via Prisma
- XSS protection through React
- CSRF tokens for state-changing operations
- Rate limiting on all APIs
- Secure session management

### Infrastructure Security

- HTTPS everywhere
- Security headers configured
- Regular dependency updates
- Environment variable encryption
- Database connection encryption
- File upload validation

## Scalability Considerations

### Current Architecture

- Monolithic Next.js application
- Single PostgreSQL database
- Redis for caching
- MinIO for object storage
- Cloudflare CDN

### Future Scaling Options

- Database read replicas
- Redis clustering
- Horizontal scaling with PM2
- Edge functions with Cloudflare Workers
- Queue system (Bull/BullMQ)
- Microservices for specific features

## Development Workflow

### Local Development

1. Docker Compose for services
2. Hot module replacement
3. TypeScript checking
4. ESLint on save
5. Prettier formatting

### Git Workflow

1. Feature branches
2. Pull request reviews
3. Automated testing
4. Semantic commits
5. Squash and merge

### Deployment Process

1. Push to main branch
2. GitHub Actions trigger
3. Run tests
4. Build application
5. Deploy to server
6. Run migrations
7. Clear caches
8. Health check

## Monitoring & Maintenance

### Daily Monitoring

- Uptime checks
- Error rates
- Performance metrics
- Security alerts
- Backup verification

### Weekly Tasks

- Dependency updates check
- Performance review
- Security scan
- Database optimization
- Log rotation

### Monthly Tasks

- Full backup test
- Security audit
- Performance optimization
- Documentation update
- Cost review

## Cost Optimization

### Free Tier Services

- **Cloudflare**: CDN, SSL, DDoS protection
- **GitHub**: Repository, Actions (2000 mins/month)
- **UptimeRobot**: 50 monitors
- **Resend**: 100 emails/day
- **Google Analytics**: Unlimited events

### Low-Cost Services

- **VPS Hosting**: ~$20-50/month
- **PostgreSQL**: Self-hosted
- **Redis**: Self-hosted
- **MinIO**: Self-hosted
- **Domain**: ~$12/year

### Estimated Monthly Cost

- **Infrastructure**: $20-50
- **Domain**: $1
- **Email (if over free tier)**: $20
- **Total**: ~$41-71/month

## Documentation & Resources

### Internal Documentation

- API documentation (OpenAPI/Swagger)
- Component storybook
- Database schema docs
- Deployment guide
- Contributing guidelines

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Cloudflare Documentation](https://developers.cloudflare.com)

## Support & Community

### Getting Help

- GitHub Issues for bugs
- GitHub Discussions for questions
- Stack Overflow for general help
- Discord/Slack for real-time chat

### Contributing

- Fork repository
- Create feature branch
- Write tests
- Submit pull request
- Follow code style guide

## License

This technology stack documentation is for reference purposes. Adapt as needed for your project.