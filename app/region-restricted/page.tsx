"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function RegionRestricted() {
  const searchParams = useSearchParams();
  const country = searchParams?.get('country') || 'unknown';
  
  // Map country codes to names for better UX
  const countryNames: Record<string, string> = {
    'US': 'United States',
    'GB': 'United Kingdom',
    'FR': 'France',
    'AU': 'Australia',
    'CA': 'Canada',
    'IN': 'India',
    'ZA': 'South Africa',
    // Add more as needed
  };
  
  const countryName = countryNames[country] || country;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-black">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <div className="flex justify-center">
          {/* You can add your logo here */}
          <h2 className="text-2xl font-bold text-primary">LakazHub</h2>
        </div>
        
        <h1 className="text-2xl font-bold">Region Restricted</h1>
        
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-amber-800">
            We're currently only available in <strong>Mauritius</strong>.
          </p>
          <p className="mt-2 text-amber-700 text-sm">
            Your detected region: <strong>{countryName}</strong>
          </p>
        </div>
        
        <div className="space-y-3">
          <p className="text-gray-600">
            LakazHub is currently in its initial launch phase in Mauritius.
            We're working on expanding to more countries soon!
          </p>
          
          <p className="text-gray-600 text-sm">
            If you believe this is an error or you're using a VPN, please try disabling your VPN or contact our support team.
          </p>
        </div>
        
        <div className="pt-4 space-y-3">
          <Link href="/" className="w-full">
            <Button className="w-full" variant="default">
              Return to Homepage
            </Button>
          </Link>
          
          <Link href="mailto:support@lakazhub.com" className="w-full">
            <Button className="w-full" variant="outline">
              Contact Support
            </Button>
          </Link>
        </div>
      </div>
      
      <p className="mt-6 text-sm text-gray-500">
        © {new Date().getFullYear()} LakazHub. All rights reserved.
      </p>
    </div>
  );
}