'use client';

import "./globals.css";
import { Inter } from "next/font/google";
import AuthHandler from "./auth/AuthHandler";
import { ThemeProvider } from "./theme-provider";
import { useEffect } from 'react';
import { PropertyCache } from './lib/utils/cache/propertyCache';
import AuthErrorBoundary from './components/auth/AuthErrorBoundary';

const inter = Inter({ subsets: ["latin"] });

const CacheInitializer = () => {
  useEffect(() => {
    PropertyCache.init();
  }, []);
  
  return null;
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider defaultTheme="system">
          <AuthErrorBoundary>
            <AuthHandler>
              <CacheInitializer />
              {children}
            </AuthHandler>
          </AuthErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
