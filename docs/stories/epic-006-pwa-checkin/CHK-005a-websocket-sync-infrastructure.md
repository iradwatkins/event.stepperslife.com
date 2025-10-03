# Story: CHK-005a - WebSocket Sync Infrastructure

**Epic**: EPIC-006 - Mobile Check-in PWA
**Story Points**: 3
**Priority**: P1 (High)
**Status**: Not Started
**Parent Story**: CHK-005 (Multi-Device Sync - 5 pts)
**Dependencies**: CHK-001 (PWA Framework), TIX-003 (Ticket Validation)

---

## Story

**As a** system architect
**I want** a robust WebSocket infrastructure for real-time sync
**So that** all check-in devices receive updates within 2 seconds

**As an** event organizer with multiple entry points
**I want** all staff devices synchronized in real-time
**So that** duplicate check-ins are prevented across all devices

---

## Acceptance Criteria

### AC1: Socket.io Server Setup
**Given** the application needs real-time communication
**When** server starts
**Then** it should:
- Initialize Socket.io server with Express/Next.js
- Configure CORS for PWA domains
- Set up connection authentication (JWT)
- Create event-based room isolation
- Enable binary transport for performance
- Configure heartbeat (30s interval)
- Set connection timeout (60s)
- Handle graceful shutdown
- Support horizontal scaling with Redis adapter

### AC2: Device Registration & Rooms
**Given** a staff device connects to check-in
**When** WebSocket connection establishes
**Then** the system should:
- Authenticate with JWT token
- Extract staffId, eventId, deviceId from token
- Join room: `event:${eventId}`
- Register device metadata:
  - deviceId, staffId, staffName
  - lastSeen timestamp
  - User agent / device info
  - Connection quality
- Broadcast device joined to room
- Return current event state (checked-in count, etc.)
- Store connection in Redis (for multi-server)

### AC3: Real-Time Check-In Broadcasting
**Given** a check-in occurs on any device
**When** validation succeeds
**Then** the server should:
- Receive check-in event from API
- Broadcast to all devices in event room
- Exclude the originating device (no echo)
- Include complete check-in data:
  ```typescript
  {
    type: 'CHECK_IN_SUCCESS',
    ticketId: string,
    attendeeId: string,
    attendeeName: string,
    tier: string,
    staffId: string,
    staffName: string,
    deviceId: string,
    timestamp: string,
    location?: string
  }
  ```
- Guarantee delivery within 2 seconds (p95)
- Track broadcast metrics (latency, failures)

### AC4: Connection Health Monitoring
**Given** devices maintain persistent connections
**When** monitoring connection health
**Then** the system should:
- Send ping every 30 seconds
- Expect pong within 5 seconds
- Mark unresponsive after missed 2 pongs
- Emit `device_disconnected` event
- Clean up stale connections (5min timeout)
- Track connection quality:
  - Latency (ping round-trip time)
  - Packet loss
  - Connection stability
- Auto-reconnect on client with exponential backoff

### AC5: Event Broadcasting Patterns
**Given** various real-time events occur
**When** broadcasting to rooms
**Then** support these events:

| Event Type | Direction | Payload | Use Case |
|------------|-----------|---------|----------|
| `check_in_success` | Server → Clients | Check-in details | Update all devices |
| `check_in_conflict` | Server → Client | Conflict info | Notify duplicate attempt |
| `device_joined` | Server → Clients | Device info | Track active staff |
| `device_left` | Server → Clients | Device ID | Remove from active list |
| `sync_request` | Client → Server | Event ID | Request current state |
| `sync_response` | Server → Client | Event state | Provide current data |
| `heartbeat` | Bidirectional | Timestamp | Keep-alive |

### AC6: Error Handling & Resilience
**Given** network issues or errors occur
**When** handling WebSocket events
**Then** the system should:
- Handle connection drops gracefully
- Implement exponential backoff reconnection:
  - Attempt 1: 1 second
  - Attempt 2: 2 seconds
  - Attempt 3: 4 seconds
  - Attempt 4: 8 seconds
  - Max delay: 30 seconds
  - Max attempts: Infinity
