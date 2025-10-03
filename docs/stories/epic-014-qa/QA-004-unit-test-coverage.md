# QA-004: Unit Test Coverage

**Epic:** EPIC-014 - QA & Testing
**Story Points:** 5
**Priority:** High
**Status:** To Do

## User Story

**As a** developer
**I want** comprehensive unit test coverage
**So that** individual functions and components are reliable and regressions are caught early

## Description

Implement comprehensive unit test coverage for all critical business logic, services, utilities, and React components using Jest and React Testing Library. Achieve 80%+ overall coverage with 100% coverage for critical paths like payment processing, ticket generation, and authentication.

## Acceptance Criteria

### 1. Test Coverage Targets
- [ ] **Overall coverage:** 80%+ across all files
- [ ] **Critical paths:** 100% coverage (payments, auth, tickets)
- [ ] **Business logic:** 90%+ coverage (services, utilities)
- [ ] **React components:** 75%+ coverage
- [ ] **API routes:** 85%+ coverage
- [ ] **Database models:** 80%+ coverage

### 2. Testing Infrastructure
- [ ] Jest configured and optimized
- [ ] React Testing Library set up
- [ ] Test utilities and helpers created
- [ ] Mock data factories implemented
- [ ] Code coverage reporting
- [ ] Pre-commit hooks for tests
- [ ] CI/CD integration

### 3. Service Layer Tests
- [ ] **Payment Service:** All payment flows tested
- [ ] **Email Service:** Template rendering and delivery
- [ ] **QR Code Service:** Generation and validation
- [ ] **Authentication Service:** Login, registration, tokens
- [ ] **Event Service:** CRUD operations and business logic
- [ ] **Ticket Service:** Generation, validation, transfer
- [ ] **Analytics Service:** Metrics calculations

### 4. Utility Function Tests
- [ ] Date/time formatting and calculations
- [ ] Currency formatting and conversions
- [ ] Validation functions (email, phone, etc.)
- [ ] String manipulation utilities
- [ ] Array and object helpers
- [ ] Error handling utilities
- [ ] Encryption/hashing functions

### 5. React Component Tests
- [ ] **Forms:** Validation, submission, error handling
- [ ] **Buttons:** Click handlers, disabled states
- [ ] **Modals:** Open/close, data passing
- [ ] **Tables:** Data rendering, sorting, filtering
- [ ] **Charts:** Data visualization correctness
- [ ] **Navigation:** Link behavior, route protection
- [ ] **Hooks:** Custom hook behavior and edge cases

### 6. API Route Tests
- [ ] Authentication and authorization
- [ ] Request validation
- [ ] Response formatting
- [ ] Error handling
- [ ] Rate limiting
- [ ] CORS handling

### 7. Edge Cases & Error Handling
- [ ] Null/undefined handling
- [ ] Empty arrays/objects
- [ ] Invalid input data
- [ ] Network errors
- [ ] Database errors
- [ ] Race conditions
- [ ] Boundary values

### 8. Test Quality Standards
- [ ] Tests are deterministic (no flaky tests)
- [ ] Tests are isolated (no shared state)
- [ ] Tests are fast (< 100ms per unit test)
- [ ] Tests have descriptive names
- [ ] Tests follow AAA pattern (Arrange, Act, Assert)
- [ ] Mocks are used appropriately
- [ ] Test coverage is meaningful, not just numerical

## Technical Requirements

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/lib', '<rootDir>/app'],
  testMatch: [
    '**/__tests__/**/*.ts?(x)',
    '**/?(*.)+(spec|test).ts?(x)',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './lib/payments/': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    './lib/auth/': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
      },
    }],
  },
};
```

### Test Utilities
```typescript
// test-utils/test-helpers.ts
import { render, RenderOptions } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Custom render with providers
export function renderWithProviders(
  ui: React.ReactElement,
  options?: RenderOptions & { session?: any }
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <SessionProvider session={options?.session}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </SessionProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

// Mock fetch
export function mockFetch(data: any, status = 200) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
    } as Response)
  );
}

// Wait for async updates
export const waitFor = (callback: () => void, options?: { timeout?: number }) =>
  new Promise<void>((resolve) => {
    const timeout = options?.timeout || 1000;
    const start = Date.now();

    const check = () => {
      try {
        callback();
        resolve();
      } catch (error) {
        if (Date.now() - start < timeout) {
          setTimeout(check, 50);
        } else {
          throw error;
        }
      }
    };

    check();
  });
```

### Example: Payment Service Tests
```typescript
// lib/payments/__tests__/payment.service.test.ts
import { PaymentService } from '../payment.service';
import { SquareService } from '../square.service';
import { prisma } from '@/lib/prisma';

jest.mock('../square.service');
jest.mock('@/lib/prisma');

