import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/tickets/me
 * Get all tickets for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tickets = await prisma.ticket.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true
          }
        },
        ticketType: {
          select: {
            name: true
          }
        },
        event: {
          select: {
            id: true,
            name: true,
            startDate: true,
            venue: {
              select: {
                name: true,
                address: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}
