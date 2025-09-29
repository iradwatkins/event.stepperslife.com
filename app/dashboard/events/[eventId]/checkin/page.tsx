'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  QrCode,
  Search,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Scan,
  Camera,
  UserCheck,
  Download,
  BarChart3
} from 'lucide-react';

interface CheckInStats {
  totalTickets: number;
  checkedIn: number;
  notCheckedIn: number;
  checkInRate: number;
  hourlyDistribution: Array<{
    hour: string;
    count: number;
  }>;
}

interface TicketInfo {
  id: string;
  ticketNumber: string;
  holderName: string;
  ticketType: string;
  checkedInAt?: string;
  attendee?: {
    name: string;
    email: string;
  };
}

export default function EventCheckInPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<any>(null);
  const [stats, setStats] = useState<CheckInStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check-in states
  const [checkingIn, setCheckingIn] = useState(false);
  const [recentCheckIns, setRecentCheckIns] = useState<TicketInfo[]>([]);

  // Manual search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // QR Scanner (would need additional camera library in production)
  const [scannerActive, setScannerActive] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/login');
      return;
    }

    fetchEventData();
    fetchCheckInStats();
  }, [session, status, eventId]);

  const fetchEventData = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch event');
      }

      setEvent(result.event);
    } catch (error) {
      console.error('Error fetching event:', error);
      setError(error instanceof Error ? error.message : 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const fetchCheckInStats = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/checkin`);
      const result = await response.json();

      if (response.ok) {
        setStats(result.stats);
      }
    } catch (error) {
      console.error('Error fetching check-in stats:', error);
    }
  };

  const handleManualCheckIn = async (ticketId: string, validationCode: string) => {
    setCheckingIn(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticketId,
          validationCode,
          checkInMethod: 'MANUAL_SEARCH',
          location: 'Check-in Desk'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Check-in failed');
      }

      // Add to recent check-ins
      setRecentCheckIns(prev => [result.ticket, ...prev.slice(0, 9)]);

      // Refresh stats
      fetchCheckInStats();

      setSearchQuery('');
      setSearchResults([]);

      // Show success message
      alert(`✅ ${result.ticket.holderName} checked in successfully!`);

    } catch (error) {
      console.error('Check-in error:', error);
      setError(error instanceof Error ? error.message : 'Check-in failed');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchResults([]);

    try {
      // Mock search implementation - in production this would be a real API
      // For now, just simulate finding tickets
      setSearchResults([
        {
          id: 'mock-ticket-1',
          ticketNumber: 'TKT-001',
          holderName: 'John Doe',
          ticketType: 'General Admission',
          validationCode: 'VAL123456',
          checkedIn: false
        }
      ]);
    } catch (error) {
      console.error('Search error:', error);
      setError('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const toggleQRScanner = () => {
    setScannerActive(!scannerActive);
    if (!scannerActive) {
      // In production, this would initialize camera access
      alert('QR Scanner would be initialized here. Requires camera permissions and QR scanning library.');
    }
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

  if (error && !event) {
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
                <h1 className="text-2xl font-bold text-gray-900">Check-in Error</h1>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Check-in</h2>
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
                <h1 className="text-2xl font-bold text-gray-900">Event Check-in</h1>
                <p className="text-gray-600">{event?.name}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline" size="sm">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Check-in Interface */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalTickets || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Checked In</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats?.checkedIn || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.checkInRate.toFixed(1) || 0}% of total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Remaining</CardTitle>
                  <Clock className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats?.notCheckedIn || 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* QR Code Scanner */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  QR Code Scanner
                </CardTitle>
                <CardDescription>
                  Scan ticket QR codes for quick check-in
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  {scannerActive ? (
                    <div className="space-y-4">
                      <div className="w-64 h-64 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
                        <Camera className="w-16 h-16 text-gray-400" />
                        <p className="text-gray-500 ml-2">Camera feed would appear here</p>
                      </div>
                      <Button onClick={toggleQRScanner} variant="outline">
                        Stop Scanner
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Scan className="w-16 h-16 text-gray-400 mx-auto" />
                      <div>
                        <h3 className="font-medium mb-2">QR Code Scanner</h3>
                        <p className="text-gray-600 mb-4">
                          Click to activate camera and scan ticket QR codes
                        </p>
                        <Button onClick={toggleQRScanner}>
                          <Camera className="w-4 h-4 mr-2" />
                          Start Scanner
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Manual Search */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Manual Search
                </CardTitle>
                <CardDescription>
                  Search by ticket number, name, or email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ticket number, name, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch} disabled={searching || !searchQuery.trim()}>
                    {searching ? (
                      <Clock className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.map((ticket) => (
                      <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{ticket.holderName}</p>
                          <p className="text-sm text-gray-600">
                            {ticket.ticketNumber} • {ticket.ticketType}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleManualCheckIn(ticket.id, ticket.validationCode)}
                          disabled={checkingIn || ticket.checkedIn}
                        >
                          {ticket.checkedIn ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : checkingIn ? (
                            <Clock className="w-4 h-4 animate-spin" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Check-ins Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Check-ins</CardTitle>
                <CardDescription>Latest successful check-ins</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentCheckIns.length > 0 ? (
                    recentCheckIns.map((ticket) => (
                      <div key={ticket.id} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{ticket.holderName}</p>
                          <p className="text-xs text-gray-600">{ticket.ticketNumber}</p>
                          {ticket.checkedInAt && (
                            <p className="text-xs text-gray-500">
                              {new Date(ticket.checkedInAt).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No check-ins yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export Attendee List
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Check-in Report
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  <Users className="w-4 h-4 mr-2" />
                  View All Tickets
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}