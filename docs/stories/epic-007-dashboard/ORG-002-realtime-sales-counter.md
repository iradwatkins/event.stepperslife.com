# ORG-002: Real-time Sales Counter

**Epic:** EPIC-007 - Organizer Dashboard & Analytics
**Story Points:** 3
**Priority:** Medium
**Status:** Ready for Development

## User Story
As an **event organizer**
I want to **watch ticket sales update in real-time**
So that **I can see the immediate impact of my marketing efforts and celebrate each sale**

## Acceptance Criteria

### AC1: Real-time Sales Display
- [ ] Sales counter displays current ticket sales for selected event
- [ ] Counter updates instantly (<100ms latency) when new sale occurs
- [ ] Shows today's sales, this week's sales, and all-time sales
- [ ] Revenue displayed alongside ticket count (e.g., "5 tickets • $250")
- [ ] Counter animates with smooth counting effect when updating

### AC2: Live Sales Feed
- [ ] Scrolling feed shows last 10 sales with: timestamp, ticket type, price, buyer name (first name only)
- [ ] New sales appear at top of feed with slide-in animation
- [ ] Each sale entry fades after 10 seconds but remains visible
- [ ] Sales feed auto-scrolls to show new entries
- [ ] "See All Sales" link navigates to full order history

### AC3: Visual Notifications
- [ ] Celebration animation plays when sale occurs (confetti, sparkles, or pulse effect)
- [ ] Color-coded badges for different ticket types in feed
- [ ] Visual highlight for high-value sales (>$100)
- [ ] Progress bar shows sales towards capacity
- [ ] Milestone celebrations at 25%, 50%, 75%, 100% capacity

### AC4: Sound Notifications (Optional)
- [ ] Pleasant "cha-ching" sound plays on sale (mutable)
- [ ] Different sounds for regular vs VIP ticket sales
- [ ] Volume control in settings
- [ ] Enable/disable sound notifications toggle
- [ ] Sound respects browser audio permissions

### AC5: WebSocket Connection
- [ ] Establishes WebSocket connection on page load
- [ ] Reconnects automatically if connection drops
- [ ] Shows connection status indicator (connected/disconnected)
- [ ] Fallback to polling (every 10 seconds) if WebSocket unavailable
- [ ] Graceful degradation for older browsers

### AC6: Event Selection
- [ ] Dropdown to select which event to monitor
- [ ] "All Events" option shows combined sales across all events
- [ ] Recently viewed events appear at top of dropdown
- [ ] Search/filter events by name
- [ ] Default to most recent upcoming event

### AC7: Performance Optimization
- [ ] Feed limited to last 50 sales (pagination for more)
- [ ] Efficient DOM updates (virtual scrolling for large feeds)
- [ ] Throttle animations if multiple sales occur rapidly
- [ ] Low-power mode option for mobile devices
- [ ] Cleanup resources when component unmounts

## Technical Implementation

### Frontend Components
```typescript
// /components/dashboard/RealtimeSalesCounter.tsx
interface RealtimeSalesCounterProps {
  eventId?: string; // Optional: null for "all events"
  showCelebrations?: boolean;
  soundEnabled?: boolean;
}

interface SaleUpdate {
  id: string;
  eventId: string;
  eventName: string;
  ticketType: string;
  quantity: number;
  amount: number;
  buyerName: string; // First name only for privacy
  timestamp: Date;
}

interface SalesStats {
  todayCount: number;
  todayRevenue: number;
  weekCount: number;
  weekRevenue: number;
  allTimeCount: number;
  allTimeRevenue: number;
  progressPercent: number; // sold/capacity
}

// Component Structure
- RealtimeSalesCounter (container)
  - EventSelector (dropdown)
  - SalesStatsDisplay
    - StatCard (today, week, all-time)
    - ProgressBar
  - LiveSalesFeed
    - SaleItem (individual sale entry)
  - ConnectionStatus (WebSocket indicator)
  - CelebrationOverlay (confetti/animations)
  - SoundNotification (audio player)
```

