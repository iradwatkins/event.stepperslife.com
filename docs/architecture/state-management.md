# SteppersLife Events Platform - State Management Architecture
## Zustand Store Design & Client State Architecture
### Version 2.0

---

## Overview

This document defines the complete client-side state management architecture using Zustand for the SteppersLife events platform. The architecture is designed for high performance, type safety, and seamless integration with tRPC and real-time features.

---

## Architecture Principles

### Core Principles

1. **Single Source of Truth**: Each domain has one primary store
2. **Predictable State Updates**: Immutable updates with clear action patterns
3. **Type Safety**: Full TypeScript integration with strict typing
4. **Performance Optimized**: Selective subscriptions and shallow equality
5. **Persistent State**: Automatic localStorage/sessionStorage where needed
6. **Real-time Sync**: WebSocket integration for live updates
7. **Offline Support**: Optimistic updates with offline queue

### Store Architecture

```typescript
// Core store structure
interface StoreSlice<T> {
  // State
  data: T;
  loading: boolean;
  error: string | null;

  // Actions
  actions: {
    fetch: () => Promise<void>;
    reset: () => void;
    clearError: () => void;
  };

  // Computed
  computed: {
    isReady: boolean;
    hasData: boolean;
  };
}
```

---

## Store Organization

### Store Structure

```
src/stores/
├── index.ts                 # Store exports and setup
├── types.ts                 # Shared store types
├── middleware.ts            # Custom middleware
│
├── auth/                    # Authentication stores
│   ├── auth-store.ts
│   └── session-store.ts
│
├── events/                  # Event management stores
│   ├── event-store.ts
│   ├── event-list-store.ts
│   └── event-form-store.ts
│
├── checkout/                # Purchase flow stores
│   ├── cart-store.ts
│   ├── checkout-store.ts
│   └── payment-store.ts
│
├── organizer/              # Organizer dashboard stores
│   ├── dashboard-store.ts
│   ├── organizer-store.ts
│   └── analytics-store.ts
│
├── ui/                     # UI state stores
│   ├── theme-store.ts
│   ├── navigation-store.ts
│   └── modal-store.ts
│
├── real-time/              # Real-time data stores
│   ├── websocket-store.ts
│   ├── seat-selection-store.ts
│   └── live-updates-store.ts
│
└── cache/                  # Cache management
    ├── query-cache-store.ts
    └── offline-store.ts
```

---

## Authentication Stores

### Auth Store

