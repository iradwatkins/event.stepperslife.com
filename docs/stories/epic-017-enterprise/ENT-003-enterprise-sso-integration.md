# ENT-003: Enterprise SSO Integration

**Epic:** EPIC-017 Enterprise Features
**Story Points:** 5
**Priority:** E3 (Expansion)
**Status:** Not Started

---

## User Story

**As an** enterprise administrator
**I want** to integrate single sign-on (SSO) with our corporate identity provider
**So that** employees can access the platform securely using their existing corporate credentials

---

## Acceptance Criteria

### 1. SAML 2.0 Authentication
- [ ] SAML 2.0 protocol implementation
- [ ] Service Provider (SP) metadata generation
- [ ] Identity Provider (IdP) metadata import
- [ ] Assertion validation and signature verification
- [ ] Attribute mapping configuration
- [ ] Single Logout (SLO) support
- [ ] Encrypted SAML assertions
- [ ] SAML debugging and troubleshooting tools

### 2. OAuth 2.0 / OpenID Connect
- [ ] OAuth 2.0 authorization code flow
- [ ] OpenID Connect authentication
- [ ] JWT token validation
- [ ] Refresh token handling
- [ ] Scope management
- [ ] PKCE (Proof Key for Code Exchange) support
- [ ] ID token claims mapping
- [ ] Token revocation support

### 3. Identity Provider Integration
- [ ] Okta integration
- [ ] Azure Active Directory (Azure AD) integration
- [ ] Google Workspace integration
- [ ] OneLogin integration
- [ ] Auth0 integration
- [ ] Generic SAML provider support
- [ ] Generic OIDC provider support
- [ ] Multi-IdP support per organization

### 4. Just-In-Time (JIT) User Provisioning
- [ ] Automatic user creation on first login
- [ ] User profile sync from IdP attributes
- [ ] Email verification bypass for SSO users
- [ ] Default role assignment
- [ ] Organization assignment
- [ ] User metadata mapping
- [ ] Profile update on subsequent logins
- [ ] Deprovisioning on IdP deletion

### 5. Role Mapping from Identity Provider
- [ ] IdP group to application role mapping
- [ ] Custom attribute-based role assignment
- [ ] Role mapping configuration UI
- [ ] Multiple group mappings
- [ ] Role hierarchy support
- [ ] Default role for unmapped users
- [ ] Role sync frequency configuration
- [ ] Audit log for role assignments

### 6. Security & Compliance
- [ ] Certificate management for SAML
- [ ] Secure credential storage
- [ ] Session management for SSO users
- [ ] Force SSO for specific organizations
- [ ] SSO fallback to password authentication
- [ ] Login audit trail
- [ ] MFA compatibility
- [ ] GDPR compliance for user data

### 7. Testing & Quality
- [ ] Unit tests for SAML/OAuth flows (>85% coverage)
- [ ] Integration tests with test IdPs
- [ ] Security audit and penetration testing
- [ ] Load testing SSO endpoints
- [ ] Error handling for failed authentication
- [ ] Documentation for IdP setup
- [ ] Admin guide for SSO configuration
- [ ] End-user SSO login guide

---

## Technical Specifications

