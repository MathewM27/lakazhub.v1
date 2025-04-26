import { Metadata, Viewport } from 'next'
import './globals.css'

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'LakazHub | Rent Property in Mauritius',
  description: 'Find, rent, and manage houses, apartments, and properties in Mauritius easily with LakazHub. The #1 property rental platform for landlords and tenants in Mauritius.',
  manifest: '/manifest.json',
  keywords: [
    'LakazHub', 'rent property Mauritius', 'houses for rent Mauritius', 'apartments Mauritius', 'property rental Mauritius',
    'Mauritius real estate', 'Mauritius property portal', 'landlord Mauritius', 'tenant Mauritius', 'rental listings Mauritius',
    'long term rental Mauritius', 'short term rental Mauritius', 'Mauritius rental platform', 'LakazHub Mauritius', 'LakazHub property',
    'LakazHub apartments', 'LakazHub houses', 'LakazHub rental', 'LakazHub landlord', 'LakazHub tenant', 'LakazHub Mauritius property'
  ],
  openGraph: {
    title: 'LakazHub - Rent Properties in Mauritius',
    description: 'Easily rent and find properties, houses, and apartments across Mauritius. Connect landlords and tenants seamlessly with LakazHub.',
    url: 'https://lakazhub.com/',
    type: 'website',
    images: [
      {
        url: '/lakaz-hub.png',
        width: 1200,
        height: 630,
        alt: 'LakazHub Mauritius Property Rental'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    site: '@lakazhub',
    title: 'LakazHub - Rent Properties in Mauritius',
    description: 'Find, rent, and manage properties in Mauritius. The #1 property rental platform for landlords and tenants.',
    images: ['/lakaz-hub.png']
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LakazHub'
  },
  formatDetection: {
    telephone: false
  },
  authors: [{ name: 'LakazHub', url: 'https://lakazhub.com/' }]
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
        {/* SEO meta tags */}
        <meta name="description" content="Find, rent, and manage houses, apartments, and properties in Mauritius easily with LakazHub. The #1 property rental platform for landlords and tenants in Mauritius." />
        <meta name="keywords" content="LakazHub, rent property Mauritius, houses for rent Mauritius, apartments Mauritius, property rental Mauritius, Mauritius real estate, Mauritius property portal, landlord Mauritius, tenant Mauritius, rental listings Mauritius, long term rental Mauritius, short term rental Mauritius, Mauritius rental platform, LakazHub Mauritius, LakazHub property, LakazHub apartments, LakazHub houses, LakazHub rental, LakazHub landlord, LakazHub tenant, LakazHub Mauritius property" />
        <meta name="author" content="LakazHub" />
        <meta property="og:title" content="LakazHub - Rent Properties in Mauritius" />
        <meta property="og:description" content="Easily rent and find properties, houses, and apartments across Mauritius. Connect landlords and tenants seamlessly with LakazHub." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://lakazhub.com/" />
        <meta property="og:image" content="/lakaz-hub.png" />
        <meta name="robots" content="index, follow" />
        {/* Add this line for better PWA experience */}
        <meta name="description" content="Connect landlords and tenants seamlessly with LakazHub" />
      </head>
      <body>{children}</body>
    </html>
  )
}