```typescript
// stores/auth/auth-store.ts
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { User, Session } from '@/types/auth';

interface AuthState {
  // State
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;

  // Internal actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Actions
        login: async (email: string, password: string) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const { user, session } = await authApi.login.mutate({ email, password });

            set((state) => {
              state.user = user;
              state.session = session;
              state.isAuthenticated = true;
              state.isLoading = false;
            });

            // Initialize other stores for authenticated user
            useOrganizerStore.getState().fetchProfile();
            useCartStore.getState().syncWithServer();

          } catch (error) {
            set((state) => {
              state.error = error.message;
              state.isLoading = false;
            });
            throw error;
          }
        },

        logout: async () => {
          set((state) => {
            state.isLoading = true;
          });

          try {
            await authApi.logout.mutate();
          } catch (error) {
            console.error('Logout error:', error);
          } finally {
            set((state) => {
              state.user = null;
              state.session = null;
              state.isAuthenticated = false;
              state.isLoading = false;
              state.error = null;
            });

            // Clear other stores
            useOrganizerStore.getState().reset();
            useCartStore.getState().clear();
            useDashboardStore.getState().reset();
          }
        },

        register: async (data: RegisterData) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const { user, session } = await authApi.register.mutate(data);

            set((state) => {
              state.user = user;
              state.session = session;
              state.isAuthenticated = true;
              state.isLoading = false;
            });

          } catch (error) {
            set((state) => {
              state.error = error.message;
              state.isLoading = false;
            });
            throw error;
          }
        },

        updateProfile: async (data: Partial<User>) => {
          const currentUser = get().user;
          if (!currentUser) throw new Error('Not authenticated');

          try {
            const updatedUser = await userApi.profile.update.mutate(data);

            set((state) => {
              state.user = updatedUser;
            });

          } catch (error) {
            set((state) => {
              state.error = error.message;
            });
            throw error;
          }
        },

        verifyEmail: async (token: string) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            await authApi.verifyEmail.mutate({ token });

            set((state) => {
              if (state.user) {
                state.user.emailVerified = new Date();
              }
              state.isLoading = false;
            });

          } catch (error) {
            set((state) => {
              state.error = error.message;
              state.isLoading = false;
            });
            throw error;
          }
        },

        resetPassword: async (email: string) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            await authApi.resetPassword.mutate({ email });
            set((state) => {
              state.isLoading = false;
            });

          } catch (error) {
            set((state) => {
              state.error = error.message;
              state.isLoading = false;
            });
            throw error;
          }
        },

        changePassword: async (oldPassword: string, newPassword: string) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            await authApi.changePassword.mutate({ oldPassword, newPassword });
            set((state) => {
              state.isLoading = false;
            });

          } catch (error) {
            set((state) => {
              state.error = error.message;
              state.isLoading = false;
            });
            throw error;
          }
        },

        // Internal actions
        setUser: (user: User | null) => set((state) => {
          state.user = user;
          state.isAuthenticated = !!user;
        }),

        setSession: (session: Session | null) => set((state) => {
          state.session = session;
        }),

        setLoading: (loading: boolean) => set((state) => {
          state.isLoading = loading;
        }),

        setError: (error: string | null) => set((state) => {
          state.error = error;
        }),

        clearError: () => set((state) => {
          state.error = null;
        }),
      })),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          session: state.session,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);

// Computed selectors
export const useAuthSelectors = () => {
  const store = useAuthStore();

  return {
    isOrganizer: store.user?.role === 'ORGANIZER' || store.user?.role === 'ADMIN',
    isAdmin: store.user?.role === 'ADMIN' || store.user?.role === 'SUPER_ADMIN',
    isVerified: !!store.user?.emailVerified,
    hasProfile: !!store.user?.firstName && !!store.user?.lastName,
    canCreateEvents: store.user?.role === 'ORGANIZER' || store.user?.role === 'ADMIN',
  };
};
```

---

## Event Management Stores

### Event Store

