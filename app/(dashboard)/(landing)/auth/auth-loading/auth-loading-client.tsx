'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Props {
  renderRoleBadgeOnly?: boolean;
}

export default function AuthLoadingClient({ renderRoleBadgeOnly }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('Preparing your dashboard...');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const error = searchParams?.get('error');
    const description = searchParams?.get('description');
    const redirect = searchParams?.get('redirect');
    const role = searchParams?.get('user_role');

    if (role) setUserRole(role);

    if (renderRoleBadgeOnly) return;

    if (error) {
      setError(`${error}${description ? `: ${description}` : ''}`);
      return;
    }

    if (!redirect) {
      setError('No redirect destination specified');
      return;
    }

    let cancelled = false;
    const progressInterval: NodeJS.Timeout | undefined = setInterval(() => {
      setProgress(prev => {
        if (prev < 90) return prev + 5;
        return prev;
      });
    }, 80);

    setMessage('Preparing your dashboard...');
    setProgress(0);

    setTimeout(() => {
      if (!cancelled) {
        setProgress(100);
        setMessage('Redirecting to your dashboard...');
        setTimeout(() => {
          if (!cancelled) {
            const dashboardUrl = `${redirect}${redirect.includes('?') ? '&' : '?'}auth=success`;
            router.push(dashboardUrl);
          }
        }, 300);
      }
      if (progressInterval) clearInterval(progressInterval);
    }, 1200);

    return () => {
      cancelled = true;
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [router, searchParams, renderRoleBadgeOnly]);

  if (renderRoleBadgeOnly) {
    const role = searchParams?.get('user_role');
    if (!role) return null;
    return (
      <span className={`ml-2 text-sm ${role === 'landlord' ? 'bg-amber-500 text-black' : 'bg-blue-500 text-black'} px-2 py-0.5 rounded`}>
        {role === 'landlord' ? 'Landlord' : 'Tenant'}
      </span>
    );
  }

  if (error) {
    return (
      <div className="max-w-md w-full bg-zinc-900 border border-red-700 rounded-lg p-6 shadow-lg mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-red-500">Authentication Error</h2>
          <p className="mt-2 text-zinc-300">
            We encountered an error with the authentication system.
          </p>
        </div>
        <div className="bg-black/30 p-4 rounded-md mb-6 overflow-auto max-h-32">
          <p className="text-red-400 text-sm font-mono">
            {error}
          </p>
        </div>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => router.push('/auth/login')}
            className="px-4 py-2 bg-zinc-800 text-white rounded hover:bg-zinc-700 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <p className="text-lg mb-8">{message}</p>
      <div className="relative w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-8">
        <div
          className={`absolute top-0 left-0 h-full ${userRole === 'landlord' ? 'bg-amber-500' : 'bg-blue-500'} transition-all duration-300 ease-out rounded-full`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className={`animate-spin mx-auto rounded-full h-12 w-12 border-2 border-b-2 ${userRole === 'landlord' ? 'border-amber-500' : 'border-blue-500'} mb-4`}></div>
      <p className="text-zinc-400">Preparing your experience</p>
    </>
  );
}
