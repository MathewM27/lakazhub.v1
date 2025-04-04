'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthCodeError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || '';
  const description = searchParams.get('description') || 'An unknown error occurred';
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
      <div className="max-w-md w-full p-8 bg-white/5 border border-white/10 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 p-4 rounded-lg mb-4">
          <p className="font-semibold">{error}</p>
          <p className="mt-2">{description}</p>
        </div>
        <p className="mb-6">
          There was a problem during the authentication process.
        </p>
        <div className="flex justify-center">
          <Link 
            href="/"
            className="px-4 py-2 bg-white text-black rounded hover:bg-white/90 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}