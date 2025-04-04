import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import AuthHandler from './components/auth/AuthHandler'
import { ErrorBoundary } from './components/common/ErrorBoundary'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'LakazHub',
  description: 'Connecting Landlords and Tenants',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <ErrorBoundary>
          <AuthHandler>
            {children}
          </AuthHandler>
        </ErrorBoundary>
      </body>
    </html>
  )
}