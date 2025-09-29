'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Loader2 } from 'lucide-react';

interface SquarePaymentFormProps {
  applicationId: string;
  locationId: string;
  amount: number;
  onPaymentSuccess: (result: any) => void;
  onPaymentError: (error: string) => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    Square?: any;
  }
}

export default function SquarePaymentForm({
  applicationId,
  locationId,
  amount,
  onPaymentSuccess,
  onPaymentError,
  disabled = false
}: SquarePaymentFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const cardInstance = useRef<any>(null);
  const paymentsInstance = useRef<any>(null);

  useEffect(() => {
    const loadSquareScript = () => {
      if (window.Square) {
        setScriptLoaded(true);
        setIsLoading(false);
        return;
      }

      const script = document.createElement('script');
      const environment = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';
      script.src = environment === 'production'
        ? 'https://web.squarecdn.com/v1/square.js'
        : 'https://sandbox.web.squarecdn.com/v1/square.js';
      script.async = true;
      script.onload = () => {
        setScriptLoaded(true);
        setIsLoading(false);
      };
      script.onerror = () => {
        onPaymentError('Failed to load payment form');
        setIsLoading(false);
      };
      document.head.appendChild(script);
    };

    loadSquareScript();
  }, [onPaymentError]);

  useEffect(() => {
    const initializeCard = async () => {
      if (!scriptLoaded || !window.Square || !cardRef.current) return;

      try {
        // Initialize the payments object
        const payments = window.Square.payments(applicationId, locationId);
        paymentsInstance.current = payments;

        // Initialize the card payment object
        const card = await payments.card();
        cardInstance.current = card;

        // Attach the card to the DOM
        await card.attach(cardRef.current);

        // Handle card focus events for styling
        card.addEventListener('focusClassAdded', (event: any) => {
          cardRef.current?.classList.add('square-card-focused');
        });

        card.addEventListener('focusClassRemoved', (event: any) => {
          cardRef.current?.classList.remove('square-card-focused');
        });

        card.addEventListener('errorClassAdded', (event: any) => {
          cardRef.current?.classList.add('square-card-error');
        });

        card.addEventListener('errorClassRemoved', (event: any) => {
          cardRef.current?.classList.remove('square-card-error');
        });

      } catch (error) {
        console.error('Failed to initialize Square payment form:', error);
        onPaymentError('Failed to initialize payment form');
      }
    };

    initializeCard();

    return () => {
      if (cardInstance.current) {
        cardInstance.current.destroy();
        cardInstance.current = null;
      }
    };
  }, [scriptLoaded, applicationId, locationId, onPaymentError]);

  const handlePayment = async () => {
    if (!cardInstance.current || isProcessing || disabled) return;

    setIsProcessing(true);

    try {
      // Tokenize the payment method
      const result = await cardInstance.current.tokenize();

      if (result.status === 'OK') {
        // Payment tokenization successful
        onPaymentSuccess({
          sourceId: result.token,
          verificationToken: result.details?.verificationToken
        });
      } else {
        // Handle tokenization errors
        const errorMessage = result.errors?.[0]?.message || 'Payment processing failed';
        onPaymentError(errorMessage);
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      onPaymentError('Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Information
          </CardTitle>
          <CardDescription>Secure payment processing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2">Loading payment form...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Information
        </CardTitle>
        <CardDescription>
          Secure payment processing powered by Square
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Square Card Element */}
        <div
          ref={cardRef}
          className="square-card-container p-4 border rounded-md min-h-[80px] transition-colors"
          style={{
            backgroundColor: 'transparent'
          }}
        />

        {/* Payment Total */}
        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-md">
          <span className="font-medium">Total Amount:</span>
          <span className="text-xl font-bold">${amount.toFixed(2)}</span>
        </div>

        {/* Pay Button */}
        <Button
          onClick={handlePayment}
          disabled={isProcessing || disabled}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Pay ${amount.toFixed(2)}
            </>
          )}
        </Button>

        {/* Security Notice */}
        <p className="text-xs text-gray-500 text-center">
          🔒 Your payment information is secure and encrypted.
          We never store your credit card details.
        </p>
      </CardContent>

      <style jsx>{`
        .square-card-container {
          transition: border-color 0.2s ease;
        }

        .square-card-focused {
          border-color: rgb(59, 130, 246) !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
        }

        .square-card-error {
          border-color: rgb(239, 68, 68) !important;
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1) !important;
        }
      `}</style>
    </Card>
  );
}