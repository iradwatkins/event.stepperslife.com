/**
 * Affiliate System Type Definitions
 * Provides type safety for the affiliate ticket sales system
 */

import { z } from 'zod';

// ============================================================================
// AFFILIATE STATUS TYPES
// ============================================================================

export type AffiliateStatus = 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'BANNED' | 'INACTIVE';
export type CommissionType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'TIERED';
export type SaleType = 'ONLINE_LINK' | 'CASH_OFFLINE' | 'MANUAL_ENTRY';
export type SettlementStatus = 'UNSETTLED' | 'SETTLED' | 'WRITTEN_OFF';
export type PayoutMethod = 'BANK_TRANSFER' | 'STRIPE_CONNECT' | 'CHECK';

// ============================================================================
// AFFILIATE REGISTRATION
// ============================================================================

/**
 * Validation schema for affiliate registration
 * Enforces strong password requirements and required fields
 */
export const affiliateRegistrationSchema = z.object({
  // Personal Information
  email: z.string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),

  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .trim(),

  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .trim(),

  phone: z.string()
    .regex(/^\+?1?\d{10,14}$/, 'Please enter a valid phone number')
    .trim(),

  // Security
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character (@$!%*?&#)'),

  confirmPassword: z.string()
    .min(1, 'Please confirm your password'),

  // Business Information (Optional)
  businessName: z.string()
    .max(100, 'Business name must be less than 100 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  taxId: z.string()
    .regex(/^\d{2}-?\d{7}$/, 'Tax ID must be in format XX-XXXXXXX')
    .optional()
    .or(z.literal('')),

  // Legal Agreements
  termsAccepted: z.boolean()
    .refine((val) => val === true, {
      message: 'You must accept the Affiliate Terms & Conditions'
    }),

  affiliateAgreement: z.boolean()
    .refine((val) => val === true, {
      message: 'You must accept the Affiliate Agreement'
    }),

  // Optional Marketing
  marketingOptIn: z.boolean().default(false)
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

export type AffiliateRegistrationForm = z.infer<typeof affiliateRegistrationSchema>;

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface AffiliateRegistrationResponse {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    affiliateId: string;
    email: string;
    status: AffiliateStatus;
  };
  error?: string;
  details?: Array<{
    path: string[];
    message: string;
  }>;
}

// ============================================================================
// AFFILIATE PROFILE TYPES
// ============================================================================

export interface Affiliate {
  id: string;
  userId: string;

  // Business Information
  businessName: string | null;
  taxId: string | null;
  w9Submitted: boolean;
  w9DocumentUrl: string | null;

  // Cash Payment PIN
  cashPinHash: string | null;
  pinLastChanged: Date | null;

  // Status
  status: AffiliateStatus;
  approvedBy: string | null;
  approvedAt: Date | null;
  suspendedAt: Date | null;
  suspensionReason: string | null;

  // Payment Settings
  payoutMethod: PayoutMethod;
  bankAccountLast4: string | null;
  stripeConnectId: string | null;

  // Statistics
  totalSales: number;
  totalRevenue: number;
  totalCommission: number;
  totalPaidOut: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// AFFILIATE LINK TYPES
// ============================================================================

export interface AffiliateLink {
  id: string;
  affiliateId: string;
  eventId: string;

  // Link Configuration
  linkCode: string;
  trackingUrl: string;

  // Commission Settings
  commissionType: CommissionType;
  commissionValue: number;

  // Statistics
  clicks: number;
  conversions: number;
  totalSales: number;

  // Status
  isActive: boolean;
  expiresAt: Date | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// AFFILIATE SALE TYPES
// ============================================================================

export interface AffiliateSale {
  id: string;
  affiliateId: string;
  affiliateLinkId: string | null;
  eventId: string;
  orderId: string;

  // Sale Details
  saleType: SaleType;
  ticketCount: number;
  ticketPrice: number;
  subtotal: number;
  fees: number;
  taxes: number;
  total: number;

  // Commission/Profit
  commissionType: CommissionType;
  commissionValue: number;
  commissionAmount: number;

  // Payment Method
  paymentMethod: string;

  // Cash Payment Validation
  cashValidatedBy: string | null;
  cashPinValidated: boolean;
  cashValidatedAt: Date | null;

  // Settlement
  wholesaleOwed: number | null;
  settlementStatus: SettlementStatus;
  settledAt: Date | null;

  // Payment References
  squarePaymentId: string | null;
  stripePaymentId: string | null;

  // Timestamps
  saleDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// AFFILIATE DASHBOARD TYPES
// ============================================================================

export interface AffiliateDashboardStats {
  // Overview
  totalSales: number;
  totalRevenue: number;
  totalCommission: number;
  pendingPayout: number;

  // Performance
  conversionRate: number;
  averageOrderValue: number;
  topPerformingEvent: {
    id: string;
    name: string;
    sales: number;
    revenue: number;
  } | null;

  // Recent Activity
  recentSales: AffiliateSale[];
  upcomingPayouts: AffiliatePayout[];
}

// ============================================================================
// AFFILIATE PAYOUT TYPES
// ============================================================================

export interface AffiliatePayout {
  id: string;
  affiliateId: string;

  // Payout Details
  payoutNumber: string;
  amount: number;
  currency: string;

  // Period
  periodStart: Date;
  periodEnd: Date;

  // Statistics
  salesCount: number;
  totalCommission: number;
  platformFee: number;
  netPayout: number;

  // Status
  status: 'PENDING' | 'SCHEDULED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  scheduledFor: Date;
  processedAt: Date | null;

  // Payment Method
  payoutMethod: PayoutMethod;
  stripeTransferId: string | null;
  bankTransferId: string | null;

  // Failure Handling
  failureReason: string | null;
  retryCount: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// PASSWORD STRENGTH TYPES
// ============================================================================

export interface PasswordStrength {
  score: number;
  maxScore: number;
  feedback: string[];
  color: string;
  strength: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
}

// ============================================================================
// FORM FIELD TYPES
// ============================================================================

export interface FormFieldError {
  type: string;
  message: string;
}

export interface FormState {
  isSubmitting: boolean;
  isSuccess: boolean;
  error: string | null;
}
