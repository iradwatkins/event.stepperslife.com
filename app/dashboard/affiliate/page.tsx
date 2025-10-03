'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  Loader2,
  Calendar,
  ShoppingCart,
  Link as LinkIcon,
  Eye,
  MousePointerClick
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

interface DashboardData {
  profile: {
    id: string;
    userId: string;
    businessName: string | null;
    status: string;
    approvedAt: Date | null;
    totalSales: number;
    totalRevenue: number;
    totalCommission: number;
    totalPaidOut: number;
    pendingPayout: number;
    stripeConnectStatus: 'NOT_CONNECTED' | 'CONNECTED' | 'PENDING';
  };
  trackingLinks: Array<{
    id: string;
    eventId: string;
    eventName: string;
    linkCode: string;
    trackingUrl: string;
    clicks: number;
    conversions: number;
    totalSales: number;
    isActive: boolean;
  }>;
  recentSales: Array<{
    id: string;
    eventName: string;
    saleDate: Date;
    ticketCount: number;
    amount: number;
    commission: number;
    status: string;
    saleType: string;
  }>;
  upcomingEvents: Array<{
    id: string;
    name: string;
    startDate: Date;
    coverImage: string | null;
    commissionRate: number;
    commissionType: string;
    available: boolean;
  }>;
  stats: {
    clickThroughRate: number;
    conversionRate: number;
    averageOrderValue: number;
    averageCommission: number;
  };
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data: DashboardData;
  error?: string;
}

// ============================================================================
// STATUS BADGE COMPONENT
// ============================================================================

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    PENDING: { label: 'Pending Review', className: 'bg-yellow-100 text-yellow-800' },
    APPROVED: { label: 'Approved', className: 'bg-green-100 text-green-800' },
    SUSPENDED: { label: 'Suspended', className: 'bg-red-100 text-red-800' },
    BANNED: { label: 'Banned', className: 'bg-gray-100 text-gray-800' }
  };

  const defaultVariant = { label: 'Pending Review', className: 'bg-yellow-100 text-yellow-800' };
  const variant = variants[status] ?? defaultVariant;

  return (
    <Badge className={variant.className}>
      {variant.label}
    </Badge>
  );
}

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    positive: boolean;
  };
}

