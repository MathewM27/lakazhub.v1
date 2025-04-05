"use client";

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/utils/supabase/client';
import PropertyGrid from './property-component/property-grid';
import PropertyModal from './modals/property-modal-details';
import AvailabilityModal from './modals/availability-modal';
import NotificationModal from './modals/notification-modal';
import { useToast } from '../../tenant-dashboard/hooks/use-toast';
import Header from "../navigation/header"
import HeroSection from "../layout/hero-section"
import OtherProperties from "../layout/other-properties"
import { Footer } from "../navigation/footer"
import SuccessModal from "./modals/success-modal"
import { useAuth } from '../auth/AuthHandler';
import AuthDebugger from './auth/AuthDebugger';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { LoaderCircle } from "lucide-react"

import { Property, LandlordProperty } from "../types"; // Use the shared types

export default function LandlordDashboard() {
  const { user, profile, isAuthenticating, isAuthenticated, hasCorrectRole, signOut } = useAuth();
  const [selectedProperty, setSelectedProperty] = useState<Property | undefined>(undefined);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const { toast } = useToast();
  const [successModalOpen, setSuccessModalOpen] = useState(false)
  const [successModalProps, setSuccessModalProps] = useState({
    title: "",
    message: "",
  })
  
  // Handler functions for property actions
  const handlePropertyDetails = useCallback((property: Property) => {
    setSelectedProperty(property);
    setDetailsModalOpen(true);
  }, []);
  
  const handleAddNewProperty = useCallback(() => {
    setSelectedProperty(undefined);
    setDetailsModalOpen(true);
  }, []);
  
  const handleAvailability = useCallback((property: Property) => {
    setSelectedProperty(property);
    setAvailabilityModalOpen(true);
  }, []);
  
  const handleNotifications = useCallback((property: Property) => {
    setSelectedProperty(property);
    setNotificationsModalOpen(true);
  }, []);
  
  const handleSuccessAction = useCallback(() => {
    // Refresh properties data
    toast({
      title: "Success",
      description: "Your changes have been saved."
    });
  }, [toast]);

  // Handler for refreshing properties
  const refreshProperties = async () => {
    // Your code to fetch updated properties
  };
  
  const handleAvailabilityAction = (property: Property) => {
    setSelectedProperty(property);
    setAvailabilityModalOpen(true);
  };

  // Function to render the welcome screen
  const renderWelcomeScreen = (message = "Your landlord dashboard is loading...") => {
    return (
      <div className="flex flex-col h-screen bg-black text-white">
        {/* Header with logo */}
        <div className="w-full py-6 px-8 border-b border-zinc-800">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-yellow-500">LakazHub</h1>
              <span className="ml-2 text-sm bg-yellow-500 text-black px-2 py-0.5 rounded">Landlord</span>
            </div>
          </div>
        </div>
        
        {/* Welcome content */}
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <h2 className="text-3xl font-bold mb-6">Welcome to LakazHub</h2>
            <p className="text-lg mb-8">{message}</p>
            
            <div className="relative w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-8">
              <div className="absolute top-0 left-0 h-full bg-yellow-500 animate-pulse rounded-full" style={{width: '100%'}}></div>
            </div>
            
            <div className="animate-spin mx-auto rounded-full h-12 w-12 border-2 border-b-2 border-yellow-500 mb-4"></div>
            <p className="text-zinc-400">Preparing your dashboard experience</p>
          </div>
        </div>
      </div>
    );
  };
  
  // Show a friendly welcome screen while authentication is being checked
  if (isAuthenticating) {
    return renderWelcomeScreen();
  }
  
  // Show login prompt if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 bg-black text-white">
        <div className="text-center max-w-md w-full bg-zinc-900 p-8 rounded-lg shadow-lg border border-zinc-800">
          <h1 className="text-2xl font-bold mb-4 text-yellow-500">Login Required</h1>
          <p className="mb-6">Please log in to access your landlord dashboard.</p>
          <div className="flex gap-4 justify-center">
            <a 
              href="/" 
              className="px-6 py-3 bg-yellow-500 text-black font-medium hover:bg-yellow-400 rounded-md transition-colors"
            >
              Log In
            </a>
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
  
  // If authenticated but role check is still pending or failed, show welcome screen first
  // This prevents the "Access Denied" screen from flashing before authentication completes
  if (isAuthenticated && user && !hasCorrectRole) {
    // Check if we're still in the process of validating the role
    // We'll assume that if we have a user but profile is null, we're still loading
    const isStillValidating = profile === null;
    
    if (isStillValidating) {
      return renderWelcomeScreen("Verifying your account permissions...");
    }
    
    // If we've completed validation and still don't have the correct role, show access denied
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 bg-black text-white">
        <div className="text-center max-w-md w-full bg-zinc-900 p-8 rounded-lg shadow-lg border border-zinc-800">
          <h1 className="text-2xl font-bold mb-4 text-yellow-500">Access Denied</h1>
          <p className="mb-6">You need a landlord account to access this dashboard.</p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={signOut}
              className="px-6 py-3 bg-yellow-500 text-black font-medium hover:bg-yellow-400 rounded-md transition-colors"
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
  
  // Render dashboard for authenticated users
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Header />

      <div className="flex-1">
        <HeroSection />
        
        {/* Auth Debugger - only visible in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="container mx-auto px-4 py-4">
            <AuthDebugger />
          </div>
        )}
        
        {/* Session Status Banner */}
        <div className="container mx-auto px-4 py-2">
          <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
            <AlertTitle className="flex items-center gap-2">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Session Active
            </AlertTitle>
            <AlertDescription>
              Welcome back, {profile?.full_name || user?.email}. You are logged in as a landlord.
            </AlertDescription>
          </Alert>
        </div>

        <section className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold mb-8">My Properties</h2>
          
          <PropertyGrid 
            onPropertyDetailsAction={handlePropertyDetails}
            onAvailabilityAction={handleAvailability}
            onNotificationsAction={handleNotifications}
            onAddNewPropertyAction={handleAddNewProperty}
          />
        </section>

        <section className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold mb-8">Coming Soon</h2>
          <OtherProperties />
        </section>
      </div>

      <Footer />
      
     

      <PropertyModal
        open={detailsModalOpen}
        onOpenChangeAction={setDetailsModalOpen}
        property={selectedProperty}
        onSuccess={handleSuccessAction}
      />
      
      <AvailabilityModal
        open={availabilityModalOpen}
        onOpenChangeAction={setAvailabilityModalOpen}
        property={selectedProperty}
        onUpdate={refreshProperties} // Add this to refresh properties after update
      />
      
      <NotificationModal
        open={notificationsModalOpen}
        onOpenChangeAction={setNotificationsModalOpen}
        property={selectedProperty}
      />

      <SuccessModal
        open={successModalOpen}
        onOpenChangeAction={setSuccessModalOpen}
        title={successModalProps.title}
        message={successModalProps.message}
        autoClose={true}
      />

     
    </div>
  );
}