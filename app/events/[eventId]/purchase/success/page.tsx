'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Download, Ticket, Calendar, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { Suspense } from 'react';

interface OrderDetails {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  fees: number;
  taxes: number;
  total: number;
  ticketCount: number;
  event: {
    id: string;
    name: string;
    startDate: string;
    venue?: {
      name: string;
      address: string;
    };
  };
  tickets: Array<{
    id: string;
    ticketNumber: string;
    type: string;
  }>;
}

function PurchaseSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError('No order ID provided');
      setLoading(false);
      return;
    }

    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) {
        throw new Error('Failed to load order details');
      }
      const data = await response.json();
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}/receipt`);
      if (!response.ok) throw new Error('Failed to download receipt');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${order?.orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Failed to download receipt. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading your order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'Unable to load order details'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-primary"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="bg-white rounded-lg shadow-xl p-8 mb-6 text-center">
          <div className="mb-6">
            <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto animate-bounce" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Your tickets have been confirmed
          </p>

          {/* Order Number */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-500 mb-1">Order Confirmation Number</p>
            <p className="text-2xl font-mono font-bold text-gray-900">
              {order.orderNumber}
            </p>
          </div>

          <div className="flex items-center justify-center text-sm text-gray-500">
            <Mail className="h-4 w-4 mr-2" />
            <span>Confirmation email sent to your inbox</span>
          </div>
        </div>

        {/* Event Details */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Details</h2>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Event</p>
              <p className="text-lg font-medium text-gray-900">{order.event.name}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Date & Time</p>
              <p className="text-lg font-medium text-gray-900">
                {new Date(order.event.startDate).toLocaleString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </p>
            </div>

            {order.event.venue && (
              <div>
                <p className="text-sm text-gray-500">Venue</p>
                <p className="text-lg font-medium text-gray-900">{order.event.venue.name}</p>
                <p className="text-sm text-gray-600">{order.event.venue.address}</p>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-gray-600">
              <span>Tickets ({order.ticketCount})</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            {order.fees > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Service Fees</span>
                <span>${order.fees.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Sales Tax</span>
              <span>${order.taxes.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between text-lg font-bold text-gray-900">
              <span>Total Paid</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <div className="flex items-start">
              <Ticket className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {order.ticketCount} {order.ticketCount === 1 ? 'Ticket' : 'Tickets'} Confirmed
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Your tickets are ready to use. You'll need to present them at the event entrance.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>

          <div className="grid gap-3">
            <button
              onClick={() => router.push(`/dashboard/events/${order.event.id}`)}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Ticket className="h-5 w-5" />
              View My Tickets
              <ArrowRight className="h-5 w-5" />
            </button>

            <button
              onClick={handleDownloadReceipt}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <Download className="h-5 w-5" />
              Download Receipt (PDF)
            </button>

            <button
              onClick={async () => {
                try {
                  const response = await fetch(`/api/orders/${orderId}/calendar`);
                  if (!response.ok) throw new Error('Failed to download calendar');

                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `event-${order?.orderNumber}.ics`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                } catch (err) {
                  alert('Failed to download calendar invite. Please try again.');
                }
              }}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <Calendar className="h-5 w-5" />
              Add to Calendar
            </button>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">What Happens Next?</h2>

          <ol className="space-y-3">
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                1
              </span>
              <div>
                <p className="font-medium text-gray-900">Check Your Email</p>
                <p className="text-sm text-gray-600">We've sent your tickets and receipt to your email address</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                2
              </span>
              <div>
                <p className="font-medium text-gray-900">Save Your Tickets</p>
                <p className="text-sm text-gray-600">Download or screenshot your QR code tickets for easy access</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                3
              </span>
              <div>
                <p className="font-medium text-gray-900">Arrive Early</p>
                <p className="text-sm text-gray-600">Present your ticket QR code at the entrance for quick check-in</p>
              </div>
            </li>
          </ol>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Need help? Contact us at{' '}
              <a href="mailto:support@events.stepperslife.com" className="text-primary hover:underline">
                support@events.stepperslife.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PurchaseSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    }>
      <PurchaseSuccessContent />
    </Suspense>
  );
}
