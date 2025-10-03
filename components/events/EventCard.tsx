'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  ArrowRight,
  Image as ImageIcon
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

type ViewType = 'masonry' | 'grid' | 'list';

interface EventCardProps {
  event: EventData;
  viewType?: ViewType;
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'workshop':
      return 'bg-purple-100 text-purple-800';
    case 'sets':
      return 'bg-blue-100 text-blue-800';
    case 'in_the_park':
      return 'bg-green-100 text-green-800';
    case 'trip':
      return 'bg-yellow-100 text-yellow-800';
    case 'cruise':
      return 'bg-cyan-100 text-cyan-800';
    case 'holiday':
      return 'bg-red-100 text-red-800';
    case 'competition':
      return 'bg-orange-100 text-orange-800';
    case 'classes':
      return 'bg-indigo-100 text-indigo-800';
    case 'other':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export function EventCard({ event, viewType = 'grid' }: EventCardProps) {
  const ticketsRemaining = event.capacity - event.ticketsSold;
  const minPrice = event.ticketTypes.length > 0
    ? event.ticketTypes.some(t => Number(t.price) === 0)
      ? 'Free'
      : `From $${Math.min(...event.ticketTypes.map(t => Number(t.price))).toFixed(2)}`
    : 'Free';

  // List View
  if (viewType === 'list') {
    return (
      <Card className="hover:shadow-lg transition-shadow overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Event Image - Always show */}
          <div className="w-full md:w-64 h-48 md:h-auto overflow-hidden bg-gray-100 flex-shrink-0">
            {event.coverImage ? (
              <img
                src={event.coverImage}
                alt={event.title}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <ImageIcon className="w-16 h-16 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex-1 flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{event.title}</CardTitle>
                  <p className="text-sm text-gray-600">
                    by {event.organizer.firstName} {event.organizer.lastName}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant="outline" className={getCategoryColor(event.category)}>
                      {event.category}
                    </Badge>
                    {ticketsRemaining <= 10 && ticketsRemaining > 0 && (
                      <Badge className="bg-red-100 text-red-800">
                        Only {ticketsRemaining} left!
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{minPrice}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 flex-1 flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <div>
                    <div>{new Date(event.startDate).toLocaleDateString()}</div>
                    <div className="text-xs">{new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{event.venue.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span>{event.ticketsSold} / {event.capacity} attending</span>
                </div>
              </div>
              {event.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">{event.description}</p>
              )}
              <div className="mt-auto">
                <Button asChild className="w-full md:w-auto">
                  <Link href={`/events/${event.id}`}>
                    View Details & Buy Tickets
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </div>
        </div>
      </Card>
    );
  }

  // Masonry View - Image only (info is on the image)
  if (viewType === 'masonry') {
    return (
      <Link href={`/events/${event.id}`} className="block group">
        <div className="relative overflow-hidden rounded-lg hover:shadow-xl transition-shadow">
          {event.coverImage ? (
            <img
              src={event.coverImage}
              alt={event.title}
              className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full aspect-video flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <ImageIcon className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>
      </Link>
    );
  }

  // Grid View - Full card with details
  return (
    <Card className="hover:shadow-lg transition-shadow overflow-hidden h-full flex flex-col">
      {/* Event Image - Always show */}
      <div className="aspect-video w-full overflow-hidden bg-gray-100">
        {event.coverImage ? (
          <img
            src={event.coverImage}
            alt={event.title}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <ImageIcon className="w-12 h-12 text-gray-400" />
          </div>
        )}
      </div>
      <CardHeader className="flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              by {event.organizer.firstName} {event.organizer.lastName}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className={getCategoryColor(event.category)}>
                {event.category}
              </Badge>
              {ticketsRemaining <= 10 && ticketsRemaining > 0 && (
                <Badge className="bg-red-100 text-red-800">
                  Only {ticketsRemaining} left!
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
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
            <span className="font-medium text-green-600">{minPrice}</span>
          </div>
        </div>

        {event.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
        )}

        <div className="pt-2 mt-auto">
          <Button asChild className="w-full">
            <Link href={`/events/${event.id}`}>
              View Details & Buy Tickets
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
