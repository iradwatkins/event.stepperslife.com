'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/ui/image-upload';
import {
  ArrowLeft, Calendar, MapPin, Clock, DollarSign, Users,
  AlertCircle, Plus, Trash2, Save
} from 'lucide-react';

interface TicketType {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  salesStartDate?: string;
  salesEndDate?: string;
  earlyBirdPrice?: number;
  earlyBirdEndDate?: string;
}

interface EventData {
  id: string;
  name: string;
  description: string;
  eventType: string;
  startDate: string;
  endDate: string;
  coverImage?: string;
  maxCapacity: number;
  venue: {
    name: string;
    address: string;
  };
  ticketTypes: TicketType[];
}

export default function EditEventPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [coverImage, setCoverImage] = useState<string>('');
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);

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
      setCoverImage(result.event.coverImage || '');
      setTicketTypes(result.event.ticketTypes || []);
    } catch (error) {
      console.error('Error fetching event:', error);
      setError(error instanceof Error ? error.message : 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const addTicketType = () => {
    setTicketTypes([...ticketTypes, {
      name: '',
      price: 0,
      quantity: 50,
    }]);
  };

  const removeTicketType = (index: number) => {
    setTicketTypes(ticketTypes.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const formData = new FormData(e.target as HTMLFormElement);

      const updates = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        category: formData.get('category') as string,
        eventDate: formData.get('date') as string,
        startTime: formData.get('start-time') as string,
        endTime: formData.get('end-time') as string,
        coverImage: coverImage || null,
        venueName: formData.get('venue-name') as string,
        venueAddress: formData.get('address') as string,
        capacity: parseInt(formData.get('capacity') as string) || event?.maxCapacity || 100,
        ticketTypes: ticketTypes.map((tt, index) => ({
          id: tt.id,
          name: formData.get(`ticket-name-${index}`) as string,
          price: parseFloat(formData.get(`ticket-price-${index}`) as string),
          quantity: parseInt(formData.get(`ticket-quantity-${index}`) as string),
          salesStartDate: formData.get(`ticket-start-${index}`) as string || undefined,
          salesEndDate: formData.get(`ticket-end-${index}`) as string || undefined,
          earlyBirdPrice: formData.get(`ticket-earlybird-price-${index}`)
            ? parseFloat(formData.get(`ticket-earlybird-price-${index}`) as string)
            : undefined,
          earlyBirdEndDate: formData.get(`ticket-earlybird-end-${index}`) as string || undefined,
        }))
      };

      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update event');
      }

      alert('Event updated successfully!');
      router.push(`/dashboard/events/${eventId}/manage`);

    } catch (error) {
      console.error('Event update error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session || !event) {
    return null;
  }

  if (error && !event) {
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

  // Extract date and time from event dates
  const eventDate = new Date(event.startDate);
  const formattedDate = eventDate.toISOString().split('T')[0];
  const startTime = eventDate.toTimeString().slice(0, 5);
  const endDate = event.endDate ? new Date(event.endDate) : null;
  const endTime = endDate ? endDate.toTimeString().slice(0, 5) : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <Button variant="ghost" asChild>
              <Link href={`/dashboard/events/${eventId}/manage`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Event
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Event</h1>
              <p className="text-gray-600">{event.name}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Event Details
              </CardTitle>
              <CardDescription>
                Update basic information about your event
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={event.name}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    name="category"
                    defaultValue={event.eventType}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={event.description}
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Cover Image</Label>
                <div className="flex gap-6 items-start">
                  {/* Image Preview - Left Side */}
                  {coverImage && (
                    <div className="flex-shrink-0">
                      <img
                        src={coverImage}
                        alt="Event cover"
                        className="w-64 h-auto rounded-lg border-2 border-gray-200 shadow-sm object-cover"
                      />
                    </div>
                  )}

                  {/* Upload Component - Right Side */}
                  <div className="flex-1">
                    <ImageUpload
                      value={coverImage}
                      onChange={setCoverImage}
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date & Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                When
              </CardTitle>
              <CardDescription>
                Update event date and time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date">Event Date *</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    defaultValue={formattedDate}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time *</Label>
                  <Input
                    id="start-time"
                    name="start-time"
                    type="time"
                    defaultValue={startTime}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <Input
                    id="end-time"
                    name="end-time"
                    type="time"
                    defaultValue={endTime}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Venue Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Venue Information
              </CardTitle>
              <CardDescription>
                Update venue details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="venue-name">Venue Name *</Label>
                  <Input
                    id="venue-name"
                    name="venue-name"
                    defaultValue={event.venue.name}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    name="address"
                    defaultValue={event.venue.address}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Capacity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Capacity
              </CardTitle>
              <CardDescription>
                Set maximum event capacity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="capacity">Max Capacity *</Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  defaultValue={event.maxCapacity}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Ticket Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Ticket Types
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTicketType}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Ticket Type
                </Button>
              </CardTitle>
              <CardDescription>
                Manage ticket types, prices, and availability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {ticketTypes.map((ticket, index) => (
                <Card key={index} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">Ticket Type #{index + 1}</h4>
                      {ticketTypes.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTicketType(index)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`ticket-name-${index}`}>Name *</Label>
                        <Input
                          id={`ticket-name-${index}`}
                          name={`ticket-name-${index}`}
                          defaultValue={ticket.name}
                          placeholder="General Admission"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`ticket-price-${index}`}>Price *</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                          <Input
                            id={`ticket-price-${index}`}
                            name={`ticket-price-${index}`}
                            type="number"
                            step="0.01"
                            min="0"
                            className="pl-8"
                            defaultValue={ticket.price}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`ticket-quantity-${index}`}>Quantity *</Label>
                        <Input
                          id={`ticket-quantity-${index}`}
                          name={`ticket-quantity-${index}`}
                          type="number"
                          min="1"
                          defaultValue={ticket.quantity}
                          required
                        />
                      </div>
                    </div>

                    {/* Early Bird Pricing */}
                    <div className="border-t pt-4 mt-4">
                      <h5 className="text-sm font-medium mb-3 text-gray-700">Early Bird Pricing (Optional)</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`ticket-earlybird-price-${index}`}>Early Bird Price</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                            <Input
                              id={`ticket-earlybird-price-${index}`}
                              name={`ticket-earlybird-price-${index}`}
                              type="number"
                              step="0.01"
                              min="0"
                              className="pl-8"
                              defaultValue={ticket.earlyBirdPrice || ''}
                              placeholder="Optional"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`ticket-earlybird-end-${index}`}>Early Bird End Date</Label>
                          <Input
                            id={`ticket-earlybird-end-${index}`}
                            name={`ticket-earlybird-end-${index}`}
                            type="date"
                            defaultValue={ticket.earlyBirdEndDate ? new Date(ticket.earlyBirdEndDate).toISOString().split('T')[0] : ''}
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sales Period */}
                    <div className="border-t pt-4 mt-4">
                      <h5 className="text-sm font-medium mb-3 text-gray-700">Sales Period</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`ticket-start-${index}`}>Sales Start Date</Label>
                          <Input
                            id={`ticket-start-${index}`}
                            name={`ticket-start-${index}`}
                            type="date"
                            defaultValue={ticket.salesStartDate ? new Date(ticket.salesStartDate).toISOString().split('T')[0] : ''}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`ticket-end-${index}`}>Sales End Date</Label>
                          <Input
                            id={`ticket-end-${index}`}
                            name={`ticket-end-${index}`}
                            type="date"
                            defaultValue={ticket.salesEndDate ? new Date(ticket.salesEndDate).toISOString().split('T')[0] : ''}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {ticketTypes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-4">No ticket types defined</p>
                  <Button type="button" onClick={addTicketType}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Ticket Type
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" asChild>
              <Link href={`/dashboard/events/${eventId}/manage`}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save All Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