### WebSocket Implementation
```typescript
// /lib/websocket/salesSocket.ts
export class SalesWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(
    private organizerId: string,
    private eventId: string | null,
    private onSale: (sale: SaleUpdate) => void,
    private onError: (error: Error) => void
  ) {}

  connect() {
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/sales/${this.organizerId}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('Sales WebSocket connected');
      this.reconnectAttempts = 0;

      // Subscribe to specific event or all events
      this.ws?.send(JSON.stringify({
        type: 'subscribe',
        eventId: this.eventId
      }));
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'sale') {
        this.onSale(data.payload);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.onError(new Error('WebSocket connection error'));
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed, attempting reconnect...');
      this.reconnect();
    };
  }

  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

      setTimeout(() => {
        console.log(`Reconnect attempt ${this.reconnectAttempts}`);
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnect attempts reached');
      this.onError(new Error('Failed to reconnect'));
    }
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }

  changeEvent(eventId: string | null) {
    this.eventId = eventId;
    this.ws?.send(JSON.stringify({
      type: 'subscribe',
      eventId: this.eventId
    }));
  }
}
```

### Custom Hook
```typescript
// /lib/hooks/useRealtimeSales.ts
export function useRealtimeSales(
  organizerId: string,
  eventId: string | null
) {
  const [sales, setSales] = useState<SaleUpdate[]>([]);
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wsRef = useRef<SalesWebSocket | null>(null);

  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio('/sounds/sale-notification.mp3');

    // Fetch initial stats
    fetchStats();

    // Connect WebSocket
    wsRef.current = new SalesWebSocket(
      organizerId,
      eventId,
      handleNewSale,
      handleError
    );
    wsRef.current.connect();

    return () => {
      wsRef.current?.disconnect();
      audioRef.current = null;
    };
  }, [organizerId, eventId]);

  const handleNewSale = useCallback((sale: SaleUpdate) => {
    // Add to feed
    setSales(prev => [sale, ...prev].slice(0, 50));

    // Update stats
    setStats(prev => prev ? {
      ...prev,
      todayCount: prev.todayCount + sale.quantity,
      todayRevenue: prev.todayRevenue + sale.amount,
      allTimeCount: prev.allTimeCount + sale.quantity,
      allTimeRevenue: prev.allTimeRevenue + sale.amount,
      progressPercent: calculateProgress(prev.allTimeCount + sale.quantity)
    } : null);

    // Play sound
    audioRef.current?.play().catch(err => {
      console.warn('Audio playback failed:', err);
    });

    // Trigger celebration
    triggerCelebration(sale);
  }, []);

  const handleError = useCallback((err: Error) => {
    setError(err);
    setIsConnected(false);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(
        `/api/dashboard/sales/stats?organizerId=${organizerId}&eventId=${eventId || 'all'}`
      );
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err as Error);
    }
  };

  return {
    sales,
    stats,
    isConnected,
    error,
    refetch: fetchStats
  };
}
```

### Backend WebSocket Server
```typescript
// /lib/websocket/server.ts (using Socket.IO)
import { Server } from 'socket.io';
import { verifyAuth } from '@/lib/auth/verify';

export function initSalesWebSocket(io: Server) {
  const salesNamespace = io.of('/sales');

  salesNamespace.use(async (socket, next) => {
    // Authenticate socket connection
    const token = socket.handshake.auth.token;
    const user = await verifyAuth(token);

    if (!user || user.role !== 'ORGANIZER') {
      return next(new Error('Unauthorized'));
    }

    socket.data.organizerId = user.id;
    next();
  });

  salesNamespace.on('connection', (socket) => {
    console.log(`Sales socket connected: ${socket.data.organizerId}`);

    socket.on('subscribe', ({ eventId }) => {
      const room = eventId
        ? `event:${eventId}`
        : `organizer:${socket.data.organizerId}`;

      socket.join(room);
      console.log(`Subscribed to ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`Sales socket disconnected: ${socket.data.organizerId}`);
    });
  });
}