- Buffer messages during disconnection (max 100)
- Replay buffered messages on reconnection
- Handle authentication failures (re-auth)
- Log all errors with context
- Alert admins of persistent failures

### AC7: Performance & Scalability
**Given** high check-in traffic (100+ concurrent devices)
**When** broadcasting events
**Then** optimize for:
- Support 500+ concurrent connections per server
- Broadcast latency < 100ms (p95)
- Use Redis pub/sub for horizontal scaling
- Implement message batching (10ms window)
- Enable binary transport (reduced payload size)
- Use WebSocket compression
- Monitor memory usage (< 100MB per 100 connections)
- Implement rate limiting (100 events/sec per device)
- Handle server failover gracefully

---

## Tasks / Subtasks

### Server Infrastructure
- [ ] Install Socket.io dependencies
  - [ ] `npm install socket.io socket.io-redis`
  - [ ] TypeScript types
  - [ ] Redis client for adapter

- [ ] Create Socket.io server
  - [ ] File: `/server/websocket/socket-server.ts`
  - [ ] Initialize with HTTP server
  - [ ] Configure Socket.io options
  - [ ] Set up CORS
  - [ ] Enable compression
  - [ ] Configure transport

- [ ] Implement authentication middleware
  - [ ] Verify JWT token on connection
  - [ ] Extract user/event info
  - [ ] Reject unauthorized connections
  - [ ] Handle token expiration

- [ ] Set up Redis adapter
  - [ ] Connect Redis client
  - [ ] Configure adapter for Socket.io
  - [ ] Enable pub/sub
  - [ ] Test multi-server setup

### Room Management
- [ ] Build room joining logic
  - [ ] Parse event ID from auth
  - [ ] Join event-specific room
  - [ ] Store device metadata
  - [ ] Broadcast device joined

- [ ] Create device registry
  - [ ] File: `/server/websocket/device-registry.ts`
  - [ ] Track connected devices per event
  - [ ] Store device metadata in Redis
  - [ ] Clean up on disconnect
  - [ ] Query active devices

- [ ] Implement room broadcasting
  - [ ] Broadcast to event room
  - [ ] Exclude sender
  - [ ] Include metadata
  - [ ] Track delivery

### Event Handlers
- [ ] Build check-in event handler
  - [ ] File: `/server/websocket/event-handlers.ts`
  - [ ] Receive check-in from API
  - [ ] Format broadcast message
  - [ ] Send to event room
  - [ ] Log broadcast

- [ ] Create conflict event handler
  - [ ] Send conflict to specific device
  - [ ] Include conflict details
  - [ ] Log conflict event

- [ ] Add device lifecycle handlers
  - [ ] Handle connection
  - [ ] Handle disconnection
  - [ ] Handle reconnection
  - [ ] Clean up resources

### Health Monitoring
- [ ] Implement heartbeat system
  - [ ] Server ping every 30s
  - [ ] Client pong response
  - [ ] Detect missed heartbeats
  - [ ] Disconnect stale connections

- [ ] Build connection quality tracking
  - [ ] Measure ping latency
  - [ ] Track packet loss
  - [ ] Calculate connection score
  - [ ] Store metrics in Redis

- [ ] Create monitoring dashboard data
  - [ ] Active connections count
  - [ ] Connection quality stats
  - [ ] Broadcast metrics
  - [ ] Error rates

### Client SDK
- [ ] Create WebSocket client manager
  - [ ] File: `/lib/sync/websocket-manager.ts`
  - [ ] Initialize Socket.io client
  - [ ] Handle authentication
  - [ ] Manage connection lifecycle
  - [ ] Implement reconnection logic

- [ ] Build event emitters
  - [ ] Emit check-in events
  - [ ] Emit heartbeat
  - [ ] Emit sync requests
  - [ ] Handle responses

