'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Plus,
  Search,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  Filter,
  ImageIcon
} from 'lucide-react';

interface EventData {
  id: string;
  name: string; // Database field is 'name', not 'title'
  description: string;
  eventType: string; // Database field is 'eventType', not 'category'
  startDate: string;
  endDate: string | null;
  status: string;
  maxCapacity: number; // Database field is 'maxCapacity', not 'capacity'
  visibility: string;
  coverImage?: string | null;
  venue: {
    name: string;
    address: string;
  };
  organizer: {
    firstName: string;
    lastName: string;
    email: string;
  };
  ticketTypes: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    tier?: string;
  }>;
  ticketsSold: number;
}

export default function EventsListPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/login');
      return;
    }

    // Only organizers and admins can access this page
    // Attendees should create their first event to become organizers
    if (session.user.role === 'ATTENDEE') {
      router.push('/dashboard/tickets');
      return;
    }

    fetchEvents();
  }, [session, status, searchTerm, filterCategory, filterStatus, router]);

  const fetchEvents = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterCategory) params.append('category', filterCategory);
      if (filterStatus) params.append('status', filterStatus);

      const response = await fetch(`/api/events?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch events');
      }

      setEvents(result.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'SOCIAL':
        return 'bg-blue-100 text-blue-800';
      case 'WORKSHOP':
        return 'bg-purple-100 text-purple-800';
      case 'COMPETITION':
        return 'bg-orange-100 text-orange-800';
      case 'CLASS':
        return 'bg-green-100 text-green-800';
      case 'CRUISE':
        return 'bg-cyan-100 text-cyan-800';
      case 'TRIP':
        return 'bg-yellow-100 text-yellow-800';
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
                <Link href="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
                <p className="text-gray-600">Events I organize and manage</p>
              </div>
            </div>
            <Button asChild>
              <Link href="/dashboard/events/create">
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Find Events</CardTitle>
            <CardDescription>Search and filter your events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">All Categories</option>
                <option value="workshop">Workshop</option>
                <option value="sets">Sets</option>
                <option value="in_the_park">In the Park</option>
                <option value="trip">Trip</option>
                <option value="cruise">Cruise</option>
                <option value="holiday">Holiday</option>
                <option value="competition">Competition</option>
                <option value="classes">Classes</option>
                <option value="other">Other</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <Button variant="outline" onClick={fetchEvents}>
                <Filter className="w-4 h-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Events Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Events Found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterCategory || filterStatus
                  ? 'No events match your current filters.'
                  : 'You haven\'t created any events yet.'}
              </p>
              <Button asChild>
                <Link href="/dashboard/events/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Event
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {events.map((event) => (
              <div key={event.id} className="group">
                {/* Cover Image */}
                <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3 shadow-md hover:shadow-xl transition-shadow">
                  {event.coverImage ? (
                    <Image
                      src={event.coverImage}
                      alt={event.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <Calendar className="w-20 h-20 text-primary/40" />
                    </div>
                  )}

                  {/* Status Badge Overlay */}
                  <div className="absolute top-3 right-3">
                    <Badge className={getStatusColor(event.status)}>
                      {event.status}
                    </Badge>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mb-3">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link href={`/dashboard/events/${event.id}`}>
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Link>
                  </Button>
                  <Button variant="default" size="sm" asChild className="flex-1">
                    <Link href={`/dashboard/events/${event.id}/manage`}>
                      <Edit className="w-4 h-4 mr-1" />
                      Manage
                    </Link>
                  </Button>
                </div>

                {/* Event Date */}
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    {new Date(event.startDate).toLocaleDateString('en-US', {
                      month: '2-digit',
                      day: '2-digit',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {event.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}