### Database Schema
```prisma
// prisma/schema.prisma

model SSOConfiguration {
  id                String   @id @default(cuid())
  organizationId    String   @unique
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Provider details
  provider          String   // 'saml', 'oidc', 'oauth2'
  providerName      String   // 'okta', 'azure_ad', 'google', 'onelogin', 'custom'

  // SAML configuration
  samlIdpMetadata   String?  // XML metadata from IdP
  samlEntityId      String?
  samlSsoUrl        String?
  samlCertificate   String?
  samlSigningAlgorithm String? @default("sha256")
  samlSloUrl        String?  // Single Logout URL

  // OAuth/OIDC configuration
  oidcIssuer        String?
  oidcClientId      String?
  oidcClientSecret  String?  // Encrypted
  oidcAuthUrl       String?
  oidcTokenUrl      String?
  oidcUserinfoUrl   String?
  oidcScopes        String?  @default("openid profile email")

  // Attribute mapping
  attributeMapping  Json     // {email: "email", firstName: "given_name", lastName: "family_name"}

  // Role mapping
  roleMappings      Json     // [{idpGroup: "admins", appRole: "admin"}, ...]

  // JIT provisioning
  jitProvisioning   Boolean  @default(true)
  defaultRole       String   @default("member")
  autoAssignOrg     Boolean  @default(true)

  // Security settings
  enforceSSO        Boolean  @default(false)
  allowPasswordFallback Boolean @default(true)

  // Status
  enabled           Boolean  @default(false)
  testMode          Boolean  @default(true)

  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([organizationId, enabled])
}

model SSOSession {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id])

  // Session details
  sessionId         String   @unique // IdP session ID
  nameId            String?  // SAML NameID
  sessionIndex      String?  // SAML SessionIndex

  // Token information
  accessToken       String?  // Encrypted
  refreshToken      String?  // Encrypted
  idToken           String?  // Encrypted
  expiresAt         DateTime

  // Metadata
  ipAddress         String?
  userAgent         String?
  metadata          Json?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([userId, organizationId])
  @@index([sessionId])
}

model SSOAuditLog {
  id                String   @id @default(cuid())
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id])
  userId            String?
  user              User?    @relation(fields: [userId], references: [id])

  // Event details
  event             String   // 'login_success', 'login_failure', 'logout', 'jit_provision', 'role_mapped'
  provider          String
  result            String   // 'success', 'failure'
  errorMessage      String?

  // Metadata
  ipAddress         String?
  userAgent         String?
  metadata          Json?

  createdAt         DateTime @default(now())

  @@index([organizationId, event, createdAt])
  @@index([userId, createdAt])
}

// Update User model
model User {
  // ... existing fields
  ssoProvider       String?  // 'saml', 'oidc', 'oauth2'
  ssoNameId         String?  @unique // IdP unique identifier
  ssoMetadata       Json?
  ssoSessions       SSOSession[]
  ssoAuditLogs      SSOAuditLog[]
  // ... rest of fields
}
```

