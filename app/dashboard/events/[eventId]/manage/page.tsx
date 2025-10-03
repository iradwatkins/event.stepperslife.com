'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  MapPin,
  BarChart3,
  Download,
  Mail,
  CheckCircle,
  Clock,
  AlertCircle,
  Settings,
  Share2,
  Eye,
  Edit,
  QrCode,
  XCircle
} from 'lucide-react';
import CancelEventDialog from '@/components/events/CancelEventDialog';
import ShareEventButton from '@/components/events/ShareEventButton';
import { PublishEventDialog } from '@/components/events/PublishEventDialog';

interface TicketType {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sold: number;
}

interface Order {
  id: string;
  orderNumber: string;
  buyerName: string;
  buyerEmail: string;
  total: number;
  status: string;
  ticketCount: number;
  createdAt: string;
}

interface EventData {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImage?: string | null;
  startDate: string;
  endDate: string;
  status: string;
  maxCapacity?: number;
  venue: {
    name: string;
    address: string;
  };
  organizer: {
    firstName: string;
    lastName: string;
    email: string;
  };
  ticketTypes: TicketType[];
  _count: {
    tickets: number;
    orders: number;
  };
}

interface DashboardStats {
  totalRevenue: number;
  ticketsSold: number;
  totalCapacity: number;
  ordersCount: number;
  checkInRate: number;
  averageOrderValue: number;
}