```typescript
// stores/events/event-store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Event, EventFilters } from '@/types/events';

interface EventState {
  // Current event data
  currentEvent: Event | null;

  // Event lists
  events: Event[];
  featuredEvents: Event[];
  userEvents: Event[];

  // Loading states
  isLoading: boolean;
  isLoadingEvent: boolean;
  isLoadingFeatured: boolean;

  // Error states
  error: string | null;
  eventError: string | null;

  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };

  // Filters
  filters: EventFilters;

  // Actions
  fetchEvents: (filters?: EventFilters, append?: boolean) => Promise<void>;
  fetchEventBySlug: (slug: string) => Promise<Event>;
  fetchFeaturedEvents: () => Promise<void>;
  fetchUserEvents: () => Promise<void>;

  // Mutations
  createEvent: (data: CreateEventData) => Promise<Event>;
  updateEvent: (id: string, data: UpdateEventData) => Promise<Event>;
  publishEvent: (id: string) => Promise<void>;
  cancelEvent: (id: string, reason: string) => Promise<void>;

  // Favorites
  favoriteEvent: (eventId: string) => Promise<void>;
  unfavoriteEvent: (eventId: string) => Promise<void>;

  // Filters & pagination
  setFilters: (filters: Partial<EventFilters>) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;

  // Internal actions
  setCurrentEvent: (event: Event | null) => void;
  updateEventInList: (eventId: string, updates: Partial<Event>) => void;
  removeEventFromList: (eventId: string) => void;
  clearError: () => void;
  reset: () => void;
}

export const useEventStore = create<EventState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      currentEvent: null,
      events: [],
      featuredEvents: [],
      userEvents: [],
      isLoading: false,
      isLoadingEvent: false,
      isLoadingFeatured: false,
      error: null,
      eventError: null,
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false,
      },
      filters: {
        category: '',
        city: '',
        state: '',
        dateFrom: null,
        dateTo: null,
        search: '',
        featured: false,
        sortBy: 'date',
        sortOrder: 'asc',
      },

      // Actions
      fetchEvents: async (filters?: EventFilters, append = false) => {
        const currentFilters = filters || get().filters;
        const currentPage = append ? get().pagination.page + 1 : 1;

        set((state) => {
          state.isLoading = true;
          state.error = null;
          if (!append) {
            state.events = [];
          }
          state.pagination.page = currentPage;
        });

        try {
          const result = await eventApi.public.events.list.query({
            ...currentFilters,
            page: currentPage,
            limit: get().pagination.limit,
          });

          set((state) => {
            if (append) {
              state.events.push(...result.events);
            } else {
              state.events = result.events;
            }
            state.pagination.total = result.total;
            state.pagination.hasMore = result.hasMore;
            state.isLoading = false;
          });

        } catch (error) {
          set((state) => {
            state.error = error.message;
            state.isLoading = false;
          });
          throw error;
        }
      },

      fetchEventBySlug: async (slug: string) => {
        set((state) => {
          state.isLoadingEvent = true;
          state.eventError = null;
        });

        try {
          const event = await eventApi.public.events.getBySlug.query({
            slug,
            includeTickets: true,
            includeVenue: true,
          });

          set((state) => {
            state.currentEvent = event;
            state.isLoadingEvent = false;
          });

          return event;

        } catch (error) {
          set((state) => {
            state.eventError = error.message;
            state.isLoadingEvent = false;
          });
          throw error;
        }
      },

      fetchFeaturedEvents: async () => {
        set((state) => {
          state.isLoadingFeatured = true;
        });

        try {
          const result = await eventApi.public.events.list.query({
            featured: true,
            limit: 6,
          });

          set((state) => {
            state.featuredEvents = result.events;
            state.isLoadingFeatured = false;
          });

        } catch (error) {
          set((state) => {
            state.isLoadingFeatured = false;
          });
        }
      },

      fetchUserEvents: async () => {
        const { isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated) return;

        try {
          const events = await userApi.events.list.query();

          set((state) => {
            state.userEvents = events;
          });

        } catch (error) {
          console.error('Failed to fetch user events:', error);
        }
      },

      createEvent: async (data: CreateEventData) => {
        try {
          const event = await organizerApi.events.create.mutate(data);

          set((state) => {
            state.userEvents.unshift(event);
          });

          return event;

        } catch (error) {
          set((state) => {
            state.error = error.message;
          });
          throw error;
        }
      },

      updateEvent: async (id: string, data: UpdateEventData) => {
        try {
          const event = await organizerApi.events.update.mutate({ eventId: id, ...data });

          set((state) => {
            state.updateEventInList(id, event);
            if (state.currentEvent?.id === id) {
              state.currentEvent = event;
            }
          });

          return event;

        } catch (error) {
          set((state) => {
            state.error = error.message;
          });
          throw error;
        }
      },

      publishEvent: async (id: string) => {
        try {
          await organizerApi.events.publish.mutate({ eventId: id });

          set((state) => {
            state.updateEventInList(id, { status: 'PUBLISHED', publishedAt: new Date() });
          });

        } catch (error) {
          set((state) => {
            state.error = error.message;
          });
          throw error;
        }
      },

      cancelEvent: async (id: string, reason: string) => {
        try {
          await organizerApi.events.cancel.mutate({ eventId: id, reason });

          set((state) => {
            state.updateEventInList(id, { status: 'CANCELLED' });
          });

        } catch (error) {
          set((state) => {
            state.error = error.message;
          });
          throw error;
        }
      },

      favoriteEvent: async (eventId: string) => {
        try {
          await userApi.social.favorites.add.mutate({ eventId });

          set((state) => {
            state.updateEventInList(eventId, { isFavorited: true });
          });

        } catch (error) {
          throw error;
        }
      },

      unfavoriteEvent: async (eventId: string) => {
        try {
          await userApi.social.favorites.remove.mutate({ eventId });

          set((state) => {
            state.updateEventInList(eventId, { isFavorited: false });
          });

        } catch (error) {
          throw error;
        }
      },

      setFilters: (filters: Partial<EventFilters>) => set((state) => {
        state.filters = { ...state.filters, ...filters };
        state.pagination.page = 1;
      }),

      clearFilters: () => set((state) => {
        state.filters = {
          category: '',
          city: '',
          state: '',
          dateFrom: null,
          dateTo: null,
          search: '',
          featured: false,
          sortBy: 'date',
          sortOrder: 'asc',
        };
        state.pagination.page = 1;
      }),

      setPage: (page: number) => set((state) => {
        state.pagination.page = page;
      }),

      // Internal actions
      setCurrentEvent: (event: Event | null) => set((state) => {
        state.currentEvent = event;
      }),

      updateEventInList: (eventId: string, updates: Partial<Event>) => set((state) => {
        const updateEvent = (events: Event[]) =>
          events.map(event =>
            event.id === eventId ? { ...event, ...updates } : event
          );

        state.events = updateEvent(state.events);
        state.featuredEvents = updateEvent(state.featuredEvents);
        state.userEvents = updateEvent(state.userEvents);
      }),

      removeEventFromList: (eventId: string) => set((state) => {
        state.events = state.events.filter(e => e.id !== eventId);
        state.featuredEvents = state.featuredEvents.filter(e => e.id !== eventId);
        state.userEvents = state.userEvents.filter(e => e.id !== eventId);
      }),

      clearError: () => set((state) => {
        state.error = null;
        state.eventError = null;
      }),

      reset: () => set((state) => {
        state.currentEvent = null;
        state.events = [];
        state.featuredEvents = [];
        state.userEvents = [];
        state.isLoading = false;
        state.isLoadingEvent = false;
        state.isLoadingFeatured = false;
        state.error = null;
        state.eventError = null;
        state.pagination = {
          page: 1,
          limit: 20,
          total: 0,
          hasMore: false,
        };
      }),
    })),
    { name: 'EventStore' }
  )
);

// Event selectors
export const useEventSelectors = () => {
  const store = useEventStore();

  return {
    upcomingEvents: store.events.filter(e => new Date(e.startDate) > new Date()),
    pastEvents: store.events.filter(e => new Date(e.startDate) <= new Date()),
    publishedEvents: store.events.filter(e => e.status === 'PUBLISHED'),
    hasActiveFilters: Object.values(store.filters).some(v => v && v !== '' && v !== false),
    totalPages: Math.ceil(store.pagination.total / store.pagination.limit),
  };
};
```

