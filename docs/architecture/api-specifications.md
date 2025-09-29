# SteppersLife Events Platform - API Specifications
## tRPC Router Architecture & Endpoint Documentation
### Version 2.0

---

## Overview

This document defines the complete API architecture for the SteppersLife events platform using tRPC for type-safe, full-stack TypeScript development. The API is designed to support real-time features, Square payment integration, and high-performance event ticketing.

---

## API Architecture

### Router Structure

```typescript
// server/api/root.ts
export const appRouter = router({
  // Public APIs (no authentication required)
  public: publicRouter,

  // User APIs (authentication required)
  user: userRouter,

  // Organizer APIs (organizer role required)
  organizer: organizerRouter,

  // Admin APIs (admin role required)
  admin: adminRouter,

  // Payment APIs (special handling for Square)
  payment: paymentRouter,

  // Real-time subscriptions
  realtime: realtimeRouter,
});
```

---

## Public API Routes

### Event Discovery & Information

```typescript
// server/api/routers/public.ts
export const publicRouter = router({

  // Event Discovery
  events: router({
    // Get paginated event list with filters
    list: publicProcedure
      .input(z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
        category: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        search: z.string().optional(),
        featured: z.boolean().optional(),
        sortBy: z.enum(['date', 'name', 'price', 'popularity']).default('date'),
        sortOrder: z.enum(['asc', 'desc']).default('asc'),
      }))
      .query(async ({ input, ctx }) => {
        // Implementation with pagination, filters, full-text search
      }),

    // Get single event by slug
    getBySlug: publicProcedure
      .input(z.object({
        slug: z.string(),
        includeTickets: z.boolean().default(true),
        includeVenue: z.boolean().default(true),
      }))
      .query(async ({ input, ctx }) => {
        // Return event with related data
      }),

    // Get event ticket availability
    getAvailability: publicProcedure
      .input(z.object({
        eventId: z.string().uuid(),
      }))
      .query(async ({ input, ctx }) => {
        // Return real-time ticket availability
      }),

    // Search events (autocomplete)
    search: publicProcedure
      .input(z.object({
        query: z.string().min(2),
        limit: z.number().max(10).default(5),
      }))
      .query(async ({ input, ctx }) => {
        // Fast autocomplete search
      }),
  }),

  // Event Categories
  categories: router({
    list: publicProcedure
      .query(async ({ ctx }) => {
        // Get all active categories
      }),
  }),

  // Venue Information
  venues: router({
    getBySlug: publicProcedure
      .input(z.object({
        slug: z.string(),
        includeEvents: z.boolean().default(false),
      }))
      .query(async ({ input, ctx }) => {
        // Get venue details
      }),

    search: publicProcedure
      .input(z.object({
        query: z.string().min(2),
        city: z.string().optional(),
        state: z.string().optional(),
      }))
      .query(async ({ input, ctx }) => {
        // Search venues
      }),
  }),

  // Health Check
  health: publicProcedure
    .query(async ({ ctx }) => {
      return {
        status: 'healthy',
        timestamp: new Date(),
        version: process.env.APP_VERSION,
      };
    }),
});
```

---

## User API Routes

### Authentication & Profile Management