describe('PaymentService', () => {
  let paymentService: PaymentService;
  let mockSquareService: jest.Mocked<SquareService>;

  beforeEach(() => {
    mockSquareService = new SquareService() as jest.Mocked<SquareService>;
    paymentService = new PaymentService(mockSquareService);
    jest.clearAllMocks();
  });

  describe('processPayment', () => {
    it('should successfully process a valid payment', async () => {
      // Arrange
      const paymentData = {
        sourceId: 'cnon:card-nonce-ok',
        amount: 5000,
        currency: 'USD',
        orderId: 'order_123',
      };

      mockSquareService.createPayment.mockResolvedValue({
        id: 'payment_123',
        status: 'COMPLETED',
        amount: 5000,
      });

      // Act
      const result = await paymentService.processPayment(paymentData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.paymentId).toBe('payment_123');
      expect(mockSquareService.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceId: paymentData.sourceId,
          amount: paymentData.amount,
        })
      );
    });

    it('should handle payment failure gracefully', async () => {
      // Arrange
      const paymentData = {
        sourceId: 'cnon:card-nonce-declined',
        amount: 5000,
        currency: 'USD',
        orderId: 'order_123',
      };

      mockSquareService.createPayment.mockRejectedValue(
        new Error('Payment declined')
      );

      // Act
      const result = await paymentService.processPayment(paymentData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Payment declined');
    });

    it('should validate payment amount', async () => {
      // Arrange
      const invalidPaymentData = {
        sourceId: 'cnon:card-nonce-ok',
        amount: -100, // Invalid negative amount
        currency: 'USD',
        orderId: 'order_123',
      };

      // Act & Assert
      await expect(
        paymentService.processPayment(invalidPaymentData)
      ).rejects.toThrow('Invalid payment amount');
    });

    it('should handle network errors', async () => {
      // Arrange
      const paymentData = {
        sourceId: 'cnon:card-nonce-ok',
        amount: 5000,
        currency: 'USD',
        orderId: 'order_123',
      };

      mockSquareService.createPayment.mockRejectedValue(
        new Error('Network error')
      );

      // Act
      const result = await paymentService.processPayment(paymentData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('refundPayment', () => {
    it('should successfully refund a payment', async () => {
      // Arrange
      const refundData = {
        paymentId: 'payment_123',
        amount: 5000,
        reason: 'Customer request',
      };

      mockSquareService.refundPayment.mockResolvedValue({
        id: 'refund_123',
        status: 'COMPLETED',
        amount: 5000,
      });

      // Act
      const result = await paymentService.refundPayment(refundData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.refundId).toBe('refund_123');
    });

    it('should not allow partial refunds exceeding payment amount', async () => {
      // Arrange
      const refundData = {
        paymentId: 'payment_123',
        amount: 10000, // More than original payment
        reason: 'Customer request',
      };

      (prisma.payment.findUnique as jest.Mock).mockResolvedValue({
        amount: 5000,
      });

      // Act & Assert
      await expect(
        paymentService.refundPayment(refundData)
      ).rejects.toThrow('Refund amount exceeds payment amount');
    });
  });
});
```

### Example: React Component Tests
```typescript
// components/__tests__/EventCard.test.tsx
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventCard } from '../EventCard';
import { renderWithProviders } from '@/test-utils/test-helpers';

describe('EventCard', () => {
  const mockEvent = {
    id: 'event_123',
    title: 'Summer Dance Workshop',
    date: new Date('2025-07-15'),
    location: 'New York, NY',
    price: 2500,
    imageUrl: '/images/event.jpg',
    availableTickets: 50,
  };

  it('should render event details correctly', () => {
    renderWithProviders(<EventCard event={mockEvent} />);

    expect(screen.getByText('Summer Dance Workshop')).toBeInTheDocument();
    expect(screen.getByText('New York, NY')).toBeInTheDocument();
    expect(screen.getByText('$25.00')).toBeInTheDocument();
    expect(screen.getByText('50 tickets left')).toBeInTheDocument();
  });

  it('should display sold out badge when no tickets available', () => {
    const soldOutEvent = { ...mockEvent, availableTickets: 0 };
    renderWithProviders(<EventCard event={soldOutEvent} />);

    expect(screen.getByText('Sold Out')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /buy tickets/i })).toBeDisabled();
  });

  it('should call onClick when card is clicked', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    renderWithProviders(<EventCard event={mockEvent} onClick={handleClick} />);

    await user.click(screen.getByRole('article'));

    expect(handleClick).toHaveBeenCalledWith(mockEvent);
  });

  it('should format date correctly', () => {
    renderWithProviders(<EventCard event={mockEvent} />);

    expect(screen.getByText(/Jul 15, 2025/i)).toBeInTheDocument();
  });

  it('should show loading state', () => {
    renderWithProviders(<EventCard event={mockEvent} isLoading />);

    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });

  it('should handle missing optional fields', () => {
    const minimalEvent = {
      id: 'event_123',
      title: 'Test Event',
      date: new Date(),
    };

    renderWithProviders(<EventCard event={minimalEvent} />);

    expect(screen.getByText('Test Event')).toBeInTheDocument();
    expect(screen.queryByText(/tickets left/i)).not.toBeInTheDocument();
  });
});
```

### Example: Custom Hook Tests
```typescript
// hooks/__tests__/useCart.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCart } from '../useCart';

