'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  CreditCard,
  Download,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface BillingAccount {
  id: string;
  platformFeeFixed: number;
  platformFeePercent: number;
  creditBalance: number;
  pendingBalance: number;
  availableBalance: number;
  totalRevenue: number;
  totalFees: number;
  totalPayouts: number;
  payoutSchedule: string;
  minimumPayout: number;
  status: string;
}

interface PayoutRecord {
  id: string;
  payoutNumber: string;
  amount: number;
  status: string;
  scheduledFor: string;
  completedAt?: string;
  periodStart: string;
  periodEnd: string;
  transactionCount: number;
}

interface BillingStats {
  totalFees: number;
  totalRefunds: number;
  netFees: number;
  creditPurchases: number;
  creditDeductions: number;
  transactionCount: number;
  currentBalance: number;
  pendingPayout: number;
}

export default function BillingDashboardPage() {
  const { data: session } = useSession();
  const [account, setAccount] = useState<BillingAccount | null>(null);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      loadBillingData();
    }
  }, [session]);

  const loadBillingData = async () => {
    try {
      setLoading(true);

      // Load billing account
      const accountRes = await fetch('/api/billing/account');
      if (!accountRes.ok) throw new Error('Failed to load billing account');
      const accountData = await accountRes.json();
      setAccount(accountData);

      // Load payouts
      const payoutsRes = await fetch('/api/billing/payouts');
      if (!payoutsRes.ok) throw new Error('Failed to load payouts');
      const payoutsData = await payoutsRes.json();
      setPayouts(payoutsData.payouts || []);

      // Load stats (last 30 days)
      const statsRes = await fetch('/api/billing/stats');
      if (!statsRes.ok) throw new Error('Failed to load stats');
      const statsData = await statsRes.json();
      setStats(statsData.stats);

      setLoading(false);
    } catch (err) {
      console.error('Load billing data error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load billing data');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading billing information...</p>
        </div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Billing</h1>
          <p className="text-gray-600 mb-4">{error || 'Billing account not found'}</p>
          <button
            onClick={loadBillingData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPayoutStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'FAILED':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Billing & Payouts</h1>
            <p className="text-gray-600 mt-1">Manage your revenue and payment settings</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard/billing/settings"
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Link>
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <CreditCard className="w-4 h-4 mr-2" />
              Buy Credits
            </button>
          </div>
        </div>

        {/* Account Status */}
        <div className="mb-6">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(account.status)}`}>
            Account Status: {account.status}
          </span>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Pending Balance</p>
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">${account.pendingBalance.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Next payout: {account.payoutSchedule.toLowerCase()}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Credit Balance</p>
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">${account.creditBalance.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Prepaid platform fees</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">${account.totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">All-time gross sales</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Payouts</p>
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">${account.totalPayouts.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Lifetime payments received</p>
          </div>
        </div>

        {/* Fee Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Your Platform Fees</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-blue-800">Per-Ticket Fee</p>
              <p className="text-2xl font-bold text-blue-900">${account.platformFeeFixed.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-blue-800">Percentage Fee</p>
              <p className="text-2xl font-bold text-blue-900">{account.platformFeePercent.toFixed(2)}%</p>
            </div>
          </div>
          <p className="text-xs text-blue-700 mt-3">
            Platform fees are automatically deducted from ticket sales. Use prepaid credits to save on fees!
          </p>
        </div>

        {/* Recent Payouts */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Recent Payouts</h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center">
              <Download className="w-4 h-4 mr-1" />
              Export All
            </button>
          </div>

          {payouts.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No payouts yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Payouts will appear here once you reach the minimum payout amount of ${account.minimumPayout.toFixed(2)}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payout #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transactions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {payout.payoutNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(payout.periodStart).toLocaleDateString()} - {new Date(payout.periodEnd).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ${payout.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getPayoutStatusIcon(payout.status)}
                          <span className="ml-2 text-sm text-gray-600">{payout.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {payout.completedAt
                          ? new Date(payout.completedAt).toLocaleDateString()
                          : new Date(payout.scheduledFor).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {payout.transactionCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Need Help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/help/billing" className="text-blue-600 hover:text-blue-700 text-sm">
              → Billing FAQ
            </Link>
            <Link href="/help/payouts" className="text-blue-600 hover:text-blue-700 text-sm">
              → Payout Schedule
            </Link>
            <Link href="/support" className="text-blue-600 hover:text-blue-700 text-sm">
              → Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}