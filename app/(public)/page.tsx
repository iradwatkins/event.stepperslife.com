'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Users,
  Ticket,
  TrendingUp,
  Shield,
  Zap,
  Heart,
  Star,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle,
  Sparkles
} from 'lucide-react';

export default function HomePage() {
  const { data: session } = useSession();
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const features = [
    {
      icon: Calendar,
      title: 'Easy Event Creation',
      description: 'Create and manage events in minutes with our intuitive platform',
      color: 'text-[oklch(0.6723_0.1606_244.9955)]'
    },
    {
      icon: Ticket,
      title: 'Digital Ticketing',
      description: 'QR code tickets delivered instantly to attendees via email',
      color: 'text-[oklch(0.6723_0.1606_244.9955)]'
    },
    {
      icon: Users,
      title: 'Community Building',
      description: 'Connect with stepping enthusiasts and grow your audience',
      color: 'text-[oklch(0.6907_0.1554_160.3454)]'
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Square integration for safe and reliable payment processing',
      color: 'text-[oklch(0.5919_0.2186_10.5826)]'
    },
    {
      icon: TrendingUp,
      title: 'Real-time Analytics',
      description: 'Track ticket sales and event performance with detailed insights',
      color: 'text-[oklch(0.8214_0.1600_82.5337)]'
    },
    {
      icon: Zap,
      title: 'Instant Refunds',
      description: 'Automated refund processing for cancelled or transferred tickets',
      color: 'text-[oklch(0.7064_0.1822_151.7125)]'
    }
  ];

  const stats = [
    { label: 'Active Events', value: '500+', icon: Calendar },
    { label: 'Happy Attendees', value: '50K+', icon: Users },
    { label: 'Tickets Sold', value: '100K+', icon: Ticket },
    { label: 'Success Rate', value: '99.9%', icon: Star }
  ];

  const upcomingEvents = [
    {
      id: 1,
      title: 'Summer Steppers Showcase',
      date: 'July 15, 2025',
      time: '7:00 PM',
      location: 'Chicago, IL',
      price: '$35',
      category: 'SOCIAL',
      image: '/events/summer-showcase.jpg'
    },
    {
      id: 2,
      title: 'Midwest Stepping Championship',
      date: 'August 20, 2025',
      time: '6:00 PM',
      location: 'Detroit, MI',
      price: '$50',
      category: 'COMPETITION',
      image: '/events/championship.jpg'
    },
    {
      id: 3,
      title: 'Stepping Workshop & Social',
      date: 'September 10, 2025',
      time: '5:00 PM',
      location: 'Indianapolis, IN',
      price: '$25',
      category: 'WORKSHOP',
      image: '/events/workshop.jpg'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 dark:from-primary/5 dark:via-accent/10 dark:to-primary/10">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25" />

        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div variants={fadeInUp} className="mb-6">
              <Badge className="mb-4 px-4 py-1.5 text-sm font-semibold">
                <Sparkles className="w-3 h-3 mr-1.5" />
                Welcome to SteppersLife Events
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-600 to-blue-600"
            >
              Discover & Host
              <br />
              Stepping Events
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
            >
              The premier platform for the stepping community. Create, discover, and attend amazing stepping events with secure ticketing and seamless management.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button size="lg" asChild className="group">
                <Link href="/events">
                  Browse Events
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href={session ? "/dashboard/events/create" : "/auth/login"}>
                  {session ? "Create Event" : "Get Started Free"}
                </Link>
              </Button>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="mt-12 flex flex-wrap gap-8 justify-center text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Secure Payments</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Instant Tickets</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>24/7 Support</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob dark:opacity-10" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-accent/20 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000 dark:opacity-10" />
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-[oklch(0.6907_0.1554_160.3454)]/20 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000 dark:opacity-10" />
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-background border-y">
        <div className="container mx-auto px-4">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="text-center"
              >
                <div className="flex justify-center mb-3">
                  <stat.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-3xl md:text-4xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeInUp}>
              <Badge className="mb-4">Features</Badge>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              Everything You Need to Succeed
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Powerful tools designed specifically for stepping event organizers and attendees
            </motion.p>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className={`inline-flex p-3 rounded-lg bg-muted mb-4 ${feature.color}`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeInUp}>
              <Badge className="mb-4">Featured Events</Badge>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              Upcoming Stepping Events
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Don't miss out on these amazing events in your community
            </motion.p>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
          >
            {upcomingEvents.map((event, index) => (
              <motion.div key={event.id} variants={fadeInUp}>
                <Card className="overflow-hidden hover:shadow-xl transition-shadow group">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center relative overflow-hidden">
                    <Calendar className="h-16 w-16 text-primary/40" />
                    <Badge className="absolute top-4 right-4">{event.category}</Badge>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>
                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">{event.price}</span>
                      <Button size="sm" asChild>
                        <Link href={`/events/${event.id}`}>
                          View Event
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Button size="lg" variant="outline" asChild>
              <Link href="/events">
                View All Events
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-purple-600 text-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div variants={fadeInUp} className="mb-6">
              <Heart className="h-16 w-16 mx-auto mb-6 animate-pulse" />
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-5xl font-bold mb-6"
            >
              Ready to Host Your Event?
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-xl mb-8 text-white/90"
            >
              Join thousands of event organizers who trust SteppersLife Events to power their stepping events
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button size="lg" variant="secondary" asChild>
                <Link href={session ? "/dashboard/events/create" : "/auth/login"}>
                  {session ? "Create Event" : "Get Started Free"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30" asChild>
                <Link href="/contact">
                  Contact Sales
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}