- [ ] Add event listeners
  - [ ] Listen for check-in broadcasts
  - [ ] Listen for conflicts
  - [ ] Listen for device updates
  - [ ] Listen for connection events

---

## Database Schema

```prisma
// No new Prisma models needed
// WebSocket state stored in Redis

// Redis data structures:
// device:{deviceId} → { staffId, eventId, connectedAt, lastSeen }
// event:{eventId}:devices → Set of deviceIds
// event:{eventId}:stats → { checkedInCount, connectedDevices }
```

---

## Dev Notes

### Socket.io Server Implementation

```typescript
// server/websocket/socket-server.ts

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import jwt from 'jsonwebtoken';

export class WebSocketServer {
  private io: SocketIOServer;
  private pubClient: any;
  private subClient: any;

  async initialize(httpServer: HTTPServer): Promise<void> {
    // Create Socket.io server
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL,
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 30000,
      maxHttpBufferSize: 1e6, // 1MB
      allowEIO3: true
    });

    // Set up Redis adapter for horizontal scaling
    if (process.env.REDIS_URL) {
      this.pubClient = createClient({ url: process.env.REDIS_URL });
      this.subClient = this.pubClient.duplicate();

      await Promise.all([
        this.pubClient.connect(),
        this.subClient.connect()
      ]);

      this.io.adapter(createAdapter(this.pubClient, this.subClient));
      console.log('✓ Socket.io Redis adapter configured');
    }

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

        socket.data.userId = decoded.userId;
        socket.data.staffId = decoded.staffId;
        socket.data.eventId = decoded.eventId;
        socket.data.deviceId = socket.handshake.query.deviceId;

        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    // Connection handler
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    console.log('✓ WebSocket server initialized');
  }

  private async handleConnection(socket: any): Promise<void> {
    const { eventId, staffId, deviceId } = socket.data;

    console.log(`Device connected: ${deviceId} (Staff: ${staffId}, Event: ${eventId})`);

    // Join event room
    socket.join(`event:${eventId}`);

    // Register device
    await this.registerDevice(socket);

    // Broadcast device joined
    socket.to(`event:${eventId}`).emit('device_joined', {
      deviceId,
      staffId,
      staffName: socket.data.staffName,
      connectedAt: new Date().toISOString()
    });

    // Set up event listeners
    this.setupEventHandlers(socket);

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });
  }

  private setupEventHandlers(socket: any): void {
    const { eventId } = socket.data;

    // Heartbeat
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Sync request
    socket.on('sync_request', async () => {
      const state = await this.getEventState(eventId);
      socket.emit('sync_response', state);
    });
  }

  async broadcastCheckIn(eventId: string, data: CheckInBroadcast): Promise<void> {
    this.io.to(`event:${eventId}`).emit('check_in_success', data);
  }

  async broadcastConflict(deviceId: string, data: ConflictData): Promise<void> {
    const sockets = await this.io.fetchSockets();
    const targetSocket = sockets.find(s => s.data.deviceId === deviceId);

    if (targetSocket) {
      targetSocket.emit('check_in_conflict', data);
    }
  }

  private async registerDevice(socket: any): Promise<void> {
    const { eventId, deviceId, staffId } = socket.data;

    // Store in Redis
    await this.pubClient.setEx(
      `device:${deviceId}`,
      3600, // 1 hour TTL
      JSON.stringify({
        staffId,
        eventId,
        connectedAt: Date.now(),
        lastSeen: Date.now()
      })
    );

    // Add to event devices set
    await this.pubClient.sAdd(`event:${eventId}:devices`, deviceId);
  }

  private async handleDisconnection(socket: any): Promise<void> {
    const { eventId, deviceId } = socket.data;

    console.log(`Device disconnected: ${deviceId}`);

    // Broadcast device left
    socket.to(`event:${eventId}`).emit('device_left', {
      deviceId,
      disconnectedAt: new Date().toISOString()
    });

    // Remove from Redis (after delay for reconnection)
    setTimeout(async () => {
      await this.pubClient.sRem(`event:${eventId}:devices`, deviceId);
      await this.pubClient.del(`device:${deviceId}`);
    }, 300000); // 5 minutes
  }

  private async getEventState(eventId: string): Promise<any> {
    const checkedInCount = await prisma.checkInLog.count({
      where: { eventId, status: 'VALID' }
    });

    const devices = await this.pubClient.sMembers(`event:${eventId}:devices`);

    return {
      eventId,
      checkedInCount,
      connectedDevices: devices.length,
      devices
    };
  }
}
```

