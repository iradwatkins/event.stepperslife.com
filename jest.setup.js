// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables for testing
process.env.NEXTAUTH_URL = 'http://localhost:3004'
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-only'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.SQUARE_ENVIRONMENT = 'sandbox'
process.env.SQUARE_ACCESS_TOKEN = 'test-square-token'
process.env.SQUARE_APPLICATION_ID = 'test-square-app-id'
process.env.SQUARE_LOCATION_ID = 'test-square-location-id'
process.env.SMTP_HOST = 'localhost'
process.env.SMTP_PORT = '1025'
process.env.SMTP_USER = 'test'
process.env.SMTP_PASS = 'test'
process.env.SMTP_FROM = 'test@example.com'

// Global test setup
beforeAll(() => {
  // Setup global mocks if needed
})

afterAll(() => {
  // Cleanup after all tests
})

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/',
}))

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))
