'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { XCircle, ArrowLeft, CreditCard, Mail, Phone, Loader2 } from 'lucide-react';

// Common payment error messages and user-friendly explanations
const ERROR_MESSAGES: Record<string, { title: string; description: string; actionable: boolean }> = {
  'card_declined': {
    title: 'Card Declined',
    description: 'Your card was declined by your bank. Please try a different card or contact your bank.',
    actionable: true
  },
  'insufficient_funds': {
    title: 'Insufficient Funds',
    description: 'There are insufficient funds on your card. Please use a different payment method.',
    actionable: true
  },
  'invalid_card': {
    title: 'Invalid Card',
    description: 'The card information provided is invalid. Please check your card details.',
    actionable: true
  },
  'expired_card': {
    title: 'Card Expired',
    description: 'Your card has expired. Please use a different payment method.',
    actionable: true
  },
  'processing_error': {
    title: 'Processing Error',
    description: 'There was an error processing your payment. Please try again.',
    actionable: true
  },
  'network_error': {
    title: 'Network Error',
    description: 'Unable to connect to payment processor. Please check your internet connection and try again.',
    actionable: true
  },
  'timeout': {
    title: 'Request Timeout',
    description: 'The payment request took too long to process. Your card has not been charged. Please try again.',
    actionable: true
  },
  'generic': {
    title: 'Payment Failed',
    description: 'We were unable to process your payment. Please try again or use a different payment method.',
    actionable: true
  }
};

function PurchaseFailedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId');
  const errorCode = searchParams.get('error') || 'generic';
  const errorMessage = searchParams.get('message');

  const [eventName, setEventName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    } else {
      setLoading(false);
    }
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      if (response.ok) {
        const event = await response.json();
        setEventName(event.name);
      }
    } catch (err) {
      console.error('Failed to load event details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTryAgain = () => {
    if (eventId) {
      router.push(`/events/${eventId}/purchase`);
    } else {
      router.push('/events');
    }
  };

  const errorInfo = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES['generic'];
  const title = errorInfo?.title || 'Payment Failed';
  const description = errorInfo?.description || 'Unable to process payment';
  const actionable = errorInfo?.actionable !== false;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Error Header */}
        <div className="bg-white rounded-lg shadow-xl p-8 mb-6 text-center">
          <div className="mb-6">
            <XCircle className="h-20 w-20 text-red-500 mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {title}
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            {errorMessage || description}
          </p>

          {eventName && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-500 mb-1">Attempted Purchase</p>
              <p className="text-lg font-medium text-gray-900">{eventName}</p>
            </div>
          )}

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded text-left">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-yellow-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-900">
                  Don't worry - your card was not charged
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  No tickets were created for this failed transaction.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* What to Try */}
        {actionable && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">What You Can Try</h2>

            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                  1
                </span>
                <div>
                  <p className="font-medium text-gray-900">Double-check your card information</p>
                  <p className="text-sm text-gray-600">Verify card number, expiration date, CVV, and billing address</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                  2
                </span>
                <div>
                  <p className="font-medium text-gray-900">Try a different payment method</p>
                  <p className="text-sm text-gray-600">Use another credit or debit card</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                  3
                </span>
                <div>
                  <p className="font-medium text-gray-900">Contact your bank</p>
                  <p className="text-sm text-gray-600">They may have declined the transaction for security reasons</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                  4
                </span>
                <div>
                  <p className="font-medium text-gray-900">Wait a few minutes and try again</p>
                  <p className="text-sm text-gray-600">Sometimes temporary issues resolve themselves</p>
                </div>
              </li>
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid gap-3">
            <button
              onClick={handleTryAgain}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <CreditCard className="h-5 w-5" />
              Try Again
            </button>

            <button
              onClick={() => router.push('/events')}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-5 w-5" />
              Browse Other Events
            </button>
          </div>
        </div>

        {/* Support Information */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Need Help?</h2>

          <p className="text-gray-600 mb-4">
            If you continue to experience issues, our support team is here to help.
          </p>

          <div className="space-y-3">
            <a
              href="mailto:support@events.stepperslife.com"
              className="flex items-center text-primary hover:text-primary-dark transition-colors"
            >
              <Mail className="h-5 w-5 mr-3" />
              <div>
                <p className="font-medium">Email Support</p>
                <p className="text-sm text-gray-600">support@events.stepperslife.com</p>
              </div>
            </a>

            <div className="flex items-center text-gray-700">
              <Phone className="h-5 w-5 mr-3" />
              <div>
                <p className="font-medium">Phone Support</p>
                <p className="text-sm text-gray-600">Available Monday-Friday, 9 AM - 6 PM EST</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              <strong>Error Code:</strong> {errorCode}
              <br />
              Please reference this code when contacting support.
            </p>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900">
                Your payment information is secure
              </p>
              <p className="text-sm text-blue-700 mt-1">
                We use industry-standard encryption to protect your financial data. We never store your full card details.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PurchaseFailedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <Loader2 className="h-12 w-12 animate-spin text-red-500" />
      </div>
    }>
      <PurchaseFailedContent />
    </Suspense>
  );
}
