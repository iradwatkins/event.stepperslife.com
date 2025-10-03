'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calendar,
  Users,
  Heart,
  Target,
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function AboutPage() {
  const values = [
    {
      icon: Heart,
      title: 'Community First',
      description: 'We believe in building strong, connected stepping communities that support and uplift each other.'
    },
    {
      icon: Target,
      title: 'Excellence',
      description: 'We strive for excellence in every aspect of our platform, from features to customer service.'
    },
    {
      icon: Users,
      title: 'Inclusivity',
      description: 'Everyone is welcome in our community, regardless of skill level or background.'
    },
    {
      icon: Sparkles,
      title: 'Innovation',
      description: 'We continuously evolve our platform to meet the changing needs of stepping event organizers.'
    }
  ];

  const stats = [
    { value: '10,000+', label: 'Events Hosted' },
    { value: '250K+', label: 'Tickets Sold' },
    { value: '98%', label: 'Satisfaction Rate' },
    { value: '50+', label: 'Cities Served' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
              About SteppersLife Events
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Your premier platform for discovering and hosting stepping events across the nation
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">Our Mission</h2>
            <p className="text-lg text-muted-foreground text-center mb-12">
              To empower stepping event organizers with the tools they need to create unforgettable experiences,
              while connecting attendees with the vibrant stepping community through seamless event discovery and ticketing.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {values.map((value, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <value.icon className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                        <p className="text-muted-foreground">{value.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">Our Story</h2>
            <div className="prose prose-lg dark:prose-invert mx-auto">
              <p className="text-lg text-muted-foreground">
                SteppersLife Events was born from a passion for the stepping community and a vision to make event
                management accessible to everyone. Founded by stepping enthusiasts who understand the unique needs
                of event organizers, we've built a platform that combines powerful features with ease of use.
              </p>
              <p className="text-lg text-muted-foreground mt-4">
                Today, we're proud to serve thousands of event organizers and attendees across the country, helping
                to grow and strengthen the stepping community one event at a time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Join Us?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Start hosting your stepping events with SteppersLife Events today
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/auth/login">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">
                  Contact Us
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
