/**
 * Database Cleaner
 * Handles cleanup of test data from the database
 * Respects foreign key constraints by deleting in correct order
 */

import { PrismaClient } from '@prisma/client';

export class DatabaseCleaner {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Clean up all test data based on email pattern
   * Deletes all records associated with @e2etest.com emails
   */
  async cleanupTestData(emailPattern: string = '@e2etest.com') {
    try {
      console.log(`🧹 Cleaning up test data for pattern: ${emailPattern}`);

      // Find all test users
      const testUsers = await this.prisma.user.findMany({
        where: {
          email: {
            contains: emailPattern,
          },
        },
        select: { id: true, email: true },
      });

      console.log(`📧 Found ${testUsers.length} test users to clean up`);

      for (const user of testUsers) {
        await this.deleteUserAndRelatedData(user.id);
        console.log(`✅ Cleaned up user: ${user.email}`);
      }

      // Also clean up test events by slug pattern
      await this.cleanupTestEvents('e2e-test-event-');

      console.log(`✨ Cleanup complete!`);
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      throw error;
    }
  }

  /**
   * Delete a specific user and all related data
   */
  async deleteUserAndRelatedData(userId: string) {
    try {
      // Delete in order respecting foreign key constraints

      // 1. Audit logs
      await this.prisma.auditLog.deleteMany({
        where: { userId },
      });

      // 2. Ticket transfers (as sender or recipient)
      await this.prisma.ticketTransfer.deleteMany({
        where: {
          OR: [{ fromUserId: userId }, { toUserId: userId }],
        },
      });

      // 3. Event favorites
      await this.prisma.eventFavorite.deleteMany({
        where: { userId },
      });

      // 4. Follows (as follower or following)
      await this.prisma.follow.deleteMany({
        where: {
          OR: [{ followerId: userId }, { followingId: userId }],
        },
      });

      // 5. Tickets (owned by user)
      await this.prisma.ticket.deleteMany({
        where: { userId },
      });

      // 6. Refunds (via orders)
      const userOrders = await this.prisma.order.findMany({
        where: { userId },
        select: { id: true },
      });
      const orderIds = userOrders.map((o) => o.id);

      if (orderIds.length > 0) {
        await this.prisma.refund.deleteMany({
          where: { orderId: { in: orderIds } },
        });
      }

      // 7. Payments (via orders)
      if (orderIds.length > 0) {
        await this.prisma.payment.deleteMany({
          where: { orderId: { in: orderIds } },
        });
      }

      // 8. Orders
      await this.prisma.order.deleteMany({
        where: { userId },
      });

      // 9. Events organized by user
      const userEvents = await this.prisma.event.findMany({
        where: { organizerId: userId },
        select: { id: true },
      });

      for (const event of userEvents) {
        await this.deleteEvent(event.id);
      }

      // 10. Sessions
      await this.prisma.session.deleteMany({
        where: { userId },
      });

      // 11. Accounts
      await this.prisma.account.deleteMany({
        where: { userId },
      });

      // 12. Billing account and related records
      try {
        await this.prisma.billingAccount.deleteMany({
          where: { userId },
        });
      } catch {
        // Billing may not exist for all users
      }

      // 13. Finally, delete the user
      await this.prisma.user.delete({
        where: { id: userId },
      });
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error);
      // Continue with other users even if one fails
    }
  }

  /**
   * Delete an event and all related data
   */
  async deleteEvent(eventId: string) {
    try {
      // 1. Event favorites
      await this.prisma.eventFavorite.deleteMany({
        where: { eventId },
      });

      // 2. Tickets for this event (not owned by users)
      const eventTickets = await this.prisma.ticket.findMany({
        where: { eventId },
        select: { id: true },
      });

      for (const ticket of eventTickets) {
        await this.prisma.ticketTransfer.deleteMany({
          where: { ticketId: ticket.id },
        });
      }

      await this.prisma.ticket.deleteMany({
        where: { eventId },
      });

      // 3. Orders for this event (get remaining ones)
      const eventOrders = await this.prisma.order.findMany({
        where: { eventId },
        select: { id: true },
      });
      const orderIds = eventOrders.map((o) => o.id);

      if (orderIds.length > 0) {
        await this.prisma.refund.deleteMany({
          where: { orderId: { in: orderIds } },
        });

        await this.prisma.payment.deleteMany({
          where: { orderId: { in: orderIds } },
        });

        await this.prisma.order.deleteMany({
          where: { id: { in: orderIds } },
        });
      }

      // 4. Ticket types
      await this.prisma.ticketType.deleteMany({
        where: { eventId },
      });

      // 5. Event sessions
      await this.prisma.eventSession.deleteMany({
        where: { eventId },
      });

      // 6. Finally, delete the event
      await this.prisma.event.delete({
        where: { id: eventId },
      });
    } catch (error) {
      console.error(`Error deleting event ${eventId}:`, error);
      // Continue anyway
    }
  }

  /**
   * Clean up test events by slug pattern
   */
  async cleanupTestEvents(slugPattern: string) {
    try {
      const testEvents = await this.prisma.event.findMany({
        where: {
          slug: {
            startsWith: slugPattern,
          },
        },
        select: { id: true, slug: true },
      });

      console.log(`🎫 Found ${testEvents.length} test events to clean up`);

      for (const event of testEvents) {
        await this.deleteEvent(event.id);
        console.log(`✅ Cleaned up event: ${event.slug}`);
      }
    } catch (error) {
      console.error('Error cleaning up test events:', error);
    }
  }

  /**
   * Clean up by timestamp (for specific test run)
   */
  async cleanupByTimestamp(timestamp: string) {
    console.log(`🧹 Cleaning up test data for timestamp: ${timestamp}`);

    // Clean users with this timestamp in email
    await this.cleanupTestData(`.${timestamp}@e2etest.com`);

    // Clean events with this timestamp in slug
    await this.cleanupTestEvents(`e2e-test-event-${timestamp}`);
  }

  /**
   * Disconnect from database
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }

  /**
   * Get count of test data
   */
  async getTestDataCount() {
    const users = await this.prisma.user.count({
      where: {
        email: {
          contains: '@e2etest.com',
        },
      },
    });

    const events = await this.prisma.event.count({
      where: {
        slug: {
          startsWith: 'e2e-test-event-',
        },
      },
    });

    return { users, events };
  }
}

// Export singleton instance
export const databaseCleaner = new DatabaseCleaner();
