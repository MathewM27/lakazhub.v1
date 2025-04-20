'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <div className="w-full py-6 px-8 border-b border-zinc-800">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-500">LakazHub</h1>
            <span className="ml-2 text-sm bg-blue-500 text-black px-2 py-0.5 rounded">404</span>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h2 className="text-6xl font-bold mb-4 text-blue-500">404</h2>
          <h3 className="text-2xl font-semibold mb-4">Page Not Found</h3>
          <p className="text-lg text-white/70 mb-8">
            Sorry, the page you are looking for does not exist or has been moved.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-500 text-black font-medium hover:bg-blue-400 rounded-md transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
