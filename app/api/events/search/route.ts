import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/monitoring/sentry';

interface SearchFilters {
  query?: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  dateFrom?: string;
  dateTo?: string;
  location?: string;
  radius?: number; // in miles
  lat?: number;
  lng?: number;
  organizer?: string;
  tags?: string[];
  sortBy?: 'date' | 'price' | 'popularity' | 'name' | 'created';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters: SearchFilters = {
      query: searchParams.get('q') || undefined,
      category: searchParams.get('category') || undefined,
      priceMin: searchParams.get('priceMin') ? parseFloat(searchParams.get('priceMin')!) : undefined,
      priceMax: searchParams.get('priceMax') ? parseFloat(searchParams.get('priceMax')!) : undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      location: searchParams.get('location') || undefined,
      radius: searchParams.get('radius') ? parseFloat(searchParams.get('radius')!) : undefined,
      lat: searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined,
      lng: searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined,
      organizer: searchParams.get('organizer') || undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'date',
      sortOrder: (searchParams.get('sortOrder') as any) || 'asc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    };

    // Build the where clause
    const whereClause: any = {
      status: 'PUBLISHED',
      visibility: { in: ['PUBLIC', 'UNLISTED'] },
      startDate: {
        gte: filters.dateFrom ? new Date(filters.dateFrom) : new Date()
      }
    };

    // Add date range filter
    if (filters.dateTo) {
      whereClause.startDate.lte = new Date(filters.dateTo);
    }

    // Add text search across multiple fields
    if (filters.query) {
      whereClause.OR = [
        { name: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } },
        { shortDescription: { contains: filters.query, mode: 'insensitive' } },
        { venue: { name: { contains: filters.query, mode: 'insensitive' } } },
        { venue: { address: { contains: filters.query, mode: 'insensitive' } } },
        { venue: { city: { contains: filters.query, mode: 'insensitive' } } },
        { organizer: { firstName: { contains: filters.query, mode: 'insensitive' } } },
        { organizer: { lastName: { contains: filters.query, mode: 'insensitive' } } },
        { tags: { hasSome: [filters.query] } }
      ];
    }

    // Add category filter
    if (filters.category) {
      whereClause.categories = {
        some: {
          name: { equals: filters.category, mode: 'insensitive' }
        }
      };
    }

    // Add organizer filter
    if (filters.organizer) {
      whereClause.organizer = {
        OR: [
          { firstName: { contains: filters.organizer, mode: 'insensitive' } },
          { lastName: { contains: filters.organizer, mode: 'insensitive' } },
          { email: { contains: filters.organizer, mode: 'insensitive' } }
        ]
      };
    }

