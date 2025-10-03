'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>

          <h1 className="text-4xl md:text-5xl font-bold mb-6">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: October 1, 2025</p>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <h2>Agreement to Terms</h2>
            <p>
              By accessing and using SteppersLife Events, you agree to be bound by these Terms of Service and all
              applicable laws and regulations. If you do not agree with any of these terms, you are prohibited
              from using this platform.
            </p>

            <h2>Use License</h2>
            <p>
              Permission is granted to temporarily access and use SteppersLife Events for personal, non-commercial
              purposes, subject to the restrictions set in these Terms of Service.
            </p>
            <p>You agree not to:</p>
            <ul>
              <li>Modify or copy platform materials</li>
              <li>Use materials for commercial purposes</li>
              <li>Attempt to reverse engineer any software</li>
              <li>Remove copyright or proprietary notations</li>
              <li>Transfer materials to another person</li>
            </ul>

            <h2>Event Tickets</h2>
            <h3>Purchases</h3>
            <p>
              All ticket purchases are final unless the event is cancelled by the organizer. Refund policies are
              set by individual event organizers and vary by event.
            </p>

            <h3>Ticket Transfer</h3>
            <p>
              Tickets may be transferable subject to the event organizer's policies. Unauthorized resale or
              transfer of tickets may result in ticket invalidation.
            </p>

            <h3>Entry Requirements</h3>
            <p>
              Admission to events is subject to venue and organizer requirements. Valid photo ID may be required
              for entry. Event organizers reserve the right to refuse entry.
            </p>

            <h2>User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account and password. You agree to
              accept responsibility for all activities that occur under your account.
            </p>

            <h2>Event Organizers</h2>
            <p>Event organizers agree to:</p>
            <ul>
              <li>Provide accurate event information</li>
              <li>Fulfill all ticket purchases</li>
              <li>Process refunds in accordance with stated policies</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Not engage in fraudulent or deceptive practices</li>
            </ul>

            <h2>Payment Processing</h2>
            <p>
              All payments are processed securely through Square. We do not store complete credit card information.
              By making a purchase, you agree to Square's Terms of Service and Privacy Policy.
            </p>

            <h2>Disclaimer</h2>
            <p>
              SteppersLife Events is provided "as is." We make no warranties, expressed or implied, regarding the
              platform's operation or content. We are not liable for any damages arising from your use of the
              platform.
            </p>

            <h2>Limitations of Liability</h2>
            <p>
              SteppersLife Events shall not be liable for any indirect, incidental, special, consequential, or
              punitive damages resulting from your use or inability to use the platform.
            </p>

            <h2>Indemnification</h2>
            <p>
              You agree to indemnify and hold SteppersLife Events harmless from any claims, damages, or expenses
              arising from your use of the platform or violation of these Terms.
            </p>

            <h2>Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of Illinois,
              without regard to its conflict of law provisions.
            </p>

            <h2>Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. Continued use of the platform following
              any changes constitutes acceptance of those changes.
            </p>

            <h2>Contact Information</h2>
            <p>
              For questions about these Terms of Service, please contact us at:
            </p>
            <ul>
              <li>Email: legal@stepperslife.com</li>
              <li>Address: Chicago, IL</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