### SSO Service
```typescript
// lib/services/sso.service.ts
import { SAML } from '@node-saml/node-saml';
import { Issuer, generators } from 'openid-client';
import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from '@/lib/utils/encryption';

const prisma = new PrismaClient();

export class SSOService {
  // Initialize SAML provider
  async initializeSAML(organizationId: string): Promise<SAML> {
    const config = await prisma.sSOConfiguration.findUnique({
      where: { organizationId },
    });

    if (!config || config.provider !== 'saml') {
      throw new Error('SAML configuration not found');
    }

    return new SAML({
      entryPoint: config.samlSsoUrl!,
      issuer: config.samlEntityId!,
      cert: config.samlCertificate!,
      callbackUrl: `${process.env.NEXTAUTH_URL}/api/auth/saml/callback`,
      signatureAlgorithm: config.samlSigningAlgorithm!,
      wantAssertionsSigned: true,
      wantAuthnResponseSigned: true,
    });
  }

  // Handle SAML login
  async handleSAMLLogin(organizationId: string): Promise<string> {
    const saml = await this.initializeSAML(organizationId);
    const loginUrl = await saml.getAuthorizeUrlAsync('', '', {});
    return loginUrl;
  }

  // Handle SAML callback
  async handleSAMLCallback(
    organizationId: string,
    samlResponse: string
  ): Promise<User> {
    const saml = await this.initializeSAML(organizationId);
    const profile = await saml.validatePostResponseAsync(samlResponse);

    const config = await prisma.sSOConfiguration.findUnique({
      where: { organizationId },
    });

    if (!config) {
      throw new Error('SSO configuration not found');
    }

    // Map attributes
    const attributeMapping = config.attributeMapping as Record<string, string>;
    const email = profile[attributeMapping.email || 'email'];
    const firstName = profile[attributeMapping.firstName || 'firstName'];
    const lastName = profile[attributeMapping.lastName || 'lastName'];

    // JIT provisioning
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user && config.jitProvisioning) {
      user = await prisma.user.create({
        data: {
          email,
          name: `${firstName} ${lastName}`,
          emailVerified: new Date(),
          ssoProvider: 'saml',
          ssoNameId: profile.nameID,
          ssoMetadata: profile,
        },
      });

      // Assign to organization
      if (config.autoAssignOrg) {
        await prisma.organizationUser.create({
          data: {
            organizationId,
            userId: user.id,
            role: config.defaultRole,
          },
        });
      }

      // Map roles
      await this.mapUserRoles(user.id, organizationId, profile);

      // Audit log
      await this.logSSOEvent(organizationId, user.id, 'jit_provision', 'success');
    }

    // Create SSO session
    await prisma.sSOSession.create({
      data: {
        userId: user!.id,
        organizationId,
        sessionId: profile.sessionIndex!,
        nameId: profile.nameID,
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
      },
    });

    await this.logSSOEvent(organizationId, user!.id, 'login_success', 'success');

    return user!;
  }

  // Initialize OIDC provider
  async initializeOIDC(organizationId: string) {
    const config = await prisma.sSOConfiguration.findUnique({
      where: { organizationId },
    });

    if (!config || config.provider !== 'oidc') {
      throw new Error('OIDC configuration not found');
    }

    const issuer = await Issuer.discover(config.oidcIssuer!);

    const client = new issuer.Client({
      client_id: config.oidcClientId!,
      client_secret: decrypt(config.oidcClientSecret!),
      redirect_uris: [`${process.env.NEXTAUTH_URL}/api/auth/oidc/callback`],
      response_types: ['code'],
    });

    return client;
  }

  // Handle OIDC login
  async handleOIDCLogin(organizationId: string): Promise<string> {
    const client = await this.initializeOIDC(organizationId);
    const config = await prisma.sSOConfiguration.findUnique({
      where: { organizationId },
    });

    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);

    const authUrl = client.authorizationUrl({
      scope: config!.oidcScopes!,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    // Store code verifier in session
    // (Implementation depends on session management)

    return authUrl;
  }

  // Handle OIDC callback
  async handleOIDCCallback(
    organizationId: string,
    code: string,
    codeVerifier: string
  ): Promise<User> {
    const client = await this.initializeOIDC(organizationId);
    const config = await prisma.sSOConfiguration.findUnique({
      where: { organizationId },
    });

    const tokenSet = await client.callback(
      `${process.env.NEXTAUTH_URL}/api/auth/oidc/callback`,
      { code },
      { code_verifier: codeVerifier }
    );

    const userinfo = await client.userinfo(tokenSet.access_token!);

    // Map attributes
    const attributeMapping = config!.attributeMapping as Record<string, string>;
    const email = userinfo[attributeMapping.email || 'email'] as string;
    const firstName = userinfo[attributeMapping.firstName || 'given_name'] as string;
    const lastName = userinfo[attributeMapping.lastName || 'family_name'] as string;

    // JIT provisioning (similar to SAML)
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user && config!.jitProvisioning) {
      user = await prisma.user.create({
        data: {
          email,
          name: `${firstName} ${lastName}`,
          emailVerified: new Date(),
          ssoProvider: 'oidc',
          ssoNameId: userinfo.sub as string,
          ssoMetadata: userinfo,
        },
      });

      if (config!.autoAssignOrg) {
        await prisma.organizationUser.create({
          data: {
            organizationId,
            userId: user.id,
            role: config!.defaultRole,
          },
        });
      }

      await this.mapUserRoles(user.id, organizationId, userinfo);
      await this.logSSOEvent(organizationId, user.id, 'jit_provision', 'success');
    }

    // Create SSO session
    await prisma.sSOSession.create({
      data: {
        userId: user!.id,
        organizationId,
        sessionId: tokenSet.session_state as string,
        accessToken: encrypt(tokenSet.access_token!),
        refreshToken: tokenSet.refresh_token ? encrypt(tokenSet.refresh_token) : null,
        idToken: tokenSet.id_token ? encrypt(tokenSet.id_token) : null,
        expiresAt: new Date(tokenSet.expires_at! * 1000),
      },
    });

    await this.logSSOEvent(organizationId, user!.id, 'login_success', 'success');

    return user!;
  }

  // Map user roles from IdP groups
  async mapUserRoles(
    userId: string,
    organizationId: string,
    profile: any
  ): Promise<void> {
    const config = await prisma.sSOConfiguration.findUnique({
      where: { organizationId },
    });

    if (!config) return;

    const roleMappings = config.roleMappings as Array<{
      idpGroup: string;
      appRole: string;
    }>;

    const userGroups = profile.groups || [];

    for (const mapping of roleMappings) {
      if (userGroups.includes(mapping.idpGroup)) {
        await prisma.organizationUser.upsert({
          where: {
            organizationId_userId: { organizationId, userId },
          },
          update: {
            role: mapping.appRole,
          },
          create: {
            organizationId,
            userId,
            role: mapping.appRole,
          },
        });

        await this.logSSOEvent(organizationId, userId, 'role_mapped', 'success', {
          idpGroup: mapping.idpGroup,
          appRole: mapping.appRole,
        });
        break;
      }
    }
  }

  // Log SSO events
  async logSSOEvent(
    organizationId: string,
    userId: string | null,
    event: string,
    result: string,
    metadata?: any
  ): Promise<void> {
    await prisma.sSOAuditLog.create({
      data: {
        organizationId,
        userId,
        event,
        result,
        provider: 'sso',
        metadata,
      },
    });
  }

  // Handle SSO logout
  async handleSSOLogout(sessionId: string): Promise<void> {
    const session = await prisma.sSOSession.findUnique({
      where: { sessionId },
    });

    if (session) {
      await prisma.sSOSession.delete({
        where: { sessionId },
      });

      await this.logSSOEvent(
        session.organizationId,
        session.userId,
        'logout',
        'success'
      );
    }
  }
}
```