### WebSocket Client Manager

```typescript
// lib/sync/websocket-manager.ts

import { io, Socket } from 'socket.io-client';

export class WebSocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30000;

  connect(eventId: string, token: string, deviceId: string): void {
    this.socket = io(process.env.NEXT_PUBLIC_WS_URL || '', {
      auth: { token },
      query: { deviceId },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: this.maxReconnectDelay,
      timeout: 10000
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✓ WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('WebSocket disconnected:', reason);
    });

    this.socket.on('reconnect_attempt', (attempt) => {
      this.reconnectAttempts = attempt;
      console.log(`Reconnection attempt ${attempt}`);
    });

    this.socket.on('check_in_success', (data) => {
      this.handleCheckInBroadcast(data);
    });

    this.socket.on('check_in_conflict', (data) => {
      this.handleConflict(data);
    });

    this.socket.on('device_joined', (data) => {
      console.log('Device joined:', data);
    });

    this.socket.on('device_left', (data) => {
      console.log('Device left:', data);
    });

    // Heartbeat
    setInterval(() => {
      this.socket?.emit('ping');
    }, 30000);

    this.socket.on('pong', (data) => {
      const latency = Date.now() - data.timestamp;
      console.log(`Latency: ${latency}ms`);
    });
  }

  private handleCheckInBroadcast(data: CheckInBroadcast): void {
    // Update local state
    // Dispatch event to React components
    window.dispatchEvent(new CustomEvent('check-in-broadcast', { detail: data }));
  }

  private handleConflict(data: ConflictData): void {
    // Show conflict notification
    window.dispatchEvent(new CustomEvent('check-in-conflict', { detail: data }));
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  getConnectionStatus(): 'connected' | 'disconnected' | 'connecting' {
    if (!this.socket) return 'disconnected';
    return this.socket.connected ? 'connected' : 'connecting';
  }
}
```

---

## Testing

### Unit Tests
- [ ] Authentication middleware
- [ ] Room joining logic
- [ ] Device registration
- [ ] Broadcast formatting
- [ ] Heartbeat mechanism

### Integration Tests
- [ ] End-to-end connection flow
- [ ] Real-time broadcasting
- [ ] Multi-device sync
- [ ] Reconnection handling
- [ ] Redis adapter integration

### Load Tests
- [ ] 500+ concurrent connections
- [ ] 1000+ broadcasts per minute
- [ ] Memory usage under load
- [ ] Connection stability
- [ ] Failover scenarios

---

## Environment Variables

```bash
# WebSocket configuration
NEXT_PUBLIC_WS_URL=http://localhost:3004
WS_PORT=3004

# Redis for scaling
REDIS_URL=redis://localhost:6379

# JWT for authentication
JWT_SECRET=your-jwt-secret

# Performance tuning
WS_PING_INTERVAL=30000
WS_PING_TIMEOUT=60000
WS_MAX_CONNECTIONS=500
```

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-09-30 | BMAD SM Agent | Initial sharded story from CHK-005 |

---

*Sharded from CHK-005 (5 pts) - Part 1 of 2*
*Next: CHK-005b - Conflict Resolution & Offline Queue (2 pts)*
*Generated by BMAD SM Agent*