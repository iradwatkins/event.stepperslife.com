'use client';

import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function UnauthorizedPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-700">Access Denied</CardTitle>
          <CardDescription>
            You don&apos;t have permission to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {session ? (
            <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
              <p><strong>Current Role:</strong> {session.user.role}</p>
              <p><strong>Account:</strong> {session.user.email}</p>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              You may need to sign in to access this resource.
            </div>
          )}

          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go to Homepage
              </Link>
            </Button>

            <Button variant="outline" asChild className="w-full">
              <Link href="javascript:history.back()">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Link>
            </Button>
          </div>

          <div className="text-xs text-muted-foreground pt-4">
            If you believe this is an error, please contact support.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}