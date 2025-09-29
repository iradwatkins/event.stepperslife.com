import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { logMessage, logError } from '@/lib/monitoring/sentry';

// Event creation schema
const createEventSchema = z.object({
  title: z.string().min(1, 'Event title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  category: z.enum(['SOCIAL', 'WORKSHOP', 'COMPETITION', 'CLASS', 'CRUISE', 'TRIP']),

  // Date and time
  eventDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid start time'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid end time').optional(),

  // Venue information
  venueName: z.string().min(1, 'Venue name is required'),
  venueAddress: z.string().min(1, 'Venue address is required'),

  // Pricing and capacity
  ticketPrice: z.number().min(0, 'Price cannot be negative').optional(),
  earlyBirdPrice: z.number().min(0, 'Early bird price cannot be negative').optional(),
  capacity: z.number().int().min(1, 'Capacity must be at least 1').optional(),

  // Event settings
  isPublished: z.boolean().default(false),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'UNLISTED']).default('PUBLIC'),
});

async function handleCreateEvent(request: NextRequest, context: any) {
  const { user } = context;

  // Debug: Log user info
  console.log('Creating event for user:', { id: user?.id, email: user?.email, role: user?.role });

  if (!user || !user.id) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const validationResult = createEventSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    const eventData = validationResult.data;

    // Combine date and time
    const eventDateTime = new Date(`${eventData.eventDate} ${eventData.startTime}`);
    const endDateTime = eventData.endTime
      ? new Date(`${eventData.eventDate} ${eventData.endTime}`)
      : null;

    // Validate that event is in the future
    if (eventDateTime <= new Date()) {
      return NextResponse.json(
        { error: 'Event date must be in the future' },
        { status: 400 }
      );
    }

    // Validate end time is after start time (handle times crossing midnight)
    if (endDateTime) {
      // If end time appears to be before start time, assume it's the next day
      if (endDateTime < eventDateTime) {
        // Add 24 hours to end time
        endDateTime.setDate(endDateTime.getDate() + 1);
      }
      // Now check if they're equal
      if (endDateTime.getTime() === eventDateTime.getTime()) {
        return NextResponse.json(
          { error: 'End time must be after start time' },
          { status: 400 }
        );
      }
    }

    // Generate slug from venue name
    const venueSlug = eventData.venueName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + Date.now();

    // Parse address to extract city, state, and zip
    const addressParts = eventData.venueAddress.split(',').map(part => part.trim());
    let city = '';
    let state = '';
    let zipCode = '';

    // Try to extract city, state, and zip from address
    if (addressParts.length >= 2) {
      // Assume format: "Street, City, State Zip"
      city = addressParts[1] || '';
      if (addressParts.length >= 3) {
        const stateZip = addressParts[2].trim();
        const stateZipMatch = stateZip.match(/^([A-Z]{2})\s+(\d{5})$/);
        if (stateZipMatch) {
          state = stateZipMatch[1];
          zipCode = stateZipMatch[2];
        } else {
          // Try to extract state (2 letters) and zip (5 digits) separately
          const stateMatch = stateZip.match(/[A-Z]{2}/);
          const zipMatch = stateZip.match(/\d{5}/);
          state = stateMatch ? stateMatch[0] : '';
          zipCode = zipMatch ? zipMatch[0] : '';
        }
      }
    }

    // Check if user has an organizer profile, create if not
    let organizerProfile = await prisma.organizerProfile.findUnique({
      where: { userId: user.id }
    });

    if (!organizerProfile) {
      console.log('Creating organizer profile for user:', user.id);
      organizerProfile = await prisma.organizerProfile.create({
        data: {
          id: `org-${user.id}`,
          userId: user.id,
          businessName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          businessType: 'INDIVIDUAL',
          isVerified: user.role === 'ADMIN',
          verifiedAt: user.role === 'ADMIN' ? new Date() : null,
          verificationLevel: user.role === 'ADMIN' ? 'FULL' : 'BASIC'
        }
      });
    }

    // Create venue first
    console.log('Creating venue with data:', {
      name: eventData.venueName,
      slug: venueSlug,
      address: eventData.venueAddress,
      city: city,
      state: state,
      zipCode: zipCode,
      maxCapacity: eventData.capacity || 100,
      organizerId: organizerProfile.id
    });

    const venue = await prisma.venue.create({
      data: {
        name: eventData.venueName,
        slug: venueSlug,
        address: eventData.venueAddress,
        city: city,
        state: state,
        zipCode: zipCode,
        maxCapacity: eventData.capacity || 100,
        organizerId: organizerProfile.id
      }
    });

    // Create the event
    const event = await prisma.event.create({
      data: {
        title: eventData.title,
        description: eventData.description || '',
        category: eventData.category,
        startDate: eventDateTime,
        endDate: endDateTime,
        venueId: venue.id,
        organizerId: organizerProfile.id,
        capacity: eventData.capacity || 100,
        visibility: eventData.visibility,
        status: eventData.isPublished ? 'PUBLISHED' : 'DRAFT',

        // Create default ticket type
        ticketTypes: {
          create: {
            name: 'General Admission',
            price: eventData.ticketPrice || 0,
            quantity: eventData.capacity || 100,
            saleStartDate: new Date(),
            saleEndDate: new Date(eventDateTime.getTime() - 24 * 60 * 60 * 1000), // 24 hours before event
            isActive: true,
            tier: 'GENERAL'
          }
        }
      },
      include: {
        venue: true,
        ticketTypes: true,
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Create early bird ticket type if specified
    if (eventData.earlyBirdPrice && eventData.earlyBirdPrice < (eventData.ticketPrice || 0)) {
      await prisma.ticketType.create({
        data: {
          eventId: event.id,
          name: 'Early Bird',
          price: eventData.earlyBirdPrice,
          quantity: Math.floor((eventData.capacity || 100) * 0.3), // 30% of capacity for early bird
          saleStartDate: new Date(),
          saleEndDate: new Date(eventDateTime.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week before event
          isActive: true,
          tier: 'EARLY_BIRD'
        }
      });
    }

    // Log event creation
    await prisma.auditLog.create({
      data: {
        action: 'EVENT_CREATED',
        entityType: 'EVENT',
        entityId: event.id,
        userId: user.id,
        metadata: {
          eventTitle: event.title,
          eventDate: eventDateTime.toISOString(),
          venue: venue.name,
          capacity: event.capacity,
          status: event.status
        }
      }
    });

    logMessage('Event created successfully', 'info', {
      user: { id: user.id, email: user.email, role: user.role },
      extra: { eventId: event.id, eventTitle: event.title }
    });

    return NextResponse.json({
      success: true,
      message: 'Event created successfully',
      event: {
        id: event.id,
        title: event.title,
        category: event.category,
        startDate: event.startDate,
        endDate: event.endDate,
        venue: event.venue,
        capacity: event.capacity,
        status: event.status,
        ticketTypes: event.ticketTypes,
        organizer: event.organizer
      }
    });

  } catch (error) {
    console.error('Event creation error:', error);

    logError(error instanceof Error ? error : new Error(String(error)), {
      user: { id: user.id, email: user.email, role: user.role },
      tags: { component: 'event-api', operation: 'create' }
    });

    await prisma.auditLog.create({
      data: {
        action: 'EVENT_CREATION_FAILED',
        entityType: 'EVENT',
        entityId: 'unknown',
        userId: user.id,
        metadata: {
          error: String(error)
        }
      }
    }).catch(console.error);

    return NextResponse.json(
      { error: 'Failed to create event. Please try again.' },
      { status: 500 }
    );
  }
}

async function handleGetEvents(request: NextRequest, context: any) {
  const { user } = context;
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const category = searchParams.get('category');
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  try {
    const where: any = {};

    // Filter by user's access level
    if (user.role === 'ORGANIZER') {
      where.organizerId = user.id;
    } else if (user.role === 'STAFF') {
      // Staff can see events they're assigned to
      where.OR = [
        { organizerId: user.id },
        {
          staffAssignments: {
            some: { staffUserId: user.id, isActive: true }
          }
        }
      ];
    }
    // ADMIN and SUPER_ADMIN can see all events (no additional filter)

    // Apply filters
    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { venue: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [events, totalCount] = await Promise.all([
      prisma.event.findMany({
        where,
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
          ticketTypes: true,
          _count: {
            select: {
              tickets: true
            }
          }
        },
        orderBy: { startDate: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.event.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      events: events.map(event => ({
        ...event,
        ticketsSold: event._count.tickets
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Get events error:', error);

    logError(error instanceof Error ? error : new Error(String(error)), {
      user: { id: user.id, email: user.email, role: user.role },
      tags: { component: 'event-api', operation: 'get' }
    });

    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST: Create event
export const POST = withAuth(handleCreateEvent, {
  permissions: ['events.create']
});

// GET: Get events
export const GET = withAuth(handleGetEvents, {
  permissions: ['events.view']
});