function StatCard({ title, value, subtitle, icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className={`flex items-center mt-2 text-sm ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`w-4 h-4 mr-1 ${!trend.positive ? 'rotate-180' : ''}`} />
            {trend.value}% vs last month
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// TRACKING LINK CARD COMPONENT
// ============================================================================

interface TrackingLinkCardProps {
  link: DashboardData['trackingLinks'][0];
}

function TrackingLinkCard({ link }: TrackingLinkCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link.trackingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const conversionRate = link.clicks > 0
    ? ((link.conversions / link.clicks) * 100).toFixed(1)
    : '0.0';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base">{link.eventName}</CardTitle>
            <CardDescription className="text-xs mt-1">
              Code: {link.linkCode}
            </CardDescription>
          </div>
          <Badge variant={link.isActive ? 'default' : 'secondary'}>
            {link.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* URL with Copy Button */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-muted p-2 rounded text-xs font-mono truncate">
            {link.trackingUrl}
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {copied ? 'Copied!' : 'Copy link'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-muted/50 p-2 rounded">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <MousePointerClick className="h-3 w-3" />
              <span className="text-xs">Clicks</span>
            </div>
            <div className="text-lg font-semibold">{link.clicks}</div>
          </div>
          <div className="bg-muted/50 p-2 rounded">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <ShoppingCart className="h-3 w-3" />
              <span className="text-xs">Sales</span>
            </div>
            <div className="text-lg font-semibold">{link.conversions}</div>
          </div>
          <div className="bg-muted/50 p-2 rounded">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs">CVR</span>
            </div>
            <div className="text-lg font-semibold">{conversionRate}%</div>
          </div>
        </div>

        {/* Total Sales */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-muted-foreground">Total Sales</span>
          <span className="text-sm font-semibold">
            ${link.totalSales.toFixed(2)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function DashboardSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN DASHBOARD PAGE
// ============================================================================

export default function AffiliateDashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  // ============================================================================
  // AUTHENTICATION CHECK
  // ============================================================================

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/dashboard/affiliate');
    }
  }, [sessionStatus, router]);

  // ============================================================================
  // FETCH DASHBOARD DATA
  // ============================================================================

  useEffect(() => {
    const fetchDashboard = async () => {
      if (sessionStatus !== 'authenticated') return;

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/affiliates/dashboard', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const result: ApiResponse = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to load dashboard');
        }

        setDashboardData(result.data);

        // Handle pending status message
        if (result.message) {
          setPendingMessage(result.message);
        }

      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [sessionStatus]);

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (sessionStatus === 'loading' || isLoading) {
    return <DashboardSkeleton />;
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        <Button
          onClick={() => window.location.reload()}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  // ============================================================================
  // NO DATA STATE
  // ============================================================================

  if (!dashboardData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No dashboard data available. Please contact support if this issue persists.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { profile, trackingLinks, recentSales, upcomingEvents, stats } = dashboardData;

  // ============================================================================
  // PENDING APPROVAL STATE
  // ============================================================================

  if (profile.status === 'PENDING') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl">Application Under Review</CardTitle>
            <CardDescription>
              {pendingMessage || 'Your affiliate application is being reviewed by our team.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                We typically review applications within 1-2 business days.
                You'll receive an email notification once your application has been processed.
              </AlertDescription>
            </Alert>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
              <Button onClick={() => window.location.reload()}>
                Check Status
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================================================
  // SUSPENDED/BANNED STATE
  // ============================================================================

  if (profile.status === 'SUSPENDED' || profile.status === 'BANNED') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {profile.status === 'SUSPENDED'
              ? 'Your affiliate account has been suspended. Please contact support for assistance.'
              : 'Your affiliate account has been permanently banned.'
            }
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // ============================================================================
  // APPROVED DASHBOARD
  // ============================================================================

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {profile.businessName || 'Affiliate Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your performance, manage links, and view earnings
          </p>
        </div>
        <StatusBadge status={profile.status} />
      </div>

      {/* Stripe Connect Alert */}
      {profile.stripeConnectStatus !== 'CONNECTED' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Connect your Stripe account to receive automatic payouts.{' '}
            <Button variant="link" className="p-0 h-auto">
              Connect Now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Sales"
          value={profile.totalSales.toString()}
          subtitle="Lifetime ticket sales"
          icon={<ShoppingCart className="h-4 w-4" />}
        />
        <StatCard
          title="Total Revenue"
          value={`$${profile.totalRevenue.toFixed(2)}`}
          subtitle="Gross sales generated"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatCard
          title="Total Commission"
          value={`$${profile.totalCommission.toFixed(2)}`}
          subtitle={`Avg: $${stats.averageCommission.toFixed(2)} per sale`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          title="Pending Payout"
          value={`$${profile.pendingPayout.toFixed(2)}`}
          subtitle={`Paid out: $${profile.totalPaidOut.toFixed(2)}`}
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      {/* Performance Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>Your affiliate performance statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                Click-Through Rate
              </div>
              <div className="text-2xl font-bold">{stats.clickThroughRate}%</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Conversion Rate
              </div>
              <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                Average Order Value
              </div>
              <div className="text-2xl font-bold">${stats.averageOrderValue.toFixed(2)}</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                Commission Per Sale
              </div>
              <div className="text-2xl font-bold">${stats.averageCommission.toFixed(2)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tracking Links */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Active Tracking Links</h2>
            <Button variant="outline" size="sm">
              <LinkIcon className="h-4 w-4 mr-2" />
              Create New Link
            </Button>
          </div>

          {trackingLinks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <LinkIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No tracking links yet. Create your first link to start promoting events.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {trackingLinks.map((link) => (
                <TrackingLinkCard key={link.id} link={link} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Sales */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Sales</h2>

          {recentSales.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No sales yet. Share your tracking links to start earning commissions!
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead className="text-right">Tickets</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{sale.eventName}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(sale.saleDate), 'MMM dd, yyyy')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{sale.ticketCount}</TableCell>
                        <TableCell className="text-right font-medium">
                          ${sale.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          ${sale.commission.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Available Events to Promote</h2>
            <Button variant="ghost" size="sm">
              View All
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden">
                {event.coverImage && (
                  <div className="h-32 bg-muted" />
                )}
                <CardHeader className="pb-3">
                  <CardTitle className="text-base line-clamp-2">{event.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1 text-xs">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(event.startDate), 'MMM dd, yyyy')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">Commission</span>
                    <span className="text-sm font-semibold text-green-600">
                      {event.commissionRate}%
                    </span>
                  </div>
                  <Button size="sm" className="w-full">
                    <LinkIcon className="h-3 w-3 mr-2" />
                    Create Tracking Link
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
