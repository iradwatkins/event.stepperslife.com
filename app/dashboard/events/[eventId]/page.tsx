'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Users,
  Calendar,
  MapPin,
  DollarSign,
  Eye,
  Share,
  Settings,
  BarChart3,
  Ticket,
  Clock,
  ImageIcon
} from 'lucide-react';
import ShareEventButton from '@/components/events/ShareEventButton';

interface EventData {
  id: string;
  name: string; // Database uses 'name', not 'title'
  slug: string;
  description: string;
  eventType: string; // Database uses 'eventType', not 'category'
  startDate: string;
  endDate: string;
  status: string;
  maxCapacity: number; // Database uses 'maxCapacity', not 'capacity'
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

export default function EventDetailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/login');
      return;
    }

    fetchEvent();
  }, [session, status, eventId]);

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch event');
      }

      setEvent(result.event);
    } catch (error) {
      console.error('Error fetching event:', error);
      setError(error instanceof Error ? error.message : 'Failed to load event');
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 py-4">
              <Button variant="ghost" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
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
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Event Not Found</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button asChild>
                <Link href="/dashboard">Return to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!event) {
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
                <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getStatusColor(event.status)}>
                    {event.status}
                  </Badge>
                  <Badge variant="outline" className={getCategoryColor(event.eventType)}>
                    {event.eventType}
                  </Badge>
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
              <Button variant="outline" asChild>
                <Link href={`/dashboard/events/${event.id}/manage`}>
                  <Settings className="w-4 h-4 mr-2" />
                  Manage
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/events/${event.slug}`} target="_blank">
                  <Eye className="w-4 h-4 mr-2" />
                  View Public
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Image */}
          <div className="lg:col-span-4">
            {event.coverImage ? (
              <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 shadow-lg sticky top-8">
                <Image
                  src={event.coverImage}
                  alt={event.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  priority
                />
              </div>
            ) : (
              <div className="relative w-full aspect-[3/4] rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shadow-lg sticky top-8">
                <ImageIcon className="w-24 h-24 text-primary/40" />
              </div>
            )}
          </div>

          {/* Middle Column - Event Details */}
          <div className="lg:col-span-5 space-y-6">

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Event Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Start Date</p>
                      <p className="font-medium">{new Date(event.startDate).toLocaleString()}</p>
                    </div>
                  </div>
                  {event.endDate && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">End Date</p>
                        <p className="font-medium">{new Date(event.endDate).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Venue</p>
                    <p className="font-medium">{event.venue.name}</p>
                    <p className="text-sm text-gray-600">{event.venue.address}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Capacity</p>
                    <p className="font-medium">{event.maxCapacity} people</p>
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
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="w-5 h-5" />
                  Ticket Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {event.ticketTypes.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{ticket.name}</p>
                        <p className="text-sm text-gray-600">{ticket.tier} • {ticket.quantity} available</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">${Number(ticket.price).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tickets Sold</span>
                  <span className="font-bold text-lg">{event.ticketsSold}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Revenue</span>
                  <span className="font-bold text-lg">$0.00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Capacity</span>
                  <span className="font-medium">{event.maxCapacity}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Availability</span>
                  <span className="font-medium">{event.maxCapacity - event.ticketsSold} left</span>
                </div>
              </CardContent>
            </Card>

            {/* Organizer Info */}
            <Card>
              <CardHeader>
                <CardTitle>Organizer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-semibold text-sm">
                      {event.organizer.firstName[0]}{event.organizer.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">
                      {event.organizer.firstName} {event.organizer.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{event.organizer.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" variant="outline" asChild>
                  <Link href={`/dashboard/events/${event.id}/manage`}>
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Event
                  </Link>
                </Button>
                <Button className="w-full" variant="outline" asChild>
                  <Link href={`/dashboard/events/${event.id}/analytics`}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Analytics
                  </Link>
                </Button>
                <Button className="w-full" variant="outline" asChild>
                  <Link href={`/dashboard/events/${event.id}/checkin`}>
                    <Users className="w-4 h-4 mr-2" />
                    Check-in
                  </Link>
                </Button>
                <Button className="w-full" variant="outline" asChild>
                  <Link href={`/events/${event.slug}`} target="_blank">
                    <Eye className="w-4 h-4 mr-2" />
                    View Public Page
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}