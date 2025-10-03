'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Loader2, Send, CheckCircle, XCircle } from 'lucide-react';

interface TransferTicketDialogProps {
  ticketId: string;
  eventName: string;
  ticketNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function TransferTicketDialog({
  ticketId,
  eventName,
  ticketNumber,
  isOpen,
  onClose,
  onSuccess
}: TransferTicketDialogProps) {
  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'error'>('form');
  const [transferring, setTransferring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    toEmail: '',
    message: ''
  });

  const [transferInfo, setTransferInfo] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.toEmail || !formData.toEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setTransferring(true);
    setError(null);
    setStep('processing');

    try {
      const response = await fetch(`/api/tickets/${ticketId}/transfer/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          toEmail: formData.toEmail,
          message: formData.message || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate transfer');
      }

      setTransferInfo(data.transfer);
      setStep('success');

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Transfer error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initiate transfer');
      setStep('error');
    } finally {
      setTransferring(false);
    }
  };

  const handleReset = () => {
    setStep('form');
    setFormData({ toEmail: '', message: '' });
    setError(null);
    setTransferInfo(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {step === 'form' && (
          <>
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Send className="h-6 w-6 text-primary" />
                Transfer Ticket
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Send this ticket to another person
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Ticket Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Ticket</p>
                <p className="font-medium text-gray-900">{eventName}</p>
                <p className="text-sm text-gray-500">{ticketNumber}</p>
              </div>

              {/* Important Notice */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Important</p>
                    <ul className="mt-2 space-y-1 list-disc list-inside">
                      <li>Transfer expires in 48 hours</li>
                      <li>Recipient will receive email notification</li>
                      <li>Once accepted, you won't have access to this ticket</li>
                      <li>QR code will be regenerated after transfer</li>
                    </ul>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded p-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Recipient Email */}
              <div className="space-y-2">
                <Label htmlFor="toEmail">
                  Recipient Email Address *
                </Label>
                <Input
                  id="toEmail"
                  type="email"
                  value={formData.toEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, toEmail: e.target.value }))}
                  placeholder="recipient@example.com"
                  required
                />
                <p className="text-xs text-gray-500">
                  The person receiving this ticket must have this email address
                </p>
              </div>

              {/* Optional Message */}
              <div className="space-y-2">
                <Label htmlFor="message">
                  Personal Message (Optional)
                </Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Add a personal note to the recipient..."
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500">
                  {formData.message.length} / 500 characters
                </p>
              </div>
            </form>

            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={onClose} disabled={transferring}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={transferring || !formData.toEmail}>
                {transferring ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Transfer
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {step === 'processing' && (
          <div className="p-12 text-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Initiating Transfer...
            </h3>
            <p className="text-gray-600">
              Please wait while we process your request.
            </p>
          </div>
        )}

        {step === 'success' && transferInfo && (
          <>
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-green-600 flex items-center gap-2">
                <CheckCircle className="h-6 w-6" />
                Transfer Initiated
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                Your ticket transfer has been sent successfully!
              </p>

              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                <h4 className="font-medium text-green-900 mb-2">What happens next:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>✓ Email sent to {formData.toEmail}</li>
                  <li>✓ Transfer expires on {new Date(transferInfo.expiresAt).toLocaleString()}</li>
                  <li>✓ You'll be notified when accepted or declined</li>
                  <li>✓ You can cancel the transfer anytime before acceptance</li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded p-4">
                <p className="text-sm text-gray-600 mb-2">Transfer ID</p>
                <p className="text-xs font-mono text-gray-800 break-all">{transferInfo.id}</p>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <Button onClick={() => {
                onClose();
                handleReset();
              }}>
                Done
              </Button>
            </div>
          </>
        )}

        {step === 'error' && (
          <>
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-red-600 flex items-center gap-2">
                <XCircle className="h-6 w-6" />
                Transfer Failed
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>

              <p className="text-gray-600 text-sm">
                Common reasons for transfer failure:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Event is within 24 hours</li>
                <li>Ticket has already been checked in</li>
                <li>Maximum transfer limit reached (3 transfers)</li>
                <li>A transfer is already pending</li>
              </ul>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={handleReset}>
                Try Again
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
