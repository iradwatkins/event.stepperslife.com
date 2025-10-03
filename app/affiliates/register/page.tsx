'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Loader2,
  DollarSign,
  TrendingUp,
  Users,
  Gift
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

import {
  affiliateRegistrationSchema,
  type AffiliateRegistrationForm,
  type AffiliateRegistrationResponse,
  type PasswordStrength
} from '@/types/affiliate';

/**
 * Password strength checker with comprehensive feedback
 * Validates password complexity and provides user-friendly guidance
 */
const checkPasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  const feedback: string[] = [];
  const maxScore = 5;

  // Length check
  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('At least 8 characters');
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push('One lowercase letter');
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('One uppercase letter');
  }

  // Number check
  if (/\d/.test(password)) {
    score++;
  } else {
    feedback.push('One number');
  }

  // Special character check
  if (/[^A-Za-z0-9]/.test(password)) {
    score++;
  } else {
    feedback.push('One special character');
  }

  // Determine color and strength label
  let color = 'bg-red-500';
  let strength: PasswordStrength['strength'] = 'weak';

  if (score === 5) {
    color = 'bg-green-600';
    strength = 'very-strong';
  } else if (score === 4) {
    color = 'bg-green-500';
    strength = 'strong';
  } else if (score === 3) {
    color = 'bg-yellow-500';
    strength = 'good';
  } else if (score === 2) {
    color = 'bg-orange-500';
    strength = 'fair';
  }

  return { score, maxScore, feedback, color, strength };
};

/**
 * Affiliate Registration Page
 *
 * Comprehensive registration form for new affiliates with:
 * - Multi-step validation
 * - Password strength indicators
 * - Real-time feedback
 * - Accessibility features
 * - Mobile-responsive design
 */