### API Routes
```typescript
// app/api/auth/sso/saml/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { SSOService } from '@/lib/services/sso.service';

const ssoService = new SSOService();

export async function GET(req: NextRequest) {
  const organizationId = req.nextUrl.searchParams.get('org');

  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
  }

  try {
    const loginUrl = await ssoService.handleSAMLLogin(organizationId);
    return NextResponse.redirect(loginUrl);
  } catch (error) {
    return NextResponse.json({ error: 'SSO login failed' }, { status: 500 });
  }
}

// app/api/auth/sso/saml/callback/route.ts
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const samlResponse = formData.get('SAMLResponse') as string;
  const relayState = formData.get('RelayState') as string;

  const organizationId = relayState; // Or extract from RelayState

  try {
    const user = await ssoService.handleSAMLCallback(organizationId, samlResponse);
    // Create NextAuth session
    return NextResponse.redirect('/dashboard');
  } catch (error) {
    return NextResponse.json({ error: 'SAML callback failed' }, { status: 500 });
  }
}
```

---

## Testing Requirements

### Unit Tests
```typescript
describe('SSOService', () => {
  it('should initialize SAML provider', async () => {
    const saml = await ssoService.initializeSAML(organizationId);
    expect(saml).toBeDefined();
  });

  it('should handle SAML callback and provision user', async () => {
    const user = await ssoService.handleSAMLCallback(organizationId, samlResponse);
    expect(user.ssoProvider).toBe('saml');
  });

  it('should map user roles from IdP groups', async () => {
    await ssoService.mapUserRoles(userId, organizationId, profile);
    const orgUser = await prisma.organizationUser.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
    expect(orgUser.role).toBe('admin');
  });

  it('should handle OIDC login flow', async () => {
    const user = await ssoService.handleOIDCCallback(organizationId, code, verifier);
    expect(user.ssoProvider).toBe('oidc');
  });
});
```

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] SAML 2.0 integration functional
- [ ] OAuth/OIDC integration functional
- [ ] JIT provisioning working
- [ ] Role mapping operational
- [ ] Major IdPs tested (Okta, Azure AD, Google)
- [ ] Security audit completed
- [ ] Unit tests passing (>85% coverage)
- [ ] Integration tests passing
- [ ] Documentation complete

---

## Dependencies

- US-001: User authentication (prerequisite)
- US-005: RBAC system (prerequisite)
- ENT-002: Organization management (prerequisite)

---

## Estimated Timeline

**Total Duration:** 4-5 weeks
**Story Points:** 5