```typescript
// server/api/routers/user.ts
export const userRouter = router({

  // Profile Management
  profile: router({
    get: protectedProcedure
      .query(async ({ ctx }) => {
        // Get current user profile
      }),

    update: protectedProcedure
      .input(z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        phone: z.string().optional(),
        dateOfBirth: z.date().optional(),
        timezone: z.string().optional(),
        marketingOptIn: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Update user profile
      }),

    uploadAvatar: protectedProcedure
      .input(z.object({
        imageData: z.string(), // base64 encoded
      }))
      .mutation(async ({ input, ctx }) => {
        // Upload and set avatar
      }),

    delete: protectedProcedure
      .mutation(async ({ ctx }) => {
        // Soft delete user account
      }),
  }),

  // Order History
  orders: router({
    list: protectedProcedure
      .input(z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
        status: z.enum(['all', 'completed', 'pending', 'cancelled']).default('all'),
      }))
      .query(async ({ input, ctx }) => {
        // Get user's order history
      }),

    getById: protectedProcedure
      .input(z.object({
        orderId: z.string().uuid(),
      }))
      .query(async ({ input, ctx }) => {
        // Get specific order details
      }),

    requestRefund: protectedProcedure
      .input(z.object({
        orderId: z.string().uuid(),
        reason: z.enum(['customer_request', 'event_cancelled', 'event_postponed']),
        reasonText: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Request order refund
      }),
  }),

  // Ticket Management
  tickets: router({
    list: protectedProcedure
      .input(z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
        upcoming: z.boolean().optional(),
      }))
      .query(async ({ input, ctx }) => {
        // Get user's tickets
      }),

    getById: protectedProcedure
      .input(z.object({
        ticketId: z.string().uuid(),
      }))
      .query(async ({ input, ctx }) => {
        // Get ticket details with QR code
      }),

    transfer: protectedProcedure
      .input(z.object({
        ticketId: z.string().uuid(),
        recipientEmail: z.string().email(),
        message: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Transfer ticket to another user
      }),

    downloadPdf: protectedProcedure
      .input(z.object({
        ticketId: z.string().uuid(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Generate and return PDF ticket
      }),
  }),

  // Social Features
  social: router({
    favorites: router({
      list: protectedProcedure
        .query(async ({ ctx }) => {
          // Get user's favorite events
        }),

      add: protectedProcedure
        .input(z.object({
          eventId: z.string().uuid(),
        }))
        .mutation(async ({ input, ctx }) => {
          // Add event to favorites
        }),

      remove: protectedProcedure
        .input(z.object({
          eventId: z.string().uuid(),
        }))
        .mutation(async ({ input, ctx }) => {
          // Remove from favorites
        }),
    }),

    reviews: router({
      create: protectedProcedure
        .input(z.object({
          eventId: z.string().uuid(),
          rating: z.number().min(1).max(5),
          title: z.string().optional(),
          comment: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          // Create event review
        }),

      update: protectedProcedure
        .input(z.object({
          reviewId: z.string().uuid(),
          rating: z.number().min(1).max(5).optional(),
          title: z.string().optional(),
          comment: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          // Update review
        }),

      delete: protectedProcedure
        .input(z.object({
          reviewId: z.string().uuid(),
        }))
        .mutation(async ({ input, ctx }) => {
          // Delete review
        }),
    }),

    following: router({
      list: protectedProcedure
        .query(async ({ ctx }) => {
          // Get followed organizers
        }),

      follow: protectedProcedure
        .input(z.object({
          organizerId: z.string().uuid(),
        }))
        .mutation(async ({ input, ctx }) => {
          // Follow organizer
        }),

      unfollow: protectedProcedure
        .input(z.object({
          organizerId: z.string().uuid(),
        }))
        .mutation(async ({ input, ctx }) => {
          // Unfollow organizer
        }),
    }),
  }),

  // Waitlist Management
  waitlist: router({
    join: protectedProcedure
      .input(z.object({
        eventId: z.string().uuid(),
        ticketQuantity: z.number().min(1).max(10),
        maxPrice: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Join event waitlist
      }),

    leave: protectedProcedure
      .input(z.object({
        eventId: z.string().uuid(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Leave waitlist
      }),

    list: protectedProcedure
      .query(async ({ ctx }) => {
        // Get user's waitlist entries
      }),
  }),
});
```

---

## Organizer API Routes

### Event & Business Management

