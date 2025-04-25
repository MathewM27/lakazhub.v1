import { Metadata, Viewport } from 'next'
import './globals.css'

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'LakazHub',
  description: 'Connect landlords and tenants seamlessly',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LakazHub'
  },
  formatDetection: {
    telephone: false
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/lakaz-hub.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/lakaz-hub.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        {/* Add this line for better PWA experience */}
        <meta name="description" content="Connect landlords and tenants seamlessly with LakazHub" />
      </head>
      <body>{children}</body>
    </html>
  )
}