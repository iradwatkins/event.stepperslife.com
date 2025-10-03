# QA-008: Quality Gates in CI/CD

**Epic:** EPIC-014 - QA & Testing
**Story Points:** 3
**Priority:** High
**Status:** To Do

## User Story

**As a** DevOps engineer
**I want** automated quality gates in the CI/CD pipeline
**So that** low-quality code cannot be deployed to production

## Description

Implement comprehensive automated quality gates in the CI/CD pipeline that enforce code quality standards, test coverage requirements, security checks, and build validation. Gates should prevent deployment of code that fails quality checks and provide clear feedback to developers on what needs to be fixed.

## Acceptance Criteria

### 1. Test Coverage Gate
- [ ] Unit test coverage must be >= 80%
- [ ] Integration test coverage must be >= 70%
- [ ] Critical paths must have 100% coverage
- [ ] Coverage reports generated and stored
- [ ] Coverage trends tracked over time
- [ ] Block merge if coverage decreases

### 2. Test Execution Gate
- [ ] All unit tests must pass
- [ ] All integration tests must pass
- [ ] E2E tests must pass (smoke tests on PR)
- [ ] No flaky tests allowed (< 1% flake rate)
- [ ] Test execution time monitoring
- [ ] Parallel test execution

### 3. Code Quality Gate
- [ ] ESLint checks must pass (0 errors)
- [ ] TypeScript compilation must succeed
- [ ] Prettier formatting enforced
- [ ] No console.log statements in production
- [ ] Import organization enforced
- [ ] Unused imports removed
- [ ] Code complexity under threshold

### 4. Security Scanning Gate
- [ ] Dependency vulnerability scan (npm audit)
- [ ] No critical vulnerabilities allowed
- [ ] No high-severity vulnerabilities allowed
- [ ] SAST (Static Application Security Testing)
- [ ] Secrets detection (no hardcoded secrets)
- [ ] License compliance check
- [ ] OWASP dependency check

### 5. Build Validation Gate
- [ ] Next.js build must succeed
- [ ] No build warnings (production)
- [ ] Bundle size within limits (< 500KB initial)
- [ ] Lighthouse performance score >= 90
- [ ] Lighthouse accessibility score >= 90
- [ ] No unused dependencies
- [ ] Tree-shaking verification

### 6. Database Migration Gate
- [ ] Migration tests pass
- [ ] Migrations are reversible
- [ ] Schema validation
- [ ] No breaking changes without approval
- [ ] Migration performance tested
- [ ] Backup verification

### 7. API Contract Gate
- [ ] API schema validation
- [ ] No breaking API changes
- [ ] OpenAPI spec validation
- [ ] Backward compatibility check
- [ ] API versioning enforced
- [ ] Documentation updated

### 8. Deployment Readiness Gate
- [ ] All quality gates passed
- [ ] Environment variables validated
- [ ] Health check endpoint working
- [ ] Database connection verified
- [ ] External service connectivity checked
- [ ] Release notes generated

## Technical Requirements

