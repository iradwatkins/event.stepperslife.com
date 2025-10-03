import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const status = searchParams.get('status'); // Allow all statuses by default
    const eventId = searchParams.get('eventId');

    // If requesting a specific event
    if (eventId) {
      const event = await prisma.event.findUnique({
        where: {
          id: eventId,
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
            orderBy: { price: 'asc' },
            include: {
              _count: {
                select: {
                  tickets: {
                    where: {
                      status: 'VALID'
                    }
                  }
                }
              }
            }
          },
          _count: {
            select: {
              tickets: {
                where: {
                  status: 'VALID'
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
          ticketsSold: event._count.tickets,
          ticketTypes: event.ticketTypes.map(tt => ({
            ...tt,
            sold: tt._count?.tickets || 0
          }))
        }]
      });
    }

    // Build where clause for filtering
    const whereClause: any = {
      visibility: { in: ['PUBLIC', 'UNLISTED'] },
      startDate: {
        gte: new Date() // Only show future events
      }
    };

    // Only filter by status if explicitly provided
    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
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
      whereClause.eventType = category;
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
          orderBy: { price: 'asc' },
          include: {
            _count: {
              select: {
                tickets: {
                  where: {
                    status: 'VALID'
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            tickets: {
              where: {
                status: 'VALID'
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
      ticketsSold: event._count.tickets,
      ticketTypes: event.ticketTypes.map(tt => ({
        ...tt,
        sold: tt._count?.tickets || 0
      }))
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