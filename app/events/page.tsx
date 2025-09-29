'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Filter,
  ArrowRight
} from 'lucide-react';

interface EventData {
  id: string;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string | null;
  status: string;
  capacity: number;
  venue: {
    name: string;
    address: string;
  };
  organizer: {
    firstName: string;
    lastName: string;
  };
  ticketTypes: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    tier: string;
  }>;
  ticketsSold: number;
}

export default function PublicEventsPage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    fetchEvents();
  }, [searchTerm, filterCategory]);

  const fetchEvents = async () => {
    try {
      const params = new URLSearchParams();
      params.append('status', 'PUBLISHED'); // Only show published events
      if (searchTerm) params.append('search', searchTerm);
      if (filterCategory) params.append('category', filterCategory);

      const response = await fetch(`/api/events/public?${params}`);
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
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Stepperslife Events</h1>
              <p className="text-gray-600">Discover amazing stepping events in your community</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Find Your Perfect Event</CardTitle>
            <CardDescription>Search through our upcoming stepping events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search events by name, location, or organizer..."
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
                <option value="SOCIAL">Social Events</option>
                <option value="WORKSHOP">Workshops</option>
                <option value="COMPETITION">Competitions</option>
                <option value="CLASS">Classes</option>
                <option value="CRUISE">Cruises</option>
                <option value="TRIP">Trips</option>
              </select>
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
                {searchTerm || filterCategory
                  ? 'No events match your search criteria. Try adjusting your filters.'
                  : 'There are no published events at the moment. Check back soon!'}
              </p>
              <Button onClick={() => { setSearchTerm(''); setFilterCategory(''); }}>
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        by {event.organizer.firstName} {event.organizer.lastName}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={getCategoryColor(event.category)}>
                          {event.category}
                        </Badge>
                        {event.capacity - event.ticketsSold <= 10 && (
                          <Badge className="bg-red-100 text-red-800">
                            Only {event.capacity - event.ticketsSold} left!
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(event.startDate).toLocaleDateString()}</span>
                      <span>{new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{event.venue.name}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{event.ticketsSold} / {event.capacity} attending</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-600">
                        {event.ticketTypes.length > 0
                          ? event.ticketTypes.some(t => t.price === 0)
                            ? 'Free'
                            : `From $${Math.min(...event.ticketTypes.map(t => t.price)).toFixed(2)}`
                          : 'Free'
                        }
                      </span>
                    </div>
                  </div>

                  {event.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
                  )}

                  <div className="pt-2">
                    <Button asChild className="w-full">
                      <Link href={`/events/${event.id}`}>
                        View Details & Buy Tickets
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Call to Action */}
        {events.length > 0 && (
          <Card className="mt-12">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Want to Host Your Own Event?</h3>
              <p className="text-gray-600 mb-6">
                Join our community of event organizers and start hosting amazing stepping events.
              </p>
              <Button asChild size="lg">
                <Link href="/auth/register">
                  Become an Organizer
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}