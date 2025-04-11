'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

type LoadingScreenProps = {
  userType?: 'tenant' | 'landlord' | 'user';
  message?: string;
};

export default function AuthLoadingScreen({ 
  userType = 'user', 
  message = 'Authenticating...' 
}: LoadingScreenProps) {
  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <div className="w-full py-6 px-8 border-b border-zinc-800">
        <div className="container mx-auto">
          <div className="flex items-center">
            <span className="text-xl font-semibold">LakazHub</span>
            <span className="ml-2 px-2 py-1 bg-zinc-800 text-xs uppercase rounded">
              {userType === 'tenant' ? 'Tenant Portal' : 'Landlord Portal'}
            </span>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
          <h2 className="text-xl font-medium">{message}</h2>
          <p className="text-zinc-400 max-w-md text-center">
            Please wait while we securely verify your authentication status...
          </p>
        </div>
      </div>
    </div>
  );
}