import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'  // Change this line to point to the correct path

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
  icons: {
    icon: './lakaz-hub.svg',
  }
}

export default function DashboardLandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Remove any <html>, <head>, or <body> tags!
  return <>{children}</>;
}