// Emit sale event when order completed
export async function broadcastSale(sale: SaleUpdate) {
  const io = getSocketIOInstance();
  const salesNamespace = io.of('/sales');

  // Emit to event-specific room
  salesNamespace.to(`event:${sale.eventId}`).emit('sale', {
    type: 'sale',
    payload: sale
  });

  // Emit to organizer's "all events" room
  const event = await prisma.event.findUnique({
    where: { id: sale.eventId },
    select: { organizerId: true }
  });

  if (event) {
    salesNamespace.to(`organizer:${event.organizerId}`).emit('sale', {
      type: 'sale',
      payload: sale
    });
  }
}
```

### Payment Webhook Integration
```typescript
// /app/api/webhooks/square/route.ts
import { broadcastSale } from '@/lib/websocket/server';

export async function POST(req: Request) {
  const event = await req.json();

  if (event.type === 'payment.updated' && event.data.object.payment.status === 'COMPLETED') {
    const order = await processPayment(event.data.object.payment);

    // Broadcast real-time sale
    await broadcastSale({
      id: order.id,
      eventId: order.eventId,
      eventName: order.event.name,
      ticketType: order.items[0].ticketType.name,
      quantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
      amount: order.totalAmount,
      buyerName: order.user.firstName, // First name only
      timestamp: new Date()
    });
  }

  return NextResponse.json({ received: true });
}
```

### Celebration Component
```typescript
// /components/dashboard/CelebrationOverlay.tsx
import confetti from 'canvas-confetti';

interface CelebrationOverlayProps {
  onComplete: () => void;
}

