'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Calendar,
  MapPin,
  User,
  Clock,
  Ticket
} from 'lucide-react';
import Link from 'next/link';

function TransferAcceptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: authStatus } = useSession();
  const transferId = searchParams.get('transferId');

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [transfer, setTransfer] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (authStatus === 'loading') return;

    if (!session) {
      // Redirect to login with return URL
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(window.location.href)}`);
      return;
    }

    if (transferId) {
      fetchTransferDetails();
    } else {
      setError('Invalid transfer link');
      setLoading(false);
    }
  }, [transferId, session, authStatus]);

  const fetchTransferDetails = async () => {
    try {
      const response = await fetch(`/api/tickets/transfer/${transferId}/details`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load transfer details');
      }

      setTransfer(data);
    } catch (err) {
      console.error('Error loading transfer:', err);
      setError(err instanceof Error ? err.message : 'Failed to load transfer');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!transferId) return;

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/tickets/transfer/${transferId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept transfer');
      }

      setSuccess(true);
    } catch (err) {
      console.error('Accept error:', err);
      setError(err instanceof Error ? err.message : 'Failed to accept transfer');
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!transferId) return;

    if (!confirm('Are you sure you want to decline this ticket transfer?')) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/tickets/transfer/${transferId}/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to decline transfer');
      }

      // Redirect to dashboard after declining
      router.push('/dashboard?message=Transfer declined');
    } catch (err) {
      console.error('Decline error:', err);
      setError(err instanceof Error ? err.message : 'Failed to decline transfer');
    } finally {
      setProcessing(false);
    }
  };

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading transfer details...</p>
        </div>
      </div>
    );
  }

  if (error && !transfer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <XCircle className="h-6 w-6" />
                Transfer Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">{error}</p>
              <Button asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600 flex items-center gap-2">
                <CheckCircle className="h-8 w-8" />
                Ticket Transfer Accepted
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                <h4 className="font-medium text-green-900 mb-2">Success!</h4>
                <p className="text-sm text-green-700">
                  The ticket has been transferred to your account. You can now view it in your dashboard.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-sm text-blue-800">
                  <strong>Important:</strong> A new QR code has been generated for security. The previous owner's QR code is now invalid.
                </p>
              </div>

              <div className="flex gap-3">
                <Button asChild className="flex-1">
                  <Link href="/dashboard">View My Tickets</Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/events">Browse Events</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!transfer) return null;

  // Check if transfer is expired
  const isExpired = new Date(transfer.expiresAt) < new Date();
  const isNotPending = transfer.status !== 'PENDING';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-6 w-6 text-primary" />
              Ticket Transfer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              <strong>{transfer.fromUser?.firstName || 'Someone'} {transfer.fromUser?.lastName || ''}</strong> has sent you a ticket!
            </p>
          </CardContent>
        </Card>

        {/* Event Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-gray-900">{transfer.event?.name}</p>
            </div>

            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{new Date(transfer.event?.startDate).toLocaleDateString()}</span>
              <span>{new Date(transfer.event?.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            {transfer.event?.venue && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{transfer.event.venue.name}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-gray-600">
              <User className="h-4 w-4" />
              <span>From: {transfer.fromUser?.email}</span>
            </div>
          </CardContent>
        </Card>

        {/* Personal Message */}
        {transfer.message && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personal Message</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 italic">"{transfer.message}"</p>
            </CardContent>
          </Card>
        )}

        {/* Transfer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transfer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span>
                {isExpired ? 'Expired on' : 'Expires on'}: {' '}
                {new Date(transfer.expiresAt).toLocaleString()}
              </span>
            </div>

            <div className="text-sm text-gray-500">
              Status: <span className="font-medium">{transfer.status}</span>
            </div>
          </CardContent>
        </Card>

        {/* Warnings/Errors */}
        {isExpired && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-900">Transfer Expired</p>
                <p className="text-sm text-red-700 mt-1">
                  This transfer has expired and can no longer be accepted.
                </p>
              </div>
            </div>
          </div>
        )}

        {isNotPending && !isExpired && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-yellow-900">Transfer {transfer.status}</p>
                <p className="text-sm text-yellow-700 mt-1">
                  This transfer has already been {transfer.status.toLowerCase()}.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Actions */}
        {!isExpired && !isNotPending && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Once you accept this ticket, a new QR code will be generated and the sender will no longer have access to it.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleAccept}
                    disabled={processing}
                    className="flex-1"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept Ticket
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleDecline}
                    variant="outline"
                    disabled={processing}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function TransferAcceptPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    }>
      <TransferAcceptContent />
    </Suspense>
  );
}
