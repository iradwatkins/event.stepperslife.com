// Payment Error Handling System
// Implements PAY-006: Payment Error Handling & User Feedback

export enum PaymentErrorCategory {
  CARD_DECLINED = 'CARD_DECLINED',
  INVALID_CARD = 'INVALID_CARD',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface PaymentError {
  category: PaymentErrorCategory;
  userMessage: string;
  technicalDetails: string;
  squareErrorCode?: string;
  retryable: boolean;
  suggestedActions: string[];
}

export class PaymentErrorMapper {
  /**
   * Map Square API error to user-friendly PaymentError
   */
  static mapSquareError(squareError: any): PaymentError {
    const code = squareError.code || squareError.category || '';
    const errorString = JSON.stringify(squareError);

    switch (code) {
      // Card Declined
      case 'CARD_DECLINED':
      case 'CVV_FAILURE':
      case 'INSUFFICIENT_FUNDS':
      case 'CARD_DECLINED_CALL_ISSUER':
      case 'CARD_DECLINED_VERIFICATION_REQUIRED':
        return {
          category: PaymentErrorCategory.CARD_DECLINED,
          userMessage:
            'Your card was declined by your bank. This may be due to insufficient funds, ' +
            'a card limit, or your bank flagging the transaction as unusual.',
          technicalDetails: errorString,
          squareErrorCode: code,
          retryable: true,
          suggestedActions: [
            'Try a different payment card',
            'Contact your bank to authorize the transaction',
            'Verify your card has sufficient funds'
          ]
        };

      // Invalid Card
      case 'INVALID_CARD':
      case 'INVALID_CARD_DATA':
      case 'INVALID_EXPIRATION':
      case 'INVALID_EXPIRATION_YEAR':
      case 'INVALID_EXPIRATION_MONTH':
      case 'CARD_EXPIRED':
      case 'INVALID_CVV':
        return {
          category: PaymentErrorCategory.INVALID_CARD,
          userMessage:
            'The card information appears to be incorrect or the card has expired. ' +
            'Please check your card number, expiration date, and CVV.',
          technicalDetails: errorString,
          squareErrorCode: code,
          retryable: true,
          suggestedActions: [
            'Verify your card number is correct',
            'Check the expiration date',
            'Confirm the CVV security code',
            'Try a different card'
          ]
        };

      // Processing Errors (retryable)
      case 'GATEWAY_TIMEOUT':
      case 'SERVICE_UNAVAILABLE':
      case 'INTERNAL_SERVER_ERROR':
      case 'TEMPORARY_ERROR':
      case 'RATE_LIMITED':
        return {
          category: PaymentErrorCategory.PROCESSING_ERROR,
          userMessage:
            'We\'re experiencing temporary difficulties processing your payment. ' +
            'Please try again in a few moments.',
          technicalDetails: errorString,
          squareErrorCode: code,
          retryable: true,
          suggestedActions: [
            'Wait a moment and try again',
            'Refresh the page',
            'Contact support if the problem persists'
          ]
        };

      // Validation Errors
      case 'INVALID_REQUEST_ERROR':
      case 'BAD_REQUEST':
      case 'MISSING_REQUIRED_PARAMETER':
      case 'INVALID_VALUE':
        return {
          category: PaymentErrorCategory.VALIDATION_ERROR,
          userMessage:
            'Some payment information is missing or invalid. ' +
            'Please review your information and try again.',
          technicalDetails: errorString,
          squareErrorCode: code,
          retryable: true,
          suggestedActions: [
            'Review all required fields',
            'Ensure billing address is complete',
            'Verify payment amount'
          ]
        };

      // Authorization Errors
      case 'AUTHORIZATION_DECLINED':
      case 'VERIFY_CVV':
      case 'VERIFY_AVS':
      case 'ADDRESS_VERIFICATION_FAILURE':
      case 'CVV_ACCEPTED_AVS_REJECTED':
        return {
          category: PaymentErrorCategory.AUTHORIZATION_ERROR,
          userMessage:
            'Your payment could not be authorized. Your bank may require ' +
            'additional verification or your card details may not match their records.',
          technicalDetails: errorString,
          squareErrorCode: code,
          retryable: true,
          suggestedActions: [
            'Verify your billing address matches your card',
            'Check your CVV security code',
            'Contact your bank',
            'Try a different payment method'
          ]
        };

      // Network/Connectivity Errors
      case 'NETWORK_ERROR':
      case 'CONNECTION_ERROR':
        return {
          category: PaymentErrorCategory.NETWORK_ERROR,
          userMessage:
            'Unable to connect to payment processor. Please check your internet connection.',
          technicalDetails: errorString,
          squareErrorCode: code,
          retryable: true,
          suggestedActions: [
            'Check your internet connection',
            'Try again in a moment',
            'Contact support if the problem continues'
          ]
        };

      // Unknown/Default
      default:
        return {
          category: PaymentErrorCategory.UNKNOWN_ERROR,
          userMessage:
            'An unexpected error occurred while processing your payment. ' +
            'Please try again or contact support for assistance.',
          technicalDetails: errorString,
          squareErrorCode: code,
          retryable: true,
          suggestedActions: [
            'Try again',
            'Use a different payment method',
            'Contact support with order ID'
          ]
        };
    }
  }

  /**
   * Map generic error to PaymentError
   */
  static mapGenericError(error: Error): PaymentError {
    return {
      category: PaymentErrorCategory.UNKNOWN_ERROR,
      userMessage:
        'An unexpected error occurred while processing your payment. ' +
        'Please try again or contact support for assistance.',
      technicalDetails: error.message,
      retryable: true,
      suggestedActions: [
        'Try again',
        'Contact support if the problem persists'
      ]
    };
  }

  /**
   * Sanitize error for logging (remove sensitive data)
   */
  static sanitizeForLogging(error: any): any {
    const sanitized = { ...error };

    // Remove any potential PCI data
    delete sanitized.cardNumber;
    delete sanitized.cvv;
    delete sanitized.pin;
    delete sanitized.track1;
    delete sanitized.track2;

    // Mask last 4 digits if present
    if (sanitized.last4) {
      sanitized.last4 = '****';
    }

    return sanitized;
  }
}
