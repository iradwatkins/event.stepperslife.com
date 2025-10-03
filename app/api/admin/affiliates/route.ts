import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/affiliates
 *
 * Retrieves a list of affiliate applications with filtering options
 *
 * Query Parameters:
 * - status: Filter by affiliate status (PENDING, APPROVED, SUSPENDED, BANNED, INACTIVE)
 * - page: Page number for pagination (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - search: Search by name or email
 * - sortBy: Sort field (createdAt, approvedAt, totalSales, totalRevenue)
 * - sortOrder: Sort direction (asc, desc)
 *
 * @requires Authentication - User must be logged in
 * @requires Authorization - User must have ADMIN or SUPER_ADMIN role
 * @returns List of affiliates with pagination metadata
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Authorization check - only admins can view affiliates
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    // Extract and validate query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const search = searchParams.get('search') || undefined;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.user = {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'createdAt' || sortBy === 'approvedAt') {
      orderBy[sortBy] = sortOrder;
    } else if (sortBy === 'totalSales' || sortBy === 'totalRevenue') {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    // Execute queries in parallel
    const [affiliates, totalCount] = await Promise.all([
      prisma.affiliate.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              isVerified: true,
              createdAt: true
            }
          }
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.affiliate.count({ where })
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        affiliates,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPreviousPage
        }
      }
    });

  } catch (error) {
    console.error('Error fetching affiliates:', error);

    return NextResponse.json(
      { error: 'Failed to fetch affiliates. Please try again.' },
      { status: 500 }
    );
  }
}
