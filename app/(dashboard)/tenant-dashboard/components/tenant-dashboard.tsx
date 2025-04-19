"use client";


import { useAuth } from '../auth/AuthHandler';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoaderCircle } from "lucide-react";
import Link from 'next/link'; // Import Link component

export default function TenantDashboard() {
  const { user, profile, isAuthenticating, isAuthenticated, hasCorrectRole, signOut } = useAuth();
  
  // Function to render the welcome screen
  const renderWelcomeScreen = (message = "Your tenant dashboard is loading...") => {
    return (
      <div className="flex flex-col h-screen bg-black text-white">
        {/* Header with logo */}
        <div className="w-full py-6 px-8 border-b border-zinc-800">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-500">LakazHub</h1>
              <span className="ml-2 text-sm bg-blue-500 text-black px-2 py-0.5 rounded">Tenant</span>
            </div>
          </div>
        </div>
        
        {/* Welcome content */}
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <h2 className="text-3xl font-bold mb-6">Welcome to LakazHub</h2>
            <p className="text-lg mb-8">{message}</p>
            
            <div className="relative w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-8">
              <div className="absolute top-0 left-0 h-full bg-blue-500 animate-pulse rounded-full" style={{width: '100%'}}></div>
            </div>
            
            <div className="animate-spin mx-auto rounded-full h-12 w-12 border-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-zinc-400">Preparing your tenant experience</p>
          </div>
        </div>
      </div>
    );
  };
  
  // Show a friendly welcome screen while authentication is being checked
  if (isAuthenticating) {
    return renderWelcomeScreen();
  }
  
  // Show login prompt if not authenticated - FIXED: Use Link instead of anchor tags
  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 bg-black text-white">
        <div className="text-center max-w-md w-full bg-zinc-900 p-8 rounded-lg shadow-lg border border-zinc-800">
          <h1 className="text-2xl font-bold mb-4 text-blue-500">Login Required</h1>
          <p className="mb-6">Please log in to access your tenant dashboard.</p>
          <div className="flex gap-4 justify-center">
            <Link 
              href="/" 
            >
              Log In
            </Link>
            <Link 
              href="/" 
              className="px-6 py-3 bg-zinc-800 text-white hover:bg-zinc-700 rounded-md transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // If authenticated but role check is still pending or failed
  if (isAuthenticated && user && !hasCorrectRole) {
    // Check if we're still in the process of validating the role
    const isStillValidating = profile === null;
    
    if (isStillValidating) {
      return renderWelcomeScreen("Verifying your account permissions...");
    }
    
    // If we've completed validation and still don't have the correct role, show access denied
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 bg-black text-white">
        <div className="text-center max-w-md w-full bg-zinc-900 p-8 rounded-lg shadow-lg border border-zinc-800">
          <h1 className="text-2xl font-bold mb-4 text-blue-500">Access Denied</h1>
          <p className="mb-6">You need a tenant account to access this dashboard.</p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={signOut}
              className="px-6 py-3 bg-blue-500 text-black font-medium hover:bg-blue-400 rounded-md transition-colors"
            >
              Sign Out
            </button>
            <a 
              href="/" 
              className="px-6 py-3 bg-zinc-800 text-white hover:bg-zinc-700 rounded-md transition-colors"
            >
              Return Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Render dashboard for authenticated users with correct role
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Header placeholder */}
      <header className="border-b border-zinc-800 py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold">Tenant Dashboard</h1>
        </div>
      </header>
      
      <div className="flex-1 container mx-auto px-4 py-8">
        
        
        {/* Session Status Banner */}
        <div className="mb-6">
          <Alert className="bg-blue-50 border-blue-200 text-blue-800">
            <AlertTitle className="flex items-center gap-2">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Session Active
            </AlertTitle>
            <AlertDescription>
              Welcome back, {profile?.full_name || user?.email}. You are logged in as a tenant.
            </AlertDescription>
          </Alert>
        </div>
        
        {/* Dashboard content placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
            <h2 className="text-xl font-semibold mb-4">My Rentals</h2>
            <p className="text-zinc-400">View your current rental properties and upcoming payments.</p>
          </div>
          
          <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
            <h2 className="text-xl font-semibold mb-4">Messages</h2>
            <p className="text-zinc-400">Check messages from your landlord or property manager.</p>
          </div>
        </div>
      </div>
      
      {/* Footer placeholder */}
      <footer className="border-t border-zinc-800 py-6">
        <div className="container mx-auto px-4 text-center text-zinc-600">
          <p>© {new Date().getFullYear()} LakazHub - Tenant Portal</p>
        </div>
      </footer>
    </div>
  );
}