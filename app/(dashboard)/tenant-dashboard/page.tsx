'use client';

import { useEffect } from 'react';
import { useAuth } from './auth/AuthHandler';
import { PageWrapper } from "./components/layouts/PageWrapper";
import PropertiesSection from "./components/properties/PropertySelection";
import { Footer } from './components/navigation/Footer';
import Navigation from "./components/navigation/Navbar";
import Link from 'next/link';
import dynamic from 'next/dynamic';
import IosInstallPrompt from '@/components/pwa/IosInstallPrompt';

// // Dynamically import PremiumFeatures for better FCP/LCP
// const PremiumFeatures = dynamic(() => import('./components/layouts/Premium'), {
//   loading: () => <div className="text-white/70 py-12 text-center">Loading premium features...</div>,
//   ssr: false,
// });

// Example: If you have a map component, import it dynamically like this:
// const MapComponent = dynamic(() => import('./components/MapComponent'), { ssr: false });

const renderWelcomeScreen = (message = "Your tenant dashboard is loading...") => {
  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <div className="w-full py-6 px-8 border-b border-zinc-800">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-500">LakazHub</h1>
            <span className="ml-2 text-sm bg-blue-500 text-black px-2 py-0.5 rounded">Tenant</span>
          </div>
        </div>
      </div>
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

// Import PWA components
import RegisterSW from '../(landing)/components/pwa/RegisterSW';
import DashboardInstallPrompt from '@/components/pwa/DashboardInstallPrompt';
import HeroSection from './components/layouts/hero-section';

export default function Home() {
  const { user, profile, isAuthenticating, isAuthenticated, hasCorrectRole, signOut } = useAuth();

  // Show a friendly welcome screen while authentication is being checked
  if (isAuthenticating) {
    return renderWelcomeScreen();
  }
  
  // Show login prompt if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 bg-black text-white">
        <div className="text-center max-w-md w-full bg-zinc-900 p-8 rounded-lg shadow-lg border border-zinc-800">
          <h1 className="text-2xl font-bold mb-4 text-blue-500">Login Required</h1>
          <p className="mb-6">Please log in to access your tenant dashboard.</p>
          <div className="flex gap-4 justify-center">
            <Link 
              href="/" 
              className="px-6 py-3 bg-blue-600 text-white font-medium hover:bg-blue-500 rounded-md transition-colors"
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
  
  // If authenticated but role check is still pending or failed, show welcome screen first
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
              className="px-6 py-3 bg-blue-600 text-white font-medium hover:bg-blue-500 rounded-md transition-colors"
            >
              Sign Out
            </button>
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

  // Render dashboard for authenticated users
  return (
    <div className="flex flex-col min-h-screen">
      <RegisterSW />
      <DashboardInstallPrompt userRole="tenant" />
      <IosInstallPrompt />
      
      <PageWrapper>
        <Navigation />
        <HeroSection />
        <PropertiesSection />
        
        <Footer />
      </PageWrapper>
    </div>
  );
}