```typescript
// server/api/routers/organizer.ts
export const organizerRouter = router({

  // Profile Management
  profile: router({
    get: organizerProcedure
      .query(async ({ ctx }) => {
        // Get organizer profile
      }),

    create: protectedProcedure
      .input(z.object({
        businessName: z.string().min(2),
        businessType: z.enum(['individual', 'sole_proprietorship', 'partnership', 'llc', 'corporation', 'non_profit']),
        taxId: z.string().optional(),
        website: z.string().url().optional(),
        squareLocationId: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Create organizer profile
      }),

    update: organizerProcedure
      .input(z.object({
        businessName: z.string().optional(),
        website: z.string().url().optional(),
        autoPayoutEnabled: z.boolean().optional(),
        defaultPayoutSchedule: z.enum(['daily', 'weekly', 'monthly', 'on_demand']).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Update organizer profile
      }),

    verify: organizerProcedure
      .input(z.object({
        documents: z.array(z.string()), // Document IDs
      }))
      .mutation(async ({ input, ctx }) => {
        // Submit verification documents
      }),
  }),

  // Team Management
  team: router({
    list: organizerProcedure
      .query(async ({ ctx }) => {
        // Get team members
      }),

    invite: organizerProcedure
      .input(z.object({
        email: z.string().email(),
        role: z.enum(['admin', 'manager', 'staff', 'volunteer']),
        permissions: z.array(z.string()),
      }))
      .mutation(async ({ input, ctx }) => {
        // Invite team member
      }),

    update: organizerProcedure
      .input(z.object({
        memberId: z.string().uuid(),
        role: z.enum(['admin', 'manager', 'staff', 'volunteer']).optional(),
        permissions: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Update team member
      }),

    remove: organizerProcedure
      .input(z.object({
        memberId: z.string().uuid(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Remove team member
      }),
  }),

  // Venue Management
  venues: router({
    list: organizerProcedure
      .query(async ({ ctx }) => {
        // Get organizer's venues
      }),

    create: organizerProcedure
      .input(z.object({
        name: z.string().min(2),
        address: z.string(),
        city: z.string(),
        state: z.string().length(2),
        zipCode: z.string(),
        maxCapacity: z.number().min(1),
        hasSeating: z.boolean().default(false),
        hasParking: z.boolean().default(false),
        isAccessible: z.boolean().default(true),
        amenities: z.array(z.string()).default([]),
      }))
      .mutation(async ({ input, ctx }) => {
        // Create venue
      }),

    update: organizerProcedure
      .input(z.object({
        venueId: z.string().uuid(),
        name: z.string().optional(),
        maxCapacity: z.number().optional(),
        amenities: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Update venue
      }),

    delete: organizerProcedure
      .input(z.object({
        venueId: z.string().uuid(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Soft delete venue
      }),
  }),

  // Event Management
  events: router({
    list: organizerProcedure
      .input(z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
        status: z.enum(['all', 'draft', 'published', 'live', 'completed', 'cancelled']).default('all'),
      }))
      .query(async ({ input, ctx }) => {
        // Get organizer's events
      }),

    create: organizerProcedure
      .input(z.object({
        name: z.string().min(2),
        description: z.string().optional(),
        startDate: z.date(),
        endDate: z.date(),
        timezone: z.string().default('America/New_York'),
        eventType: z.enum(['general_admission', 'reserved_seating', 'festival', 'conference']),
        venueId: z.string().uuid().optional(),
        maxCapacity: z.number().optional(),
        isVirtual: z.boolean().default(false),
        virtualUrl: z.string().url().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Create event
      }),

    update: organizerProcedure
      .input(z.object({
        eventId: z.string().uuid(),
        name: z.string().optional(),
        description: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        maxCapacity: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Update event
      }),

    publish: organizerProcedure
      .input(z.object({
        eventId: z.string().uuid(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Publish event
      }),

    cancel: organizerProcedure
      .input(z.object({
        eventId: z.string().uuid(),
        reason: z.string(),
        refundPolicy: z.enum(['full_refund', 'partial_refund', 'no_refund']),
      }))
      .mutation(async ({ input, ctx }) => {
        // Cancel event
      }),

    duplicate: organizerProcedure
      .input(z.object({
        eventId: z.string().uuid(),
        newStartDate: z.date(),
        newEndDate: z.date(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Duplicate event
      }),
  }),

  // Ticket Type Management
  ticketTypes: router({
    list: organizerProcedure
      .input(z.object({
        eventId: z.string().uuid(),
      }))
      .query(async ({ input, ctx }) => {
        // Get event's ticket types
      }),

    create: organizerProcedure
      .input(z.object({
        eventId: z.string().uuid(),
        name: z.string(),
        description: z.string().optional(),
        price: z.number().min(0),
        quantity: z.number().min(1),
        minPerOrder: z.number().min(1).default(1),
        maxPerOrder: z.number().min(1).default(10),
        salesStartDate: z.date().optional(),
        salesEndDate: z.date().optional(),
        requiresSeat: z.boolean().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        // Create ticket type
      }),

    update: organizerProcedure
      .input(z.object({
        ticketTypeId: z.string().uuid(),
        name: z.string().optional(),
        price: z.number().optional(),
        quantity: z.number().optional(),
        maxPerOrder: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Update ticket type
      }),

    delete: organizerProcedure
      .input(z.object({
        ticketTypeId: z.string().uuid(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Delete ticket type
      }),
  }),

  // Order Management
  orders: router({
    list: organizerProcedure
      .input(z.object({
        eventId: z.string().uuid().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(50),
        status: z.enum(['all', 'completed', 'pending', 'failed']).default('all'),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      }))
      .query(async ({ input, ctx }) => {
        // Get orders for organizer's events
      }),

    getById: organizerProcedure
      .input(z.object({
        orderId: z.string().uuid(),
      }))
      .query(async ({ input, ctx }) => {
        // Get order details
      }),

    refund: organizerProcedure
      .input(z.object({
        orderId: z.string().uuid(),
        amount: z.number().optional(), // Partial refund
        reason: z.enum(['customer_request', 'event_cancelled', 'admin_decision']),
        reasonText: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Process refund
      }),

    resendConfirmation: organizerProcedure
      .input(z.object({
        orderId: z.string().uuid(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Resend order confirmation
      }),
  }),

  // Check-in Management
  checkin: router({
    validateTicket: organizerProcedure
      .input(z.object({
        qrCode: z.string(),
        eventId: z.string().uuid().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Validate and check-in ticket
      }),

    manualCheckin: organizerProcedure
      .input(z.object({
        eventId: z.string().uuid(),
        search: z.string(), // Email, name, or confirmation number
      }))
      .mutation(async ({ input, ctx }) => {
        // Manual check-in by search
      }),

    getStats: organizerProcedure
      .input(z.object({
        eventId: z.string().uuid(),
      }))
      .query(async ({ input, ctx }) => {
        // Get check-in statistics
      }),

    exportList: organizerProcedure
      .input(z.object({
        eventId: z.string().uuid(),
        format: z.enum(['csv', 'excel']),
      }))
      .mutation(async ({ input, ctx }) => {
        // Export attendee list
      }),
  }),

  // Analytics & Reporting
  analytics: router({
    dashboard: organizerProcedure
      .input(z.object({
        timeframe: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
      }))
      .query(async ({ input, ctx }) => {
        // Get dashboard analytics
      }),

    salesReport: organizerProcedure
      .input(z.object({
        eventId: z.string().uuid().optional(),
        dateFrom: z.date(),
        dateTo: z.date(),
        groupBy: z.enum(['day', 'week', 'month']).default('day'),
      }))
      .query(async ({ input, ctx }) => {
        // Generate sales report
      }),

    attendeeReport: organizerProcedure
      .input(z.object({
        eventId: z.string().uuid(),
      }))
      .query(async ({ input, ctx }) => {
        // Generate attendee demographics report
      }),

    financialReport: organizerProcedure
      .input(z.object({
        dateFrom: z.date(),
        dateTo: z.date(),
      }))
      .query(async ({ input, ctx }) => {
        // Generate financial summary
      }),
  }),

  // Discount Management
  discounts: router({
    list: organizerProcedure
      .input(z.object({
        eventId: z.string().uuid(),
      }))
      .query(async ({ input, ctx }) => {
        // Get event discounts
      }),

    create: organizerProcedure
      .input(z.object({
        eventId: z.string().uuid(),
        code: z.string().min(3),
        name: z.string(),
        type: z.enum(['fixed_amount', 'percentage', 'early_bird']),
        value: z.number().min(0),
        maxUses: z.number().optional(),
        maxUsesPerUser: z.number().optional(),
        startDate: z.date(),
        endDate: z.date(),
        minOrderAmount: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Create discount code
      }),

    update: organizerProcedure
      .input(z.object({
        discountId: z.string().uuid(),
        maxUses: z.number().optional(),
        endDate: z.date().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Update discount
      }),

    delete: organizerProcedure
      .input(z.object({
        discountId: z.string().uuid(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Delete discount
      }),
  }),

  // Waitlist Management
  waitlist: router({
    list: organizerProcedure
      .input(z.object({
        eventId: z.string().uuid(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(50),
      }))
      .query(async ({ input, ctx }) => {
        // Get waitlist entries
      }),

    notify: organizerProcedure
      .input(z.object({
        eventId: z.string().uuid(),
        waitlistIds: z.array(z.string().uuid()).optional(),
        customMessage: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Notify waitlist members
      }),

    export: organizerProcedure
      .input(z.object({
        eventId: z.string().uuid(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Export waitlist
      }),
  }),
});
```

