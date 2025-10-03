import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Stepperslife Events</CardTitle>
          <CardDescription className="text-lg">
            Welcome to the events platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Button asChild className="w-full">
              <Link href="/auth/login">
                Sign In
              </Link>
            </Button>

            <Button variant="outline" asChild className="w-full">
              <Link href="/auth/register">
                Create Account
              </Link>
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Admin Development Access</p>
            <p className="font-mono">Port: 3004</p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}