---

## Checkout & Payment Stores

### Cart Store

```typescript
// stores/checkout/cart-store.ts
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { CartItem, DiscountCode } from '@/types/checkout';

interface CartState {
  // Cart data
  items: CartItem[];
  eventId: string | null;

  // Pricing
  subtotal: number;
  fees: number;
  taxes: number;
  discount: number;
  total: number;

  // Discount
  discountCode: DiscountCode | null;

  // State
  isLoading: boolean;
  error: string | null;

  // Session
  sessionId: string;
  expiresAt: Date | null;

  // Actions
  addTickets: (tickets: AddTicketData[]) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  selectSeat: (itemId: string, seatId: string) => void;

  // Discount
  applyDiscount: (code: string) => Promise<void>;
  removeDiscount: () => void;

  // Validation
  validateCart: () => Promise<boolean>;

  // Sync
  syncWithServer: () => Promise<void>;

  // Clear
  clear: () => void;

  // Internal
  calculateTotals: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useCartStore = create<CartState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        items: [],
        eventId: null,
        subtotal: 0,
        fees: 0,
        taxes: 0,
        discount: 0,
        total: 0,
        discountCode: null,
        isLoading: false,
        error: null,
        sessionId: '',
        expiresAt: null,

        // Actions
        addTickets: (tickets: AddTicketData[]) => set((state) => {
          const eventId = tickets[0]?.eventId;

          // Clear cart if switching events
          if (state.eventId && state.eventId !== eventId) {
            state.items = [];
            state.discountCode = null;
          }

          state.eventId = eventId;

          tickets.forEach(ticket => {
            const existingItem = state.items.find(
              item => item.ticketTypeId === ticket.ticketTypeId
            );

            if (existingItem) {
              existingItem.quantity += ticket.quantity;
            } else {
              state.items.push({
                id: generateId(),
                ticketTypeId: ticket.ticketTypeId,
                ticketTypeName: ticket.ticketTypeName,
                price: ticket.price,
                quantity: ticket.quantity,
                seats: [],
                requiresSeat: ticket.requiresSeat,
              });
            }
          });

          state.calculateTotals();
          state.error = null;
        }),

        removeItem: (itemId: string) => set((state) => {
          state.items = state.items.filter(item => item.id !== itemId);
          state.calculateTotals();

          if (state.items.length === 0) {
            state.eventId = null;
            state.discountCode = null;
          }
        }),

        updateQuantity: (itemId: string, quantity: number) => set((state) => {
          const item = state.items.find(item => item.id === itemId);

          if (item) {
            if (quantity <= 0) {
              state.items = state.items.filter(item => item.id !== itemId);
            } else {
              item.quantity = quantity;

              // Adjust seats if reducing quantity
              if (item.seats.length > quantity) {
                item.seats = item.seats.slice(0, quantity);
              }
            }

            state.calculateTotals();
          }
        }),

        selectSeat: (itemId: string, seatId: string) => set((state) => {
          const item = state.items.find(item => item.id === itemId);

          if (item && item.requiresSeat) {
            if (!item.seats.includes(seatId)) {
              if (item.seats.length < item.quantity) {
                item.seats.push(seatId);
              } else {
                // Replace oldest seat selection
                item.seats.shift();
                item.seats.push(seatId);
              }
            }
          }
        }),

        applyDiscount: async (code: string) => {
          if (!get().eventId || !get().items.length) {
            throw new Error('Cart is empty');
          }

          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const discountResult = await paymentApi.validateDiscount.mutate({
              eventId: get().eventId!,
              code,
              orderTotal: get().subtotal,
            });

            set((state) => {
              state.discountCode = discountResult;
              state.isLoading = false;
              state.calculateTotals();
            });

          } catch (error) {
            set((state) => {
              state.error = error.message;
              state.isLoading = false;
            });
            throw error;
          }
        },

        removeDiscount: () => set((state) => {
          state.discountCode = null;
          state.calculateTotals();
        }),

        validateCart: async () => {
          if (!get().eventId || !get().items.length) {
            return false;
          }

          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            // Check ticket availability
            const availability = await eventApi.public.events.getAvailability.query({
              eventId: get().eventId!,
            });

            let isValid = true;

            set((state) => {
              state.items = state.items.filter(item => {
                const ticketType = availability.ticketTypes.find(
                  tt => tt.id === item.ticketTypeId
                );

                if (!ticketType || ticketType.available < item.quantity) {
                  isValid = false;
                  return false;
                }

                return true;
              });

              state.isLoading = false;

              if (!isValid) {
                state.error = 'Some tickets are no longer available';
                state.calculateTotals();
              }
            });

            return isValid;

          } catch (error) {
            set((state) => {
              state.error = error.message;
              state.isLoading = false;
            });
            return false;
          }
        },

        syncWithServer: async () => {
          const { isAuthenticated } = useAuthStore.getState();
          if (!isAuthenticated || !get().items.length) return;

          try {
            // Sync cart with server for authenticated users
            await userApi.cart.sync.mutate({
              items: get().items,
              discountCode: get().discountCode?.code,
            });

          } catch (error) {
            console.error('Cart sync failed:', error);
          }
        },

        clear: () => set((state) => {
          state.items = [];
          state.eventId = null;
          state.subtotal = 0;
          state.fees = 0;
          state.taxes = 0;
          state.discount = 0;
          state.total = 0;
          state.discountCode = null;
          state.error = null;
          state.sessionId = '';
          state.expiresAt = null;
        }),

        calculateTotals: () => set((state) => {
          state.subtotal = state.items.reduce(
            (sum, item) => sum + (item.price * item.quantity),
            0
          );

          // Calculate platform fee (flat $0.29 or $0.75 per ticket)
          const totalTickets = state.items.reduce((sum, item) => sum + item.quantity, 0);
          state.fees = totalTickets * 0.29; // Use prepaid rate

          // Calculate discount
          if (state.discountCode) {
            if (state.discountCode.isPercentage) {
              state.discount = state.subtotal * (state.discountCode.value / 100);
            } else {
              state.discount = Math.min(state.discountCode.value, state.subtotal);
            }
          } else {
            state.discount = 0;
          }

          // Calculate taxes (implement based on event location)
          state.taxes = 0; // Simplified for MVP

          state.total = state.subtotal + state.fees + state.taxes - state.discount;
        }),

        setLoading: (loading: boolean) => set((state) => {
          state.isLoading = loading;
        }),

        setError: (error: string | null) => set((state) => {
          state.error = error;
        }),
      })),
      {
        name: 'cart-storage',
        partialize: (state) => ({
          items: state.items,
          eventId: state.eventId,
          discountCode: state.discountCode,
          sessionId: state.sessionId,
          expiresAt: state.expiresAt,
        }),
      }
    ),
    { name: 'CartStore' }
  )
);

// Cart selectors
export const useCartSelectors = () => {
  const store = useCartStore();

  return {
    itemCount: store.items.reduce((sum, item) => sum + item.quantity, 0),
    ticketCount: store.items.reduce((sum, item) => sum + item.quantity, 0),
    isEmpty: store.items.length === 0,
    hasSeatedTickets: store.items.some(item => item.requiresSeat),
    allSeatsSelected: store.items.every(item =>
      !item.requiresSeat || item.seats.length === item.quantity
    ),
    canCheckout: store.items.length > 0 &&
                 store.items.every(item =>
                   !item.requiresSeat || item.seats.length === item.quantity
                 ),
  };
};
```

