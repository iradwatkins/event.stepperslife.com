'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  Ticket,
  DollarSign,
  CreditCard,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  HelpCircle,
  Calculator,
  Calendar,
  Shield,
  Zap,
  Gift,
  Percent,
  Users
} from 'lucide-react';

export default function PayAsYouGoPricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-primary-600">Home</Link>
            <span>/</span>
            <Link href="/pricing" className="hover:text-primary-600">Pricing</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Pay-As-You-Go</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-600 rounded-full mb-6">
            <Ticket className="w-10 h-10 text-white" />
          </div>
          <Badge className="mb-4 bg-green-600 text-white">
            <Gift className="w-3 h-3 mr-1 inline" />
            First 5 Tickets FREE
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Pay-As-You-Go Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Try risk-free with 5 free paid tickets, then pay just $0.75 per ticket. No monthly fees, no contracts. Perfect for occasional events or getting started.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/login">
                Start Selling Tickets
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Pricing
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Free Trial Highlight */}
        <Card className="mb-16 border-4 border-green-600 shadow-xl">
          <CardContent className="p-12">
            <div className="text-center max-w-3xl mx-auto">
              <Gift className="w-16 h-16 text-green-600 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Try Before You Pay: First 5 Tickets FREE
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                We want you to experience the platform risk-free. Your first 5 paid tickets are completely free - no platform fees, no commitment. After that, it's just $0.75 per ticket.
              </p>
              <div className="bg-green-50 rounded-lg p-6">
                <div className="grid md:grid-cols-2 gap-6 text-left">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Perfect for testing:</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>See how the platform works</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Test the checkout experience</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Try QR check-in features</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Automatically switches:</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>After 5th ticket sold</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>No action required from you</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Track usage in dashboard</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Breakdown */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Know exactly what you'll pay with every ticket sold
          </p>
          <Card className="border-2 border-primary-200 max-w-2xl mx-auto">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="text-6xl font-bold text-primary-600 mb-2">$0.75</div>
                <div className="text-xl text-gray-600">Per Ticket Sold</div>
              </div>
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-700">Platform Fee</span>
                  <span className="font-bold text-primary-600">$0.75 per ticket</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-700">Payment Processing (Square)</span>
                  <span className="font-bold text-gray-900">2.9% + $0.30</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-700">Monthly Fees</span>
                  <span className="font-bold text-green-600">$0</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-700">Setup Costs</span>
                  <span className="font-bold text-green-600">$0</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-700">Contracts</span>
                  <span className="font-bold text-green-600">None</span>
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-700">
                  <strong>Competitive advantage:</strong> Ticket Tailor charges $0.85 per ticket. You save $0.10 per ticket with Stepperslife Events!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Examples */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Real Pricing Examples
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            See exactly what you'll earn with different ticket prices
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {/* $15 Ticket */}
            <Card className="border-2 border-blue-200">
              <CardHeader className="text-center bg-gradient-to-br from-blue-50 to-blue-100">
                <CardTitle className="text-xl">$15 Ticket</CardTitle>
                <CardDescription>Small event pricing</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ticket Price</span>
                    <span className="font-semibold">$15.00</span>
                  </div>
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Platform Fee</span>
                      <span className="text-red-600">-$0.75</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Payment Processing</span>
                      <span className="text-red-600">-$0.74</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2 text-lg">
                      <span className="text-green-700">You Keep</span>
                      <span className="text-green-700">$13.51</span>
                    </div>
                    <div className="text-center text-xs text-gray-500 bg-gray-50 py-2 rounded">
                      90.1% of ticket price
                    </div>
                  </div>
                  <div className="border-t pt-3 mt-4">
                    <div className="text-xs font-semibold text-gray-600 mb-2">50 tickets sold:</div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Revenue</span>
                      <span className="font-bold text-green-600">$675.50</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* $35 Ticket */}
            <Card className="border-2 border-green-200">
              <CardHeader className="text-center bg-gradient-to-br from-green-50 to-green-100">
                <CardTitle className="text-xl">$35 Ticket</CardTitle>
                <CardDescription>Medium event pricing</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ticket Price</span>
                    <span className="font-semibold">$35.00</span>
                  </div>
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Platform Fee</span>
                      <span className="text-red-600">-$0.75</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Payment Processing</span>
                      <span className="text-red-600">-$1.32</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2 text-lg">
                      <span className="text-green-700">You Keep</span>
                      <span className="text-green-700">$32.93</span>
                    </div>
                    <div className="text-center text-xs text-gray-500 bg-gray-50 py-2 rounded">
                      94.1% of ticket price
                    </div>
                  </div>
                  <div className="border-t pt-3 mt-4">
                    <div className="text-xs font-semibold text-gray-600 mb-2">100 tickets sold:</div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Revenue</span>
                      <span className="font-bold text-green-600">$3,293.00</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* $75 Ticket */}
            <Card className="border-2 border-purple-200">
              <CardHeader className="text-center bg-gradient-to-br from-purple-50 to-purple-100">
                <CardTitle className="text-xl">$75 Ticket</CardTitle>
                <CardDescription>Premium event pricing</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ticket Price</span>
                    <span className="font-semibold">$75.00</span>
                  </div>
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Platform Fee</span>
                      <span className="text-red-600">-$0.75</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Payment Processing</span>
                      <span className="text-red-600">-$2.48</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2 text-lg">
                      <span className="text-green-700">You Keep</span>
                      <span className="text-green-700">$71.77</span>
                    </div>
                    <div className="text-center text-xs text-gray-500 bg-gray-50 py-2 rounded">
                      95.7% of ticket price
                    </div>
                  </div>
                  <div className="border-t pt-3 mt-4">
                    <div className="text-xs font-semibold text-gray-600 mb-2">200 tickets sold:</div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Revenue</span>
                      <span className="font-bold text-green-600">$14,354.00</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Booking Fee Option */}
        <Card className="mb-16 bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200">
          <CardHeader className="text-center">
            <Percent className="w-12 h-12 text-amber-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Optional Booking Fee</CardTitle>
            <CardDescription className="text-base">
              Pass fees to customers and keep 100% of your ticket price
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Without Booking Fee</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Customer Pays</span>
                        <span className="font-semibold">$35.00</span>
                      </div>
                      <div className="flex justify-between text-sm text-red-600">
                        <span>Platform Fee</span>
                        <span>-$0.75</span>
                      </div>
                      <div className="flex justify-between text-sm text-red-600">
                        <span>Processing</span>
                        <span>-$1.32</span>
                      </div>
                      <div className="flex justify-between font-bold pt-2 border-t">
                        <span>You Receive</span>
                        <span className="text-green-600">$32.93</span>
                      </div>
                      <div className="text-xs text-center text-gray-500 mt-2">
                        You absorb $2.07 in fees
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-amber-400">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      With Booking Fee
                      <Badge className="bg-amber-600">Recommended</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Ticket Price</span>
                        <span>$35.00</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>+ Booking Fee</span>
                        <span>+$2.07</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium border-b pb-2">
                        <span>Customer Pays</span>
                        <span>$37.07</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Less All Fees</span>
                        <span>-$2.07</span>
                      </div>
                      <div className="flex justify-between font-bold pt-2 border-t">
                        <span>You Receive</span>
                        <span className="text-green-600">$35.00</span>
                      </div>
                      <div className="text-xs text-center text-amber-600 font-semibold mt-2">
                        Keep 100% of ticket price!
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-white rounded-lg p-6 text-center">
                <p className="text-gray-700">
                  <strong>You decide:</strong> The booking fee is completely optional and can be toggled per event. Many successful events use this model to maintain competitive pricing while maximizing revenue.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* When You Get Paid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How Payment Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-primary-200">
              <CardHeader>
                <CreditCard className="w-10 h-10 text-primary-600 mb-4" />
                <CardTitle>Instant Collection</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                When customers buy tickets, payment is processed immediately through Square. Funds are held securely until payout.
              </CardContent>
            </Card>

            <Card className="border-2 border-primary-200">
              <CardHeader>
                <Calendar className="w-10 h-10 text-primary-600 mb-4" />
                <CardTitle>7-Day Payout</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                Payouts are automatically processed 7 days after your event ends. This protects both you and attendees from last-minute changes.
              </CardContent>
            </Card>

            <Card className="border-2 border-primary-200">
              <CardHeader>
                <TrendingUp className="w-10 h-10 text-primary-600 mb-4" />
                <CardTitle>Real-Time Tracking</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                View your balance, pending payouts, and transaction history in your dashboard. Export reports anytime for accounting.
              </CardContent>
            </Card>
          </div>
        </div>

        {/* When to Use This vs Credits */}
        <Card className="mb-16 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
          <CardHeader className="text-center">
            <Calculator className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Pay-As-You-Go vs. Prepaid Credits</CardTitle>
            <CardDescription className="text-base">
              Not sure which plan is right for you? Here's a quick guide.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-4">
                    Use Pay-As-You-Go If:
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">You're hosting 1-5 events per year</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">You're just testing the platform</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">You want zero upfront costs</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Your events are unpredictable or seasonal</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-4">
                    Consider Credits If:
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">You're selling 200+ tickets per year</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">You host recurring events monthly/weekly</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">You want to save 10-60% per ticket</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">You prefer bulk purchasing for savings</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mt-8 text-center">
                <Button size="lg" variant="outline" asChild>
                  <Link href="/pricing/prepaid-credits">
                    Compare Prepaid Credits
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-lg">
                  <HelpCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  How does the "first 5 tickets free" trial work?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                The first 5 paid tickets you sell across all your events have no platform fee ($0 instead of $0.75). After your 5th ticket sale, the standard $0.75 fee applies automatically. You'll still pay Square's payment processing fees (2.9% + $0.30) even during the trial.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-lg">
                  <HelpCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  Are there any monthly fees or contracts?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                No monthly fees, no subscriptions, no contracts. You only pay the $0.75 per-ticket fee when you actually sell tickets. If you don't sell tickets in a month, you pay nothing. Cancel or stop using the platform anytime.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-lg">
                  <HelpCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  What's the difference between platform fee and payment processing?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                The platform fee ($0.75) goes to Stepperslife Events for using our software, features, and support. Payment processing (2.9% + $0.30) goes to Square for handling credit card transactions securely. These are separate fees, but both are automatically deducted from each sale.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-lg">
                  <HelpCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  Can I switch to prepaid credits later?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                Yes! You can purchase prepaid credits at any time. Once you have credits, they're used automatically for ticket sales instead of the $0.75 per-ticket rate. If credits run out, you automatically switch back to pay-as-you-go.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-lg">
                  <HelpCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  When exactly do I receive my payout?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                Payouts are processed automatically 7 days after your event end date. For example, if your event ends on Saturday, you'll receive payout the following Saturday. This waiting period protects against chargebacks and last-minute refunds.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-lg">
                  <HelpCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  How does the booking fee option work?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                When enabled, a small booking fee (covering platform and processing costs) is added at checkout. Attendees see the total price before completing purchase. You receive 100% of your original ticket price. This is completely optional and can be toggled per event.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-lg">
                  <HelpCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  What happens if I need to issue refunds?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                You can issue full or partial refunds through your dashboard. When you refund a ticket, the platform fee ($0.75) is also refunded to you. However, Square's payment processing fees are not refundable (this is Square's policy, not ours).
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-lg">
                  <HelpCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  Is there a limit on how many events I can create?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                No limits! Create unlimited events and sell unlimited tickets. You only pay the $0.75 per-ticket fee for each paid ticket sold. Host as many events as you want simultaneously or throughout the year.
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Start Selling Tickets Today</h2>
            <p className="text-xl text-primary-50 mb-8 max-w-2xl mx-auto">
              Try risk-free with 5 free tickets, then pay only when you sell. No credit card required to start.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/auth/login">
                  Create Your First Event
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white text-primary-600 hover:bg-primary-50" asChild>
                <Link href="/pricing">
                  Compare All Plans
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
