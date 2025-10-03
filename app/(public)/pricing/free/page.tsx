'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  Gift,
  Users,
  Calendar,
  QrCode,
  Mail,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  HelpCircle,
  Sparkles,
  Globe,
  Shield,
  Zap,
  Heart
} from 'lucide-react';

export default function FreeEventsPricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-primary-600">Home</Link>
            <span>/</span>
            <Link href="/pricing" className="hover:text-primary-600">Pricing</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Free Events</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-600 rounded-full mb-6">
            <Gift className="w-10 h-10 text-white" />
          </div>
          <Badge className="mb-4 bg-green-600 text-white">100% Free Forever</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Free Events Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Host unlimited free community events with zero platform fees. Perfect for meetups, workshops, classes, and community gatherings.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-green-600 hover:bg-green-700">
              <Link href="/auth/login">
                Create Your Free Event
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
        {/* Pricing Box */}
        <Card className="mb-16 border-4 border-green-600 shadow-xl">
          <CardContent className="p-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="text-6xl font-bold text-green-600 mb-4">$0</div>
                <div className="text-2xl font-semibold text-gray-900 mb-2">Per Ticket, Forever</div>
                <div className="text-lg text-gray-600 mb-6">
                  Up to 5,000 free tickets per year
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">No platform fees</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">No payment processing fees</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">No setup costs</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">No credit card required</span>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">What happens after 5,000 tickets?</h3>
                <p className="text-gray-600 mb-4">
                  If your free events exceed 5,000 registrations in a calendar year, simply contact us for a custom quote. We'll work with you to create a plan that fits your needs.
                </p>
                <p className="text-sm text-gray-500">
                  Note: This is total across all your free events combined. Most organizers never hit this limit.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Who It's For */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Perfect For Community Events
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            The Free Events plan is designed for organizers who bring communities together without charging admission
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-green-200">
              <CardHeader>
                <Users className="w-10 h-10 text-green-600 mb-4" />
                <CardTitle>Community Meetups</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <span>Stepping practice sessions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <span>Social gatherings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <span>Networking events</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <span>Club meetings</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200">
              <CardHeader>
                <Calendar className="w-10 h-10 text-green-600 mb-4" />
                <CardTitle>Workshops & Classes</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <span>Free dance workshops</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <span>Educational sessions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <span>Training programs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <span>Skill-sharing events</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200">
              <CardHeader>
                <Heart className="w-10 h-10 text-green-600 mb-4" />
                <CardTitle>Non-Profit Events</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <span>Charity fundraisers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <span>Community service events</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <span>Volunteer activities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <span>Public awareness campaigns</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* All Features Included */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            All Features Included
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Free events get access to every feature in the platform. No limitations, no upgrades needed.
          </p>
          <Card className="border-2 border-green-200">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <QrCode className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">QR Code Check-In</div>
                    <div className="text-sm text-gray-600">Fast, contactless event entry with mobile scanning</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">Automated Emails</div>
                    <div className="text-sm text-gray-600">Confirmation emails with digital tickets sent instantly</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BarChart3 className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">Event Analytics</div>
                    <div className="text-sm text-gray-600">Track registrations, attendance, and engagement</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">Attendee Management</div>
                    <div className="text-sm text-gray-600">View, search, and manage your guest list</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">Public Event Pages</div>
                    <div className="text-sm text-gray-600">Beautiful event pages with custom branding</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">Secure & Reliable</div>
                    <div className="text-sm text-gray-600">Enterprise-grade security and 99.9% uptime</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">Instant Registration</div>
                    <div className="text-sm text-gray-600">One-click registration process for attendees</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">Calendar Integration</div>
                    <div className="text-sm text-gray-600">Add to Google Calendar, Outlook, and iCal</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">Unlimited Events</div>
                    <div className="text-sm text-gray-600">Create as many free events as you need</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real Examples */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Real-World Examples
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            See how organizers use free events to build thriving communities
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 border-blue-200">
              <CardHeader className="bg-gradient-to-br from-blue-50 to-blue-100">
                <CardTitle className="text-xl">Weekly Stepping Practice</CardTitle>
                <CardDescription>Chicago Steppers Club</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Event Type</span>
                    <span className="font-semibold">Free Weekly Meetup</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Attendance</span>
                    <span className="font-semibold">45 people per session</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Annual Events</span>
                    <span className="font-semibold">52 events/year</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Registrations</span>
                    <span className="font-semibold">2,340 tickets/year</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-bold text-lg">
                      <span className="text-green-700">Platform Cost</span>
                      <span className="text-green-700">$0</span>
                    </div>
                    <div className="text-xs text-center text-gray-500 mt-2">
                      Well within the 5,000 ticket limit
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200">
              <CardHeader className="bg-gradient-to-br from-purple-50 to-purple-100">
                <CardTitle className="text-xl">Monthly Dance Workshop</CardTitle>
                <CardDescription>Community Dance Initiative</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Event Type</span>
                    <span className="font-semibold">Free Monthly Workshop</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Attendance</span>
                    <span className="font-semibold">120 people per workshop</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Annual Events</span>
                    <span className="font-semibold">12 events/year</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Registrations</span>
                    <span className="font-semibold">1,440 tickets/year</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-bold text-lg">
                      <span className="text-green-700">Platform Cost</span>
                      <span className="text-green-700">$0</span>
                    </div>
                    <div className="text-xs text-center text-gray-500 mt-2">
                      Plenty of room to grow
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* How to Get Started */}
        <Card className="mb-16 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
          <CardHeader className="text-center">
            <Zap className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">How to Get Started</CardTitle>
            <CardDescription className="text-base">
              Launch your first free event in 5 minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-3xl mx-auto">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
                  <h4 className="font-semibold text-gray-900 mb-2">Create Account</h4>
                  <p className="text-sm text-gray-600">Sign up in 30 seconds. No credit card needed.</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
                  <h4 className="font-semibold text-gray-900 mb-2">Create Event</h4>
                  <p className="text-sm text-gray-600">Fill in event details and set ticket price to $0.</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
                  <h4 className="font-semibold text-gray-900 mb-2">Share & Go Live</h4>
                  <p className="text-sm text-gray-600">Get your event URL and start accepting registrations.</p>
                </div>
              </div>
              <div className="text-center mt-8">
                <Button size="lg" asChild className="bg-green-600 hover:bg-green-700">
                  <Link href="/auth/login">
                    Create Free Event Now
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
                  <HelpCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  Are there really no hidden fees for free events?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                Absolutely zero fees. Since tickets are free, there's no money changing hands, so there are no payment processing fees either. You just create the event and start accepting registrations.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-lg">
                  <HelpCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  Do I need to set up payment processing for free events?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                No! For free events, you don't need to connect a payment processor or provide any financial information. Just create your event and share the link.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-lg">
                  <HelpCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  Can I mix free and paid events on the same account?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                Yes! Many organizers run both free community events and paid ticketed events. You can have as many of each as you need on one account.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-lg">
                  <HelpCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  What counts toward my 5,000 free ticket limit?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                Only tickets for events where the ticket price is $0. Paid events (even $1 tickets) don't count toward this limit. The 5,000 limit resets each calendar year (January 1st).
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-lg">
                  <HelpCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  Can attendees still get digital tickets for free events?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                Yes! Every registration automatically receives a confirmation email with a QR code ticket, regardless of whether the event is free or paid. You can use these for check-in at your event.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-lg">
                  <HelpCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  What if I want to accept donations at a free event?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                Keep the event registration free, then add a note in your event description with a link to your donation page (PayPal, Venmo, etc.). Or consider creating an optional "Donation Tier" ticket alongside your free tier.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-lg">
                  <HelpCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  Is there a limit on event capacity for free events?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                No platform-imposed limits. You set your own capacity based on your venue. You can accept as many or as few registrations as you want per event (as long as your total annual free tickets stay under 5,000).
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-lg">
                  <HelpCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  Can I upgrade to paid events later?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                Absolutely! Start with free events to build your audience, then add paid events whenever you're ready. No plan changes needed - just set a ticket price above $0 and connect your payment processor.
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Create Your Free Event?</h2>
            <p className="text-xl text-green-50 mb-8 max-w-2xl mx-auto">
              Join thousands of organizers who trust Stepperslife Events to power their community gatherings.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/auth/login">
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white text-green-600 hover:bg-green-50" asChild>
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