---

## Real-time Stores

### Seat Selection Store

```typescript
// stores/real-time/seat-selection-store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Seat, SeatUpdate } from '@/types/seating';

interface SeatSelectionState {
  // Event context
  eventId: string | null;
  seatingChartId: string | null;

  // Seat data
  seats: Record<string, Seat>;
  sections: Record<string, Section>;

  // Selection state
  selectedSeats: string[];
  reservedSeats: string[];
  unavailableSeats: string[];

  // UI state
  isLoading: boolean;
  error: string | null;
  highlightedSection: string | null;

  // Session
  sessionId: string;
  reservationExpiry: Date | null;

  // Actions
  loadSeatingChart: (eventId: string, seatingChartId: string) => Promise<void>;
  selectSeat: (seatId: string) => void;
  deselectSeat: (seatId: string) => void;
  clearSelection: () => void;
  reserveSeats: (seatIds: string[]) => Promise<void>;
  releaseReservation: () => Promise<void>;

  // Real-time updates
  handleSeatUpdate: (update: SeatUpdate) => void;
  subscribeToUpdates: () => () => void;

  // UI actions
  highlightSection: (sectionId: string | null) => void;

  // Internal
  setSeat: (seatId: string, updates: Partial<Seat>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useSeatSelectionStore = create<SeatSelectionState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      eventId: null,
      seatingChartId: null,
      seats: {},
      sections: {},
      selectedSeats: [],
      reservedSeats: [],
      unavailableSeats: [],
      isLoading: false,
      error: null,
      highlightedSection: null,
      sessionId: generateSessionId(),
      reservationExpiry: null,

      // Actions
      loadSeatingChart: async (eventId: string, seatingChartId: string) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
          state.eventId = eventId;
          state.seatingChartId = seatingChartId;
        });

        try {
          const { seats, sections, unavailableSeats } = await eventApi.seating.getChart.query({
            eventId,
            seatingChartId,
          });

          set((state) => {
            state.seats = seats.reduce((acc, seat) => {
              acc[seat.id] = seat;
              return acc;
            }, {} as Record<string, Seat>);

            state.sections = sections.reduce((acc, section) => {
              acc[section.id] = section;
              return acc;
            }, {} as Record<string, Section>);

            state.unavailableSeats = unavailableSeats;
            state.isLoading = false;
          });

          // Subscribe to real-time updates
          get().subscribeToUpdates();

        } catch (error) {
          set((state) => {
            state.error = error.message;
            state.isLoading = false;
          });
          throw error;
        }
      },

      selectSeat: (seatId: string) => set((state) => {
        const seat = state.seats[seatId];

        if (!seat || state.unavailableSeats.includes(seatId)) {
          return;
        }

        if (!state.selectedSeats.includes(seatId)) {
          state.selectedSeats.push(seatId);

          // Update cart store
          const cartStore = useCartStore.getState();
          const seatedItems = cartStore.items.filter(item => item.requiresSeat);

          if (seatedItems.length > 0) {
            const item = seatedItems[0]; // Assume single seated ticket type for simplicity
            cartStore.selectSeat(item.id, seatId);
          }
        }
      }),

      deselectSeat: (seatId: string) => set((state) => {
        state.selectedSeats = state.selectedSeats.filter(id => id !== seatId);
      }),

      clearSelection: () => set((state) => {
        state.selectedSeats = [];
      }),

      reserveSeats: async (seatIds: string[]) => {
        if (!get().eventId) return;

        try {
          const result = await paymentApi.reserveSeats.mutate({
            eventId: get().eventId!,
            seatIds,
            sessionId: get().sessionId,
          });

          set((state) => {
            state.reservedSeats = seatIds;
            state.reservationExpiry = new Date(result.expiresAt);
          });

          // Set up auto-release timer
          const expiryMs = result.expiresAt - Date.now();
          setTimeout(() => {
            get().releaseReservation();
          }, expiryMs);

        } catch (error) {
          set((state) => {
            state.error = error.message;
          });
          throw error;
        }
      },

      releaseReservation: async () => {
        if (!get().reservedSeats.length) return;

        try {
          await paymentApi.releaseSeats.mutate({
            sessionId: get().sessionId,
          });

          set((state) => {
            state.reservedSeats = [];
            state.reservationExpiry = null;
          });

        } catch (error) {
          console.error('Failed to release reservation:', error);
        }
      },

      handleSeatUpdate: (update: SeatUpdate) => set((state) => {
        if (update.eventId !== state.eventId) return;

        switch (update.type) {
          case 'selected':
            if (!state.unavailableSeats.includes(update.seatId)) {
              state.unavailableSeats.push(update.seatId);
            }
            break;

          case 'released':
            state.unavailableSeats = state.unavailableSeats.filter(
              id => id !== update.seatId
            );
            break;

          case 'purchased':
            if (!state.unavailableSeats.includes(update.seatId)) {
              state.unavailableSeats.push(update.seatId);
            }
            break;
        }
      }),

      subscribeToUpdates: () => {
        if (!get().eventId) return () => {};

        const unsubscribe = realtimeApi.seatUpdates.subscribe(
          { eventId: get().eventId! },
          {
            onData: (update) => {
              get().handleSeatUpdate(update);
            },
            onError: (error) => {
              console.error('Seat update subscription error:', error);
            },
          }
        );

        return unsubscribe;
      },

      highlightSection: (sectionId: string | null) => set((state) => {
        state.highlightedSection = sectionId;
      }),

      // Internal actions
      setSeat: (seatId: string, updates: Partial<Seat>) => set((state) => {
        if (state.seats[seatId]) {
          Object.assign(state.seats[seatId], updates);
        }
      }),

      setLoading: (loading: boolean) => set((state) => {
        state.isLoading = loading;
      }),

      setError: (error: string | null) => set((state) => {
        state.error = error;
      }),

      reset: () => set((state) => {
        state.eventId = null;
        state.seatingChartId = null;
        state.seats = {};
        state.sections = {};
        state.selectedSeats = [];
        state.reservedSeats = [];
        state.unavailableSeats = [];
        state.highlightedSection = null;
        state.reservationExpiry = null;
        state.error = null;
      }),
    })),
    { name: 'SeatSelectionStore' }
  )
);

// Seat selection selectors
export const useSeatSelectionSelectors = () => {
  const store = useSeatSelectionStore();

  return {
    availableSeats: Object.values(store.seats).filter(
      seat => !store.unavailableSeats.includes(seat.id)
    ),
    selectedSeatCount: store.selectedSeats.length,
    isValidSelection: store.selectedSeats.length > 0,
    reservationTimeLeft: store.reservationExpiry
      ? Math.max(0, store.reservationExpiry.getTime() - Date.now())
      : 0,
    hasActiveReservation: store.reservedSeats.length > 0 &&
                         store.reservationExpiry &&
                         store.reservationExpiry > new Date(),
  };
};
```

