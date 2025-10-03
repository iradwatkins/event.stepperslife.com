-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ATTENDEE', 'ORGANIZER', 'STAFF', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'BANNED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "public"."BusinessType" AS ENUM ('INDIVIDUAL', 'SOLE_PROPRIETORSHIP', 'PARTNERSHIP', 'LLC', 'CORPORATION', 'NON_PROFIT');

-- CreateEnum
CREATE TYPE "public"."VerificationLevel" AS ENUM ('BASIC', 'VERIFIED', 'PREMIUM', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "public"."TeamRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'VOLUNTEER');

-- CreateEnum
CREATE TYPE "public"."PayoutSchedule" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'ON_DEMAND');

-- CreateEnum
CREATE TYPE "public"."SeatType" AS ENUM ('STANDARD', 'PREMIUM', 'VIP', 'ACCESSIBLE', 'OBSTRUCTED_VIEW');

-- CreateEnum
CREATE TYPE "public"."EventType" AS ENUM ('GENERAL_ADMISSION', 'RESERVED_SEATING', 'FESTIVAL', 'CONFERENCE', 'WORKSHOP', 'CONCERT', 'SPORTS', 'THEATER', 'VIRTUAL', 'HYBRID');

-- CreateEnum
CREATE TYPE "public"."EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'LIVE', 'POSTPONED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."EventVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'UNLISTED', 'INVITE_ONLY');