describe('useCart', () => {
  it('should initialize with empty cart', () => {
    const { result } = renderHook(() => useCart());

    expect(result.current.items).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.itemCount).toBe(0);
  });

  it('should add item to cart', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addItem({
        id: 'ticket_123',
        name: 'General Admission',
        price: 2500,
        quantity: 2,
      });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.itemCount).toBe(2);
    expect(result.current.total).toBe(5000);
  });

  it('should update item quantity', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addItem({
        id: 'ticket_123',
        name: 'General Admission',
        price: 2500,
        quantity: 2,
      });
    });

    act(() => {
      result.current.updateQuantity('ticket_123', 5);
    });

    expect(result.current.itemCount).toBe(5);
    expect(result.current.total).toBe(12500);
  });

  it('should remove item from cart', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addItem({
        id: 'ticket_123',
        name: 'General Admission',
        price: 2500,
        quantity: 2,
      });
    });

    act(() => {
      result.current.removeItem('ticket_123');
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.total).toBe(0);
  });

  it('should clear cart', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addItem({
        id: 'ticket_123',
        name: 'General Admission',
        price: 2500,
        quantity: 2,
      });
      result.current.addItem({
        id: 'ticket_456',
        name: 'VIP',
        price: 5000,
        quantity: 1,
      });
    });

    act(() => {
      result.current.clearCart();
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.total).toBe(0);
  });
});
```

### Mock Data Factories
```typescript
// test-utils/factories.ts
export const mockUser = (overrides?: Partial<User>): User => ({
  id: 'user_123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'attendee',
  createdAt: new Date(),
  ...overrides,
});

export const mockEvent = (overrides?: Partial<Event>): Event => ({
  id: 'event_123',
  title: 'Test Event',
  description: 'This is a test event',
  startDate: new Date('2025-07-15'),
  endDate: new Date('2025-07-15'),
  location: 'Test Location',
  organizerId: 'user_123',
  status: 'published',
  createdAt: new Date(),
  ...overrides,
});

export const mockOrder = (overrides?: Partial<Order>): Order => ({
  id: 'order_123',
  eventId: 'event_123',
  userId: 'user_123',
  amount: 5000,
  status: 'completed',
  tickets: [],
  createdAt: new Date(),
  ...overrides,
});
```

## Implementation Details

### Phase 1: Infrastructure (Day 1)
1. Configure Jest and React Testing Library
2. Set up test utilities and helpers
3. Create mock data factories
4. Configure code coverage
5. Set up CI/CD integration

### Phase 2: Service Layer Tests (Day 2)
1. Write payment service tests
2. Write authentication service tests
3. Write email service tests
4. Write ticket service tests
5. Write analytics service tests

### Phase 3: Component Tests (Day 3-4)
1. Test form components
2. Test UI components
3. Test page components
4. Test custom hooks
5. Test utility functions

### Phase 4: API & Coverage (Day 5)
1. Write API route tests
2. Improve coverage in critical areas
3. Fix any failing tests
4. Document testing patterns
5. Review and optimize

### File Structure
```
/__tests__/
├── services/
│   ├── payment.service.test.ts
│   ├── auth.service.test.ts
│   ├── email.service.test.ts
│   └── ticket.service.test.ts
├── components/
│   ├── EventCard.test.tsx
│   ├── CheckoutForm.test.tsx
│   └── TicketQRCode.test.tsx
├── hooks/
│   ├── useCart.test.ts
│   ├── useAuth.test.ts
│   └── useCheckout.test.ts
├── utils/
│   ├── formatters.test.ts
│   ├── validators.test.ts
│   └── helpers.test.ts
└── api/
    ├── events.test.ts
    ├── orders.test.ts
    └── auth.test.ts

/test-utils/
├── test-helpers.ts
├── factories.ts
└── mocks.ts
```

## Dependencies
- Infrastructure: Jest, React Testing Library
- Related: All feature implementations

## Testing Checklist

### Test Quality
- [ ] All tests pass consistently
- [ ] No flaky tests
- [ ] Tests are fast (< 5 seconds total)
- [ ] Tests are maintainable
- [ ] Mocks are appropriate

### Coverage
- [ ] Overall coverage > 80%
- [ ] Critical paths 100%
- [ ] Edge cases covered
- [ ] Error handling tested
- [ ] Async code tested

### CI/CD
- [ ] Tests run on every commit
- [ ] Coverage reports generated
- [ ] Pre-commit hooks work
- [ ] Failed tests block merges

## Performance Metrics
- Test suite execution time: < 30 seconds
- Individual test time: < 100ms
- Coverage report generation: < 5 seconds

## Success Metrics
- Test coverage: > 80%
- Test pass rate: 100%
- Test execution time: < 30 seconds
- Defect escape rate: < 5%
- Code review coverage: 100%

## Additional Resources
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Notes
- Focus on testing behavior, not implementation details
- Avoid over-mocking; use real objects when possible
- Keep tests simple and readable
- Refactor tests along with production code
- Use snapshot testing sparingly