'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
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

          <h1 className="text-4xl md:text-5xl font-bold mb-6">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: October 1, 2025</p>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <h2>Introduction</h2>
            <p>
              SteppersLife Events ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you use our platform.
            </p>

            <h2>Information We Collect</h2>
            <h3>Personal Information</h3>
            <p>We may collect personally identifiable information that you voluntarily provide, including:</p>
            <ul>
              <li>Name and contact information (email address, phone number)</li>
              <li>Account credentials</li>
              <li>Payment information (processed securely through Square)</li>
              <li>Event preferences and purchase history</li>
            </ul>

            <h3>Automatically Collected Information</h3>
            <p>When you access our platform, we may automatically collect:</p>
            <ul>
              <li>Device and browser information</li>
              <li>IP address and location data</li>
              <li>Usage data and analytics</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>

            <h2>How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Process ticket purchases and event registrations</li>
              <li>Send order confirmations and tickets</li>
              <li>Communicate about events and platform updates</li>
              <li>Improve our services and user experience</li>
              <li>Prevent fraud and ensure platform security</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2>Information Sharing</h2>
            <p>We may share your information with:</p>
            <ul>
              <li>Event organizers for events you register for</li>
              <li>Payment processors (Square) to complete transactions</li>
              <li>Service providers who assist in platform operations</li>
              <li>Law enforcement when required by law</li>
            </ul>

            <h2>Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information.
              However, no method of transmission over the Internet is 100% secure.
            </p>

            <h2>Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access and update your personal information</li>
              <li>Delete your account and data</li>
              <li>Opt-out of marketing communications</li>
              <li>Request a copy of your data</li>
            </ul>

            <h2>Cookies</h2>
            <p>
              We use cookies and similar technologies to enhance your experience, analyze usage, and deliver
              personalized content. You can manage cookie preferences through your browser settings.
            </p>

            <h2>Children's Privacy</h2>
            <p>
              Our platform is not intended for children under 13 years of age. We do not knowingly collect personal
              information from children under 13.
            </p>

            <h2>Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting
              the new Privacy Policy on this page and updating the "Last updated" date.
            </p>

            <h2>Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <ul>
              <li>Email: privacy@stepperslife.com</li>
              <li>Address: Chicago, IL</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
