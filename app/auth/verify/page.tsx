'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, X, Clock, Mail, Loader2, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

type VerificationStatus =
  | 'verifying'
  | 'success'
  | 'invalid'
  | 'expired'
  | 'already-verified'
  | 'error';

const StatusIcon = ({ status }: { status: VerificationStatus }) => {
  switch (status) {
    case 'verifying':
      return <Loader2 className="w-16 h-16 text-primary animate-spin" />;
    case 'success':
      return <Check className="w-16 h-16 text-green-600" />;
    case 'invalid':
    case 'error':
      return <X className="w-16 h-16 text-red-600" />;
    case 'expired':
      return <Clock className="w-16 h-16 text-yellow-600" />;
    case 'already-verified':
      return <Check className="w-16 h-16 text-blue-600" />;
    default:
      return <Mail className="w-16 h-16 text-gray-600" />;
  }
};

const StatusContent = ({
  status,
  onResendVerification
}: {
  status: VerificationStatus;
  onResendVerification: () => void;
}) => {
  switch (status) {
    case 'verifying':
      return {
        title: 'Verifying Your Email',
        description: 'Please wait while we verify your email address...',
        content: null
      };

    case 'success':
      return {
        title: 'Email Verified Successfully!',
        description: 'Your email has been verified. You can now sign in to your account.',
        content: (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                Welcome to SteppersLife Events! You can now create events, purchase tickets, and connect with your community.
              </AlertDescription>
            </Alert>
            <Button className="w-full" asChild>
              <Link href="/auth/login">
                Sign In to Your Account
              </Link>
            </Button>
          </div>
        )
      };

    case 'invalid':
      return {
        title: 'Invalid Verification Link',
        description: 'This verification link is not valid or has been used already.',
        content: (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                The verification link you clicked is invalid. This could happen if the link was copied incorrectly or has already been used.
              </AlertDescription>
            </Alert>
            <Button onClick={onResendVerification} variant="outline" className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Request New Verification Email
            </Button>
          </div>
        )
      };

    case 'expired':
      return {
        title: 'Verification Link Expired',
        description: 'This verification link has expired. Verification links are valid for 24 hours.',
        content: (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                Your verification link has expired for security reasons. Please request a new verification email.
              </AlertDescription>
            </Alert>
            <Button onClick={onResendVerification} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Send New Verification Email
            </Button>
          </div>
        )
      };

    case 'already-verified':
      return {
        title: 'Email Already Verified',
        description: 'Your email address has already been verified.',
        content: (
          <div className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-800">
                Your email was previously verified. You can sign in to your account.
              </AlertDescription>
            </Alert>
            <Button className="w-full" asChild>
              <Link href="/auth/login">
                Sign In to Your Account
              </Link>
            </Button>
          </div>
        )
      };

    case 'error':
    default:
      return {
        title: 'Verification Error',
        description: 'An error occurred while verifying your email address.',
        content: (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                An unexpected error occurred. Please try again or contact support if the problem persists.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Button onClick={onResendVerification} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/support">
                  Contact Support
                </Link>
              </Button>
            </div>
          </div>
        )
      };
  }
};

function VerifyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<VerificationStatus>('verifying');
  const [isResending, setIsResending] = useState(false);

  const token = searchParams.get('token');
  const urlStatus = searchParams.get('status') as VerificationStatus | null;

  useEffect(() => {
    // If status is provided in URL (from GET request redirect)
    if (urlStatus) {
      setStatus(urlStatus);
      return;
    }

    // If token is provided, verify it
    if (token) {
      verifyToken(token);
    } else {
      setStatus('invalid');
    }
  }, [token, urlStatus]);

  const verifyToken = async (verificationToken: string) => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: verificationToken })
      });

      const result = await response.json();

      if (response.ok) {
        setStatus('success');
      } else {
        switch (response.status) {
          case 404:
            setStatus('invalid');
            break;
          case 410:
            setStatus('expired');
            break;
          default:
            setStatus('error');
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('error');
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);

    // TODO: Implement resend verification API
    try {
      // For now, just show a message
      alert('Verification email resend functionality will be implemented next. Please contact support for now.');
    } catch (error) {
      console.error('Resend error:', error);
    } finally {
      setIsResending(false);
    }
  };

  const { title, description, content } = StatusContent({
    status,
    onResendVerification: handleResendVerification
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center">
              <StatusIcon status={status} />
            </div>
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {content && (
            <div className="space-y-4">
              {content}

              {/* Additional Links */}
              <div className="pt-4 border-t">
                <div className="text-center space-y-2 text-sm text-muted-foreground">
                  <div>
                    <Link href="/" className="hover:underline">
                      Back to Home
                    </Link>
                    {' • '}
                    <Link href="/help" className="hover:underline">
                      Help Center
                    </Link>
                  </div>
                  <div>
                    Need assistance?{' '}
                    <Link href="/support" className="text-primary hover:underline">
                      Contact Support
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {status === 'verifying' && (
            <div className="text-center text-sm text-muted-foreground">
              This may take a few moments...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="animate-pulse">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    }>
      <VerifyPageContent />
    </Suspense>
  );
}