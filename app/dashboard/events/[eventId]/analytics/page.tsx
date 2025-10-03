'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  Download,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  MapPin
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface AnalyticsData {
  eventId: string;
  eventName: string;
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
  analytics: {
    ticketSalesOverTime: Array<{
      date: string;
      ticketsSold: number;
      revenue: number;
    }>;
    revenueAnalytics: {
      totalRevenue: number;
      totalFees: number;
      totalTaxes: number;
      averageOrderValue: number;
      totalOrders: number;
      totalRefunds: number;
      netRevenue: number;
    };
    checkInAnalytics: {
      totalTickets: number;
      checkedInCount: number;
      notCheckedInCount: number;
      checkInRate: number;
      hourlyDistribution: Array<{
        hour: number;
        count: number;
      }>;
    };
    ticketTypeBreakdown: Array<{
      id: string;
      name: string;
      price: number;
      totalAvailable: number;
      sold: number;
      revenue: number;
      sellThroughRate: number;
    }>;
    geographicDistribution: Array<{
      region: string;
      count: number;
      percentage: number;
    }>;
    customerDemographics: {
      totalCustomers: number;
      firstTimeCustomers: number;
      returningCustomers: number;
      customerRetentionRate: number;
    };
    peakTimesAnalysis: Array<{
      hour: number;
      dayOfWeek: string;
      orderCount: number;
    }>;
    conversionFunnel: {
      stages: Array<{
        stage: string;
        count: number;
        conversionRate: number;
      }>;
      overallConversion: number;
    };
  };
}

