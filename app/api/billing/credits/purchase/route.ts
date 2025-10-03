import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/rbac';
import { billingService } from '@/lib/services/billing.service';
import { logError } from '@/lib/monitoring/sentry';
import { z } from 'zod';
import { SquareClient, SquareEnvironment } from 'square';

const purchaseCreditsSchema = z.object({
  packageAmount: z.number().min(100).max(10000), // $100 - $10,000
  sourceId: z.string().min(1, 'Payment source is required'),
  verificationToken: z.string().optional()
});

// Credit package tiers with discounts
const CREDIT_PACKAGES = {
  100: { discount: 0 },      // $100 - no discount
  500: { discount: 5 },      // $500 - 5% discount
  1000: { discount: 7 },     // $1,000 - 7% discount
  2500: { discount: 10 },    // $2,500+ - 10% discount
};

function getDiscountPercent(amount: number): number {
  if (amount >= 2500) return 10;
  if (amount >= 1000) return 7;
  if (amount >= 500) return 5;
  return 0;
}

async function handlePurchaseCredits(request: NextRequest, context: any) {
  const { user } = context;

  try {
    const body = await request.json();
    const validatedData = purchaseCreditsSchema.parse(body);

    // Calculate discount and final price
    const discountPercent = getDiscountPercent(validatedData.packageAmount);
    const purchasePrice = validatedData.packageAmount * (1 - discountPercent / 100);

    // Process payment with Square
    const squareClient = new SquareClient({
      token: process.env.SQUARE_ACCESS_TOKEN!,
      environment: process.env.SQUARE_ENVIRONMENT === 'production'
        ? SquareEnvironment.Production
        : SquareEnvironment.Sandbox
    });

    let paymentResult;
    try {
      const createPaymentResult = await squareClient.payments.create({
        sourceId: validatedData.sourceId,
        idempotencyKey: `credit-${user.id}-${Date.now()}`,
        amountMoney: {
          amount: BigInt(Math.round(purchasePrice * 100)), // Convert to cents
          currency: 'USD'
        },
        ...(validatedData.verificationToken && {
          verificationToken: validatedData.verificationToken
        })
      });

      paymentResult = createPaymentResult;
    } catch (error: any) {
      console.error('Square payment error:', error);
      return NextResponse.json(
        { error: 'Payment processing failed. Please try again.' },
        { status: 400 }
      );
    }

    // Create credit purchase record
    const purchase = await billingService.purchasePrepaidCredits({
      userId: user.id,
      packageAmount: validatedData.packageAmount,
      discountPercent,
      squarePaymentId: paymentResult.payment?.id!,
      squareOrderId: paymentResult.payment?.orderId
    });

    return NextResponse.json({
      success: true,
      message: `Successfully purchased $${validatedData.packageAmount} in credits`,
      purchase: {
        id: purchase.id,
        packageAmount: Number(purchase.packageAmount),
        purchasePrice: Number(purchase.purchasePrice),
        discountPercent: Number(purchase.discountPercent),
        creditsRemaining: Number(purchase.creditsRemaining),
        purchasedAt: purchase.purchasedAt
      },
      paymentId: paymentResult.payment?.id
    });

  } catch (error) {
    console.error('Purchase credits error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    logError(error instanceof Error ? error : new Error(String(error)), {
      user: { id: user.id, email: user.email, role: user.role },
      tags: { component: 'billing-api', operation: 'purchase-credits' }
    });

    return NextResponse.json(
      { error: 'Failed to purchase credits' },
      { status: 500 }
    );
  }
}

// POST: Purchase prepaid credits
export async function POST(request: NextRequest) {
  return withAuth(handlePurchaseCredits, {
    permissions: ['billing.manage']
  })(request, {});
}