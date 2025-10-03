'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  Sparkles,
  Percent,
  TrendingUp,
  Shield,
  ArrowRight,
  ArrowLeft,
  HelpCircle,
  Calculator,
  DollarSign,
  Award,
  Zap,
  Clock,
  Star,
  Target
} from 'lucide-react';
import { useState } from 'react';

export default function PrepaidCreditsPricingPage() {
  const [selectedPackage, setSelectedPackage] = useState(3); // $300 package by default
  const [ticketPrice, setTicketPrice] = useState(35);
  const [ticketQuantity, setTicketQuantity] = useState(100);

  const packages = [
    { credit: 50, pay: 45, discount: 10, perTicket: 0.68, savings: 5 },
    { credit: 100, pay: 80, discount: 20, perTicket: 0.60, savings: 20 },
    { credit: 200, pay: 140, discount: 30, perTicket: 0.53, savings: 60 },
    { credit: 300, pay: 180, discount: 40, perTicket: 0.45, savings: 120 },
    { credit: 500, pay: 250, discount: 50, perTicket: 0.38, savings: 250 },
    { credit: 1000, pay: 400, discount: 60, perTicket: 0.30, savings: 600 },
  ];

  const calculateSavings = () => {
    const pkg = packages[selectedPackage];
    if (!pkg) return { payAsYouGo: '0', withCredits: '0', totalSavings: '0', percentSaved: '0' };
    const payAsYouGoFee = ticketQuantity * 0.75;
    const creditFee = ticketQuantity * pkg.perTicket;
    const savings = payAsYouGoFee - creditFee;
    return {
      payAsYouGo: payAsYouGoFee.toFixed(2),
      withCredits: creditFee.toFixed(2),
      totalSavings: savings.toFixed(2),
      percentSaved: ((savings / payAsYouGoFee) * 100).toFixed(0)
    };
  };

  const calc = calculateSavings();
  const currentPackage = packages[selectedPackage] ?? packages[0]!;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-primary-600">Home</Link>
            <span>/</span>
            <Link href="/pricing" className="hover:text-primary-600">Pricing</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Prepaid Credits</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-600 rounded-full mb-6">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <Badge className="mb-4 bg-purple-600 text-white">Save 10-60% Per Ticket</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Prepaid Credits Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Buy credits in bulk and save big. Pay as low as $0.30 per ticket (60% off!). Perfect for regular event organizers who want maximum value.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-purple-600 hover:bg-purple-700">
              <Link href="/auth/login">
                Buy Prepaid Credits
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
        {/* Key Benefits */}
        <div className="mb-16 grid md:grid-cols-4 gap-6">
          <Card className="border-2 border-purple-200 text-center">
            <CardContent className="pt-6">
              <Percent className="w-10 h-10 text-purple-600 mx-auto mb-3" />
              <div className="font-bold text-2xl text-purple-600 mb-1">Up to 60%</div>
              <div className="text-sm text-gray-600">Discount on tickets</div>
            </CardContent>
          </Card>
          <Card className="border-2 border-purple-200 text-center">
            <CardContent className="pt-6">
              <Clock className="w-10 h-10 text-purple-600 mx-auto mb-3" />
              <div className="font-bold text-2xl text-purple-600 mb-1">Never Expire</div>
              <div className="text-sm text-gray-600">Use credits anytime</div>
            </CardContent>
          </Card>
          <Card className="border-2 border-purple-200 text-center">
            <CardContent className="pt-6">
              <Zap className="w-10 h-10 text-purple-600 mx-auto mb-3" />
              <div className="font-bold text-2xl text-purple-600 mb-1">Auto-Applied</div>
              <div className="text-sm text-gray-600">Used automatically</div>
            </CardContent>
          </Card>
          <Card className="border-2 border-purple-200 text-center">
            <CardContent className="pt-6">
              <Star className="w-10 h-10 text-purple-600 mx-auto mb-3" />
              <div className="font-bold text-2xl text-purple-600 mb-1">Priority</div>
              <div className="text-sm text-gray-600">Dedicated support</div>
            </CardContent>
          </Card>
        </div>

        {/* Credit Packages */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Choose Your Package
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Bigger packages = bigger savings. All credits never expire.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-lg overflow-hidden shadow-lg">
              <thead className="bg-purple-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Package</th>
                  <th className="px-6 py-4 text-left font-semibold">You Pay</th>
                  <th className="px-6 py-4 text-left font-semibold">Discount</th>
                  <th className="px-6 py-4 text-left font-semibold">Per Ticket</th>
                  <th className="px-6 py-4 text-left font-semibold">You Save</th>
                  <th className="px-6 py-4 text-left font-semibold">Tickets Covered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {packages.map((pkg, index) => (
                  <tr
                    key={index}
                    className={`hover:bg-purple-50 ${index === 3 ? 'bg-purple-100 border-2 border-purple-400' : ''}`}
                  >
                    <td className={`px-6 py-4 ${index === 3 ? 'font-bold' : 'font-medium'}`}>
                      ${pkg.credit} Credit
                      {index === 3 && <Badge className="ml-2 bg-purple-600">Popular</Badge>}
                    </td>
                    <td className={`px-6 py-4 ${index === 3 ? 'font-bold text-lg' : ''}`}>
                      ${pkg.pay}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={index >= 3 ? 'default' : 'secondary'} className={index >= 3 ? 'bg-purple-700' : ''}>
                        {pkg.discount}% off
                      </Badge>
                    </td>
                    <td className={`px-6 py-4 ${index === 3 ? 'font-bold text-lg' : 'font-semibold'} text-green-600`}>
                      ${pkg.perTicket.toFixed(2)}
                    </td>
                    <td className={`px-6 py-4 text-sm ${index === 3 ? 'font-semibold text-purple-600' : 'text-gray-600'}`}>
                      Save ${pkg.savings}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      ~{Math.floor(pkg.credit / pkg.perTicket)} tickets
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-center mt-8">
            <p className="text-sm text-gray-600 mb-4">
              <strong>Credits never expire</strong> and are automatically used for ticket sales. Any unused credits remain in your account forever.
            </p>
            <Button size="lg" asChild className="bg-purple-600 hover:bg-purple-700">
              <Link href="/auth/login">
                Purchase Credits Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>

        {/* ROI Calculator */}
        <Card className="mb-16 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
          <CardHeader className="text-center">
            <Calculator className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Savings Calculator</CardTitle>
            <CardDescription className="text-base">
              See exactly how much you'll save with prepaid credits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Credit Package
                  </label>
                  <select
                    value={selectedPackage}
                    onChange={(e) => setSelectedPackage(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    {packages.map((pkg, index) => (
                      <option key={index} value={index}>
                        ${pkg.credit} Credit - Pay ${pkg.pay} ({pkg.discount}% off)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Number of Tickets to Sell
                  </label>
                  <input
                    type="number"
                    value={ticketQuantity}
                    onChange={(e) => setTicketQuantity(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    min="1"
                  />
                </div>
              </div>

              <div className="bg-white rounded-lg p-8 shadow-lg">
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-2">Pay-As-You-Go Cost</div>
                    <div className="text-3xl font-bold text-red-600">${calc.payAsYouGo}</div>
                    <div className="text-xs text-gray-500 mt-1">at $0.75/ticket</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-2">With Prepaid Credits</div>
                    <div className="text-3xl font-bold text-green-600">${calc.withCredits}</div>
                    <div className="text-xs text-gray-500 mt-1">at ${currentPackage.perTicket}/ticket</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-2">Total Savings</div>
                    <div className="text-3xl font-bold text-purple-600">${calc.totalSavings}</div>
                    <div className="text-xs text-gray-500 mt-1">{calc.percentSaved}% saved</div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-6 border-2 border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-semibold text-gray-900">Package Investment:</span>
                    <span className="text-2xl font-bold text-purple-600">${currentPackage.pay}</span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-semibold text-gray-900">Credits Received:</span>
                    <span className="text-2xl font-bold text-purple-600">${currentPackage.credit}</span>
                  </div>
                  <div className="border-t-2 border-purple-300 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">ROI on {ticketQuantity} Tickets:</span>
                      <span className="text-3xl font-bold text-green-600">${calc.totalSavings}</span>
                    </div>
                    <p className="text-sm text-center text-gray-600 mt-3">
                      You'll save <strong>${calc.totalSavings}</strong> compared to pay-as-you-go pricing!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How Credits Work */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            How Credits Work
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Simple, automatic, and transparent
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-purple-200">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
                <CardTitle>Purchase Credits</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                Choose your package and complete one-time payment. Credits are instantly added to your account and never expire.
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
                <CardTitle>Auto-Deduction</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                When tickets sell, credits are automatically deducted at the discounted rate. No action needed from you.
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
                <CardTitle>Track Balance</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                View remaining credits anytime in your dashboard. Add more whenever you need. No expiration stress.
              </CardContent>
            </Card>
          </div>
        </div>

        {/* When to Buy Credits */}
        <Card className="mb-16 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
          <CardHeader className="text-center">
            <Target className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">When Should You Buy Credits?</CardTitle>
            <CardDescription className="text-base">
              Volume calculator to help you decide
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg p-6">
                  <h4 className="font-bold text-lg text-gray-900 mb-4">
                    Break-Even Analysis
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-gray-700">$50 Credit Package</span>
                      <span className="font-bold text-blue-600">67+ tickets/year</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-gray-700">$100 Credit Package</span>
                      <span className="font-bold text-blue-600">134+ tickets/year</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-gray-700">$300 Credit Package</span>
                      <span className="font-bold text-blue-600">240+ tickets/year</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-gray-700">$1,000 Credit Package</span>
                      <span className="font-bold text-blue-600">534+ tickets/year</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    These are approximate break-even points where credits become profitable
                  </p>
                </div>

                <div className="bg-white rounded-lg p-6">
                  <h4 className="font-bold text-lg text-gray-900 mb-4">
                    Ideal Scenarios
                  </h4>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900">Monthly Events</div>
                        <div className="text-sm text-gray-600">Hosting 1-2 events per month? Credits pay for themselves.</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900">Large Events</div>
                        <div className="text-sm text-gray-600">Selling 100+ tickets per event? Save hundreds per event.</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900">Series Events</div>
                        <div className="text-sm text-gray-600">Running a workshop or class series? Credits stretch further.</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900">Predictable Volume</div>
                        <div className="text-sm text-gray-600">Know you'll sell 200+ tickets? Lock in savings now.</div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Priority Support */}
        <Card className="mb-16 border-2 border-purple-200">
          <CardHeader className="text-center bg-gradient-to-br from-purple-50 to-pink-50">
            <Award className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Priority Support Included</CardTitle>
            <CardDescription className="text-base">
              Get VIP treatment with every credit package
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <Shield className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <div className="font-semibold text-gray-900 mb-2">Dedicated Support</div>
                <div className="text-sm text-gray-600">Priority email and chat support</div>
              </div>
              <div className="text-center">
                <Zap className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <div className="font-semibold text-gray-900 mb-2">Faster Response</div>
                <div className="text-sm text-gray-600">24-hour guaranteed reply time</div>
              </div>
              <div className="text-center">
                <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <div className="font-semibold text-gray-900 mb-2">Event Consulting</div>
                <div className="text-sm text-gray-600">Free strategy session on request</div>
              </div>
              <div className="text-center">
                <Star className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <div className="font-semibold text-gray-900 mb-2">Early Access</div>
                <div className="text-sm text-gray-600">Beta features and updates first</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Real Examples */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Real Savings Examples
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            See how event organizers save with prepaid credits
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 border-green-200">
              <CardHeader className="bg-gradient-to-br from-green-50 to-emerald-100">
                <CardTitle className="text-xl">Monthly Dance Workshop</CardTitle>
                <CardDescription>12 events/year, 80 tickets each</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Annual Tickets</span>
                    <span className="font-semibold">960 tickets</span>
                  </div>
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Pay-As-You-Go Cost</span>
                      <span className="text-red-600 font-semibold">$720.00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">With $500 Credit Package</span>
                      <span className="text-green-600 font-semibold">$364.80</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span className="text-purple-700">Annual Savings</span>
                      <span className="text-purple-700">$355.20</span>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <p className="text-sm text-green-800 font-semibold text-center">
                      ROI: Save $355 per year with 50% discount tier
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200">
              <CardHeader className="bg-gradient-to-br from-blue-50 to-indigo-100">
                <CardTitle className="text-xl">Annual Stepping Convention</CardTitle>
                <CardDescription>1 large event, 500 tickets</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Annual Tickets</span>
                    <span className="font-semibold">500 tickets</span>
                  </div>
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Pay-As-You-Go Cost</span>
                      <span className="text-red-600 font-semibold">$375.00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">With $300 Credit Package</span>
                      <span className="text-green-600 font-semibold">$225.00</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span className="text-purple-700">Event Savings</span>
                      <span className="text-purple-700">$150.00</span>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-blue-800 font-semibold text-center">
                      ROI: Save $150 on one event with 40% discount tier
                    </p>
                  </div>
                </div>
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
                  <HelpCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  Do credits really never expire?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                Yes! Your credits stay in your account forever. Buy in bulk when you have budget, use them whenever you need them. No deadlines, no pressure, no expiration dates.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-lg">
                  <HelpCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  How are credits used automatically?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                When you have credits in your account and sell a ticket, the platform automatically deducts the discounted rate from your credit balance instead of charging the $0.75 pay-as-you-go fee. You don't have to do anything - it just works.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-lg">
                  <HelpCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  What happens when I run out of credits?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                You automatically switch back to pay-as-you-go pricing ($0.75 per ticket). No interruption to your events. You can purchase more credits anytime to get back to discounted rates.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-lg">
                  <HelpCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  Can I buy multiple packages or add more credits?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                Absolutely! Credits stack in your account. Buy a $100 package now, add a $200 package later - they combine for a total of $300 in credits. You can add credits anytime.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-lg">
                  <HelpCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  Is there auto-renewal for credit packages?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                No auto-renewal. Credits are one-time purchases. This gives you complete control - buy more when you need them, never get surprised by automatic charges. Optional: You can set up notifications to alert you when credits run low.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-lg">
                  <HelpCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  How do I track my credit balance?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                Your dashboard shows your current credit balance, usage history, and projected runway based on your typical ticket sales. You'll also get email notifications when your balance gets low (if you opt in).
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-lg">
                  <HelpCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  Are credits refundable?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                Unused credits can be refunded within 30 days of purchase. After 30 days or once you've used any portion of the credits, they become non-refundable (but remember, they never expire so you can always use them later).
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-lg">
                  <HelpCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  Do credits cover payment processing fees?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                No, credits only cover the platform fee. Square's payment processing fee (2.9% + $0.30) is still charged separately on each transaction. This is standard for all payment processors and goes directly to Square.
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Start Saving Today</h2>
            <p className="text-xl text-purple-50 mb-8 max-w-2xl mx-auto">
              Buy prepaid credits and save up to 60% on every ticket. Credits never expire, so there's zero risk.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/auth/login">
                  Purchase Credits
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white text-purple-600 hover:bg-purple-50" asChild>
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