### GitHub Actions Workflow
```yaml
# .github/workflows/quality-gates.yml
name: Quality Gates

on:
  pull_request:
    branches: [main, master]
  push:
    branches: [main, master]

jobs:
  # Gate 1: Code Quality
  code-quality:
    name: Code Quality Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: TypeScript Check
        run: npm run type-check

      - name: ESLint Check
        run: npm run lint

      - name: Prettier Check
        run: npm run format:check

      - name: Check for console.log
        run: |
          if grep -r "console\.log" --include="*.ts" --include="*.tsx" app lib; then
            echo "Found console.log statements"
            exit 1
          fi

      - name: Complexity Check
        run: npx complexity-report --limit 20

  # Gate 2: Tests & Coverage
  tests:
    name: Tests & Coverage
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: events_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit -- --coverage
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/events_test

      - name: Check coverage thresholds
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 80% threshold"
            exit 1
          fi

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/events_test

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/coverage-final.json
          fail_ci_if_error: true

  # Gate 3: E2E Tests (Smoke)
  e2e-smoke:
    name: E2E Smoke Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run smoke tests
        run: npm run test:e2e:smoke
        env:
          BASE_URL: http://localhost:3004

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

  # Gate 4: Security Scan
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Audit dependencies
        run: npm audit --audit-level=high

      - name: Snyk Security Scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

      - name: GitGuardian Secrets Scan
        uses: GitGuardian/ggshield-action@v1
        env:
          GITHUB_PUSH_BEFORE_SHA: ${{ github.event.before }}
          GITHUB_PUSH_BASE_SHA: ${{ github.event.base }}
          GITHUB_DEFAULT_BRANCH: ${{ github.event.repository.default_branch }}
          GITGUARDIAN_API_KEY: ${{ secrets.GITGUARDIAN_API_KEY }}

      - name: Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

  # Gate 5: Build Validation
  build:
    name: Build Validation
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build
        env:
          NODE_ENV: production

      - name: Check bundle size
        run: |
          BUNDLE_SIZE=$(du -sb .next/static/chunks | awk '{print $1}')
          MAX_SIZE=$((500 * 1024)) # 500KB
          if [ $BUNDLE_SIZE -gt $MAX_SIZE ]; then
            echo "Bundle size ${BUNDLE_SIZE} exceeds maximum ${MAX_SIZE}"
            exit 1
          fi

      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            http://localhost:3004
            http://localhost:3004/events
          configPath: './.lighthouserc.json'
          uploadArtifacts: true
          temporaryPublicStorage: true

  # Gate 6: Database Migrations
  migrations:
    name: Database Migrations
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: events_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/events_test

      - name: Test migration rollback
        run: |
          # Get latest migration
          MIGRATION=$(ls -t prisma/migrations | head -n 1)
          # Rollback
          npx prisma migrate resolve --rolled-back $MIGRATION
          # Reapply
          npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/events_test

      - name: Validate schema
        run: npx prisma validate

  # Final Gate: Quality Summary
  quality-summary:
    name: Quality Summary
    runs-on: ubuntu-latest
    needs: [code-quality, tests, e2e-smoke, security, build, migrations]
    if: always()
    steps:
      - name: Check all gates passed
        run: |
          if [ "${{ needs.code-quality.result }}" != "success" ] || \
             [ "${{ needs.tests.result }}" != "success" ] || \
             [ "${{ needs.e2e-smoke.result }}" != "success" ] || \
             [ "${{ needs.security.result }}" != "success" ] || \
             [ "${{ needs.build.result }}" != "success" ] || \
             [ "${{ needs.migrations.result }}" != "success" ]; then
            echo "❌ One or more quality gates failed"
            exit 1
          fi
          echo "✅ All quality gates passed"

      - name: Post summary to PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const summary = `
            ## Quality Gates Summary

            | Gate | Status |
            |------|--------|
            | Code Quality | ${{ needs.code-quality.result == 'success' && '✅' || '❌' }} |
            | Tests & Coverage | ${{ needs.tests.result == 'success' && '✅' || '❌' }} |
            | E2E Smoke Tests | ${{ needs.e2e-smoke.result == 'success' && '✅' || '❌' }} |
            | Security Scan | ${{ needs.security.result == 'success' && '✅' || '❌' }} |
            | Build Validation | ${{ needs.build.result == 'success' && '✅' || '❌' }} |
            | Database Migrations | ${{ needs.migrations.result == 'success' && '✅' || '❌' }} |
            `;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: summary
            });
```

### Lighthouse Configuration
```json
// .lighthouserc.json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "startServerCommand": "npm run start",
      "url": [
        "http://localhost:3004/",
        "http://localhost:3004/events"
      ]
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["error", { "minScore": 0.9 }],
        "categories:seo": ["error", { "minScore": 0.9 }],
        "first-contentful-paint": ["error", { "maxNumericValue": 2000 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

### Pre-Commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged && npm run type-check",
      "pre-push": "npm run test:unit",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

### Branch Protection Rules
```yaml
# Branch protection configuration
protection_rules:
  - branch: main
    required_status_checks:
      strict: true
      contexts:
        - code-quality
        - tests
        - e2e-smoke
        - security
        - build
        - migrations
    required_pull_request_reviews:
      required_approving_review_count: 1
      dismiss_stale_reviews: true
      require_code_owner_reviews: true
    enforce_admins: true
    restrictions: null
```

### Quality Metrics Dashboard
```typescript
// scripts/quality-metrics.ts
import fs from 'fs';

