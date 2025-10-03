'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Loader2, XCircle, CheckCircle } from 'lucide-react';

interface CancelEventDialogProps {
  eventId: string;
  eventName: string;
  ticketsSold: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CancelEventDialog({
  eventId,
  eventName,
  ticketsSold,
  isOpen,
  onClose,
  onSuccess
}: CancelEventDialogProps) {
  const router = useRouter();
  const [step, setStep] = useState<'confirm' | 'details' | 'processing' | 'success'>('confirm');
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    reason: '',
    refundAll: true,
    notifyAttendees: true,
    confirmation: ''
  });

  const [result, setResult] = useState<any>(null);

  const handleConfirm = () => {
    if (ticketsSold > 0) {
      setStep('details');
    } else {
      // No tickets sold, proceed directly
      handleCancel();
    }
  };

  const handleCancel = async () => {
    if (ticketsSold > 0 && formData.confirmation !== eventName) {
      setError('Please type the event name exactly to confirm cancellation');
      return;
    }

    if (ticketsSold > 0 && formData.reason.length < 10) {
      setError('Cancellation reason must be at least 10 characters');
      return;
    }

    setCancelling(true);
    setError(null);
    setStep('processing');

    try {
      const response = await fetch(`/api/events/${eventId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: formData.reason || 'Event cancelled by organizer',
          refundAll: formData.refundAll,
          notifyAttendees: formData.notifyAttendees
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel event');
      }

      setResult(data);
      setStep('success');

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Cancel event error:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel event');
      setStep('details');
    } finally {
      setCancelling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {step === 'confirm' && (
          <>
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-red-500" />
                Cancel Event?
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                Are you sure you want to cancel <strong>{eventName}</strong>?
              </p>

              {ticketsSold > 0 ? (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-yellow-900">Warning:</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        This event has <strong>{ticketsSold} ticket{ticketsSold > 1 ? 's' : ''} sold</strong>.
                        All attendees will be notified and tickets will be automatically refunded.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                  <p className="text-sm text-blue-700">
                    No tickets have been sold for this event yet. The event will simply be marked as cancelled.
                  </p>
                </div>
              )}

              <div className="bg-red-50 border border-red-200 rounded p-4">
                <p className="text-sm text-red-800">
                  <strong>This action cannot be undone.</strong> The event will be permanently cancelled.
                </p>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Go Back
              </Button>
              <Button variant="destructive" onClick={handleConfirm}>
                {ticketsSold > 0 ? 'Continue to Details' : 'Cancel Event'}
              </Button>
            </div>
          </>
        )}

        {step === 'details' && (
          <>
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Cancellation Details</h2>
              <p className="text-sm text-gray-600 mt-1">
                Provide details for your attendees
              </p>
            </div>
            <div className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded p-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reason">
                  Cancellation Reason *
                  <span className="text-sm text-gray-500 ml-2">(Minimum 10 characters)</span>
                </Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Explain why the event is being cancelled. This will be sent to all attendees."
                  rows={4}
                  required
                />
                <p className="text-xs text-gray-500">
                  {formData.reason.length} / 500 characters
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="refundAll"
                    checked={formData.refundAll}
                    onChange={(e) => setFormData(prev => ({ ...prev, refundAll: e.target.checked }))}
                    className="mt-1"
                  />
                  <div>
                    <Label htmlFor="refundAll" className="cursor-pointer">
                      Refund all tickets automatically
                    </Label>
                    <p className="text-sm text-gray-600">
                      All {ticketsSold} ticket{ticketsSold > 1 ? 's' : ''} will be refunded within 5-10 business days
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="notifyAttendees"
                    checked={formData.notifyAttendees}
                    onChange={(e) => setFormData(prev => ({ ...prev, notifyAttendees: e.target.checked }))}
                    className="mt-1"
                  />
                  <div>
                    <Label htmlFor="notifyAttendees" className="cursor-pointer">
                      Send cancellation notifications
                    </Label>
                    <p className="text-sm text-gray-600">
                      All attendees will receive an email about the cancellation
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded p-4">
                <Label htmlFor="confirmation" className="block mb-2">
                  Type the event name to confirm: <strong>{eventName}</strong>
                </Label>
                <Input
                  id="confirmation"
                  value={formData.confirmation}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmation: e.target.value }))}
                  placeholder="Type event name exactly"
                  required
                />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStep('confirm')} disabled={cancelling}>
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={cancelling || formData.confirmation !== eventName || formData.reason.length < 10}
              >
                {cancelling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Cancel Event'
                )}
              </Button>
            </div>
          </>
        )}

        {step === 'processing' && (
          <div className="p-12 text-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Cancelling Event...
            </h3>
            <p className="text-gray-600">
              Please wait while we process the cancellation and refunds.
            </p>
          </div>
        )}

        {step === 'success' && result && (
          <>
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-green-600 flex items-center gap-2">
                <CheckCircle className="h-6 w-6" />
                Event Cancelled
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                <strong>{eventName}</strong> has been successfully cancelled.
              </p>

              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                <h4 className="font-medium text-green-900 mb-2">Cancellation Summary:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>✓ Event status updated to CANCELLED</li>
                  <li>✓ {result.cancellation.ticketsAffected} ticket{result.cancellation.ticketsAffected > 1 ? 's' : ''} invalidated</li>
                  {result.cancellation.refunds.processed && (
                    <li>
                      ✓ {result.cancellation.refunds.successful} refund{result.cancellation.refunds.successful > 1 ? 's' : ''} initiated
                      {result.cancellation.refunds.failed > 0 && ` (${result.cancellation.refunds.failed} failed)`}
                    </li>
                  )}
                  {result.cancellation.notifications.sent && (
                    <li>✓ Cancellation emails sent to attendees</li>
                  )}
                </ul>
              </div>

              {result.cancellation.refunds.failed > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                  <p className="text-sm text-yellow-700">
                    <strong>Note:</strong> Some refunds failed. Please contact support to manually process these refunds.
                  </p>
                </div>
              )}
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <Button onClick={() => router.push('/dashboard/events')}>
                Back to Events
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
