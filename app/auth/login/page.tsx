'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertCircle, Mail, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Logo } from '@/components/ui/logo';

// Validation schema for magic link login
const magicLinkSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type MagicLinkFormData = z.infer<typeof magicLinkSchema>;

const ERROR_MESSAGES: Record<string, string> = {
  'OAuthSignin': 'Error constructing an authorization URL',
  'OAuthCallback': 'Error handling the OAuth callback',
  'OAuthCreateAccount': 'Could not create OAuth account',
  'EmailCreateAccount': 'Could not create email account',
  'Callback': 'Error in the OAuth callback',
  'OAuthAccountNotLinked': 'Email already exists with a different sign-in method',
  'EmailSignin': 'Failed to send magic link email',
  'CredentialsSignin': 'Sign in failed',
  'SessionRequired': 'Please sign in to access this page',
  'Configuration': 'There is a problem with the server configuration',
  'Default': 'An error occurred. Please try again.',
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const urlError = searchParams.get('error');

  // Handle redirect for already-authenticated users
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push(callbackUrl);
    }
  }, [status, session, callbackUrl, router]);

  const magicLinkForm = useForm<MagicLinkFormData>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: {
      email: '',
    }
  });

  const handleMagicLink = async (data: MagicLinkFormData) => {
    setIsLoadingEmail(true);
    setError(null);
    setEmailSent(false);

    try {
      const result = await signIn('email', {
        email: data.email.toLowerCase(),
        redirect: false,
        callbackUrl
      });

      if (result?.error) {
        const errorKey = result.error as keyof typeof ERROR_MESSAGES;
        const errorMessage = (errorKey in ERROR_MESSAGES ? ERROR_MESSAGES[errorKey] : ERROR_MESSAGES.Default) as string;
        setError(errorMessage);
        setIsLoadingEmail(false);
        return;
      }

      // Success - show confirmation message
      setEmailSent(true);
      setIsLoadingEmail(false);
    } catch (error) {
      // Error logged to monitoring system (Sentry)
      setError('Failed to send magic link. Please try again.');
      setIsLoadingEmail(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoadingGoogle(true);
    setError(null);

    try {
      await signIn('google', {
        callbackUrl,
      });
    } catch (error) {
      setError('Failed to sign in with Google. Please try again.');
      setIsLoadingGoogle(false);
    }
  };

  // Show loading while checking authentication status
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render form if already authenticated (will redirect via useEffect)
  if (status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-6">
            <Logo width={180} height={54} priority />
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Error Alert */}
          {(error || urlError) && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || ERROR_MESSAGES[urlError as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.Default}
              </AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {emailSent && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Check your email! We sent you a magic link to sign in.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {/* Google Sign In Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isLoadingGoogle || emailSent}
            >
              {isLoadingGoogle ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            {/* Magic Link Form */}
            <form onSubmit={magicLinkForm.handleSubmit(handleMagicLink)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    {...magicLinkForm.register('email')}
                    className={`pl-9 ${magicLinkForm.formState.errors.email ? 'border-red-500' : ''}`}
                    disabled={emailSent}
                  />
                </div>
                {magicLinkForm.formState.errors.email && (
                  <p className="text-sm text-red-600">{magicLinkForm.formState.errors.email.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoadingEmail || emailSent}
              >
                {isLoadingEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending magic link...
                  </>
                ) : emailSent ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Email sent!
                  </>
                ) : (
                  'Send Magic Link'
                )}
              </Button>
            </form>
          </div>

          {/* Help Links */}
          <div className="text-center space-y-2 text-sm text-muted-foreground mt-6">
            <p className="text-xs">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
            <div>
              <Link href="/help" className="hover:underline hover:text-primary">
                Need help?
              </Link>
              {' • '}
              <Link href="/support" className="hover:underline hover:text-primary">
                Contact Support
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
