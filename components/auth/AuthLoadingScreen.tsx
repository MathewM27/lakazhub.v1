'use client';

import React from 'react';

type AuthLoadingScreenProps = {
  userType: 'tenant' | 'landlord' | string;
  message?: string;
};

export default function AuthLoadingScreen({ 
  userType,
  message = 'Preparing your dashboard' 
}: AuthLoadingScreenProps) {
  
  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <div className="w-full py-6 px-8 border-b border-zinc-800">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-500">LakazHub</h1>
            <span className={`ml-2 text-sm ${userType === 'landlord' ? 'bg-amber-500 text-black' : 'bg-blue-500 text-black'} px-2 py-0.5 rounded`}>
              {userType === 'landlord' ? 'Landlord' : 'Tenant'}
            </span>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h2 className="text-3xl font-bold mb-6">Welcome to LakazHub</h2>
          <p className="text-lg mb-8">{message}</p>
          
          <div className="relative w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-8">
            <div className={`absolute top-0 left-0 h-full ${userType === 'landlord' ? 'bg-amber-500' : 'bg-blue-500'} animate-pulse rounded-full`} style={{width: '100%'}}></div>
          </div>
          
          <div className={`animate-spin mx-auto rounded-full h-12 w-12 border-2 border-b-2 ${userType === 'landlord' ? 'border-amber-500' : 'border-blue-500'} mb-4`}></div>
          <p className="text-zinc-400">{message}</p>
        </div>
      </div>
    </div>
  );
}