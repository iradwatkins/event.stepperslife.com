'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ticket, Calendar, MapPin, Send, DollarSign, Download, Loader2, AlertCircle } from 'lucide-react';
import RefundRequestDialog from '@/components/tickets/RefundRequestDialog';
import TransferTicketDialog from '@/components/tickets/TransferTicketDialog';

interface TicketData {
  id: string;
  ticketNumber: string;
  status: string;
  price: number;
  qrCode: string;
  order: {
    id: string;
    orderNumber: string;
  };
  ticketType: {
    name: string;
  };
  event: {
    id: string;
    name: string;
    startDate: string;
    venue?: {
      name: string;
      address: string;
    };
  };
}

export default function MyTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  // Dialog states
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/tickets/me');
      if (!response.ok) throw new Error('Failed to fetch tickets');
      const data = await response.json();
      setTickets(data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferClick = (ticket: TicketData) => {
    setSelectedTicket(ticket);
    setShowTransferDialog(true);
  };

  const handleRefundClick = (ticket: TicketData) => {
    setSelectedTicket(ticket);
    setShowRefundDialog(true);
  };

  const handleDialogSuccess = () => {
    fetchTickets(); // Refresh tickets list
  };

  const filterTickets = (tickets: TicketData[]) => {
    const now = new Date();

    switch (filter) {
      case 'upcoming':
        return tickets.filter(t => new Date(t.event.startDate) >= now);
      case 'past':
        return tickets.filter(t => new Date(t.event.startDate) < now);
      default:
        return tickets;
    }
  };

  const filteredTickets = filterTickets(tickets);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading your tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Tickets</h1>
        <p className="text-gray-600">View and manage all your event tickets</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setFilter('upcoming')}
          className={`pb-3 px-1 border-b-2 transition-colors ${
            filter === 'upcoming'
              ? 'border-primary text-primary font-medium'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Upcoming ({tickets.filter(t => new Date(t.event.startDate) >= new Date()).length})
        </button>
        <button
          onClick={() => setFilter('past')}
          className={`pb-3 px-1 border-b-2 transition-colors ${
            filter === 'past'
              ? 'border-primary text-primary font-medium'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Past ({tickets.filter(t => new Date(t.event.startDate) < new Date()).length})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`pb-3 px-1 border-b-2 transition-colors ${
            filter === 'all'
              ? 'border-primary text-primary font-medium'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All ({tickets.length})
        </button>
      </div>

      {/* Tickets Grid */}
      {filteredTickets.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Ticket className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
          <p className="text-gray-600 mb-6">
            {filter === 'upcoming' && "You don't have any upcoming events."}
            {filter === 'past' && "You haven't attended any events yet."}
            {filter === 'all' && "You haven't purchased any tickets yet."}
          </p>
          <button
            onClick={() => router.push('/')}
            className="btn-primary"
          >
            Browse Events
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Event Header */}
              <div className="bg-gradient-to-r from-primary to-primary-dark p-4 text-white">
                <h3 className="font-semibold text-lg mb-1 line-clamp-2">{ticket.event.name}</h3>
                <div className="flex items-center text-sm opacity-90">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(ticket.event.startDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>

              {/* Ticket Details */}
              <div className="p-4">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Ticket Type</span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      ticket.status === 'VALID' ? 'bg-green-100 text-green-800' :
                      ticket.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                      ticket.status === 'USED' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                  <p className="font-medium text-gray-900">{ticket.ticketType.name}</p>
                  <p className="text-xs text-gray-500 mt-1">#{ticket.ticketNumber}</p>
                </div>

                {ticket.event.venue && (
                  <div className="mb-4 text-sm text-gray-600">
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{ticket.event.venue.name}</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {ticket.status === 'VALID' && (
                  <div className="space-y-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => router.push(`/dashboard/orders/${ticket.order.id}`)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      View Ticket
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleTransferClick(ticket)}
                        className="flex items-center justify-center gap-1 px-2 py-2 text-xs border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <Send className="h-3 w-3" />
                        Transfer
                      </button>
                      <button
                        onClick={() => handleRefundClick(ticket)}
                        className="flex items-center justify-center gap-1 px-2 py-2 text-xs border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <DollarSign className="h-3 w-3" />
                        Refund
                      </button>
                    </div>
                  </div>
                )}

                {ticket.status === 'USED' && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>Ticket has been used</span>
                    </div>
                  </div>
                )}

                {ticket.status === 'CANCELLED' && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>Ticket has been cancelled</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      {selectedTicket && (
        <>
          <RefundRequestDialog
            ticketId={selectedTicket.id}
            eventName={selectedTicket.event.name}
            ticketNumber={selectedTicket.ticketNumber}
            ticketPrice={selectedTicket.price}
            isOpen={showRefundDialog}
            onClose={() => {
              setShowRefundDialog(false);
              setSelectedTicket(null);
            }}
            onSuccess={handleDialogSuccess}
          />

          <TransferTicketDialog
            ticketId={selectedTicket.id}
            eventName={selectedTicket.event.name}
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
