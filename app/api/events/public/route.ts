import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const status = searchParams.get('status') || 'PUBLISHED';
    const eventId = searchParams.get('eventId');

    // If requesting a specific event
    if (eventId) {
      const event = await prisma.event.findUnique({
        where: {
          id: eventId,
          status: 'PUBLISHED', // Only show published events to public
          visibility: { in: ['PUBLIC', 'UNLISTED'] }
        },
        include: {
          venue: true,
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          ticketTypes: {
            where: { isActive: true },
            orderBy: { tier: 'asc' }
          },
          _count: {
            select: {
              tickets: {
                where: {
                  status: { in: ['PAID', 'CONFIRMED'] }
                }
              }
            }
          }
        }
      });

      if (!event) {
        return NextResponse.json(
          { error: 'Event not found or not available' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        events: [{
          ...event,
          ticketsSold: event._count.tickets
        }]
      });
    }

    // Build where clause for filtering
    const whereClause: any = {
      status: status,
      visibility: { in: ['PUBLIC', 'UNLISTED'] },
      startDate: {
        gte: new Date() // Only show future events
      }
    };

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { venue: { name: { contains: search, mode: 'insensitive' } } },
        { venue: { address: { contains: search, mode: 'insensitive' } } },
        {
          organizer: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } }
            ]
          }
        }
      ];
    }

    if (category) {
      whereClause.category = category;
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        venue: true,
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        ticketTypes: {
          where: { isActive: true },
          orderBy: { tier: 'asc' }
        },
        _count: {
          select: {
            tickets: {
              where: {
                status: { in: ['PAID', 'CONFIRMED'] }
              }
            }
          }
        }
      },
      orderBy: { startDate: 'asc' },
      take: 50 // Limit to 50 events for performance
    });

    // Transform data to include ticket counts
    const transformedEvents = events.map(event => ({
      ...event,
      ticketsSold: event._count.tickets
    }));

    return NextResponse.json({
      success: true,
      events: transformedEvents,
      total: transformedEvents.length
    });

  } catch (error) {
    console.error('Public events API error:', error);

    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}