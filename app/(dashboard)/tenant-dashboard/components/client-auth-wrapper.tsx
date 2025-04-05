'use client';

import AuthHandler from '../auth/AuthHandler';
import AuthErrorBoundary from './common/AuthErrorBoundary';

export default function ClientAuthWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthErrorBoundary>
      <AuthHandler>
        {children}
      </AuthHandler>
    </AuthErrorBoundary>
  );
}