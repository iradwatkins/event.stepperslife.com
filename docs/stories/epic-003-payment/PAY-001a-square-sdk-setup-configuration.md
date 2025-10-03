# Story: PAY-001a - Square SDK Setup & Configuration

**Epic**: EPIC-003 - Payment Processing Foundation
**Parent Story**: PAY-001 - Square SDK Integration
**Story Points**: 3
**Priority**: P0 (Critical)
**Status**: Draft
**Dependencies**: None (first sub-story in PAY-001 sequence)

---

## Sharding Rationale

This sub-story is the first of three shards from PAY-001 (8 points). The original story was too large for optimal code quality and review efficiency. PAY-001a focuses exclusively on the foundational SDK setup and configuration layer, ensuring a solid base for subsequent payment form integration (PAY-001b) and payment processing (PAY-001c).

**Why This Shard Exists**:
- Isolates infrastructure setup from business logic
- Creates independently testable configuration layer
- Enables parallel development of downstream components
- Reduces risk by validating SDK connectivity first
- Smaller PR = better code review quality

**Scope Boundaries**:
- ✅ SDK installation and initialization
- ✅ Environment variable configuration
- ✅ API client setup and connection validation
- ❌ Payment form UI (PAY-001b)
- ❌ Payment processing logic (PAY-001c)
- ❌ Webhook handling (PAY-001c)

---

## Story

**As a** platform administrator
**I want to** configure Square SDK securely with proper credentials
**So that** the payment system has a validated connection to Square's API

---

## Acceptance Criteria

1. GIVEN Square npm packages need to be installed
   WHEN developer runs npm install
   THEN the system should:
   - Install @square/web-sdk@^2.0.0 for frontend
   - Install square@^39.0.0 (Node SDK) for backend
   - Add type definitions for TypeScript
   - Install without dependency conflicts
   - Document package versions in package.json

2. GIVEN environment variables need to be configured
   WHEN application starts in any environment (dev/staging/prod)
   THEN the system should:
   - Read SQUARE_ACCESS_TOKEN from environment
   - Read SQUARE_LOCATION_ID from environment
   - Read SQUARE_APPLICATION_ID from environment
   - Read SQUARE_ENVIRONMENT (sandbox|production)
   - Validate all required variables are present
   - Fail fast with clear error if variables missing

3. GIVEN Square API client needs to be initialized
   WHEN the application starts up
   THEN it should:
   - Create singleton Square client instance
   - Configure client with access token
   - Set correct environment (sandbox vs production)
   - Initialize PaymentsApi instance
   - Initialize LocationsApi instance
   - Cache client instance for reuse
   - Export typed client for use across application

4. GIVEN API connection needs validation
   WHEN Square client is initialized
   THEN the system should:
   - Call Square API to verify credentials
   - Verify location ID is valid and accessible
   - Check location has payment processing enabled
   - Log successful connection with environment
   - Throw descriptive error on connection failure
   - Include retry logic (max 3 attempts, exponential backoff)

5. GIVEN different environments need different credentials
   WHEN switching between sandbox and production
   THEN the system should:
   - Use sandbox credentials in development/staging
   - Use production credentials only in production
   - Display environment indicator in logs
   - Prevent production credentials in local .env
   - Use .env.vault for production secrets
   - Add runtime environment validation

6. GIVEN SDK configuration needs to be secure
   WHEN credentials are stored and accessed
   THEN the system should:
   - Never commit credentials to git (.env in .gitignore)
   - Use environment variables exclusively
   - Never expose credentials in client-side code
   - Use .env.example with dummy values for documentation
   - Encrypt production credentials with dotenv-vault
   - Add credential rotation documentation

---

## Tasks / Subtasks

- [ ] Install Square SDK packages (AC: 1)
  - [ ] Add @square/web-sdk to package.json (client-side)
  - [ ] Add square Node SDK to package.json (server-side)
  - [ ] Run npm install and verify installation
  - [ ] Add TypeScript type definitions
  - [ ] Update package-lock.json

- [ ] Create environment variable configuration (AC: 2, 5)
  - [ ] Create .env.example with all required variables
  - [ ] Document each environment variable purpose
  - [ ] Add SQUARE_ACCESS_TOKEN (sandbox token for dev)
  - [ ] Add SQUARE_LOCATION_ID
  - [ ] Add SQUARE_APPLICATION_ID
  - [ ] Add SQUARE_ENVIRONMENT=sandbox
  - [ ] Ensure .env is in .gitignore

- [ ] Set up dotenv-vault for production (AC: 6)
  - [ ] Install @dotenv-vault/core
  - [ ] Initialize vault for production secrets
  - [ ] Document vault usage in README
  - [ ] Add vault decryption to deployment process

- [ ] Create Square client initialization utility (AC: 3)
  - [ ] Create lib/square/client.ts
  - [ ] Implement getSquareClient() singleton function
  - [ ] Initialize Client with environment and access token
  - [ ] Create PaymentsApi instance
  - [ ] Create LocationsApi instance
  - [ ] Add TypeScript interfaces for client types
  - [ ] Export typed client instance

- [ ] Implement environment variable validation (AC: 2)
  - [ ] Create lib/square/config.ts
  - [ ] Add validateSquareConfig() function
  - [ ] Check all required env vars are present
  - [ ] Validate SQUARE_ENVIRONMENT is 'sandbox' or 'production'
  - [ ] Throw descriptive errors for missing vars
  - [ ] Call validation at application startup

- [ ] Add API connection verification (AC: 4)
  - [ ] Create lib/square/connection-test.ts
  - [ ] Implement verifySquareConnection() function
  - [ ] Call LocationsApi.retrieveLocation()
  - [ ] Verify location has payment processing enabled
  - [ ] Log successful connection with details
  - [ ] Handle API errors gracefully