---

## UI State Stores

### Theme Store

```typescript
// stores/ui/theme-store.ts
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  devtools(
    persist(
      (set, get) => ({
        theme: 'system',
        resolvedTheme: 'light',

        setTheme: (theme: Theme) => {
          set({ theme });

          // Update resolved theme
          const resolvedTheme = theme === 'system'
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : theme;

          set({ resolvedTheme });

          // Update document class
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(resolvedTheme);
        },

        toggleTheme: () => {
          const currentTheme = get().theme;
          const newTheme = currentTheme === 'light' ? 'dark' : 'light';
          get().setTheme(newTheme);
        },
      }),
      {
        name: 'theme-storage',
        partialize: (state) => ({ theme: state.theme }),
      }
    ),
    { name: 'ThemeStore' }
  )
);

// Initialize theme on load
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const updateSystemTheme = () => {
    const { theme, setTheme } = useThemeStore.getState();
    if (theme === 'system') {
      setTheme('system'); // Triggers re-evaluation
    }
  };

  mediaQuery.addEventListener('change', updateSystemTheme);
}
```

---

## Store Composition & Setup

### Store Index

```typescript
// stores/index.ts

// Re-export all stores
export { useAuthStore, useAuthSelectors } from './auth/auth-store';
export { useEventStore, useEventSelectors } from './events/event-store';
export { useCartStore, useCartSelectors } from './checkout/cart-store';
export { useSeatSelectionStore, useSeatSelectionSelectors } from './real-time/seat-selection-store';
export { useThemeStore } from './ui/theme-store';

// Store initialization
export const initializeStores = () => {
  // Initialize theme
  const themeStore = useThemeStore.getState();
  themeStore.setTheme(themeStore.theme);

  // Initialize auth state
  const authStore = useAuthStore.getState();
  if (authStore.isAuthenticated) {
    // Restore authenticated user state
    authStore.fetchUserProfile?.();
  }

  // Initialize other stores as needed
};

// Store reset for testing
export const resetAllStores = () => {
  useAuthStore.getState().reset?.();
  useEventStore.getState().reset();
  useCartStore.getState().clear();
  useSeatSelectionStore.getState().reset();
};

// Store subscriptions for debugging
if (process.env.NODE_ENV === 'development') {
  // Subscribe to store changes for debugging
  useAuthStore.subscribe(
    (state) => state.user,
    (user) => console.log('User changed:', user)
  );

  useCartStore.subscribe(
    (state) => state.items,
    (items) => console.log('Cart items changed:', items)
  );
}
```