export function CelebrationOverlay({ onComplete }: CelebrationOverlayProps) {
  useEffect(() => {
    // Confetti burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Auto-dismiss after animation
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="celebration-overlay">
      <div className="celebration-message">
        🎉 New Sale! 🎉
      </div>
    </div>
  );
}

// Alternative: Lottie animation
import Lottie from 'react-lottie-player';
import celebrationAnimation from '@/public/animations/celebration.json';

export function LottieCelebration() {
  return (
    <Lottie
      loop={false}
      animationData={celebrationAnimation}
      play
      style={{ width: 300, height: 300 }}
    />
  );
}
```

## UI/UX Design

### Layout
```
┌─────────────────────────────────────────────────┐
│ Real-time Sales Counter                         │
│                                                  │
│ Event: [Summer Dance Party ▼]  🟢 Connected    │
│                                                  │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│ │   TODAY     │ │  THIS WEEK  │ │  ALL TIME   ││
│ │   12 tickets││ │   48 tickets││ │  156 tickets││
│ │    $600     │ │   $2,400    │ │   $7,800    ││
│ └─────────────┘ └─────────────┘ └─────────────┘│
│                                                  │
│ Progress: ████████░░ 78% sold (156/200)        │
│                                                  │
│ Live Sales Feed                    🔊 [Sound On]│
│ ┌───────────────────────────────────────────────┐│
│ │ 🎟️ Just now - VIP Ticket - Sarah - $75      ││
│ │ 🎟️ 2 min ago - General - Mike - $50         ││
│ │ 🎟️ 5 min ago - Early Bird - Lisa - $40      ││
│ │ 🎟️ 8 min ago - VIP Ticket - John - $75      ││
│ └───────────────────────────────────────────────┘│
│                                See All Sales → │
└─────────────────────────────────────────────────┘
```

### Animation Styles
```css
/* Sale item slide-in animation */
@keyframes slideIn {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.sale-item-enter {
  animation: slideIn 0.3s ease-out;
}

/* Counter counting animation */
@keyframes countUp {
  from {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
    color: #10B981; /* Green */
  }
  to {
    transform: scale(1);
  }
}

.counter-update {
  animation: countUp 0.5s ease-out;
}

/* Celebration overlay */
.celebration-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  z-index: 9999;
  pointer-events: none;
}

.celebration-message {
  font-size: 3rem;
  font-weight: bold;
  color: white;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
  animation: pulse 1s ease-in-out infinite;
}
```

## Integration Points

### Dependencies
- **EPIC-003**: Payment webhooks trigger real-time updates
- **EPIC-004**: Ticket data for sales information
- **EPIC-002**: Event data for event names and capacity

### API Endpoints
```typescript
// Stats API
GET /api/dashboard/sales/stats
  ?organizerId={id}
  &eventId={id|all}
  &date={today|week|all}

Response: {
  todayCount: 12,
  todayRevenue: 600.00,
  weekCount: 48,
  weekRevenue: 2400.00,
  allTimeCount: 156,
  allTimeRevenue: 7800.00,
  capacity: 200,
  progressPercent: 78
}

// Recent sales feed
GET /api/dashboard/sales/feed
  ?organizerId={id}
  &eventId={id|all}
  &limit=50

Response: {
  sales: [
    {
      id: "ord_123",
      timestamp: "2025-09-30T14:23:45Z",
      ticketType: "VIP",
      quantity: 1,
      amount: 75.00,
      buyerName: "Sarah"
    },
    ...
  ]
}
```

## Performance Requirements

- **WebSocket latency**: <100ms from sale to UI update
- **Animation smoothness**: 60 FPS (16.67ms per frame)
- **Memory usage**: <50MB for feed with 50 sales
- **CPU usage**: <5% when idle, <15% during animations
- **Reconnect time**: <2 seconds after disconnect

## Testing Requirements

### Unit Tests
```typescript
describe('SalesWebSocket', () => {
  it('connects and subscribes to event', () => {
    const ws = new SalesWebSocket(organizerId, eventId, onSale, onError);
    ws.connect();
    expect(ws.isConnected()).toBe(true);
  });

  it('handles new sale updates', () => {
    const onSale = jest.fn();
    // Simulate sale event
    expect(onSale).toHaveBeenCalledWith(expectedSale);
  });

  it('reconnects after connection loss', async () => {
    // Simulate disconnect
    // Verify reconnection attempt
  });
});
```

### Integration Tests
- [ ] Test WebSocket connection lifecycle
- [ ] Test sale broadcast from payment webhook
- [ ] Test feed pagination and limits
- [ ] Test event switching

### E2E Tests
```typescript
test('organizer sees real-time sale', async ({ page }) => {
  await page.goto('/dashboard/realtime-sales');

  // Complete purchase in another browser
  await completePurchase();

  // Verify sale appears in feed
  await expect(page.locator('.sale-item').first()).toContainText('Just now');

  // Verify counter updates
  await expect(page.locator('[data-testid="today-count"]')).toContainText('1');
});
```

## Security Considerations

- [ ] Authenticate WebSocket connections with JWT
- [ ] Validate organizer owns event before subscribing
- [ ] Sanitize buyer names (first name only, no PII)
- [ ] Rate limit WebSocket connections (1 per organizer)
- [ ] Encrypt WebSocket traffic (WSS protocol)

## Accessibility

- [ ] Screen reader announces new sales ("New sale: VIP ticket, $75")
- [ ] Visual notifications for users with sound disabled
- [ ] Keyboard shortcut to toggle sound (Alt+S)
- [ ] High contrast mode for connection indicator
- [ ] Reduced motion option disables animations

## Success Metrics

- **Target**: 80% of organizers enable real-time counter during events
- **Target**: Average viewing time >5 minutes during event
- **Target**: <1% WebSocket connection failures
- **Target**: 90% positive feedback on celebration animations

## Definition of Done

- [ ] All acceptance criteria met
- [ ] WebSocket connection stable under load
- [ ] Celebration animations smooth at 60 FPS
- [ ] Unit tests pass (>80% coverage)
- [ ] E2E tests pass
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Accessibility audit passed
- [ ] Code reviewed and approved
- [ ] QA sign-off received
- [ ] Product Owner acceptance

## Notes

- Consider A/B testing different celebration animations
- Monitor battery usage on mobile devices
- Add "silent mode" for discrete monitoring
- Consider integrating with Slack/Discord for notifications