- [ ] Implement retry logic for connection (AC: 4)
  - [ ] Add retry utility function
  - [ ] Implement exponential backoff (1s, 2s, 4s)
  - [ ] Max 3 retry attempts
  - [ ] Log each retry attempt
  - [ ] Throw after max retries exceeded

- [ ] Create environment switching logic (AC: 5)
  - [ ] Add getSquareEnvironment() utility
  - [ ] Return 'sandbox' for dev/staging
  - [ ] Return 'production' only in production
  - [ ] Add environment indicator to logs
  - [ ] Prevent production credentials in local .env

- [ ] Add comprehensive logging (AC: 3, 4, 5)
  - [ ] Log SDK initialization start
  - [ ] Log successful connection with environment
  - [ ] Log location ID being used
  - [ ] Log connection failures with error details
  - [ ] Never log access tokens or sensitive data

- [ ] Create Square configuration documentation (AC: 6)
  - [ ] Document how to get Square credentials
  - [ ] Explain sandbox vs production setup
  - [ ] Add troubleshooting guide
  - [ ] Document credential rotation process
  - [ ] Add security best practices

---

## Dev Notes

### Architecture References

**Square SDK Setup**:
- Square Web SDK v2.0+ for frontend (payment forms)
- Square Node SDK v39+ for backend (API calls)
- Singleton pattern for client initialization
- Environment-based configuration

**Security Requirements**:
- Never commit credentials to version control
- Use environment variables exclusively
- Encrypt production secrets with dotenv-vault
- Never expose server-side credentials to client
- Validate all configuration at startup

**Source Tree**:
```
src/
├── lib/
│   └── square/
│       ├── client.ts         (Client initialization - NEW)
│       ├── config.ts         (Environment config validation - NEW)
│       └── connection-test.ts (Connection verification - NEW)
├── .env.example              (Example environment variables - NEW)
├── .env                      (Local environment variables - gitignored)
└── package.json              (Updated with Square SDKs)
```

**Environment Variables** (add to .env.example):
```bash
# Square Configuration (Sandbox for Development)
SQUARE_ACCESS_TOKEN=EAAAl...  # Sandbox Access Token
SQUARE_LOCATION_ID=L...        # Sandbox Location ID
SQUARE_APPLICATION_ID=sq0idp-  # Application ID
SQUARE_ENVIRONMENT=sandbox     # sandbox | production

# Production: Use dotenv-vault for secure credential management
# See docs/square-setup.md for credential generation
```

**Implementation Example** (lib/square/client.ts):
```typescript
import { Client, Environment } from 'square';
import { validateSquareConfig } from './config';

let squareClient: Client | null = null;

export function getSquareClient(): Client {
  if (squareClient) {
    return squareClient;
  }

  validateSquareConfig();

  const environment = process.env.SQUARE_ENVIRONMENT === 'production'
    ? Environment.Production
    : Environment.Sandbox;

  squareClient = new Client({
    environment,
    accessToken: process.env.SQUARE_ACCESS_TOKEN!,
  });

  return squareClient;
}

export function getPaymentsApi() {
  return getSquareClient().paymentsApi;
}

export function getLocationsApi() {
  return getSquareClient().locationsApi;
}
```

---

## Testing

### Test Standards
- Test file: `__tests__/lib/square/client.test.ts`
- Test file: `__tests__/lib/square/config.test.ts`
- Test file: `__tests__/lib/square/connection-test.test.ts`

### Testing Requirements

**Unit Tests**:
- ✅ Test client initialization with valid config
- ✅ Test client singleton pattern (same instance returned)
- ✅ Test environment variable validation
- ✅ Test missing environment variable errors
- ✅ Test invalid SQUARE_ENVIRONMENT value
- ✅ Test sandbox vs production environment switching
- ✅ Mock Square API calls for connection verification

**Integration Tests**:
- ✅ Test actual connection to Square Sandbox API
- ✅ Test location retrieval with valid credentials
- ✅ Test location payment processing capability check
- ✅ Test retry logic with network failures
- ✅ Test connection with invalid credentials (should fail gracefully)

**Security Tests**:
- ✅ Verify credentials never logged
- ✅ Verify .env not committed to git
- ✅ Verify production credentials not in local .env
- ✅ Verify client-side code cannot access server credentials

### Test Coverage Target
- Minimum 90% code coverage for configuration utilities
- 100% coverage for environment variable validation
- All error paths must be tested

---

## Definition of Done

- [ ] Square SDK packages installed and documented
- [ ] Environment variables configured in .env.example
- [ ] Square client initialization utility created
- [ ] Configuration validation implemented
- [ ] API connection verification working
- [ ] Retry logic implemented with exponential backoff
- [ ] Environment switching logic complete
- [ ] Comprehensive logging added (no sensitive data)
- [ ] Documentation for Square credential setup created
- [ ] All unit tests passing (90%+ coverage)
- [ ] Integration test with Square Sandbox API passing
- [ ] Security checklist verified (no credentials committed)
- [ ] Code review completed
- [ ] PR merged to main branch

---

## Related Stories

- **PAY-001b**: Square Payment Card Form Integration (blocks this story - next in sequence)
- **PAY-001c**: Payment Processing & Error Handling (blocks this story)
- **PAY-002**: Credit Card Processing (requires PAY-001 completion)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2024-01-15 | 1.0 | Created from PAY-001 sharding | SM Agent |

---

## Dev Agent Record

### Agent Model Used
*To be populated by dev agent*

### Debug Log References
*To be populated by dev agent*

### Completion Notes List
*To be populated by dev agent*

### File List
*To be populated by dev agent*

---

## QA Results
*To be populated by QA agent*