---

## Payment API Routes

### Square Integration & Transaction Processing

```typescript
// server/api/routers/payment.ts
export const paymentRouter = router({

  // Order Creation & Processing
  createOrder: publicProcedure
    .input(z.object({
      eventId: z.string().uuid(),
      tickets: z.array(z.object({
        ticketTypeId: z.string().uuid(),
        quantity: z.number().min(1).max(10),
        seatIds: z.array(z.string().uuid()).optional(),
      })),
      customer: z.object({
        email: z.string().email(),
        firstName: z.string(),
        lastName: z.string(),
        phone: z.string().optional(),
      }),
      discountCode: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Create order and calculate pricing
    }),

  // Square Payment Processing
  processPayment: publicProcedure
    .input(z.object({
      orderId: z.string().uuid(),
      paymentToken: z.string(),
      paymentMethod: z.enum(['card', 'cash_app_pay']),
      verificationToken: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Process payment through Square
    }),

  // Payment Status Check
  getPaymentStatus: publicProcedure
    .input(z.object({
      orderId: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      // Check payment status
    }),

  // Discount Validation
  validateDiscount: publicProcedure
    .input(z.object({
      eventId: z.string().uuid(),
      code: z.string(),
      orderTotal: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Validate discount code
    }),

  // Seat Selection & Reservation
  reserveSeats: publicProcedure
    .input(z.object({
      eventId: z.string().uuid(),
      seatIds: z.array(z.string().uuid()),
      sessionId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Reserve seats temporarily
    }),

  releaseSeats: publicProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Release reserved seats
    }),

  // Refund Processing
  processRefund: organizerProcedure
    .input(z.object({
      orderId: z.string().uuid(),
      amount: z.number().optional(),
      reason: z.enum(['customer_request', 'event_cancelled', 'admin_decision']),
    }))
    .mutation(async ({ input, ctx }) => {
      // Process refund through Square
    }),

  // Payment Methods Management
  customerCards: protectedProcedure
    .query(async ({ ctx }) => {
      // Get user's saved payment methods
    }),

  saveCard: protectedProcedure
    .input(z.object({
      cardToken: z.string(),
      isDefault: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      // Save card to Square customer profile
    }),

  deleteCard: protectedProcedure
    .input(z.object({
      cardId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Delete saved card
    }),

  // Webhook Handling
  webhook: publicProcedure
    .input(z.object({
      signature: z.string(),
      body: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Handle Square webhooks
    }),
});
```

