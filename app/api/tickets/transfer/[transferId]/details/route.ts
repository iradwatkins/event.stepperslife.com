import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/monitoring/sentry';

async function handleGetTransferDetails(request: NextRequest, context: any) {
  const { user, params } = context;
  const transferId = params.transferId;

  try {
    // Get transfer with related data
    const transfer = await prisma.$queryRaw<any[]>`
      SELECT
        tt.*,
        t.id as ticket_id,
        t."ticketNumber",
        t."holderName",
        o.id as order_id,
        e.id as event_id,
        e.name as event_name,
        e."startDate" as event_start_date,
        e."endDate" as event_end_date,
        v.name as venue_name,
        v.address as venue_address,
        from_user.email as from_email,
        from_user."firstName" as from_first_name,
        from_user."lastName" as from_last_name
      FROM ticket_transfers tt
      LEFT JOIN tickets t ON t.id = tt."ticketId"
      LEFT JOIN orders o ON o.id = t."orderId"
      LEFT JOIN events e ON e.id = o."eventId"
      LEFT JOIN venues v ON v.id = e."venueId"
      LEFT JOIN users from_user ON from_user.id = tt."fromUserId"
      WHERE tt.id = ${transferId}
      LIMIT 1
    `;

    if (!transfer || transfer.length === 0) {
      return NextResponse.json(
        { error: 'Transfer not found' },
        { status: 404 }
      );
    }

    const transferData = transfer[0];

    // Verify user is the recipient
    if (transferData.toEmail.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Unauthorized to view this transfer' },
        { status: 403 }
      );
    }

    // Format response
    return NextResponse.json({
      id: transferData.id,
      status: transferData.status,
      toEmail: transferData.toEmail,
      message: transferData.message,
      expiresAt: transferData.expiresAt,
      initiatedAt: transferData.initiatedAt,
      fromUser: {
        email: transferData.from_email,
        firstName: transferData.from_first_name,
        lastName: transferData.from_last_name
      },
      ticket: {
        id: transferData.ticket_id,
        ticketNumber: transferData.ticketNumber,
        holderName: transferData.holderName,
        order: {
          id: transferData.order_id,
          event: {
            id: transferData.event_id,
            name: transferData.event_name,
            startDate: transferData.event_start_date,
            endDate: transferData.event_end_date,
            venue: transferData.venue_name ? {
              name: transferData.venue_name,
              address: transferData.venue_address
            } : null
          }
        }
      },
      event: {
        id: transferData.event_id,
        name: transferData.event_name,
        startDate: transferData.event_start_date,
        endDate: transferData.event_end_date,
        venue: transferData.venue_name ? {
          name: transferData.venue_name,
          address: transferData.venue_address
        } : null
      }
    });

  } catch (error: any) {
    console.error('Error getting transfer details:', error);
    logError(error instanceof Error ? error : new Error(String(error)), {
      user: { id: user.id, email: user.email },
      tags: { component: 'ticket-transfer', operation: 'get-details', severity: 'medium' },
      extra: { transferId, errorMessage: error.message }
    });

    return NextResponse.json(
      {
        error: error.message || 'Failed to load transfer details',
        details: error.message
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGetTransferDetails, {
  permissions: ['tickets.view_own']
});