interface QualityMetrics {
  testCoverage: number;
  eslintErrors: number;
  eslintWarnings: number;
  buildTime: number;
  bundleSize: number;
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

function collectMetrics(): QualityMetrics {
  const coverage = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
  const eslintReport = JSON.parse(fs.readFileSync('.eslint-report.json', 'utf8'));
  const auditReport = JSON.parse(fs.readFileSync('.npm-audit.json', 'utf8'));

  return {
    testCoverage: coverage.total.lines.pct,
    eslintErrors: eslintReport.errorCount,
    eslintWarnings: eslintReport.warningCount,
    buildTime: getBuildTime(),
    bundleSize: getBundleSize(),
    vulnerabilities: {
      critical: auditReport.metadata.vulnerabilities.critical || 0,
      high: auditReport.metadata.vulnerabilities.high || 0,
      medium: auditReport.metadata.vulnerabilities.medium || 0,
      low: auditReport.metadata.vulnerabilities.low || 0,
    },
  };
}

function generateReport(metrics: QualityMetrics) {
  console.log('📊 Quality Metrics Report');
  console.log('========================\n');
  console.log(`Test Coverage: ${metrics.testCoverage}%`);
  console.log(`ESLint Errors: ${metrics.eslintErrors}`);
  console.log(`ESLint Warnings: ${metrics.eslintWarnings}`);
  console.log(`Build Time: ${metrics.buildTime}s`);
  console.log(`Bundle Size: ${(metrics.bundleSize / 1024).toFixed(2)}KB`);
  console.log('\nVulnerabilities:');
  console.log(`  Critical: ${metrics.vulnerabilities.critical}`);
  console.log(`  High: ${metrics.vulnerabilities.high}`);
  console.log(`  Medium: ${metrics.vulnerabilities.medium}`);
  console.log(`  Low: ${metrics.vulnerabilities.low}`);

  // Fail if quality gates not met
  if (
    metrics.testCoverage < 80 ||
    metrics.eslintErrors > 0 ||
    metrics.vulnerabilities.critical > 0 ||
    metrics.vulnerabilities.high > 0
  ) {
    console.error('\n❌ Quality gates not met!');
    process.exit(1);
  }

  console.log('\n✅ All quality gates passed!');
}

const metrics = collectMetrics();
generateReport(metrics);
```

## Implementation Details

### Phase 1: Basic Gates (Day 1)
1. Set up GitHub Actions
2. Configure linting checks
3. Add test execution
4. Implement coverage gates
5. Test with sample PR

### Phase 2: Advanced Gates (Day 2)
1. Add security scanning
2. Implement build validation
3. Add Lighthouse checks
4. Configure migration tests
5. Test all gates

### Phase 3: Integration & Docs (Day 3)
1. Set up branch protection
2. Configure pre-commit hooks
3. Create quality dashboard
4. Document gate requirements
5. Train team on workflow

### File Structure
```
/.github/
├── workflows/
│   ├── quality-gates.yml
│   ├── deploy.yml
│   └── nightly-tests.yml
├── CODEOWNERS
└── pull_request_template.md

/scripts/
├── quality-metrics.ts
├── check-bundle-size.sh
└── validate-migrations.sh

/.husky/
├── pre-commit
├── pre-push
└── commit-msg

/.lighthouserc.json
/.eslintrc.json
/.prettierrc.json
```

## Dependencies
- Infrastructure: GitHub Actions
- Related: All QA stories

## Testing Checklist

### Quality Gates
- [ ] Code quality checks work
- [ ] Test coverage enforced
- [ ] Security scans pass
- [ ] Build validation works
- [ ] Migration tests pass

### Automation
- [ ] Pre-commit hooks work
- [ ] CI/CD pipeline functional
- [ ] Branch protection active
- [ ] Notifications configured
- [ ] Metrics tracked

### Developer Experience
- [ ] Fast feedback (< 10 min)
- [ ] Clear error messages
- [ ] Easy to bypass in emergencies
- [ ] Documentation complete
- [ ] Team trained

## Success Metrics
- Quality gate pass rate: > 95%
- False positive rate: < 2%
- Average CI/CD time: < 10 minutes
- Production bug escape rate: < 1%
- Developer satisfaction: > 4/5

## Additional Resources
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Branch Protection Best Practices](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)
- [Continuous Integration Best Practices](https://martinfowler.com/articles/continuousIntegration.html)

## Notes
- Balance strictness with developer productivity
- Allow emergency bypass with approval
- Review and adjust thresholds based on team feedback
- Keep CI/CD pipeline fast (< 10 minutes)
- Provide clear feedback on failures