import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'  
import React from 'react';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'LakazHub | Dashboard',
  description: 'LakazHub dashboard portal',
}

export default function DashboardLandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <head>
        <link rel="preload" as="image" href="/hero.webp" imageSrcSet="/hero.webp" type="image/webp" />
        {/* Preload Geist Sans and Geist Mono fonts */}
        <link
          rel="preload"
          as="font"
          href="/_next/static/media/geist-sans-latin.woff2"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="font"
          href="/_next/static/media/geist-mono-latin.woff2"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <div className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </div>
    </>
  );
}