'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to home page where sign-in options are available
    router.push('/');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Redirecting to sign in...</h1>
        <p>Please wait...</p>
      </div>
    </div>
  );
}