---

## Real-time API Routes

### WebSocket Subscriptions & Live Updates

```typescript
// server/api/routers/realtime.ts
export const realtimeRouter = router({

  // Seat Selection Updates
  seatUpdates: publicProcedure
    .input(z.object({
      eventId: z.string().uuid(),
    }))
    .subscription(({ input }) => {
      return observable<SeatUpdate>((emit) => {
        const onSeatUpdate = (data: SeatUpdate) => {
          if (data.eventId === input.eventId) {
            emit.next(data);
          }
        };

        eventEmitter.on('seat-update', onSeatUpdate);

        return () => {
          eventEmitter.off('seat-update', onSeatUpdate);
        };
      });
    }),

  // Live Sales Ticker
  salesUpdates: organizerProcedure
    .input(z.object({
      eventId: z.string().uuid(),
    }))
    .subscription(({ input, ctx }) => {
      return observable<SalesUpdate>((emit) => {
        // Real-time sales updates for organizers
      });
    }),

  // Check-in Updates
  checkinUpdates: organizerProcedure
    .input(z.object({
      eventId: z.string().uuid(),
    }))
    .subscription(({ input, ctx }) => {
      return observable<CheckinUpdate>((emit) => {
        // Real-time check-in notifications
      });
    }),

  // Inventory Updates
  inventoryUpdates: publicProcedure
    .input(z.object({
      eventId: z.string().uuid(),
    }))
    .subscription(({ input }) => {
      return observable<InventoryUpdate>((emit) => {
        // Ticket availability updates
      });
    }),

  // System Status
  systemStatus: publicProcedure
    .subscription(() => {
      return observable<SystemStatus>((emit) => {
        // System health and status updates
      });
    }),
});
```

