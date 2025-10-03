'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EventCard } from '@/components/events/EventCard';
import { ViewToggle } from '@/components/events/ViewToggle';
import {
  Search,
  Calendar,
  Filter,
  ArrowRight
} from 'lucide-react';

type ViewType = 'masonry' | 'grid' | 'list';

interface EventData {
  id: string;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string | null;
  status: string;
  capacity: number;
  coverImage?: string;
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
  const [viewType, setViewType] = useState<ViewType>('masonry');

  // Load view preference from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem('eventsViewType') as ViewType;
    if (savedView && ['masonry', 'grid', 'list'].includes(savedView)) {
      setViewType(savedView);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [searchTerm, filterCategory]);

  const handleViewChange = (view: ViewType) => {
    setViewType(view);
    localStorage.setItem('eventsViewType', view);
  };

  const fetchEvents = async () => {
    try {
      const params = new URLSearchParams();
      // Show both PUBLISHED and DRAFT events so newly created events appear
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


  return (
    <div className="min-h-screen">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Stepperslife Events</h1>
            <p className="text-muted-foreground">Discover amazing stepping events in your community</p>
          </div>
          <ViewToggle currentView={viewType} onViewChange={handleViewChange} />
        </div>
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
                <option value="WORKSHOP">Workshop</option>
                <option value="SETS">Sets</option>
                <option value="IN_THE_PARK">In the Park</option>
                <option value="TRIP">Trip</option>
                <option value="CRUISE">Cruise</option>
                <option value="HOLIDAY">Holiday</option>
                <option value="COMPETITION">Competition</option>
                <option value="CLASSES">Classes</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="mt-4 text-center">
              <Button variant="outline" asChild>
                <Link href="/events/search">
                  <Filter className="w-4 h-4 mr-2" />
                  Advanced Search & Filters
                </Link>
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
        ) : viewType === 'list' ? (
          <div className="space-y-4">
            {events.map((event) => (
              <EventCard key={event.id} event={event} viewType="list" />
            ))}
          </div>
        ) : viewType === 'masonry' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="grid gap-4">
              {events.filter((_, i) => i % 4 === 0).map((event) => (
                <EventCard key={event.id} event={event} viewType="masonry" />
              ))}
            </div>
            <div className="grid gap-4">
              {events.filter((_, i) => i % 4 === 1).map((event) => (
                <EventCard key={event.id} event={event} viewType="masonry" />
              ))}
            </div>
            <div className="grid gap-4">
              {events.filter((_, i) => i % 4 === 2).map((event) => (
                <EventCard key={event.id} event={event} viewType="masonry" />
              ))}
            </div>
            <div className="grid gap-4">
              {events.filter((_, i) => i % 4 === 3).map((event) => (
                <EventCard key={event.id} event={event} viewType="masonry" />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} viewType="grid" />
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
                <Link href="/auth/login">
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