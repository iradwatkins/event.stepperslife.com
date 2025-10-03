'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Settings,
  Globe,
  CreditCard,
  Mail,
  Shield,
  Database,
  Bell,
  Palette,
  Save,
  AlertTriangle,
  CheckCircle,
  Server,
  Trash2
} from 'lucide-react';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('general');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    router.push('/auth/login');
    return null;
  }

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'payments', name: 'Payments', icon: CreditCard },
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'system', name: 'System', icon: Server }
  ];

  const handleSave = async () => {
    // TODO: Implement save functionality
    alert('Settings save functionality will be implemented in Sprint 2!');
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirmEmail || deleteConfirmEmail !== session?.user?.email) {
      alert('Please enter your email to confirm account deletion');
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/users/me/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmEmail: deleteConfirmEmail,
          reason: deleteReason
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      alert('Your account has been successfully deleted. You will be logged out.');
      router.push('/auth/login');
    } catch (error: any) {
      alert(error.message || 'Failed to delete account');
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
                <p className="text-gray-600">Configure system-wide settings and preferences</p>
              </div>
            </div>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary text-primary-foreground'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      Platform Information
                    </CardTitle>
                    <CardDescription>
                      Basic information about your events platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="platform-name">Platform Name</Label>
                        <Input
                          id="platform-name"
                          defaultValue="Stepperslife Events"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="platform-domain">Domain</Label>
                        <Input
                          id="platform-domain"
                          defaultValue="events.stepperslife.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="platform-description">Description</Label>
                      <Textarea
                        id="platform-description"
                        defaultValue="Your premier destination for discovering and hosting amazing events in the stepping community."
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Branding
                    </CardTitle>
                    <CardDescription>
                      Customize the look and feel of your platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primary-color">Primary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="primary-color"
                            type="color"
                            defaultValue="#3b82f6"
                            className="w-16 h-10"
                          />
                          <Input defaultValue="#3b82f6" className="flex-1" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="secondary-color">Secondary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="secondary-color"
                            type="color"
                            defaultValue="#06b6d4"
                            className="w-16 h-10"
                          />
                          <Input defaultValue="#06b6d4" className="flex-1" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Square Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure Square payment processing settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800">Square SDK Integrated</span>
                      <Badge className="bg-green-100 text-green-800 ml-auto">Active</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="square-app-id">Application ID</Label>
                        <Input
                          id="square-app-id"
                          type="password"
                          placeholder="sq0idp-..."
                          disabled
                        />
                        <p className="text-xs text-gray-500">Configured via environment variables</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="square-location">Location ID</Label>
                        <Input
                          id="square-location"
                          type="password"
                          placeholder="Location ID"
                          disabled
                        />
                        <p className="text-xs text-gray-500">Configured via environment variables</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="platform-fee">Platform Fee (%)</Label>
                      <Input
                        id="platform-fee"
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        defaultValue="2.5"
                      />
                      <p className="text-xs text-gray-500">Platform fee percentage on ticket sales</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'email' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      SendGrid Configuration
                    </CardTitle>
                    <CardDescription>
                      Email service settings and templates
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800">SendGrid Integrated</span>
                      <Badge className="bg-green-100 text-green-800 ml-auto">Active</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="from-email">From Email</Label>
                        <Input
                          id="from-email"
                          defaultValue="noreply@events.stepperslife.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="from-name">From Name</Label>
                        <Input
                          id="from-name"
                          defaultValue="Stepperslife Events"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Email Templates</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Welcome Email</p>
                            <p className="text-sm text-gray-600">Sent when user registers</p>
                          </div>
                          <Badge className="bg-green-100 text-green-800">Configured</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Email Verification</p>
                            <p className="text-sm text-gray-600">Account verification template</p>
                          </div>
                          <Badge className="bg-green-100 text-green-800">Configured</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Password Reset</p>
                            <p className="text-sm text-gray-600">Password reset instructions</p>
                          </div>
                          <Badge className="bg-green-100 text-green-800">Configured</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Authentication & Security
                    </CardTitle>
                    <CardDescription>
                      Security settings and authentication configuration
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium text-green-800">Argon2 Password Hashing</p>
                          <p className="text-sm text-green-600">Enterprise-grade password security</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium text-green-800">Email Verification Required</p>
                          <p className="text-sm text-green-600">Users must verify email to access platform</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium text-green-800">Rate Limiting</p>
                          <p className="text-sm text-green-600">Protection against brute force attacks</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Server className="w-5 h-5" />
                      System Status
                    </CardTitle>
                    <CardDescription>
                      Monitor system health and configuration
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h4 className="font-medium">Services Status</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">Database</span>
                            <Badge className="bg-green-100 text-green-800">Connected</Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">Authentication</span>
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">Email Service</span>
                            <Badge className="bg-green-100 text-green-800">Ready</Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">Payment Processing</span>
                            <Badge className="bg-green-100 text-green-800">Ready</Badge>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium">Error Tracking</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">Sentry Integration</span>
                            <Badge className="bg-green-100 text-green-800">Configured</Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">Error Logging</span>
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">Performance Monitoring</span>
                            <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      Backup & Maintenance
                    </CardTitle>
                    <CardDescription>
                      Automated backup and maintenance settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium text-green-800">Automated Backups</p>
                        <p className="text-sm text-green-600">Database and application backups configured</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Configured</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button variant="outline" className="w-full">
                        <Database className="w-4 h-4 mr-2" />
                        Run Manual Backup
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Settings className="w-4 h-4 mr-2" />
                        View Backup History
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-red-200">
                  <CardHeader className="bg-red-50">
                    <CardTitle className="flex items-center gap-2 text-red-800">
                      <AlertTriangle className="w-5 h-5" />
                      Danger Zone
                    </CardTitle>
                    <CardDescription className="text-red-600">
                      Irreversible and destructive actions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                        <div className="flex-1">
                          <h4 className="font-semibold text-red-900">Delete Account</h4>
                          <p className="text-sm text-red-700 mt-1">
                            Permanently delete your account and all associated data. This action cannot be undone.
                          </p>
                          <ul className="text-xs text-red-600 mt-2 space-y-1 ml-4 list-disc">
                            <li>All your personal information will be removed</li>
                            <li>You cannot have active events or upcoming tickets</li>
                            <li>This action is irreversible</li>
                          </ul>
                        </div>
                        <Button
                          variant="destructive"
                          onClick={() => setShowDeleteModal(true)}
                          className="ml-4"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Delete Account</h3>
            </div>

            <div className="space-y-3">
              <p className="text-gray-700">
                Are you absolutely sure you want to delete your account? This action is permanent and cannot be undone.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm font-medium text-red-800">This will:</p>
                <ul className="text-sm text-red-700 mt-1 space-y-1 ml-4 list-disc">
                  <li>Permanently delete your account</li>
                  <li>Remove all your personal data</li>
                  <li>Log you out of all devices</li>
                  <li>Cannot be reversed</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-email">
                  Type your email <span className="text-red-600">({session?.user?.email})</span> to confirm:
                </Label>
                <Input
                  id="confirm-email"
                  type="email"
                  placeholder="your@email.com"
                  value={deleteConfirmEmail}
                  onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                  className="border-red-200 focus:border-red-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delete-reason">Reason (optional):</Label>
                <Textarea
                  id="delete-reason"
                  placeholder="Let us know why you're leaving..."
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmEmail('');
                  setDeleteReason('');
                }}
                disabled={isDeleting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmEmail !== session?.user?.email}
                className="flex-1"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Forever
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}