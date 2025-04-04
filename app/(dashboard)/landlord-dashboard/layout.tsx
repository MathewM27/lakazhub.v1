'use client';

import "./globals.css";
import { Inter } from "next/font/google";
import AuthHandler from "./auth/AuthHandler";
import { ThemeProvider } from "./theme-provider";
import { useEffect } from 'react';
import { PropertyCache } from './lib/utils/cache/propertyCache';
import { ErrorBoundary } from './components/common/ErrorBoundary';

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
      <body className={inter.className}>
        <ThemeProvider defaultTheme="system">
          <ErrorBoundary>
            <AuthHandler>
              <CacheInitializer />
              {children}
            </AuthHandler>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