### Store Middleware

```typescript
// stores/middleware.ts
import type { StateCreator } from 'zustand';

// Logging middleware
export const loggerMiddleware = <T>(
  f: StateCreator<T>,
  name: string
): StateCreator<T> => (set, get, api) =>
  f(
    (args) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${name}] Previous state:`, get());
        console.log(`[${name}] Applying:`, args);
      }

      set(args);

      if (process.env.NODE_ENV === 'development') {
        console.log(`[${name}] New state:`, get());
      }
    },
    get,
    api
  );

// Error boundary middleware
export const errorBoundaryMiddleware = <T>(
  f: StateCreator<T>
): StateCreator<T> => (set, get, api) =>
  f(
    (args) => {
      try {
        set(args);
      } catch (error) {
        console.error('Store update error:', error);
        // Could integrate with error tracking service
      }
    },
    get,
    api
  );

// Optimistic update middleware
export const optimisticMiddleware = <T>(
  f: StateCreator<T>
): StateCreator<T> => (set, get, api) => {
  const originalSet = set;

  return f(
    (args) => {
      // Store previous state for rollback
      const previousState = get();

      // Apply optimistic update
      originalSet(args);

      // Return rollback function
      return () => originalSet(previousState);
    },
    get,
    api
  );
};
```

This comprehensive state management architecture provides:

1. **Type-safe stores** with full TypeScript integration
2. **Persistent state** for authentication, cart, and preferences
3. **Real-time synchronization** for seat selection and live updates
4. **Optimistic updates** for better user experience
5. **Error handling** and recovery mechanisms
6. **Performance optimization** with selective subscriptions
7. **Development tools** for debugging and testing

The architecture is designed to scale with the application while maintaining clean separation of concerns and excellent developer experience.