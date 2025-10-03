'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  TrendingUp,
  Eye,
  Ban,
  RotateCcw
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import type { AffiliateStatus } from '@/types/affiliate';

// ============================================================================
// TYPES
// ============================================================================

interface AffiliateWithUser {
  id: string;
  userId: string;
  businessName: string | null;
  taxId: string | null;
  w9Submitted: boolean;
  status: AffiliateStatus;
  approvedAt: Date | null;
  totalSales: number;
  totalRevenue: number;
  totalCommission: number;
  createdAt: Date;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    isVerified: boolean;
    createdAt: Date;
  };
}

interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ============================================================================
// STATUS BADGE COMPONENT
// ============================================================================

const StatusBadge = ({ status }: { status: AffiliateStatus }) => {
  const variants: Record<AffiliateStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    PENDING: { variant: 'outline', label: 'Pending Review' },
    APPROVED: { variant: 'default', label: 'Approved' },
    SUSPENDED: { variant: 'secondary', label: 'Suspended' },
    BANNED: { variant: 'destructive', label: 'Banned' },
    INACTIVE: { variant: 'outline', label: 'Inactive' }
  };

  const config = variants[status] || variants.PENDING;

  return (
    <Badge variant={config.variant as any} className="font-medium">
      {config.label}
    </Badge>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AdminAffiliatesPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  // State management
  const [affiliates, setAffiliates] = useState<AffiliateWithUser[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Dialogs
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateWithUser | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Form state
  const [rejectionReason, setRejectionReason] = useState('');
  const [suspensionReason, setSuspensionReason] = useState('');
  const [isPermanentBan, setIsPermanentBan] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // ============================================================================
  // AUTHORIZATION CHECK
  // ============================================================================

  useEffect(() => {
    if (sessionStatus === 'loading') return;

    if (!session?.user) {
      router.push('/auth/login?callbackUrl=/admin/affiliates');
      return;
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      router.push('/unauthorized');
      return;
    }
  }, [session, sessionStatus, router]);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchAffiliates = useCallback(async () => {
    if (!session?.user) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: currentPage.toString(),
        limit: '10',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      if (searchQuery) {
        params.set('search', searchQuery);
      }

      const response = await fetch(`/api/admin/affiliates?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch affiliates');
      }

      setAffiliates(data.data.affiliates);
      setPagination(data.data.pagination);

    } catch (err) {
      console.error('Error fetching affiliates:', err);
      setError(err instanceof Error ? err.message : 'Failed to load affiliates');
    } finally {
      setIsLoading(false);
    }
  }, [session, statusFilter, searchQuery, currentPage]);

  useEffect(() => {
    fetchAffiliates();
  }, [fetchAffiliates]);

  // ============================================================================
  // ACTION HANDLERS
  // ============================================================================

  const handleApprove = async () => {
    if (!selectedAffiliate) return;

    setIsProcessing(true);

    try {
      const response = await fetch(`/api/admin/affiliates/${selectedAffiliate.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve affiliate');
      }

      // Refresh the list
      await fetchAffiliates();
      setShowApproveDialog(false);
      setSelectedAffiliate(null);

    } catch (err) {
      console.error('Error approving affiliate:', err);
      alert(err instanceof Error ? err.message : 'Failed to approve affiliate');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedAffiliate || !rejectionReason.trim()) return;

    setIsProcessing(true);

    try {
      const response = await fetch(`/api/admin/affiliates/${selectedAffiliate.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject affiliate');
      }

      // Refresh and reset
      await fetchAffiliates();
      setShowRejectDialog(false);
      setSelectedAffiliate(null);
      setRejectionReason('');

    } catch (err) {
      console.error('Error rejecting affiliate:', err);
      alert(err instanceof Error ? err.message : 'Failed to reject affiliate');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuspend = async () => {
    if (!selectedAffiliate || !suspensionReason.trim()) return;

    setIsProcessing(true);

    try {
      const response = await fetch(`/api/admin/affiliates/${selectedAffiliate.id}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: suspensionReason,
          permanent: isPermanentBan
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to suspend affiliate');
      }

      // Refresh and reset
      await fetchAffiliates();
      setShowSuspendDialog(false);
      setSelectedAffiliate(null);
      setSuspensionReason('');
      setIsPermanentBan(false);

    } catch (err) {
      console.error('Error suspending affiliate:', err);
      alert(err instanceof Error ? err.message : 'Failed to suspend affiliate');
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================================================
  // RENDER: LOADING STATE
  // ============================================================================

  if (sessionStatus === 'loading' || !session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ============================================================================
  // RENDER: MAIN UI
  // ============================================================================

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Affiliate Management</h1>
        <p className="text-gray-600">Review and manage affiliate applications</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending Review</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  <SelectItem value="BANNED">Banned</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Affiliates List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : affiliates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No affiliates found</h3>
            <p className="text-gray-600">Try adjusting your filters or search query.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {affiliates.map((affiliate) => (
            <Card key={affiliate.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Header Row */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {affiliate.user.firstName} {affiliate.user.lastName}
                        </h3>
                        {affiliate.businessName && (
                          <p className="text-sm text-gray-600">{affiliate.businessName}</p>
                        )}
                      </div>
                      <StatusBadge status={affiliate.status} />
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{affiliate.user.email}</span>
                      </div>
                      {affiliate.user.phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{affiliate.user.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Applied {new Date(affiliate.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Stats Row (for approved affiliates) */}
                    {affiliate.status === 'APPROVED' && (
                      <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{affiliate.totalSales}</div>
                          <div className="text-xs text-gray-600">Total Sales</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            ${affiliate.totalRevenue.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-600">Revenue</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            ${affiliate.totalCommission.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-600">Commission</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedAffiliate(affiliate);
                        setShowDetailsDialog(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>

                    {affiliate.status === 'PENDING' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedAffiliate(affiliate);
                            setShowApproveDialog(true);
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedAffiliate(affiliate);
                            setShowRejectDialog(true);
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}

                    {affiliate.status === 'APPROVED' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setSelectedAffiliate(affiliate);
                          setShowSuspendDialog(true);
                        }}
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        Suspend
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
            {pagination.totalCount} results
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPreviousPage}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Affiliate Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this affiliate application?
            </DialogDescription>
          </DialogHeader>
          {selectedAffiliate && (
            <div className="py-4">
              <p className="font-medium">{selectedAffiliate.user.firstName} {selectedAffiliate.user.lastName}</p>
              <p className="text-sm text-gray-600">{selectedAffiliate.user.email}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Affiliate Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this application. This will be sent to the applicant.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Application does not meet our current requirements..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing || !rejectionReason.trim()}
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Affiliate Account</DialogTitle>
            <DialogDescription>
              Please provide a reason for suspending this account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="suspension-reason">Suspension Reason</Label>
              <Textarea
                id="suspension-reason"
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="e.g., Violation of affiliate terms..."
                rows={4}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="permanent-ban"
                checked={isPermanentBan}
                onChange={(e) => setIsPermanentBan(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="permanent-ban">Make this a permanent ban</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuspendDialog(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspend}
              disabled={isProcessing || !suspensionReason.trim()}
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isPermanentBan ? 'Ban Permanently' : 'Suspend'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
