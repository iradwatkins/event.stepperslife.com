import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'
import { Header } from '@/components/layout/Header'

export const metadata: Metadata = {
  title: 'Stepperslife Events',
  description: 'Welcome to Stepperslife Events Platform - Discover, connect, and celebrate the culture',
  metadataBase: new URL('https://events.stepperslife.com'),
  keywords: ['steppers', 'events', 'culture', 'community', 'dance', 'music'],
  authors: [{ name: 'Stepperslife' }],
  creator: 'Stepperslife',
  publisher: 'Stepperslife',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicons/favicon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicons/favicon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192x192-light.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    siteName: 'Stepperslife Events',
    title: 'Stepperslife Events',
    description: 'Welcome to Stepperslife Events Platform - Discover, connect, and celebrate the culture',
    locale: 'en_US',
    images: [
      {
        url: '/logos/stepperslife-logo-light.png',
        width: 1200,
        height: 630,
        alt: 'Stepperslife Events',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stepperslife Events',
    description: 'Welcome to Stepperslife Events Platform - Discover, connect, and celebrate the culture',
    images: ['/logos/stepperslife-logo-light.png'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'oklch(1.0000 0 0)' },
    { media: '(prefers-color-scheme: dark)', color: 'oklch(0 0 0)' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  )
}