    // Add price range filter
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      whereClause.ticketTypes = {
        some: {
          isActive: true,
          ...(filters.priceMin !== undefined && { price: { gte: filters.priceMin } }),
          ...(filters.priceMax !== undefined && { price: { lte: filters.priceMax } })
        }
      };
    }

    // Add location-based filtering
    if (filters.location) {
      whereClause.OR = whereClause.OR || [];
      whereClause.OR.push(
        { venue: { city: { contains: filters.location, mode: 'insensitive' } } },
        { venue: { state: { contains: filters.location, mode: 'insensitive' } } },
        { venue: { address: { contains: filters.location, mode: 'insensitive' } } }
      );
    }

    // Add tags filter
    if (filters.tags && filters.tags.length > 0) {
      whereClause.tags = {
        hasSome: filters.tags
      };
    }

    // Build order by clause
    let orderBy: any = {};
    switch (filters.sortBy) {
      case 'date':
        orderBy = { startDate: filters.sortOrder };
        break;
      case 'price':
        // This is complex with multiple ticket types, so we'll use a simple approximation
        orderBy = { createdAt: filters.sortOrder }; // Fallback to creation date
        break;
      case 'popularity':
        // Sort by ticket sales (requires aggregation)
        orderBy = { createdAt: filters.sortOrder }; // Fallback for now
        break;
      case 'name':
        orderBy = { name: filters.sortOrder };
        break;
      case 'created':
        orderBy = { createdAt: filters.sortOrder };
        break;
      default:
        orderBy = { startDate: 'asc' };
    }

    // Calculate pagination
    const skip = (filters.page! - 1) * filters.limit!;

    // Execute the search
    const [events, totalCount] = await Promise.all([
      prisma.event.findMany({
        where: whereClause,
        include: {
          venue: {
            select: {
              name: true,
              address: true,
              city: true,
              state: true,
              latitude: true,
              longitude: true
            }
          },
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              displayName: true
            }
          },
          categories: {
            select: {
              name: true,
              slug: true,
              color: true
            }
          },
          ticketTypes: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              price: true,
              quantity: true,
              sold: true
            },
            orderBy: { price: 'asc' }
          },
          _count: {
            select: {
              tickets: {
                where: { status: { in: ['VALID', 'PAID'] } }
              },
              reviews: true,
              favorites: true
            }
          }
        },
        orderBy,
        skip,
        take: filters.limit
      }),
      prisma.event.count({ where: whereClause })
    ]);

    // Transform the results
    const transformedEvents = events.map(event => {
      const ticketsSold = event._count.tickets;
      const minPrice = event.ticketTypes.length > 0 ?
        Math.min(...event.ticketTypes.map(t => t.price)) : 0;
      const maxPrice = event.ticketTypes.length > 0 ?
        Math.max(...event.ticketTypes.map(t => t.price)) : 0;
      const availableTickets = event.ticketTypes.reduce((sum, t) => sum + (t.quantity - t.sold), 0);

      return {
        id: event.id,
        name: event.name,
        slug: event.slug,
        description: event.description,
        shortDescription: event.shortDescription,
        startDate: event.startDate,
        endDate: event.endDate,
        coverImage: event.coverImage,
        tags: event.tags,
        isFeatured: event.isFeatured,
        venue: event.venue,
        organizer: {
          id: event.organizer.id,
          name: event.organizer.displayName ||
                `${event.organizer.firstName} ${event.organizer.lastName}`,
          firstName: event.organizer.firstName,
          lastName: event.organizer.lastName
        },
        categories: event.categories,
        pricing: {
          minPrice,
          maxPrice,
          isFree: minPrice === 0,
          currency: 'USD'
        },
        capacity: {
          ticketsSold,
          totalAvailable: availableTickets + ticketsSold,
          availableTickets,
          selloutRisk: availableTickets <= 10 && availableTickets > 0
        },
        social: {
          reviewCount: event._count.reviews,
          favoriteCount: event._count.favorites,
          attendeeCount: ticketsSold
        },
        ticketTypes: event.ticketTypes.map(tt => ({
          id: tt.id,
          name: tt.name,
          price: tt.price,
          available: tt.quantity - tt.sold,
          soldOut: tt.quantity - tt.sold <= 0
        }))
      };
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / filters.limit!);
    const hasNextPage = filters.page! < totalPages;
    const hasPrevPage = filters.page! > 1;

    // Generate facets for filtering UI
    const facets = await generateSearchFacets(whereClause, filters);

    return NextResponse.json({
      success: true,
      query: filters,
      results: {
        events: transformedEvents,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage
        },
        facets,
        meta: {
          searchTime: Date.now(),
          resultCount: transformedEvents.length,
          totalMatches: totalCount
        }
      }
    });

  } catch (error) {
    console.error('Event search error:', error);

    logError(error instanceof Error ? error : new Error(String(error)), {
      tags: { component: 'event-search-api', operation: 'search' }
    });

    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

async function generateSearchFacets(baseWhere: any, filters: SearchFilters) {
  try {
    // Get category facets
    const categories = await prisma.eventCategory.findMany({
      where: {
        events: {
          some: {
            ...baseWhere,
            categories: undefined // Remove category filter for facet generation
          }
        }
      },
      select: {
        name: true,
        slug: true,
        _count: {
          select: {
            events: {
              where: baseWhere
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Get price ranges
    const priceRanges = [
      { label: 'Free', min: 0, max: 0 },
      { label: 'Under $25', min: 0.01, max: 25 },
      { label: '$25 - $50', min: 25, max: 50 },
      { label: '$50 - $100', min: 50, max: 100 },
      { label: 'Over $100', min: 100, max: 999999 }
    ];

    // Get popular locations
    const locations = await prisma.venue.groupBy({
      by: ['city', 'state'],
      where: {
        events: {
          some: baseWhere
        }
      },
      _count: {
        events: true
      },
      orderBy: {
        _count: {
          events: 'desc'
        }
      },
      take: 10
    });

    // Get popular tags
    const allEvents = await prisma.event.findMany({
      where: baseWhere,
      select: { tags: true }
    });

    const tagCounts: Record<string, number> = {};
    allEvents.forEach(event => {
      event.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const popularTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }));

    return {
      categories: categories.map(cat => ({
        name: cat.name,
        slug: cat.slug,
        count: cat._count.events
      })),
      priceRanges,
      locations: locations.map(loc => ({
        city: loc.city,
        state: loc.state,
        count: loc._count.events
      })),
      tags: popularTags
    };

  } catch (error) {
    console.error('Error generating facets:', error);
    return {
      categories: [],
      priceRanges: [],
      locations: [],
      tags: []
    };
  }
}