export default function EventManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/login');
      return;
    }

    fetchEventData();
  }, [session, status, eventId]);

  const fetchEventData = async () => {
    try {
      setLoading(true);

      // Fetch event details
      const eventResponse = await fetch(`/api/events/${eventId}`);
      const eventResult = await eventResponse.json();

      if (!eventResponse.ok) {
        throw new Error(eventResult.error || 'Failed to fetch event');
      }

      setEvent(eventResult.event);

      // Calculate stats from event data
      const event = eventResult.event;
      const totalRevenue = event.ticketTypes.reduce((sum: number, tt: TicketType) =>
        sum + (tt.price * tt.sold), 0);
      const ticketsSold = event.ticketTypes.reduce((sum: number, tt: TicketType) =>
        sum + tt.sold, 0);
      const totalCapacity = event.maxCapacity || event.ticketTypes.reduce((sum: number, tt: TicketType) =>
        sum + tt.quantity, 0);

      // Fetch check-in statistics
      let checkInRate = 0;
      try {
        const checkinResponse = await fetch(`/api/events/${eventId}/checkin`);
        if (checkinResponse.ok) {
          const checkinResult = await checkinResponse.json();
          checkInRate = checkinResult.stats?.checkInRate || 0;
        }
      } catch (checkinError) {
        console.error('Failed to fetch check-in stats:', checkinError);
        // Continue with checkInRate = 0
      }

      setStats({
        totalRevenue,
        ticketsSold,
        totalCapacity,
        ordersCount: event._count?.orders || 0,
        checkInRate,
        averageOrderValue: event._count?.orders > 0 ? totalRevenue / event._count.orders : 0
      });

      // Mock orders data - in production, fetch from orders API
      setOrders([
        {
          id: '1',
          orderNumber: 'ORD-2024-001',
          buyerName: 'John Doe',
          buyerEmail: 'john@example.com',
          total: 50.00,
          status: 'COMPLETED',
          ticketCount: 2,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          orderNumber: 'ORD-2024-002',
          buyerName: 'Jane Smith',
          buyerEmail: 'jane@example.com',
          total: 25.00,
          status: 'COMPLETED',
          ticketCount: 1,
          createdAt: new Date().toISOString()
        }
      ]);

    } catch (error) {
      console.error('Error fetching event data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load event data');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 py-4">
              <Button variant="ghost" asChild>
                <Link href="/dashboard/events">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Events
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Event Not Found</h1>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Event</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button asChild>
                <Link href="/dashboard/events">Return to Events</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
      case 'LIVE':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/dashboard/events">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Events
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getStatusColor(event.status)}>
                    {event.status}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {new Date(event.startDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <ShareEventButton
                eventId={event.id}
                eventName={event.name}
                eventDescription={event.description}
                eventImage={event.coverImage}
                eventDate={event.startDate}
                eventUrl={`/events/${event.slug}`}
              />
              <Button variant="outline" size="sm" asChild>
                <Link href={`/events/${event.slug}`}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href={`/dashboard/events/${event.id}/edit`}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Event
                </Link>
              </Button>
              {event.status === 'DRAFT' && (
                <Button
                  size="sm"
                  onClick={() => setShowPublishDialog(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Publish Event
                </Button>
              )}
              {event.status !== 'CANCELLED' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowCancelDialog(true)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Event
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="attendees">Attendees</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats?.totalRevenue.toFixed(2) || '0.00'}</div>
                  <p className="text-xs text-muted-foreground">
                    Avg: ${stats?.averageOrderValue.toFixed(2) || '0.00'} per order
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.ticketsSold || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.totalCapacity ?
                      `${((stats.ticketsSold / stats.totalCapacity) * 100).toFixed(1)}% of capacity` :
                      'No capacity limit'
                    }
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Orders</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.ordersCount || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Total completed orders
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Check-in Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.checkInRate.toFixed(1) || '0.0'}%</div>
                  <p className="text-xs text-muted-foreground">
                    Event attendance rate
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Event Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Event Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium">{new Date(event.startDate).toLocaleString()}</p>
                      {event.endDate && (
                        <p className="text-sm text-gray-600">
                          Ends: {new Date(event.endDate).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium">{event.venue.name}</p>
                      <p className="text-sm text-gray-600">{event.venue.address}</p>
                    </div>
                  </div>

                  {event.description && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Description</p>
                      <p className="text-gray-700">{event.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ticket Types */}
              <Card>
                <CardHeader>
                  <CardTitle>Ticket Sales Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {event.ticketTypes.map((ticketType) => (
                      <div key={ticketType.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{ticketType.name}</p>
                          <p className="text-sm text-gray-600">${ticketType.price.toFixed(2)} each</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{ticketType.sold} / {ticketType.quantity}</p>
                          <p className="text-sm text-gray-600">
                            ${(ticketType.price * ticketType.sold).toFixed(2)} revenue
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>Latest ticket purchases for your event</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-medium">{order.orderNumber}</p>
                            <p className="text-sm text-gray-600">{order.buyerName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="text-sm">{order.buyerEmail}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Tickets</p>
                            <p className="text-sm">{order.ticketCount}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">${order.total.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No orders yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendees" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Attendee Management</CardTitle>
                    <CardDescription>Manage check-ins and attendee communications</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <QrCode className="w-4 h-4 mr-2" />
                      QR Scanner
                    </Button>
                    <Button variant="outline" size="sm">
                      <Mail className="w-4 h-4 mr-2" />
                      Email All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Attendee management features coming soon</p>
                  <p className="text-sm">Check-in tracking, communication tools, and more</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Event Settings
                </CardTitle>
                <CardDescription>Configure your event preferences and options</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Settings className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Event settings panel coming soon</p>
                  <p className="text-sm">Edit details, manage visibility, configure notifications</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Publish Event Dialog */}
      <PublishEventDialog
        eventId={eventId}
        eventName={event.name}
        open={showPublishDialog}
        onOpenChange={setShowPublishDialog}
        onSuccess={() => {
          fetchEventData(); // Refresh event data to show updated status
        }}
      />

      {/* Cancel Event Dialog */}
      <CancelEventDialog
        eventId={eventId}
        eventName={event.name}
        ticketsSold={event._count?.tickets || 0}
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onSuccess={() => {
          setShowCancelDialog(false);
          fetchEventData(); // Refresh event data to show updated status
        }}
      />
    </div>
  );
}