---

## Admin API Routes

### Platform Administration

```typescript
// server/api/routers/admin.ts
export const adminRouter = router({

  // User Management
  users: router({
    list: adminProcedure
      .input(z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(50),
        role: z.enum(['all', 'attendee', 'organizer', 'admin']).default('all'),
        status: z.enum(['all', 'active', 'suspended', 'banned']).default('all'),
        search: z.string().optional(),
      }))
      .query(async ({ input, ctx }) => {
        // Get users with admin filters
      }),

    getById: adminProcedure
      .input(z.object({
        userId: z.string().uuid(),
      }))
      .query(async ({ input, ctx }) => {
        // Get detailed user information
      }),

    updateStatus: adminProcedure
      .input(z.object({
        userId: z.string().uuid(),
        status: z.enum(['active', 'suspended', 'banned']),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Update user status
      }),

    impersonate: adminProcedure
      .input(z.object({
        userId: z.string().uuid(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Impersonate user for support
      }),
  }),

  // Event Moderation
  events: router({
    list: adminProcedure
      .input(z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(50),
        status: z.enum(['all', 'pending_review', 'approved', 'rejected']).default('all'),
        flagged: z.boolean().optional(),
      }))
      .query(async ({ input, ctx }) => {
        // Get events for moderation
      }),

    approve: adminProcedure
      .input(z.object({
        eventId: z.string().uuid(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Approve event
      }),

    reject: adminProcedure
      .input(z.object({
        eventId: z.string().uuid(),
        reason: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Reject event
      }),

    feature: adminProcedure
      .input(z.object({
        eventId: z.string().uuid(),
        featured: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Feature/unfeature event
      }),
  }),

  // Financial Management
  financial: router({
    dashboard: adminProcedure
      .input(z.object({
        timeframe: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
      }))
      .query(async ({ input, ctx }) => {
        // Financial dashboard
      }),

    transactions: adminProcedure
      .input(z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(50),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        status: z.enum(['all', 'completed', 'failed', 'refunded']).default('all'),
      }))
      .query(async ({ input, ctx }) => {
        // Get transaction list
      }),

    reconciliation: adminProcedure
      .input(z.object({
        dateFrom: z.date(),
        dateTo: z.date(),
      }))
      .query(async ({ input, ctx }) => {
        // Financial reconciliation report
      }),
  }),

  // System Management
  system: router({
    metrics: adminProcedure
      .query(async ({ ctx }) => {
        // System performance metrics
      }),

    auditLog: adminProcedure
      .input(z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(50),
        entityType: z.string().optional(),
        userId: z.string().uuid().optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      }))
      .query(async ({ input, ctx }) => {
        // Audit log entries
      }),

    maintenance: adminProcedure
      .input(z.object({
        enabled: z.boolean(),
        message: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Enable/disable maintenance mode
      }),
  }),

  // Platform Analytics
  analytics: router({
    overview: adminProcedure
      .input(z.object({
        timeframe: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
      }))
      .query(async ({ input, ctx }) => {
        // Platform overview analytics
      }),

    growth: adminProcedure
      .input(z.object({
        metric: z.enum(['users', 'events', 'revenue', 'tickets']),
        timeframe: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
      }))
      .query(async ({ input, ctx }) => {
        // Growth metrics
      }),

    cohorts: adminProcedure
      .input(z.object({
        type: z.enum(['user_retention', 'organizer_retention']),
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input, ctx }) => {
        // Cohort analysis
      }),
  }),
});
```

---

## API Security & Middleware

### Authentication & Authorization

