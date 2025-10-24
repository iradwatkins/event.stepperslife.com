"use client";

import Link from "next/link";
import { Calendar, MapPin, Ticket, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface ListViewProps {
  events: any[];
}

export function ListView({ events }: ListViewProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">No events found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <Link
          key={event._id}
          href={`/events/${event._id}`}
          className="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row">
            {/* Event Image */}
            <div className="sm:w-64 h-48 sm:h-auto bg-gray-200 flex-shrink-0">
              {event.imageUrl ? (
                <img
                  src={event.imageUrl}
                  alt={event.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                  <Calendar className="w-12 h-12 text-white opacity-50" />
                </div>
              )}
            </div>

            {/* Event Details */}
            <div className="flex-1 p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                    {event.name}
                  </h3>

                  {/* Event Type Badge */}
                  <span className="inline-block px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                    {event.eventType.replace("_", " ")}
                  </span>
                </div>

                <ChevronRight className="w-6 h-6 text-gray-400 ml-4 flex-shrink-0" />
              </div>

              {/* Description Preview */}
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {event.description}
              </p>

              {/* Meta Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>{format(new Date(event.startDate), "EEEE, MMMM d, yyyy 'at' h:mm a")}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {event.location.venueName && `${event.location.venueName}, `}
                    {event.location.city}, {event.location.state}
                  </span>
                </div>

                {event.ticketsVisible && (
                  <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                    <Ticket className="w-4 h-4" />
                    <span>Tickets Available</span>
                  </div>
                )}
              </div>

              {/* Categories */}
              {event.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {event.categories.slice(0, 3).map((category: string) => (
                    <span
                      key={category}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                    >
                      {category}
                    </span>
                  ))}
                  {event.categories.length > 3 && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                      +{event.categories.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