-- CreateEnum
CREATE TYPE "public"."TaxExemptionType" AS ENUM ('NON_PROFIT', 'GOVERNMENT', 'EDUCATIONAL', 'RELIGIOUS', 'CHARITY', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "public"."TicketStatus" AS ENUM ('VALID', 'USED', 'CANCELLED', 'REFUNDED', 'TRANSFERRED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'CASH_APP_PAY', 'BANK_TRANSFER', 'CASH', 'CHECK', 'GIFT_CARD');

-- CreateEnum
CREATE TYPE "public"."CheckInMethod" AS ENUM ('QR_SCAN', 'MANUAL_SEARCH', 'BARCODE_SCAN', 'NFC', 'CONFIRMATION_NUMBER');

-- CreateEnum
CREATE TYPE "public"."RefundReason" AS ENUM ('CUSTOMER_REQUEST', 'EVENT_CANCELLED', 'EVENT_POSTPONED', 'DUPLICATE_ORDER', 'FRAUD_PROTECTION', 'SYSTEM_ERROR', 'ADMIN_DECISION');

-- CreateEnum
CREATE TYPE "public"."RefundStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."TransferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."DiscountType" AS ENUM ('FIXED_AMOUNT', 'PERCENTAGE', 'BUY_X_GET_Y', 'EARLY_BIRD', 'GROUP_DISCOUNT');

-- CreateEnum
CREATE TYPE "public"."WaitlistStatus" AS ENUM ('WAITING', 'NOTIFIED', 'PURCHASED', 'EXPIRED', 'REMOVED');

-- CreateEnum
CREATE TYPE "public"."BillingAccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('PLATFORM_FEE', 'REFUND', 'CREDIT_PURCHASE', 'CREDIT_DEDUCTION', 'PAYOUT', 'SUBSCRIPTION_PAYMENT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."PayoutStatus" AS ENUM ('PENDING', 'SCHEDULED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PurchaseStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."WhitelabelPlan" AS ENUM ('BASIC', 'PREMIUM', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED', 'TRIAL');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "displayName" TEXT,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "profileImage" TEXT,
    "bio" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'ATTENDEE',
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "language" TEXT NOT NULL DEFAULT 'en',
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "squareCustomerId" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."organizer_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "businessType" "public"."BusinessType" NOT NULL DEFAULT 'INDIVIDUAL',
    "taxId" TEXT,
    "website" TEXT,
    "socialMedia" JSONB DEFAULT '{}',
    "squareLocationId" TEXT,
    "squareBusinessId" TEXT,
    "squareApplication" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verificationLevel" "public"."VerificationLevel" NOT NULL DEFAULT 'BASIC',
    "autoPayoutEnabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultPayoutSchedule" "public"."PayoutSchedule" NOT NULL DEFAULT 'DAILY',
    "totalEvents" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."team_members" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."TeamRole" NOT NULL DEFAULT 'STAFF',
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."venues" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'US',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "maxCapacity" INTEGER NOT NULL,
    "hasSeating" BOOLEAN NOT NULL DEFAULT false,
    "hasParking" BOOLEAN NOT NULL DEFAULT false,
    "isAccessible" BOOLEAN NOT NULL DEFAULT true,
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "coverImage" TEXT,
    "gallery" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."seating_charts" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "layout" JSONB NOT NULL,
    "sections" JSONB NOT NULL,
    "totalSeats" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seating_charts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."seats" (
    "id" TEXT NOT NULL,
    "seatingChartId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "row" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "seatType" "public"."SeatType" NOT NULL DEFAULT 'STANDARD',
    "isAccessible" BOOLEAN NOT NULL DEFAULT false,
    "x" DOUBLE PRECISION,
    "y" DOUBLE PRECISION,

    CONSTRAINT "seats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."events" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "venueId" TEXT,
    "seatingChartId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "shortDescription" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "eventType" "public"."EventType" NOT NULL DEFAULT 'GENERAL_ADMISSION',
    "isVirtual" BOOLEAN NOT NULL DEFAULT false,
    "virtualUrl" TEXT,
    "maxCapacity" INTEGER,
    "salesStartDate" TIMESTAMP(3),
    "salesEndDate" TIMESTAMP(3),
    "status" "public"."EventStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "public"."EventVisibility" NOT NULL DEFAULT 'PUBLIC',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "coverImage" TEXT,
    "gallery" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "squareCatalogId" TEXT,
    "squareLocationId" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_sessions" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ticket_types" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "quantity" INTEGER NOT NULL,
    "sold" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "minPerOrder" INTEGER NOT NULL DEFAULT 1,
    "maxPerOrder" INTEGER NOT NULL DEFAULT 10,
    "salesStartDate" TIMESTAMP(3),
    "salesEndDate" TIMESTAMP(3),
    "squareItemId" TEXT,
    "squareVariationId" TEXT,
    "requiresSeat" BOOLEAN NOT NULL DEFAULT false,
    "allowedSections" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rules" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "fees" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "taxes" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(6,4),
    "taxBreakdown" JSONB,
    "taxExempt" BOOLEAN NOT NULL DEFAULT false,
    "taxExemptionId" TEXT,
    "total" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'PENDING',
    "squareOrderId" TEXT,
    "squarePaymentId" TEXT,
    "squareReceiptUrl" TEXT,
    "squareReceiptNumber" TEXT,
    "paymentMethod" TEXT,
    "paymentStatus" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "browserInfo" JSONB,
    "ipAddress" TEXT,
    "source" TEXT DEFAULT 'web',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tickets" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "ticketTypeId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT,
    "seatId" TEXT,
    "holderName" TEXT,
    "holderEmail" TEXT,
    "faceValue" DECIMAL(10,2) NOT NULL,
    "fees" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "public"."TicketStatus" NOT NULL DEFAULT 'VALID',
    "qrCode" TEXT NOT NULL,
    "validationCode" TEXT NOT NULL,
    "checkedIn" BOOLEAN NOT NULL DEFAULT false,
    "checkedInAt" TIMESTAMP(3),
    "checkedInBy" TEXT,
    "checkInMethod" "public"."CheckInMethod",
    "checkInLocation" TEXT,
    "transferrable" BOOLEAN NOT NULL DEFAULT true,
    "resaleable" BOOLEAN NOT NULL DEFAULT false,
    "transferredAt" TIMESTAMP(3),
    "transferredTo" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "method" "public"."PaymentMethod" NOT NULL,
    "squarePaymentId" TEXT NOT NULL,
    "squareOrderId" TEXT,
    "squareLocationId" TEXT,
    "squareReceiptUrl" TEXT,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "cardBrand" TEXT,
    "cardLast4" TEXT,
    "cardExpMonth" INTEGER,
    "cardExpYear" INTEGER,
    "processorFee" DECIMAL(10,2),
    "netAmount" DECIMAL(10,2),
    "avsResult" TEXT,
    "cvvResult" TEXT,
    "riskEvaluation" JSONB,
    "squareResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."refunds" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "paymentId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" "public"."RefundReason" NOT NULL,
    "reasonText" TEXT,
    "squareRefundId" TEXT,
    "status" "public"."RefundStatus" NOT NULL DEFAULT 'PENDING',
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ticket_transfers" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "toUserId" TEXT,
    "status" "public"."TransferStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "oldQrCode" TEXT NOT NULL,
    "newQrCode" TEXT,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."discounts" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."DiscountType" NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "isPercentage" BOOLEAN NOT NULL DEFAULT false,
    "maxUses" INTEGER,
    "maxUsesPerUser" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "minOrderAmount" DECIMAL(10,2),
    "applicableTicketTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."discount_uses" (
    "id" TEXT NOT NULL,
    "discountId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amountDiscounted" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discount_uses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."waitlists" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "ticketQuantity" INTEGER NOT NULL DEFAULT 1,
    "maxPrice" DECIMAL(10,2),
    "status" "public"."WaitlistStatus" NOT NULL DEFAULT 'WAITING',
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waitlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reviews" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "comment" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isModerated" BOOLEAN NOT NULL DEFAULT false,
    "moderatedBy" TEXT,
    "moderatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."follows" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."system_metrics" (
    "id" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "dimensions" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."billing_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platformFeeFixed" DECIMAL(10,2) NOT NULL DEFAULT 0.75,
    "platformFeePercent" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "negotiatedRate" BOOLEAN NOT NULL DEFAULT false,
    "rateEffectiveDate" TIMESTAMP(3),
    "creditBalance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "lifetimeCredits" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "payoutSchedule" "public"."PayoutSchedule" NOT NULL DEFAULT 'DAILY',
    "minimumPayout" DECIMAL(10,2) NOT NULL DEFAULT 25.00,
    "pendingBalance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "availableBalance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "public"."BillingAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "suspendedAt" TIMESTAMP(3),
    "suspensionReason" TEXT,
    "totalRevenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalFees" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalPayouts" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "transactionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."platform_transactions" (
    "id" TEXT NOT NULL,
    "billingAccountId" TEXT NOT NULL,
    "type" "public"."TransactionType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "description" TEXT,
    "orderId" TEXT,
    "ticketId" TEXT,
    "eventId" TEXT,
    "squarePaymentId" TEXT,
    "creditUsed" BOOLEAN NOT NULL DEFAULT false,
    "creditAmount" DECIMAL(10,2),
    "status" "public"."TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fiscalMonth" TEXT NOT NULL,
    "fiscalQuarter" TEXT NOT NULL,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payout_records" (
    "id" TEXT NOT NULL,
    "billingAccountId" TEXT NOT NULL,
    "payoutNumber" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "squarePayoutId" TEXT,
    "squareBatchId" TEXT,
    "status" "public"."PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "initiatedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "fiscalMonth" TEXT NOT NULL,
    "transactionCount" INTEGER NOT NULL DEFAULT 0,
    "totalSales" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalFees" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."credit_purchases" (
    "id" TEXT NOT NULL,
    "billingAccountId" TEXT NOT NULL,
    "packageAmount" DECIMAL(10,2) NOT NULL,
    "purchasePrice" DECIMAL(10,2) NOT NULL,
    "discountPercent" DECIMAL(5,2) NOT NULL,
    "squarePaymentId" TEXT NOT NULL,
    "squareOrderId" TEXT,
    "status" "public"."PurchaseStatus" NOT NULL DEFAULT 'COMPLETED',
    "creditsUsed" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "creditsRemaining" DECIMAL(10,2) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."whitelabel_subscriptions" (
    "id" TEXT NOT NULL,
    "billingAccountId" TEXT NOT NULL,
    "planType" "public"."WhitelabelPlan" NOT NULL DEFAULT 'BASIC',
    "monthlyPrice" DECIMAL(10,2) NOT NULL DEFAULT 10.00,
    "status" "public"."SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "squareSubscriptionId" TEXT,
    "squareCustomerId" TEXT,
    "billingDay" INTEGER NOT NULL DEFAULT 1,
    "lastBilledAt" TIMESTAMP(3),
    "nextBillingAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "endsAt" TIMESTAMP(3),
    "trialStart" TIMESTAMP(3),
    "trialEnd" TIMESTAMP(3),
    "failedPaymentCount" INTEGER NOT NULL DEFAULT 0,
    "lastFailedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whitelabel_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subscription_payments" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "squarePaymentId" TEXT,
    "squareInvoiceId" TEXT,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tax_rates" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "county" TEXT,
    "city" TEXT,
    "zipCode" TEXT,
    "stateTaxRate" DECIMAL(6,4) NOT NULL,
    "localTaxRate" DECIMAL(6,4) NOT NULL DEFAULT 0,
    "combinedRate" DECIMAL(6,4) NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "source" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tax_exemptions" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "exemptionType" "public"."TaxExemptionType" NOT NULL,
    "certificateNumber" TEXT,
    "issuingAuthority" TEXT,
    "documentUrl" TEXT,
    "verificationNotes" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_exemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_EventToEventCategory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EventToEventCategory_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_squareCustomerId_key" ON "public"."users"("squareCustomerId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "public"."users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "public"."users"("status");

-- CreateIndex
CREATE INDEX "users_squareCustomerId_idx" ON "public"."users"("squareCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "organizer_profiles_userId_key" ON "public"."organizer_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_organizerId_userId_key" ON "public"."team_members"("organizerId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "venues_slug_key" ON "public"."venues"("slug");

-- CreateIndex
CREATE INDEX "venues_organizerId_idx" ON "public"."venues"("organizerId");

-- CreateIndex
CREATE INDEX "venues_city_state_idx" ON "public"."venues"("city", "state");

-- CreateIndex
CREATE INDEX "seating_charts_venueId_idx" ON "public"."seating_charts"("venueId");

-- CreateIndex
CREATE INDEX "seats_seatingChartId_idx" ON "public"."seats"("seatingChartId");

-- CreateIndex
CREATE UNIQUE INDEX "seats_seatingChartId_section_row_number_key" ON "public"."seats"("seatingChartId", "section", "row", "number");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "public"."events"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "events_squareCatalogId_key" ON "public"."events"("squareCatalogId");

-- CreateIndex
CREATE INDEX "events_organizerId_idx" ON "public"."events"("organizerId");

-- CreateIndex
CREATE INDEX "events_slug_idx" ON "public"."events"("slug");

-- CreateIndex
CREATE INDEX "events_startDate_idx" ON "public"."events"("startDate");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "public"."events"("status");

-- CreateIndex
CREATE INDEX "events_squareCatalogId_idx" ON "public"."events"("squareCatalogId");

-- CreateIndex
CREATE UNIQUE INDEX "event_categories_name_key" ON "public"."event_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "event_categories_slug_key" ON "public"."event_categories"("slug");

-- CreateIndex
CREATE INDEX "event_sessions_eventId_idx" ON "public"."event_sessions"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_types_squareItemId_key" ON "public"."ticket_types"("squareItemId");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_types_squareVariationId_key" ON "public"."ticket_types"("squareVariationId");

-- CreateIndex
CREATE INDEX "ticket_types_eventId_idx" ON "public"."ticket_types"("eventId");

-- CreateIndex
CREATE INDEX "ticket_types_squareItemId_idx" ON "public"."ticket_types"("squareItemId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "public"."orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "orders_squareOrderId_key" ON "public"."orders"("squareOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_squarePaymentId_key" ON "public"."orders"("squarePaymentId");

-- CreateIndex
CREATE INDEX "orders_orderNumber_idx" ON "public"."orders"("orderNumber");

-- CreateIndex
CREATE INDEX "orders_eventId_idx" ON "public"."orders"("eventId");

-- CreateIndex
CREATE INDEX "orders_userId_idx" ON "public"."orders"("userId");

-- CreateIndex
CREATE INDEX "orders_email_idx" ON "public"."orders"("email");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "public"."orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_ticketNumber_key" ON "public"."tickets"("ticketNumber");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_qrCode_key" ON "public"."tickets"("qrCode");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_validationCode_key" ON "public"."tickets"("validationCode");

-- CreateIndex
CREATE INDEX "tickets_orderId_idx" ON "public"."tickets"("orderId");

-- CreateIndex
CREATE INDEX "tickets_ticketTypeId_idx" ON "public"."tickets"("ticketTypeId");

-- CreateIndex
CREATE INDEX "tickets_eventId_idx" ON "public"."tickets"("eventId");

-- CreateIndex
CREATE INDEX "tickets_userId_idx" ON "public"."tickets"("userId");

-- CreateIndex
CREATE INDEX "tickets_qrCode_idx" ON "public"."tickets"("qrCode");

-- CreateIndex
CREATE INDEX "tickets_status_idx" ON "public"."tickets"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_orderId_key" ON "public"."payments"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_squarePaymentId_key" ON "public"."payments"("squarePaymentId");

-- CreateIndex
CREATE INDEX "payments_squarePaymentId_idx" ON "public"."payments"("squarePaymentId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "public"."payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_squareRefundId_key" ON "public"."refunds"("squareRefundId");

-- CreateIndex
CREATE INDEX "refunds_orderId_idx" ON "public"."refunds"("orderId");

-- CreateIndex
CREATE INDEX "refunds_squareRefundId_idx" ON "public"."refunds"("squareRefundId");

-- CreateIndex
CREATE INDEX "ticket_transfers_ticketId_idx" ON "public"."ticket_transfers"("ticketId");

-- CreateIndex
CREATE INDEX "ticket_transfers_fromUserId_idx" ON "public"."ticket_transfers"("fromUserId");

-- CreateIndex
CREATE INDEX "ticket_transfers_toUserId_idx" ON "public"."ticket_transfers"("toUserId");

-- CreateIndex
CREATE INDEX "ticket_transfers_status_idx" ON "public"."ticket_transfers"("status");

-- CreateIndex
CREATE UNIQUE INDEX "discounts_code_key" ON "public"."discounts"("code");

-- CreateIndex
CREATE INDEX "discounts_eventId_idx" ON "public"."discounts"("eventId");

-- CreateIndex
CREATE INDEX "discounts_code_idx" ON "public"."discounts"("code");

-- CreateIndex
CREATE UNIQUE INDEX "discount_uses_discountId_orderId_key" ON "public"."discount_uses"("discountId", "orderId");

-- CreateIndex
CREATE INDEX "waitlists_eventId_status_idx" ON "public"."waitlists"("eventId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "waitlists_eventId_email_key" ON "public"."waitlists"("eventId", "email");

-- CreateIndex
CREATE INDEX "reviews_eventId_idx" ON "public"."reviews"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_eventId_userId_key" ON "public"."reviews"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "event_favorites_userId_eventId_key" ON "public"."event_favorites"("userId", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "follows_followerId_followingId_key" ON "public"."follows"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "public"."audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "public"."audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "public"."audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "system_metrics_metricType_metricName_idx" ON "public"."system_metrics"("metricType", "metricName");

-- CreateIndex
CREATE INDEX "system_metrics_timestamp_idx" ON "public"."system_metrics"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "public"."accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "public"."sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "public"."verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "public"."verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "billing_accounts_userId_key" ON "public"."billing_accounts"("userId");

-- CreateIndex
CREATE INDEX "billing_accounts_userId_idx" ON "public"."billing_accounts"("userId");

-- CreateIndex
CREATE INDEX "billing_accounts_status_idx" ON "public"."billing_accounts"("status");

-- CreateIndex
CREATE INDEX "platform_transactions_billingAccountId_idx" ON "public"."platform_transactions"("billingAccountId");

-- CreateIndex
CREATE INDEX "platform_transactions_type_idx" ON "public"."platform_transactions"("type");

-- CreateIndex
CREATE INDEX "platform_transactions_status_idx" ON "public"."platform_transactions"("status");

-- CreateIndex
CREATE INDEX "platform_transactions_fiscalMonth_idx" ON "public"."platform_transactions"("fiscalMonth");

-- CreateIndex
CREATE INDEX "platform_transactions_eventId_idx" ON "public"."platform_transactions"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "payout_records_payoutNumber_key" ON "public"."payout_records"("payoutNumber");

-- CreateIndex
CREATE UNIQUE INDEX "payout_records_squarePayoutId_key" ON "public"."payout_records"("squarePayoutId");

-- CreateIndex
CREATE INDEX "payout_records_billingAccountId_idx" ON "public"."payout_records"("billingAccountId");

-- CreateIndex
CREATE INDEX "payout_records_status_idx" ON "public"."payout_records"("status");

-- CreateIndex
CREATE INDEX "payout_records_scheduledFor_idx" ON "public"."payout_records"("scheduledFor");

-- CreateIndex
CREATE INDEX "payout_records_fiscalMonth_idx" ON "public"."payout_records"("fiscalMonth");

-- CreateIndex
CREATE UNIQUE INDEX "credit_purchases_squarePaymentId_key" ON "public"."credit_purchases"("squarePaymentId");

-- CreateIndex
CREATE INDEX "credit_purchases_billingAccountId_idx" ON "public"."credit_purchases"("billingAccountId");

-- CreateIndex
CREATE INDEX "credit_purchases_status_idx" ON "public"."credit_purchases"("status");

-- CreateIndex
CREATE UNIQUE INDEX "whitelabel_subscriptions_billingAccountId_key" ON "public"."whitelabel_subscriptions"("billingAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "whitelabel_subscriptions_squareSubscriptionId_key" ON "public"."whitelabel_subscriptions"("squareSubscriptionId");

-- CreateIndex
CREATE INDEX "whitelabel_subscriptions_billingAccountId_idx" ON "public"."whitelabel_subscriptions"("billingAccountId");

-- CreateIndex
CREATE INDEX "whitelabel_subscriptions_status_idx" ON "public"."whitelabel_subscriptions"("status");

-- CreateIndex
CREATE INDEX "whitelabel_subscriptions_nextBillingAt_idx" ON "public"."whitelabel_subscriptions"("nextBillingAt");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_payments_squarePaymentId_key" ON "public"."subscription_payments"("squarePaymentId");

-- CreateIndex
CREATE INDEX "subscription_payments_subscriptionId_idx" ON "public"."subscription_payments"("subscriptionId");

-- CreateIndex
CREATE INDEX "subscription_payments_status_idx" ON "public"."subscription_payments"("status");

-- CreateIndex
CREATE INDEX "subscription_payments_dueDate_idx" ON "public"."subscription_payments"("dueDate");

-- CreateIndex
CREATE INDEX "tax_rates_state_idx" ON "public"."tax_rates"("state");

-- CreateIndex
CREATE INDEX "tax_rates_state_city_idx" ON "public"."tax_rates"("state", "city");

-- CreateIndex
CREATE INDEX "tax_rates_zipCode_idx" ON "public"."tax_rates"("zipCode");

-- CreateIndex
CREATE INDEX "tax_rates_effectiveDate_idx" ON "public"."tax_rates"("effectiveDate");

-- CreateIndex
CREATE UNIQUE INDEX "tax_exemptions_eventId_key" ON "public"."tax_exemptions"("eventId");

-- CreateIndex
CREATE INDEX "tax_exemptions_eventId_idx" ON "public"."tax_exemptions"("eventId");

-- CreateIndex
CREATE INDEX "tax_exemptions_exemptionType_idx" ON "public"."tax_exemptions"("exemptionType");

-- CreateIndex
CREATE INDEX "tax_exemptions_approved_idx" ON "public"."tax_exemptions"("approved");

-- CreateIndex
CREATE INDEX "_EventToEventCategory_B_index" ON "public"."_EventToEventCategory"("B");

-- AddForeignKey
ALTER TABLE "public"."organizer_profiles" ADD CONSTRAINT "organizer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."team_members" ADD CONSTRAINT "team_members_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "public"."organizer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."team_members" ADD CONSTRAINT "team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."venues" ADD CONSTRAINT "venues_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "public"."organizer_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."seating_charts" ADD CONSTRAINT "seating_charts_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "public"."venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."seats" ADD CONSTRAINT "seats_seatingChartId_fkey" FOREIGN KEY ("seatingChartId") REFERENCES "public"."seating_charts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "public"."venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_seatingChartId_fkey" FOREIGN KEY ("seatingChartId") REFERENCES "public"."seating_charts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_sessions" ADD CONSTRAINT "event_sessions_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ticket_types" ADD CONSTRAINT "ticket_types_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tickets" ADD CONSTRAINT "tickets_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tickets" ADD CONSTRAINT "tickets_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "public"."ticket_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tickets" ADD CONSTRAINT "tickets_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tickets" ADD CONSTRAINT "tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tickets" ADD CONSTRAINT "tickets_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "public"."seats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refunds" ADD CONSTRAINT "refunds_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refunds" ADD CONSTRAINT "refunds_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ticket_transfers" ADD CONSTRAINT "ticket_transfers_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "public"."tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ticket_transfers" ADD CONSTRAINT "ticket_transfers_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ticket_transfers" ADD CONSTRAINT "ticket_transfers_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."discounts" ADD CONSTRAINT "discounts_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."discount_uses" ADD CONSTRAINT "discount_uses_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "public"."discounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."discount_uses" ADD CONSTRAINT "discount_uses_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."waitlists" ADD CONSTRAINT "waitlists_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_favorites" ADD CONSTRAINT "event_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_favorites" ADD CONSTRAINT "event_favorites_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."follows" ADD CONSTRAINT "follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."follows" ADD CONSTRAINT "follows_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_accounts" ADD CONSTRAINT "billing_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."platform_transactions" ADD CONSTRAINT "platform_transactions_billingAccountId_fkey" FOREIGN KEY ("billingAccountId") REFERENCES "public"."billing_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."platform_transactions" ADD CONSTRAINT "platform_transactions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payout_records" ADD CONSTRAINT "payout_records_billingAccountId_fkey" FOREIGN KEY ("billingAccountId") REFERENCES "public"."billing_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."credit_purchases" ADD CONSTRAINT "credit_purchases_billingAccountId_fkey" FOREIGN KEY ("billingAccountId") REFERENCES "public"."billing_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."whitelabel_subscriptions" ADD CONSTRAINT "whitelabel_subscriptions_billingAccountId_fkey" FOREIGN KEY ("billingAccountId") REFERENCES "public"."billing_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subscription_payments" ADD CONSTRAINT "subscription_payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."whitelabel_subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tax_exemptions" ADD CONSTRAINT "tax_exemptions_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_EventToEventCategory" ADD CONSTRAINT "_EventToEventCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_EventToEventCategory" ADD CONSTRAINT "_EventToEventCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."event_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

