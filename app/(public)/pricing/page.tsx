'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  X,
  DollarSign,
  Users,
  Calendar,
  CreditCard,
  Ticket,
  TrendingUp,
  Shield,
  Zap,
  ArrowRight,
  HelpCircle,
  Sparkles,
  Gift,
  Percent
} from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <Link href="/" className="text-2xl font-bold text-primary-600 hover:text-primary-700">
                Stepperslife Events
              </Link>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/login">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-green-600 text-white text-base px-4 py-2">
            <Gift className="w-4 h-4 mr-2 inline" />
            First 5 Paid Tickets FREE - Try Risk-Free!
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Free events are 100% free. Paid events: just $0.75 per ticket (or as low as $0.30 with credits).
          </p>
          <p className="text-lg text-gray-500 mb-6">
            No subscriptions. No contracts. No surprises. Up to 5,000 free tickets per year included.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Check className="w-4 h-4 text-green-600" />
              5,000 free tickets/year
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-4 h-4 text-green-600" />
              First 5 paid tickets FREE
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-4 h-4 text-green-600" />
              Credits never expire
            </span>
          </div>
        </div>
      </section>

      {/* Main Pricing Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Pricing Tiers */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Free Events */}
          <Card className="border-2 border-green-200 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-green-600 text-white">Most Popular</Badge>
            </div>
            <CardHeader className="text-center pb-8 pt-8">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Gift className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl mb-2">Free Events</CardTitle>
              <CardDescription>Perfect for community meetups</CardDescription>
              <div className="mt-6">
                <div className="text-5xl font-bold text-gray-900">$0</div>
                <div className="text-gray-600 mt-2">Per ticket, forever</div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">100% Free</div>
                  <div className="text-sm text-gray-600">No platform fees on free tickets</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">Unlimited Registrations</div>
                  <div className="text-sm text-gray-600">Host events for any size audience</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">All Core Features</div>
                  <div className="text-sm text-gray-600">QR check-in, analytics, email tickets</div>
                </div>
              </div>
              <div className="space-y-2 pt-4">
                <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                  <Link href="/auth/login">
                    Create Free Event
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="w-full">
                  <Link href="/pricing/free">Learn More</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pay As You Sell */}
          <Card className="border-2 border-primary-200">
            <CardHeader className="text-center pb-8">
              <div className="mx-auto w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <Ticket className="w-6 h-6 text-primary-600" />
              </div>
              <CardTitle className="text-2xl mb-2">Pay As You Sell</CardTitle>
              <CardDescription>Simple per-ticket pricing</CardDescription>
              <div className="mt-6">
                <div className="text-5xl font-bold text-gray-900">$0.75</div>
                <div className="text-gray-600 mt-2">Per paid ticket sold</div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">Only Pay When You Sell</div>
                  <div className="text-sm text-gray-600">No upfront costs or monthly fees</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">Unlimited Events</div>
                  <div className="text-sm text-gray-600">Create as many events as you want</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">All Premium Features</div>
                  <div className="text-sm text-gray-600">Multi-tier pricing, analytics, check-in</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">Pass Fees to Customers</div>
                  <div className="text-sm text-gray-600">Optional booking fee on checkout</div>
                </div>
              </div>
              <div className="space-y-2 pt-4">
                <Button asChild className="w-full">
                  <Link href="/auth/login">
                    Start Selling
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="w-full">
                  <Link href="/pricing/pay-as-you-go">Learn More</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Prepaid Credits */}
          <Card className="border-2 border-secondary-200 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-secondary-600 text-white">Best Value</Badge>
            </div>
            <CardHeader className="text-center pb-8 pt-8">
              <div className="mx-auto w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-secondary-600" />
              </div>
              <CardTitle className="text-2xl mb-2">Prepaid Credits</CardTitle>
              <CardDescription>Save up to 60% with bulk credits</CardDescription>
              <div className="mt-6">
                <div className="text-5xl font-bold text-gray-900">$0.30</div>
                <div className="text-gray-600 mt-2">Per ticket (with $300+ credit)</div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">Up to 60% Savings</div>
                  <div className="text-sm text-gray-600">Bulk discounts from 10% to 60% off</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">Credits Never Expire</div>
                  <div className="text-sm text-gray-600">Use them whenever you need</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">Flexible Packages</div>
                  <div className="text-sm text-gray-600">From $50 to $1,000+ credit bundles</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">Priority Support</div>
                  <div className="text-sm text-gray-600">Dedicated assistance for bulk buyers</div>
                </div>
              </div>
              <div className="space-y-2 pt-4">
                <Button asChild className="w-full bg-secondary-600 hover:bg-secondary-700">
                  <Link href="/auth/login">
                    Buy Credits
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="w-full">
                  <Link href="/pricing/prepaid-credits">Learn More</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Prepaid Credits Pricing Table */}
        <Card className="mb-16 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
          <CardHeader className="text-center">
            <Percent className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Prepaid Credit Packages</CardTitle>
            <CardDescription>Bigger purchases = bigger savings. Credits never expire.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-4xl mx-auto">
              <div className="overflow-x-auto">
                <table className="w-full bg-white rounded-lg overflow-hidden">
                  <thead className="bg-purple-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold">Package</th>
                      <th className="px-6 py-4 text-left font-semibold">You Pay</th>
                      <th className="px-6 py-4 text-left font-semibold">Discount</th>
                      <th className="px-6 py-4 text-left font-semibold">Per Ticket Cost</th>
                      <th className="px-6 py-4 text-left font-semibold">Savings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-purple-50">
                      <td className="px-6 py-4 font-medium">$50 Credit</td>
                      <td className="px-6 py-4">$45</td>
                      <td className="px-6 py-4"><Badge variant="secondary">10% off</Badge></td>
                      <td className="px-6 py-4 font-semibold text-green-600">$0.68</td>
                      <td className="px-6 py-4 text-sm text-gray-600">Save $5</td>
                    </tr>
                    <tr className="hover:bg-purple-50">
                      <td className="px-6 py-4 font-medium">$100 Credit</td>
                      <td className="px-6 py-4">$80</td>
                      <td className="px-6 py-4"><Badge variant="secondary">20% off</Badge></td>
                      <td className="px-6 py-4 font-semibold text-green-600">$0.60</td>
                      <td className="px-6 py-4 text-sm text-gray-600">Save $20</td>
                    </tr>
                    <tr className="hover:bg-purple-50">
                      <td className="px-6 py-4 font-medium">$200 Credit</td>
                      <td className="px-6 py-4">$140</td>
                      <td className="px-6 py-4"><Badge variant="secondary">30% off</Badge></td>
                      <td className="px-6 py-4 font-semibold text-green-600">$0.53</td>
                      <td className="px-6 py-4 text-sm text-gray-600">Save $60</td>
                    </tr>
                    <tr className="hover:bg-purple-50 bg-purple-100 border-2 border-purple-400">
                      <td className="px-6 py-4 font-bold">$300 Credit</td>
                      <td className="px-6 py-4 font-bold">$180</td>
                      <td className="px-6 py-4"><Badge className="bg-purple-600">40% off</Badge></td>
                      <td className="px-6 py-4 font-bold text-green-600">$0.45</td>
                      <td className="px-6 py-4 font-semibold text-purple-600">Save $120</td>
                    </tr>
                    <tr className="hover:bg-purple-50">
                      <td className="px-6 py-4 font-medium">$500 Credit</td>
                      <td className="px-6 py-4">$250</td>
                      <td className="px-6 py-4"><Badge className="bg-purple-700">50% off</Badge></td>
                      <td className="px-6 py-4 font-semibold text-green-600">$0.38</td>
                      <td className="px-6 py-4 text-sm text-gray-600">Save $250</td>
                    </tr>
                    <tr className="hover:bg-purple-50">
                      <td className="px-6 py-4 font-medium">$1,000 Credit</td>
                      <td className="px-6 py-4">$400</td>
                      <td className="px-6 py-4"><Badge className="bg-purple-800">60% off</Badge></td>
                      <td className="px-6 py-4 font-semibold text-green-600">$0.30</td>
                      <td className="px-6 py-4 text-sm text-gray-600">Save $600</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Credits are deducted automatically as you sell tickets. No expiration date.
                </p>
                <Button size="lg" asChild>
                  <Link href="/dashboard/billing">
                    View All Packages
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Comparison Examples */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            How It Compares
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            See exactly what you keep from each ticket sale, depending on your pricing plan
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* $25 Ticket Example */}
            <Card className="border-2 border-blue-200">
              <CardHeader className="text-center bg-gradient-to-br from-blue-50 to-blue-100">
                <CardTitle className="text-xl">$25 Ticket</CardTitle>
                <CardDescription>Small event / workshop pricing</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ticket Price</span>
                    <span className="font-semibold">$25.00</span>
                  </div>
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Pay-As-You-Go ($0.75)</span>
                      <span className="text-red-600">-$0.75</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Payment Processing</span>
                      <span className="text-red-600">-$1.03</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2">
                      <span className="text-green-700">You Keep</span>
                      <span className="text-green-700">$23.22</span>
                    </div>
                    <div className="text-center text-xs text-gray-500">
                      92.9% of ticket price
                    </div>
                  </div>
                  <div className="border-t pt-3 space-y-2 bg-purple-50 -mx-6 px-6 py-3">
                    <div className="text-xs font-semibold text-purple-700 mb-2">WITH PREPAID CREDITS ($0.30)</div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Credit Fee</span>
                      <span className="text-red-600">-$0.30</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Payment Processing</span>
                      <span className="text-red-600">-$1.03</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-purple-200 pt-2">
                      <span className="text-purple-700">You Keep</span>
                      <span className="text-purple-700">$23.67</span>
                    </div>
                    <div className="text-center text-xs text-purple-600 font-semibold">
                      94.7% of ticket price - Save $0.45!
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* $50 Ticket Example */}
            <Card className="border-2 border-green-200">
              <CardHeader className="text-center bg-gradient-to-br from-green-50 to-green-100">
                <CardTitle className="text-xl">$50 Ticket</CardTitle>
                <CardDescription>Medium-sized event pricing</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ticket Price</span>
                    <span className="font-semibold">$50.00</span>
                  </div>
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Pay-As-You-Go ($0.75)</span>
                      <span className="text-red-600">-$0.75</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Payment Processing</span>
                      <span className="text-red-600">-$1.75</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2">
                      <span className="text-green-700">You Keep</span>
                      <span className="text-green-700">$47.50</span>
                    </div>
                    <div className="text-center text-xs text-gray-500">
                      95.0% of ticket price
                    </div>
                  </div>
                  <div className="border-t pt-3 space-y-2 bg-purple-50 -mx-6 px-6 py-3">
                    <div className="text-xs font-semibold text-purple-700 mb-2">WITH PREPAID CREDITS ($0.30)</div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Credit Fee</span>
                      <span className="text-red-600">-$0.30</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Payment Processing</span>
                      <span className="text-red-600">-$1.75</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-purple-200 pt-2">
                      <span className="text-purple-700">You Keep</span>
                      <span className="text-purple-700">$47.95</span>
                    </div>
                    <div className="text-center text-xs text-purple-600 font-semibold">
                      95.9% of ticket price - Save $0.45!
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* $100 Ticket Example */}
            <Card className="border-2 border-orange-200">
              <CardHeader className="text-center bg-gradient-to-br from-orange-50 to-orange-100">
                <CardTitle className="text-xl">$100 Ticket</CardTitle>
                <CardDescription>Premium event / VIP pricing</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ticket Price</span>
                    <span className="font-semibold">$100.00</span>
                  </div>
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Pay-As-You-Go ($0.75)</span>
                      <span className="text-red-600">-$0.75</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Payment Processing</span>
                      <span className="text-red-600">-$3.20</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2">
                      <span className="text-green-700">You Keep</span>
                      <span className="text-green-700">$96.05</span>
                    </div>
                    <div className="text-center text-xs text-gray-500">
                      96.1% of ticket price
                    </div>
                  </div>
                  <div className="border-t pt-3 space-y-2 bg-purple-50 -mx-6 px-6 py-3">
                    <div className="text-xs font-semibold text-purple-700 mb-2">WITH PREPAID CREDITS ($0.30)</div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Credit Fee</span>
                      <span className="text-red-600">-$0.30</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Payment Processing</span>
                      <span className="text-red-600">-$3.20</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-purple-200 pt-2">
                      <span className="text-purple-700">You Keep</span>
                      <span className="text-purple-700">$96.50</span>
                    </div>
                    <div className="text-center text-xs text-purple-600 font-semibold">
                      96.5% of ticket price - Save $0.45!
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
            <CreditCard className="w-12 h-12 text-amber-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Pass Fees to Customers (Optional)</CardTitle>
            <CardDescription className="text-base">
              You can choose to add a small booking fee at checkout, so you keep 100% of your ticket price
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-lg p-8">
                <div className="grid md:grid-cols-2 gap-8 mb-6">
                  <div>
                    <h4 className="font-bold text-lg mb-4 text-gray-900">Without Booking Fee</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Attendee Pays</span>
                        <span className="font-semibold">$25.00</span>
                      </div>
                      <div className="flex justify-between text-sm text-red-600">
                        <span>Platform Fee</span>
                        <span>-$0.75</span>
                      </div>
                      <div className="flex justify-between text-sm text-red-600">
                        <span>Payment Processing</span>
                        <span>-$1.03</span>
                      </div>
                      <div className="flex justify-between font-bold pt-2 border-t">
                        <span>You Receive</span>
                        <span className="text-green-600">$23.22</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-l-2 border-amber-200 pl-8">
                    <h4 className="font-bold text-lg mb-4 text-gray-900">With Booking Fee</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Ticket Price</span>
                        <span>$25.00</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>+ Booking Fee</span>
                        <span>+$1.78</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium border-b pb-2">
                        <span>Attendee Pays</span>
                        <span>$26.78</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Less Fees</span>
                        <span>-$1.78</span>
                      </div>
                      <div className="flex justify-between font-bold pt-2 border-t">
                        <span>You Receive</span>
                        <span className="text-green-600">$25.00</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700 text-center">
                    <strong>Your choice:</strong> Absorb the fees yourself or pass them to attendees via a small booking fee.
                    Either way, you stay competitive and in control.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What's Included */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Everything Included
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            All pricing plans include the full suite of features. No upgrades needed.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Shield className="w-10 h-10 text-primary-600 mb-4" />
                <CardTitle>Secure Payments</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                PCI-compliant payment processing with Square. Bank-level security for all transactions.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="w-10 h-10 text-primary-600 mb-4" />
                <CardTitle>Instant Setup</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                Create and publish your event in under 5 minutes. No approval process required.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="w-10 h-10 text-primary-600 mb-4" />
                <CardTitle>Real-Time Analytics</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                Live dashboards showing sales, revenue, attendance, and conversion metrics.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CreditCard className="w-10 h-10 text-primary-600 mb-4" />
                <CardTitle>Flexible Ticket Types</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                GA, VIP, Early Bird, group discounts, promo codes - unlimited pricing tiers.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="w-10 h-10 text-primary-600 mb-4" />
                <CardTitle>Attendee Management</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                QR code check-in, guest lists, order management, automated confirmations.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Ticket className="w-10 h-10 text-primary-600 mb-4" />
                <CardTitle>Digital Tickets</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                Instant QR tickets via email. Compatible with Apple Wallet and Google Pay.
              </CardContent>
            </Card>
          </div>
        </div>

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
                  Are free events really free?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                Yes! Free events have zero platform fees. No hidden charges, no small print. Host unlimited free events forever.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-lg">
                  <HelpCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  What about payment processing fees?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                Square charges standard payment processing rates: 2.9% + $0.30 per transaction. This goes directly to Square, not us. It's the same rate they charge everyone.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-lg">
                  <HelpCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  Do prepaid credits expire?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                Never! Your credits remain in your account indefinitely. Buy in bulk when it makes sense for you, use them whenever you need them.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-lg">
                  <HelpCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  Can I switch between pricing plans?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                Absolutely! Use pay-as-you-go for some events and credits for others. Your account automatically uses credits if available, otherwise charges the $0.75 per-ticket rate.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-lg">
                  <HelpCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  When do I get paid?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                Payouts are processed automatically 7 days after your event ends. This protects both organizers and attendees in case of refunds or last-minute changes. You can track your balance in real-time.
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
                You can enable an optional booking fee at checkout that covers your platform and processing fees. This means you keep 100% of your ticket price, while attendees pay a small service fee (typically $1-3 depending on ticket price). It's completely optional.
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
                No monthly fees, no subscriptions, no contracts. You only pay when you sell paid tickets. Cancel anytime. Keep using the platform for free events forever.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-lg">
                  <HelpCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  What if I need a custom pricing plan?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                For high-volume organizers (500+ tickets/month), we offer custom enterprise pricing with negotiated rates. Contact our team to discuss volume discounts and dedicated support.
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Selling Tickets?</h2>
            <p className="text-xl text-primary-50 mb-8 max-w-2xl mx-auto">
              Join the stepping community's favorite event platform. No credit card required to start.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/auth/login">
                  Create Your First Event Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white text-primary-600 hover:bg-primary-50" asChild>
                <Link href="/events">
                  Browse Events
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
