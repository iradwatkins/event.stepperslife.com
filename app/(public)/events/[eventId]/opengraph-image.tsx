import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const alt = 'Event Details';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params;
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        venue: true,
        ticketTypes: {
          where: { isActive: true },
          orderBy: { price: 'asc' },
          take: 1
        }
      }
    });

    if (!event) {
      return new ImageResponse(
        (
          <div
            style={{
              fontSize: 60,
              background: 'linear-gradient(to bottom right, #3b82f6, #8b5cf6)',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            Event Not Found
          </div>
        ),
        { ...size }
      );
    }

    const lowestPrice = event.ticketTypes[0] ? Number(event.ticketTypes[0].price) : 0;
    const eventDate = new Date(event.startDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(to bottom right, #1e40af, #7c3aed)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px',
            color: 'white',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {event.coverImage && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0.3,
                backgroundImage: `url(${event.coverImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          )}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              borderRadius: '24px',
              padding: '48px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              width: '100%',
              position: 'relative',
            }}
          >
            <div
              style={{
                fontSize: 72,
                fontWeight: 'bold',
                lineHeight: 1.2,
                textAlign: 'center',
              }}
            >
              {event.name}
            </div>
            <div
              style={{
                fontSize: 36,
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                opacity: 0.9,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                📅 {eventDate}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                📍 {event.venue?.name || "Venue TBA"}
              </div>
              {lowestPrice > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  💵 From ${lowestPrice.toFixed(2)}
                </div>
              )}
            </div>
            <div
              style={{
                fontSize: 32,
                background: 'white',
                color: '#1e40af',
                padding: '16px 32px',
                borderRadius: '12px',
                fontWeight: 'bold',
                textAlign: 'center',
                marginTop: '24px',
              }}
            >
              Get Tickets on SteppersLife Events
            </div>
          </div>
        </div>
      ),
      { ...size }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 60,
            background: 'linear-gradient(to bottom right, #3b82f6, #8b5cf6)',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          SteppersLife Events
        </div>
      ),
      { ...size }
    );
  }
}