const COLORS = ['#2563eb', '#7c3aed', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2', '#be185d'];

export default function EventAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/login');
      return;
    }

    fetchAnalyticsData();
  }, [session, status, eventId, selectedPeriod]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/analytics?period=${selectedPeriod}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch analytics data');
      }

      setAnalyticsData(result);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError(error instanceof Error ? error.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error || !analyticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 py-4">
              <Button variant="ghost" asChild>
                <Link href={`/dashboard/events/${eventId}/manage`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Event Management
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics Error</h1>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <BarChart3 className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Analytics</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button asChild>
                <Link href={`/dashboard/events/${eventId}/manage`}>Return to Event Management</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const { analytics } = analyticsData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href={`/dashboard/events/${eventId}/manage`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Event Management
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Event Analytics</h1>
                <p className="text-gray-600">{analyticsData.eventName}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="day">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
              </select>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(analytics.revenueAnalytics.totalRevenue)}</div>
                  <p className="text-xs text-muted-foreground">
                    Net: {formatCurrency(analytics.revenueAnalytics.netRevenue)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.checkInAnalytics.totalTickets}</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics.checkInAnalytics.checkedInCount} checked in ({formatPercentage(analytics.checkInAnalytics.checkInRate)})
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(analytics.revenueAnalytics.averageOrderValue)}</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics.revenueAnalytics.totalOrders} total orders
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPercentage(analytics.conversionFunnel.overallConversion)}</div>
                  <p className="text-xs text-muted-foreground">
                    Overall conversion to purchase
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Sales Over Time Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Performance</CardTitle>
                <CardDescription>Ticket sales and revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.ticketSalesOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => format(parseISO(value), 'MMM dd')}
                    />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
                      labelFormatter={(value) => format(parseISO(value as string), 'MMM dd, yyyy')}
                      formatter={(value: number, name: string) => [
                        name === 'revenue' ? formatCurrency(value) : value,
                        name === 'revenue' ? 'Revenue' : 'Tickets Sold'
                      ]}
                    />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="ticketsSold"
                      stackId="1"
                      stroke="#2563eb"
                      fill="#2563eb"
                      fillOpacity={0.6}
                      name="Tickets Sold"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="revenue"
                      stackId="2"
                      stroke="#16a34a"
                      fill="#16a34a"
                      fillOpacity={0.6}
                      name="Revenue"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Ticket Type Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ticket Type Performance</CardTitle>
                  <CardDescription>Sales breakdown by ticket type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.ticketTypeBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) => `${entry.name} ${entry.percent?.toFixed(0) ?? 0}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="sold"
                      >
                        {analytics.ticketTypeBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [value, 'Tickets Sold']} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Check-in Activity</CardTitle>
                  <CardDescription>Hourly check-in distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.checkInAnalytics.hourlyDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [value, 'Check-ins']} />
                      <Bar dataKey="count" fill="#2563eb" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Gross Revenue:</span>
                    <span className="font-bold">{formatCurrency(analytics.revenueAnalytics.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing Fees:</span>
                    <span>-{formatCurrency(analytics.revenueAnalytics.totalFees)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes:</span>
                    <span>-{formatCurrency(analytics.revenueAnalytics.totalTaxes)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Refunds:</span>
                    <span>-{formatCurrency(analytics.revenueAnalytics.totalRefunds)}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Net Revenue:</span>
                    <span>{formatCurrency(analytics.revenueAnalytics.netRevenue)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ticket Type Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.ticketTypeBreakdown.map((ticketType) => (
                      <div key={ticketType.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{ticketType.name}</p>
                            <p className="text-sm text-gray-600">{formatCurrency(ticketType.price)} each</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{ticketType.sold} / {ticketType.totalAvailable}</p>
                            <p className="text-sm text-gray-600">{formatPercentage(ticketType.sellThroughRate)}</p>
                          </div>
                        </div>
                        <div className="text-sm">
                          <span className="text-green-600 font-medium">
                            Revenue: {formatCurrency(ticketType.revenue)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Check-in Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Checked In</span>
                      </div>
                      <span className="font-bold">{analytics.checkInAnalytics.checkedInCount}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span>Not Checked In</span>
                      </div>
                      <span className="font-bold">{analytics.checkInAnalytics.notCheckedInCount}</span>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatPercentage(analytics.checkInAnalytics.checkInRate)}
                        </div>
                        <div className="text-sm text-blue-600">Check-in Rate</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Geographic Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.geographicDistribution.map((region, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span>{region.region}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{region.count}</div>
                          <div className="text-sm text-gray-600">{region.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {analytics.customerDemographics.totalCustomers}
                      </div>
                      <div className="text-sm text-blue-600">Total Customers</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {analytics.customerDemographics.firstTimeCustomers}
                      </div>
                      <div className="text-sm text-green-600">First Time</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {analytics.customerDemographics.returningCustomers}
                      </div>
                      <div className="text-sm text-purple-600">Returning</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {formatPercentage(analytics.customerDemographics.customerRetentionRate)}
                      </div>
                      <div className="text-sm text-orange-600">Retention Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Peak Purchase Times</CardTitle>
                  <CardDescription>Best performing times for ticket sales</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.peakTimesAnalysis.slice(0, 5).map((peak, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span>{peak.dayOfWeek} at {peak.hour}:00</span>
                        </div>
                        <div className="font-bold">{peak.orderCount} orders</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>Customer journey from interest to purchase</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.conversionFunnel.stages} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="stage" width={120} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Key Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900">💡 Sales Performance</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Average order value is {formatCurrency(analytics.revenueAnalytics.averageOrderValue)}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900">📈 Check-in Rate</h4>
                    <p className="text-sm text-green-700 mt-1">
                      {formatPercentage(analytics.checkInAnalytics.checkInRate)} of ticket holders attended
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-900">🎯 Conversion</h4>
                    <p className="text-sm text-purple-700 mt-1">
                      {formatPercentage(analytics.conversionFunnel.overallConversion)} overall conversion rate
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                    <h4 className="font-medium text-blue-900">🚀 Optimize Peak Times</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Focus marketing efforts on your best performing days and times
                    </p>
                  </div>
                  <div className="p-4 border-l-4 border-green-500 bg-green-50">
                    <h4 className="font-medium text-green-900">💰 Revenue Growth</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Consider premium ticket tiers to increase average order value
                    </p>
                  </div>
                  <div className="p-4 border-l-4 border-orange-500 bg-orange-50">
                    <h4 className="font-medium text-orange-900">👥 Customer Retention</h4>
                    <p className="text-sm text-orange-700 mt-1">
                      Engage returning customers with loyalty programs or early access
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}