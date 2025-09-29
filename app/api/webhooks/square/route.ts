import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { SQUARE_CONFIG } from '@/lib/payments/square.config';
import { WebhookEvent, PaymentStatus } from 'squareup';
import crypto from 'crypto';

/**
 * Verify Square webhook signature
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  signatureKey: string,
  url: string
): boolean {
  try {
    // Square webhook signature verification
    const hmac = crypto.createHmac('sha256', signatureKey);
    hmac.update(url + payload);
    const expectedSignature = hmac.digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('x-square-hmacsha256-signature') || '';
    const url = request.url;

    // Verify webhook signature
    if (!SQUARE_CONFIG.webhookSignatureKey) {
      console.error('Square webhook signature key not configured');
      return NextResponse.json(
        { error: 'Webhook configuration error' },
        { status: 500 }
      );
    }

    if (!verifyWebhookSignature(body, signature, SQUARE_CONFIG.webhookSignatureKey, url)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      );
    }

    const event = JSON.parse(body) as WebhookEvent;

    // Log webhook event
    await prisma.webhookEvent.create({
      data: {
        id: event.data?.id || crypto.randomUUID(),
        type: event.type || 'unknown',
        source: 'square',
        payload: event,
        processed: false,
        createdAt: new Date()
      }
    });

    // Process the webhook event
    await processWebhookEvent(event);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Square webhook error:', error);

    // Log webhook error
    await prisma.auditLog.create({
      data: {
        action: 'WEBHOOK_ERROR',
        entityType: 'SYSTEM',
        entityId: 'square_webhook',
        metadata: {
          error: String(error),
          source: 'square'
        }
      }
    }).catch(console.error);

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function processWebhookEvent(event: WebhookEvent) {
  const eventType = event.type;
  const eventData = event.data;

  if (!eventData?.object) {
    console.warn('Webhook event missing data object:', eventType);
    return;
  }

  try {
    switch (eventType) {
      case 'payment.created':
        await handlePaymentCreated(eventData.object);
        break;

      case 'payment.updated':
        await handlePaymentUpdated(eventData.object);
        break;

      case 'refund.created':
        await handleRefundCreated(eventData.object);
        break;

      case 'refund.updated':
        await handleRefundUpdated(eventData.object);
        break;

      case 'order.created':
        await handleOrderCreated(eventData.object);
        break;

      case 'order.updated':
        await handleOrderUpdated(eventData.object);
        break;

      default:
        console.log('Unhandled webhook event type:', eventType);
    }

    // Mark webhook as processed
    await prisma.webhookEvent.updateMany({
      where: {
        type: eventType,
        processed: false,
        createdAt: {
          gte: new Date(Date.now() - 60000) // Within last minute
        }
      },
      data: {
        processed: true,
        processedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Webhook event processing error:', error);

    await prisma.auditLog.create({
      data: {
        action: 'WEBHOOK_EVENT_ERROR',
        entityType: 'SYSTEM',
        entityId: 'square_webhook',
        metadata: {
          error: String(error),
          eventType,
          eventId: eventData.id
        }
      }
    });
  }
}

async function handlePaymentCreated(paymentData: any) {
  const payment = paymentData.payment;
  if (!payment) return;

  // Payment creation is handled in the payment service
  // This webhook is mainly for logging/confirmation
  await prisma.auditLog.create({
    data: {
      action: 'PAYMENT_CREATED_WEBHOOK',
      entityType: 'PAYMENT',
      entityId: payment.id,
      metadata: {
        amount: payment.amount_money?.amount,
        currency: payment.amount_money?.currency,
        status: payment.status,
        order_id: payment.order_id
      }
    }
  });
}

async function handlePaymentUpdated(paymentData: any) {
  const payment = paymentData.payment;
  if (!payment) return;

  // Update payment status in database
  const existingPayment = await prisma.payment.findUnique({
    where: { squarePaymentId: payment.id }
  });

  if (existingPayment) {
    await prisma.payment.update({
      where: { squarePaymentId: payment.id },
      data: {
        status: mapPaymentStatus(payment.status),
        receiptNumber: payment.receipt_number,
        receiptUrl: payment.receipt_url,
        updatedAt: new Date(payment.updated_at || new Date().toISOString())
      }
    });

    // Log payment update
    await prisma.auditLog.create({
      data: {
        action: 'PAYMENT_UPDATED_WEBHOOK',
        entityType: 'PAYMENT',
        entityId: payment.id,
        metadata: {
          oldStatus: existingPayment.status,
          newStatus: mapPaymentStatus(payment.status),
          amount: payment.amount_money?.amount
        }
      }
    });
  }
}

async function handleRefundCreated(refundData: any) {
  const refund = refundData.refund;
  if (!refund) return;

  // Log refund creation
  await prisma.auditLog.create({
    data: {
      action: 'REFUND_CREATED_WEBHOOK',
      entityType: 'REFUND',
      entityId: refund.id,
      metadata: {
        paymentId: refund.payment_id,
        amount: refund.amount_money?.amount,
        currency: refund.amount_money?.currency,
        status: refund.status
      }
    }
  });
}

async function handleRefundUpdated(refundData: any) {
  const refund = refundData.refund;
  if (!refund) return;

  // Update refund status in database
  await prisma.refund.updateMany({
    where: { squareRefundId: refund.id },
    data: {
      status: refund.status || 'UNKNOWN',
      updatedAt: new Date()
    }
  });

  // Log refund update
  await prisma.auditLog.create({
    data: {
      action: 'REFUND_UPDATED_WEBHOOK',
      entityType: 'REFUND',
      entityId: refund.id,
      metadata: {
        paymentId: refund.payment_id,
        status: refund.status
      }
    }
  });
}

async function handleOrderCreated(orderData: any) {
  // Log order creation
  await prisma.auditLog.create({
    data: {
      action: 'ORDER_CREATED_WEBHOOK',
      entityType: 'ORDER',
      entityId: orderData.id,
      metadata: {
        totalMoney: orderData.total_money,
        state: orderData.state
      }
    }
  });
}

async function handleOrderUpdated(orderData: any) {
  // Log order update
  await prisma.auditLog.create({
    data: {
      action: 'ORDER_UPDATED_WEBHOOK',
      entityType: 'ORDER',
      entityId: orderData.id,
      metadata: {
        totalMoney: orderData.total_money,
        state: orderData.state
      }
    }
  });
}

function mapPaymentStatus(squareStatus?: string): string {
  switch (squareStatus) {
    case 'APPROVED':
      return 'COMPLETED';
    case 'PENDING':
      return 'PENDING';
    case 'COMPLETED':
      return 'COMPLETED';
    case 'CANCELED':
      return 'CANCELLED';
    case 'FAILED':
      return 'FAILED';
    default:
      return 'UNKNOWN';
  }
}