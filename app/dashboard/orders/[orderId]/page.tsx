'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Download, Calendar, ArrowLeft, Ticket, MapPin, Clock, Mail, User, CreditCard, Loader2, Send, DollarSign } from 'lucide-react';
import RefundRequestDialog from '@/components/tickets/RefundRequestDialog';
import TransferTicketDialog from '@/components/tickets/TransferTicketDialog';

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
    qrCode: string;
    status: string;
    price: number;
  }>;
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
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

  const handleDownloadCalendar = async () => {
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
  };

  const handleTransferClick = (ticket: any) => {
    setSelectedTicket(ticket);
    setShowTransferDialog(true);
  };

  const handleRefundClick = (ticket: any) => {
    setSelectedTicket(ticket);
    setShowRefundDialog(true);
  };

  const handleDialogSuccess = () => {
    // Refresh order details to reflect changes
    fetchOrderDetails();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>

        {/* Order Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
              <p className="text-sm text-gray-500 mt-1">Order #{order.orderNumber}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {order.status}
              </span>
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Ticket className="h-6 w-6 mr-2 text-primary" />
            Event Information
          </h2>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Event Name</p>
              <p className="text-lg font-medium text-gray-900">{order.event.name}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1 flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Date & Time
              </p>
              <p className="text-gray-900">
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
                <p className="text-sm text-gray-500 mb-1 flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  Venue
                </p>
                <p className="font-medium text-gray-900">{order.event.venue.name}</p>
                <p className="text-sm text-gray-600">{order.event.venue.address}</p>
              </div>
            )}
          </div>
        </div>

        {/* Tickets */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Your Tickets ({order.ticketCount})
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            {order.tickets.map((ticket) => (
              <div key={ticket.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">{ticket.type}</p>
                    <p className="text-sm text-gray-500">{ticket.ticketNumber}</p>
                    {ticket.status && (
                      <span className={`inline-block px-2 py-1 text-xs rounded mt-1 ${
                        ticket.status === 'VALID' ? 'bg-green-100 text-green-800' :
                        ticket.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        ticket.status === 'USED' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {ticket.status}
                      </span>
                    )}
                  </div>
                  <Ticket className="h-5 w-5 text-gray-400" />
                </div>

                <div className="bg-gray-50 rounded p-3 flex items-center justify-center mb-3">
                  {/* QR Code Display - in production, render actual QR code */}
                  <div className="text-center">
                    <div className="w-32 h-32 bg-white border-2 border-gray-300 rounded flex items-center justify-center mb-2">
                      <svg className="h-24 w-24 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm-2 8h8v8H3v-8zm2 2v4h4v-4H5zm8-12v8h8V3h-8zm2 2h4v4h-4V5zm0 8h2v2h-2v-2zm0 4h2v2h-2v-2zm2 2h2v2h-2v-2zm0-4h2v2h-2v-2zm-2-2h2v2h-2v-2zm6-4h2v8h-2v-8z"/>
                      </svg>
                    </div>
                    <p className="text-xs text-gray-500">QR Code: {ticket.qrCode}</p>
                  </div>
                </div>

                {/* Ticket Actions */}
                {ticket.status === 'VALID' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTransferClick(ticket)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <Send className="h-4 w-4" />
                      Transfer
                    </button>
                    <button
                      onClick={() => handleRefundClick(ticket)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <DollarSign className="h-4 w-4" />
                      Refund
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
            <p className="text-sm text-blue-900">
              <strong>Important:</strong> Present these QR codes at the event entrance for check-in.
              Screenshots or printed versions are accepted.
            </p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <CreditCard className="h-6 w-6 mr-2 text-primary" />
            Payment Summary
          </h2>

          <div className="space-y-2">
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
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={handleDownloadReceipt}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Download className="h-5 w-5" />
              Download Receipt
            </button>

            <button
              onClick={handleDownloadCalendar}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <Calendar className="h-5 w-5" />
              Add to Calendar
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-3">
              If you have questions about your order or need assistance, our support team is here to help.
            </p>
            <a
              href="mailto:support@events.stepperslife.com"
              className="inline-flex items-center text-primary hover:text-primary-dark transition-colors"
            >
              <Mail className="h-5 w-5 mr-2" />
              support@events.stepperslife.com
            </a>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {selectedTicket && (
        <>
          <RefundRequestDialog
            ticketId={selectedTicket.id}
            eventName={order.event.name}
            ticketNumber={selectedTicket.ticketNumber}
            ticketPrice={selectedTicket.price || order.subtotal / order.ticketCount}
            isOpen={showRefundDialog}
            onClose={() => {
              setShowRefundDialog(false);
              setSelectedTicket(null);
            }}
            onSuccess={handleDialogSuccess}
          />

          <TransferTicketDialog
            ticketId={selectedTicket.id}
            eventName={order.event.name}
            ticketNumber={selectedTicket.ticketNumber}
            isOpen={showTransferDialog}
            onClose={() => {
              setShowTransferDialog(false);
              setSelectedTicket(null);
            }}
            onSuccess={handleDialogSuccess}
          />
        </>
      )}
    </div>
  );
}
