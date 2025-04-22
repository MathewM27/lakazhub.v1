import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Use consistent fonts across the application
const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: 'LakazHub',
  description: 'Connecting Landlords and Tenants',
  icons: {
    icon: '/lakaz-hub.svg',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
      
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}