export default function AffiliateRegisterPage() {
  const router = useRouter();

  // Form state management
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize form with React Hook Form and Zod validation
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm<AffiliateRegistrationForm>({
    resolver: zodResolver(affiliateRegistrationSchema),
    mode: 'onChange',
    defaultValues: {
      marketingOptIn: false,
      termsAccepted: false,
      affiliateAgreement: false,
      businessName: '',
      taxId: ''
    }
  });

  // Watch password field for strength indicator
  const password = watch('password', '');
  const passwordStrength = password ? checkPasswordStrength(password) : null;

  /**
   * Handle form submission
   * Validates data and sends registration request to API
   */
  const onSubmit = async (data: AffiliateRegistrationForm) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...registrationData } = data;

      const response = await fetch('/api/affiliates/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registrationData)
      });

      const result: AffiliateRegistrationResponse = await response.json();

      if (!response.ok) {
        // Handle validation errors
        if (result.details && result.details.length > 0) {
          const errorMessages = result.details.map(d => d.message).join('. ');
          throw new Error(errorMessages);
        }
        throw new Error(result.error || 'Registration failed. Please try again.');
      }

      // Success! Show success screen
      setRegistrationSuccess(true);

    } catch (error) {
      console.error('Affiliate registration error:', error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // SUCCESS SCREEN
  // ============================================================================

  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 px-4 py-12">
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader className="text-center space-y-6 pb-8">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-green-600">
              Application Submitted Successfully!
            </CardTitle>
            <CardDescription className="text-base">
              Thank you for applying to become a SteppersLife Events affiliate.
              We're excited to review your application!
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <Alert className="border-green-200 bg-green-50">
              <AlertCircle className="h-5 w-5 text-green-600" />
              <AlertDescription className="text-green-800 ml-2">
                <strong>Check your email!</strong> We've sent you a confirmation
                with your application ID and next steps.
              </AlertDescription>
            </Alert>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-lg mb-3">What happens next?</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-bold">1</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    <strong>Review Process:</strong> Our team will review your
                    application within 2-3 business days
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-bold">2</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    <strong>Email Notification:</strong> You'll receive an email
                    once your application is approved
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-bold">3</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    <strong>Dashboard Access:</strong> Upon approval, you'll get
                    instant access to your affiliate dashboard
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-bold">4</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    <strong>Start Earning:</strong> Generate tracking links and
                    start earning commissions immediately
                  </p>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.push('/')}
              >
                Back to Home
              </Button>
              <Button
                className="flex-1"
                onClick={() => router.push('/auth/login')}
              >
                Sign In to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================================================
  // REGISTRATION FORM
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Join the Affiliate Program
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Earn commissions by promoting events. Start generating income today!
          </p>
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center p-4 bg-white/80 backdrop-blur">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <h3 className="font-semibold text-sm">High Commission</h3>
            <p className="text-xs text-gray-600">Up to 20% per sale</p>
          </Card>
          <Card className="text-center p-4 bg-white/80 backdrop-blur">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <h3 className="font-semibold text-sm">Real-time Tracking</h3>
            <p className="text-xs text-gray-600">Live sales dashboard</p>
          </Card>
          <Card className="text-center p-4 bg-white/80 backdrop-blur">
            <Users className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <h3 className="font-semibold text-sm">Dedicated Support</h3>
            <p className="text-xs text-gray-600">Priority assistance</p>
          </Card>
          <Card className="text-center p-4 bg-white/80 backdrop-blur">
            <Gift className="w-8 h-8 mx-auto mb-2 text-pink-600" />
            <h3 className="font-semibold text-sm">Weekly Payouts</h3>
            <p className="text-xs text-gray-600">Fast payments</p>
          </Card>
        </div>

        {/* Main Registration Form */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Create Your Affiliate Account</CardTitle>
            <CardDescription>
              Fill out the form below to start your affiliate journey. All fields marked with * are required.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

              {/* Error Alert */}
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Personal Information</h3>

                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      autoComplete="given-name"
                      placeholder="John"
                      {...register('firstName')}
                      className={errors.firstName ? 'border-red-500 focus-visible:ring-red-500' : ''}
                      aria-invalid={errors.firstName ? 'true' : 'false'}
                      aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                    />
                    {errors.firstName && (
                      <p id="firstName-error" className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      autoComplete="family-name"
                      placeholder="Doe"
                      {...register('lastName')}
                      className={errors.lastName ? 'border-red-500 focus-visible:ring-red-500' : ''}
                      aria-invalid={errors.lastName ? 'true' : 'false'}
                      aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                    />
                    {errors.lastName && (
                      <p id="lastName-error" className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="john.doe@example.com"
                    {...register('email')}
                    className={errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    aria-invalid={errors.email ? 'true' : 'false'}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                  {errors.email && (
                    <p id="email-error" className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Phone Field */}
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+1 (555) 123-4567"
                    {...register('phone')}
                    className={errors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    aria-invalid={errors.phone ? 'true' : 'false'}
                    aria-describedby={errors.phone ? 'phone-error' : undefined}
                  />
                  {errors.phone && (
                    <p id="phone-error" className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.phone.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Used for account verification and payout notifications
                  </p>
                </div>
              </div>

              {/* Business Information Section (Optional) */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Business Information <span className="text-sm text-gray-500 font-normal">(Optional)</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      type="text"
                      placeholder="Your Business LLC"
                      {...register('businessName')}
                      className={errors.businessName ? 'border-red-500' : ''}
                    />
                    {errors.businessName && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.businessName.message}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      For 1099 tax reporting (if applicable)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxId">Tax ID / EIN</Label>
                    <Input
                      id="taxId"
                      type="text"
                      placeholder="XX-XXXXXXX"
                      {...register('taxId')}
                      className={errors.taxId ? 'border-red-500' : ''}
                    />
                    {errors.taxId && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.taxId.message}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Required if you earn over $600/year
                    </p>
                  </div>
                </div>
              </div>

              {/* Security Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Account Security</h3>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Create a strong password"
                      {...register('password')}
                      className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                      aria-invalid={errors.password ? 'true' : 'false'}
                      aria-describedby={errors.password ? 'password-error' : 'password-hint'}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>

                  {/* Password Strength Indicator */}
                  {passwordStrength && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                            style={{ width: `${(passwordStrength.score / passwordStrength.maxScore) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium capitalize min-w-[80px] text-right">
                          {passwordStrength.strength.replace('-', ' ')}
                        </span>
                      </div>
                      {passwordStrength.feedback.length > 0 && (
                        <div className="text-xs text-gray-600 bg-gray-50 rounded p-2">
                          <span className="font-medium">Missing: </span>
                          {passwordStrength.feedback.join(', ')}
                        </div>
                      )}
                    </div>
                  )}

                  {errors.password && (
                    <p id="password-error" className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      {...register('confirmPassword')}
                      className={errors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
                      aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                      aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <p id="confirmPassword-error" className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Legal Agreements Section */}
              <div className="space-y-4 pt-2">
                <h3 className="text-lg font-semibold border-b pb-2">Legal Agreements</h3>

                {/* Terms Acceptance */}
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="termsAccepted"
                    {...register('termsAccepted')}
                    className={errors.termsAccepted ? 'border-red-500' : ''}
                    aria-invalid={errors.termsAccepted ? 'true' : 'false'}
                    aria-describedby={errors.termsAccepted ? 'terms-error' : undefined}
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor="termsAccepted"
                      className="text-sm font-normal cursor-pointer leading-relaxed"
                    >
                      I agree to the{' '}
                      <Link
                        href="/terms"
                        className="text-blue-600 hover:underline font-medium"
                        target="_blank"
                      >
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link
                        href="/privacy"
                        className="text-blue-600 hover:underline font-medium"
                        target="_blank"
                      >
                        Privacy Policy
                      </Link>
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    {errors.termsAccepted && (
                      <p id="terms-error" className="text-sm text-red-600">
                        {errors.termsAccepted.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Affiliate Agreement */}
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="affiliateAgreement"
                    {...register('affiliateAgreement')}
                    className={errors.affiliateAgreement ? 'border-red-500' : ''}
                    aria-invalid={errors.affiliateAgreement ? 'true' : 'false'}
                    aria-describedby={errors.affiliateAgreement ? 'agreement-error' : undefined}
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor="affiliateAgreement"
                      className="text-sm font-normal cursor-pointer leading-relaxed"
                    >
                      I agree to the{' '}
                      <Link
                        href="/affiliates/agreement"
                        className="text-blue-600 hover:underline font-medium"
                        target="_blank"
                      >
                        Affiliate Agreement
                      </Link>{' '}
                      and commission structure
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    {errors.affiliateAgreement && (
                      <p id="agreement-error" className="text-sm text-red-600">
                        {errors.affiliateAgreement.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Marketing Opt-in */}
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="marketingOptIn"
                    {...register('marketingOptIn')}
                  />
                  <Label
                    htmlFor="marketingOptIn"
                    className="text-sm font-normal cursor-pointer leading-relaxed"
                  >
                    Send me affiliate tips, promotional materials, and platform updates
                  </Label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6 space-y-4">
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold"
                  disabled={isLoading || !isValid}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating Your Account...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-5 w-5" />
                      Create Affiliate Account
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link
                    href="/auth/login"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>

            </form>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>
            Questions about the affiliate program?{' '}
            <Link href="/affiliates/faq" className="text-blue-600 hover:underline">
              View FAQ
            </Link>{' '}
            or{' '}
            <Link href="/contact" className="text-blue-600 hover:underline">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
