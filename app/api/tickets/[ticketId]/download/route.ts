import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { pdfTicketService } from '@/lib/services/pdf-ticket.service';
import { logError } from '@/lib/monitoring/sentry';

async function handleDownloadTicket(request: NextRequest, context: any) {
  const { user, params } = context;
  const ticketId = params.ticketId;

  try {
    // Get ticket with full details
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        order: {
          include: {
            event: {
              include: {
                venue: true
              }
            }
          }
        }
      }
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (ticket.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to download this ticket' },
        { status: 403 }
      );
    }

    // Check if ticket is valid
    if (ticket.status !== 'VALID') {
      return NextResponse.json(
        { error: `Ticket cannot be downloaded (status: ${ticket.status})` },
        { status: 400 }
      );
    }

    // Generate PDF (with fallbacks for nullable fields)
    const pdfBuffer = await pdfTicketService.generateTicketPDF({
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        holderName: ticket.holderName || user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.email,
        holderEmail: ticket.holderEmail || user.email,
        faceValue: Number(ticket.faceValue),
        validationCode: ticket.validationCode,
        qrCode: ticket.qrCode
      },
      event: {
        id: ticket.order.event.id,
        name: ticket.order.event.name,
        startDate: ticket.order.event.startDate,
        endDate: ticket.order.event.endDate,
        description: ticket.order.event.description || undefined
      },
      venue: {
        name: ticket.order.event.venue?.name || 'TBD',
        address: ticket.order.event.venue?.address || 'TBD'
      },
      order: {
        orderNumber: ticket.order.orderNumber,
        purchaseDate: ticket.order.createdAt
      }
    });

    // Create filename
    const filename = `ticket-${ticket.ticketNumber}.pdf`;

    // Return PDF with appropriate headers
    // Convert Buffer to Uint8Array for NextResponse compatibility
    return new NextResponse(Uint8Array.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'private, max-age=3600'
      }
    });

  } catch (error: any) {
    console.error('Error generating PDF ticket:', error);
    logError(error instanceof Error ? error : new Error(String(error)), {
      user: { id: user.id, email: user.email },
      tags: { component: 'ticket-pdf', operation: 'download', severity: 'high' },
      extra: { ticketId, errorMessage: error.message }
    });

    return NextResponse.json(
      {
        error: error.message || 'Failed to generate PDF ticket',
        details: error.message
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleDownloadTicket, {
  permissions: ['tickets.view_own']
});
