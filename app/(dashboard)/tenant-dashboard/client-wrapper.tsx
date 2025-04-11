'use client';

import { Inter } from "next/font/google";
import AuthHandler from "./auth/AuthHandler";
import AuthErrorBoundary from './auth/AuthErrorBoundary';

const inter = Inter({ subsets: ["latin"] });

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.className} antialiased`}>
      <AuthErrorBoundary>
        <AuthHandler>
          {children}
        </AuthHandler>
      </AuthErrorBoundary>
    </div>
  );
}
