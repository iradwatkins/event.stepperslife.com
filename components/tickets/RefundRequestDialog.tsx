'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Loader2, DollarSign, CheckCircle, XCircle, Info } from 'lucide-react';

interface RefundRequestDialogProps {
  ticketId: string;
  eventName: string;
  ticketNumber: string;
  ticketPrice: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function RefundRequestDialog({
  ticketId,
  eventName,
  ticketNumber,
  ticketPrice,
  isOpen,
  onClose,
  onSuccess
}: RefundRequestDialogProps) {
  const [step, setStep] = useState<'check' | 'confirm' | 'processing' | 'success' | 'error'>('check');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eligibility, setEligibility] = useState<any>(null);
  const [refundInfo, setRefundInfo] = useState<any>(null);

  const [reasonText, setReasonText] = useState('');

  useEffect(() => {
    if (isOpen) {
      checkEligibility();
    }
  }, [isOpen, ticketId]);

  const checkEligibility = async () => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/refund/check`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check refund eligibility');
      }

      setEligibility(data);

      if (data.eligible) {
        setStep('confirm');
      } else {
        setError(data.reason || 'This ticket is not eligible for refund');
        setStep('error');
      }
    } catch (err) {
      console.error('Error checking eligibility:', err);
      setError(err instanceof Error ? err.message : 'Failed to check refund eligibility');
      setStep('error');
    }
  };

  const handleSubmit = async () => {
    setProcessing(true);
    setError(null);
    setStep('processing');

    try {
      const response = await fetch(`/api/tickets/${ticketId}/refund/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: 'CUSTOMER_REQUEST',
          reasonText: reasonText || 'Customer requested refund'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process refund');
      }

      setRefundInfo(data.refund);
      setStep('success');

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Refund error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process refund');
      setStep('error');
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setStep('check');
    setReasonText('');
    setError(null);
    setEligibility(null);
    setRefundInfo(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {step === 'check' && (
          <div className="p-12 text-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Checking Eligibility...
            </h3>
            <p className="text-gray-600">
              Please wait while we verify your refund eligibility.
            </p>
          </div>
        )}

        {step === 'confirm' && eligibility && (
          <>
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-primary" />
                Request Refund
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Review refund details before submitting
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Ticket Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Ticket</p>
                <p className="font-medium text-gray-900">{eventName}</p>
                <p className="text-sm text-gray-500">{ticketNumber}</p>
              </div>

              {/* Refund Amount */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900 mb-1">Refund Amount</p>
                    <p className="text-2xl font-bold text-blue-900">
                      ${eligibility.refundAmount?.toFixed(2) || ticketPrice.toFixed(2)}
                    </p>
                    {eligibility.cancellationFee > 0 && (
                      <p className="text-sm text-blue-700 mt-2">
                        Cancellation fee: ${eligibility.cancellationFee.toFixed(2)}
                      </p>
                    )}
                    <p className="text-xs text-blue-600 mt-2">
                      {eligibility.refundPolicyText || 'Refund will be processed to your original payment method within 5-10 business days'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Important Notes */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Please note:</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Ticket will be immediately invalidated</li>
                      <li>This action cannot be undone</li>
                      <li>Refund processing may take 5-10 business days</li>
                      <li>You will receive confirmation via email</li>
                    </ul>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded p-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Optional Reason */}
              <div className="space-y-2">
                <Label htmlFor="reasonText">
                  Reason for Refund (Optional)
                </Label>
                <Textarea
                  id="reasonText"
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  placeholder="Help us improve by telling us why you're requesting a refund..."
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500">
                  {reasonText.length} / 500 characters
                </p>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={onClose} disabled={processing}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleSubmit} disabled={processing}>
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Request Refund
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
              Processing Refund...
            </h3>
            <p className="text-gray-600">
              Please wait while we process your refund request.
            </p>
          </div>
        )}

        {step === 'success' && refundInfo && (
          <>
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-green-600 flex items-center gap-2">
                <CheckCircle className="h-6 w-6" />
                Refund Processed
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                Your refund has been successfully processed.
              </p>

              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                <h4 className="font-medium text-green-900 mb-2">Refund Details:</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>Amount:</strong> ${refundInfo.amount.toFixed(2)}</p>
                  <p><strong>Status:</strong> {refundInfo.status}</p>
                  {refundInfo.squareRefundId && (
                    <p className="text-xs mt-2 break-all">
                      <strong>Reference:</strong> {refundInfo.squareRefundId}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-sm text-blue-800">
                  <strong>What's next:</strong> You'll receive a confirmation email shortly. The refund will appear on your original payment method within 5-10 business days.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded p-4">
                <p className="text-xs text-gray-600">
                  Your ticket has been invalidated and can no longer be used for event entry.
                </p>
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
                {eligibility && !eligibility.eligible ? 'Not Eligible' : 'Refund Failed'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>

              {eligibility && !eligibility.eligible && (
                <div>
                  <p className="text-gray-600 text-sm mb-2">
                    Common reasons tickets are not eligible for refund:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                    <li>Event has already occurred</li>
                    <li>Refund window has closed</li>
                    <li>Ticket has been checked in</li>
                    <li>Ticket was already refunded</li>
                    <li>Event was cancelled (automatic refund processed)</li>
                  </ul>
                </div>
              )}
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <Button onClick={() => {
                onClose();
                handleReset();
              }}>
                Close
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