```typescript
// server/api/trpc.ts

// Base procedure with request logging
const baseProcedure = t.procedure
  .use(async ({ path, type, next, rawInput }) => {
    const start = Date.now();

    const result = await next();

    const duration = Date.now() - start;

    logger.info('tRPC call', {
      path,
      type,
      duration,
      success: result.ok,
      input: rawInput,
    });

    return result;
  });

// Public procedure (no auth required)
export const publicProcedure = baseProcedure;

// Protected procedure (authentication required)
export const protectedProcedure = baseProcedure
  .use(async ({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    return next({
      ctx: {
        ...ctx,
        session: ctx.session,
        user: ctx.session.user,
      },
    });
  });

// Organizer procedure (organizer role required)
export const organizerProcedure = protectedProcedure
  .use(async ({ ctx, next }) => {
    if (!['ORGANIZER', 'ADMIN', 'SUPER_ADMIN'].includes(ctx.user.role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Organizer access required',
      });
    }

    return next({
      ctx: {
        ...ctx,
        organizer: ctx.user.organizerProfile,
      },
    });
  });

// Admin procedure (admin role required)
export const adminProcedure = protectedProcedure
  .use(async ({ ctx, next }) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(ctx.user.role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Admin access required',
      });
    }

    return next();
  });

// Rate limiting middleware
export const rateLimitedProcedure = (limit: number, windowMs: number) =>
  baseProcedure.use(async ({ ctx, next }) => {
    const key = `rate_limit:${ctx.ip}:${ctx.pathname}`;

    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, Math.ceil(windowMs / 1000));
    }

    if (current > limit) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: 'Rate limit exceeded',
      });
    }

    return next();
  });
```

---

## Error Handling & Validation

### Comprehensive Error Management

```typescript
// lib/errors.ts

export class BusinessError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'BusinessError';
  }
}

export class PaymentError extends BusinessError {
  constructor(message: string, public squareError?: any) {
    super(message, 'PAYMENT_ERROR', 402);
    this.name = 'PaymentError';
  }
}

export class InventoryError extends BusinessError {
  constructor(message: string, public availableQuantity: number) {
    super(message, 'INVENTORY_ERROR', 409);
    this.name = 'InventoryError';
  }
}

// Global error handler
export const errorHandler = (error: unknown) => {
  if (error instanceof BusinessError) {
    return {
      code: error.code as TRPC_ERROR_CODE_KEY,
      message: error.message,
      data: {
        statusCode: error.statusCode,
        ...(error instanceof PaymentError && { squareError: error.squareError }),
        ...(error instanceof InventoryError && { availableQuantity: error.availableQuantity }),
      },
    };
  }

  // Log unexpected errors
  logger.error('Unexpected error', { error });

  return {
    code: 'INTERNAL_SERVER_ERROR' as TRPC_ERROR_CODE_KEY,
    message: 'An unexpected error occurred',
  };
};
```

---

## API Documentation Generation

### OpenAPI Integration

```typescript
// lib/openapi.ts
import { generateOpenApiDocument } from 'trpc-openapi';
import { appRouter } from '../server/api/root';

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'SteppersLife Events API',
  description: 'Complete API for event ticketing platform',
  version: '2.0.0',
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004/api',
  tags: [
    {
      name: 'events',
      description: 'Event discovery and management',
    },
    {
      name: 'tickets',
      description: 'Ticket purchasing and management',
    },
    {
      name: 'payments',
      description: 'Payment processing via Square',
    },
    {
      name: 'organizers',
      description: 'Event organizer tools',
    },
  ],
});
```

---

## Performance Optimization

### Caching & Query Optimization

```typescript
// lib/cache.ts

export const getCachedData = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> => {
  const cached = await redis.get(key);

  if (cached) {
    return JSON.parse(cached);
  }

  const data = await fetcher();
  await redis.setex(key, ttl, JSON.stringify(data));

  return data;
};

// Query optimization with includes
export const optimizedEventQuery = (includeTickets = false, includeVenue = false) => ({
  include: {
    ...(includeTickets && {
      ticketTypes: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
    }),
    ...(includeVenue && { venue: true }),
    _count: {
      select: {
        orders: { where: { status: 'COMPLETED' } },
        favorites: true,
      },
    },
  },
});
```

This comprehensive API specification provides a complete blueprint for implementing the SteppersLife events platform with type-safe, performant, and scalable endpoints that integrate seamlessly with Square payments and support real-time features.