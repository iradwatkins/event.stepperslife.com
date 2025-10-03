'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { Suspense } from 'react';

const errors: Record<string, { title: string; message: string }> = {
  Configuration: {
    title: 'Configuration Error',
    message: 'There is a problem with the server configuration. Please contact support if this persists.',
  },
  AccessDenied: {
    title: 'Access Denied',
    message: 'You do not have permission to sign in.',
  },
  Verification: {
    title: 'Verification Error',
    message: 'The verification token is invalid or has expired.',
  },
  OAuthSignin: {
    title: 'Sign In Error',
    message: 'Error occurred while trying to authenticate with the provider.',
  },
  OAuthCallback: {
    title: 'OAuth Error',
    message: 'Error occurred during the OAuth callback.',
  },
  OAuthCreateAccount: {
    title: 'Account Creation Error',
    message: 'Could not create user account with OAuth provider.',
  },
  EmailCreateAccount: {
    title: 'Account Creation Error',
    message: 'Could not create user account with email.',
  },
  Callback: {
    title: 'Callback Error',
    message: 'Error occurred during the authentication callback.',
  },
  OAuthAccountNotLinked: {
    title: 'Account Not Linked',
    message: 'This account is already associated with another user. Please sign in with the original account.',
  },
  EmailSignin: {
    title: 'Email Sign In Error',
    message: 'Failed to send verification email. Please try again.',
  },
  SessionRequired: {
    title: 'Session Required',
    message: 'Please sign in to access this page.',
  },
  Default: {
    title: 'Authentication Error',
    message: 'An unexpected error occurred during authentication.',
  },
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const errorType = searchParams.get('error') || 'Default';
  const error = errors[errorType as keyof typeof errors] || errors.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
          </div>
          
          <h2 className="text-center text-2xl font-bold text-gray-900 mb-2">
            {error?.title || 'Authentication Error'}
          </h2>
          
          <p className="text-center text-gray-600 mb-8">
            {error?.message || 'An unexpected error occurred during authentication.'}
          </p>

          {errorType === 'Configuration' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This usually happens when OAuth credentials are not properly configured 
                or there's a mismatch between the callback URL and your OAuth app settings.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
            >
              Try Again
            </Link>
            
            <Link
              href="/"
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
            >
              Go Home
            </Link>
          </div>

          <p className="mt-6 text-center text-xs text-gray-500">
            Error code: {errorType}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white shadow-lg rounded-lg p-8">
            <div className="flex items-center justify-center">
              <div className="animate-pulse">Loading...</div>
            </div>
          </div>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}