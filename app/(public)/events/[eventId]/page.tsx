'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Clock,
  User,
  Mail,
  Phone,
  CreditCard,
  ShoppingCart,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import SquarePaymentForm from '@/components/payments/SquarePaymentForm';
import ShareEventButton from '@/components/events/ShareEventButton';

interface TicketType {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sold?: number;
  tier: string;
}

interface EventData {
  id: string;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
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
  ticketTypes: TicketType[];
  ticketsSold: number;
}

interface PurchaseForm {
  ticketTypeId: string;
  quantity: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
}

export default function PublicEventDetailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);

  const [purchaseForm, setPurchaseForm] = useState<PurchaseForm>({
    ticketTypeId: '',
    quantity: 1,
    buyerName: '',
    buyerEmail: '',
    buyerPhone: ''
  });

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  useEffect(() => {
    if (session?.user) {
      setPurchaseForm(prev => ({
        ...prev,
        buyerName: session.user.name || session.user.email,
        buyerEmail: session.user.email
      }));
    }
  }, [session]);

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/public?eventId=${eventId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch event');
      }

      if (result.events && result.events.length > 0) {
        const eventData = result.events[0];
        setEvent(eventData);

        // Set default ticket type
        if (eventData.ticketTypes.length > 0) {
          setPurchaseForm(prev => ({
            ...prev,
            ticketTypeId: eventData.ticketTypes[0].id
          }));
        }
      } else {
        throw new Error('Event not found');
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      setError(error instanceof Error ? error.message : 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) {
      router.push('/auth/login');
      return;
    }

    // Validate form
    if (!purchaseForm.ticketTypeId || !purchaseForm.buyerName || !purchaseForm.buyerEmail) {
      setError('Please fill in all required fields');
      return;
    }

    const selectedTicketType = event?.ticketTypes.find(t => t.id === purchaseForm.ticketTypeId);
    if (!selectedTicketType) {
      setError('Please select a valid ticket type');
      return;
    }

    const totalAmount = Number(selectedTicketType.price) * purchaseForm.quantity;

    // If it's a free event, process directly
    if (totalAmount === 0) {
      await processFreePurchase();
      return;
    }

    // Show payment form for paid events
    setShowPaymentForm(true);
    setError(null);
  };

  const processFreePurchase = async () => {
    setPurchasing(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...purchaseForm,
          sourceId: 'free-event',
          verificationToken: null
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to purchase tickets');
      }

      setPurchaseSuccess(true);
      fetchEvent();

    } catch (error) {
      console.error('Purchase error:', error);
      setError(error instanceof Error ? error.message : 'Failed to purchase tickets');
    } finally {
      setPurchasing(false);
    }
  };

  const handlePaymentSuccess = async (paymentResult: any) => {
    setPurchasing(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...purchaseForm,
          sourceId: paymentResult.sourceId,
          verificationToken: paymentResult.verificationToken
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to complete purchase');
      }

      setPurchaseSuccess(true);
      setShowPaymentForm(false);
      fetchEvent();

    } catch (error) {
      console.error('Purchase completion error:', error);
      setError(error instanceof Error ? error.message : 'Failed to complete purchase');
    } finally {
      setPurchasing(false);
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
    setPurchasing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 py-4">
              <Button variant="ghost" asChild>
                <Link href="/events">
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
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Event Not Found</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button asChild>
                <Link href="/events">Browse Other Events</Link>
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

  const selectedTicketType = event.ticketTypes.find(t => t.id === purchaseForm.ticketTypeId);
  const totalPrice = selectedTicketType ? Number(selectedTicketType.price) * purchaseForm.quantity : 0;

  // Calculate remaining tickets for selected ticket type
  const remainingForSelectedType = selectedTicketType
    ? selectedTicketType.quantity - (selectedTicketType.sold || 0)
    : 0;

  // Calculate total remaining tickets across all types
  const totalRemainingTickets = event.ticketTypes.reduce((sum, tt) =>
    sum + (tt.quantity - (tt.sold || 0)), 0
  );

  const remainingTickets = remainingForSelectedType;

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
                <Link href="/events">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Events
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={getCategoryColor(event.category)}>
                    {event.category}
                  </Badge>
                  {remainingTickets <= 10 && remainingTickets > 0 && (
                    <Badge className="bg-red-100 text-red-800">
                      Only {remainingTickets} tickets left!
                    </Badge>
                  )}
                  {remainingTickets === 0 && (
                    <Badge className="bg-red-100 text-red-800">
                      Sold Out
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <ShareEventButton
                eventId={event.id}
                eventName={event.title}
                eventDescription={event.description}
                eventImage={event.coverImage}
                eventDate={event.startDate}
                eventUrl={`/events/${eventId}`}
              />
              {!session && (
                <>
                  <Button variant="outline" asChild>
                    <Link href="/auth/login">Sign In</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/auth/login">Register</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Event Image & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Image */}
            {event.coverImage && (
              <div className="rounded-lg overflow-hidden shadow-lg bg-gray-100">
                <img
                  src={event.coverImage}
                  alt={event.title}
                  className="w-full h-auto object-contain max-h-[600px] mx-auto"
                />
              </div>
            )}

            {/* Event Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Event Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-medium">{new Date(event.startDate).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {event.endDate && ` - ${new Date(event.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-medium">{event.venue.name}</p>
                    <p className="text-sm text-gray-600">{event.venue.address}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-medium">{event.ticketsSold} / {event.capacity} attending</p>
                    <p className="text-sm text-gray-600">
                      Organized by {event.organizer.firstName} {event.organizer.lastName}
                    </p>
                  </div>
                </div>

                {event.description && (
                  <div className="pt-4">
                    <h3 className="font-medium mb-2">About this event</h3>
                    <p className="text-gray-700">{event.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Purchase Sidebar */}
          <div className="space-y-6">
            {purchaseSuccess ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    Purchase Successful!
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Your tickets have been purchased successfully. You should receive a confirmation email shortly.
                  </p>
                  <Button asChild className="w-full">
                    <Link href="/dashboard">View My Tickets</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Purchase Tickets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {remainingTickets === 0 ? (
                    <div className="text-center py-4">
                      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-2" />
                      <p className="text-red-600 font-medium">This event is sold out</p>
                    </div>
                  ) : !session ? (
                    <div className="text-center py-4">
                      <p className="text-gray-600 mb-4">Sign in to purchase tickets</p>
                      <div className="space-y-2">
                        <Button asChild className="w-full">
                          <Link href="/auth/login">Sign In</Link>
                        </Button>
                        <Button variant="outline" asChild className="w-full">
                          <Link href="/auth/login">Create Account</Link>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handlePurchase} className="space-y-4">
                      {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm text-red-600">{error}</p>
                        </div>
                      )}

                      {/* Ticket Type Selection */}
                      <div className="space-y-2">
                        <Label>Ticket Type</Label>
                        <select
                          value={purchaseForm.ticketTypeId}
                          onChange={(e) => setPurchaseForm(prev => ({ ...prev, ticketTypeId: e.target.value }))}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          required
                        >
                          {event.ticketTypes.map((ticket) => (
                            <option key={ticket.id} value={ticket.id}>
                              {ticket.name} - ${Number(ticket.price).toFixed(2)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <select
                          value={purchaseForm.quantity}
                          onChange={(e) => setPurchaseForm(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          required
                        >
                          {Array.from({ length: Math.min(10, remainingTickets) }, (_, i) => i + 1).map(num => (
                            <option key={num} value={num}>{num}</option>
                          ))}
                        </select>
                      </div>

                      {/* Buyer Information */}
                      <div className="space-y-4 pt-2 border-t">
                        <h4 className="font-medium flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Buyer Information
                        </h4>

                        <div className="space-y-2">
                          <Label htmlFor="buyerName">Full Name *</Label>
                          <Input
                            id="buyerName"
                            value={purchaseForm.buyerName}
                            onChange={(e) => setPurchaseForm(prev => ({ ...prev, buyerName: e.target.value }))}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="buyerEmail">Email *</Label>
                          <Input
                            id="buyerEmail"
                            type="email"
                            value={purchaseForm.buyerEmail}
                            onChange={(e) => setPurchaseForm(prev => ({ ...prev, buyerEmail: e.target.value }))}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="buyerPhone">Phone (optional)</Label>
                          <Input
                            id="buyerPhone"
                            type="tel"
                            value={purchaseForm.buyerPhone}
                            onChange={(e) => setPurchaseForm(prev => ({ ...prev, buyerPhone: e.target.value }))}
                          />
                        </div>
                      </div>

                      {/* Total */}
                      <div className="pt-4 border-t">
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>Total:</span>
                          <span>${totalPrice.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Purchase Button */}
                      {!showPaymentForm ? (
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={purchasing || !selectedTicketType}
                        >
                          {purchasing ? (
                            <>
                              <CreditCard className="w-4 h-4 mr-2 animate-pulse" />
                              Processing...
                            </>
                          ) : totalPrice === 0 ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Get Free Ticket{purchaseForm.quantity > 1 ? 's' : ''}
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4 mr-2" />
                              Continue to Payment
                            </>
                          )}
                        </Button>
                      ) : null}
                    </form>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Square Payment Form */}
            {showPaymentForm && (
              <SquarePaymentForm
                applicationId={process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || 'sandbox-sq0idb--uxRoNAlmWg3C6w3ppztCg'}
                locationId={process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || 'LZN634J2MSXRY'}
                amount={totalPrice}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
                disabled={purchasing}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}