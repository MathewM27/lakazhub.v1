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
  const { user, profile, isAuthenticating, isAuthenticated } = useAuth();
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

  // Show loading state while authentication is being checked
  if (isAuthenticating) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Show login prompt if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="text-center max-w-md w-full bg-card p-6 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-4">Login Required</h1>
          <p className="mb-6">Please log in to access your landlord dashboard.</p>
          <div className="flex gap-4 justify-center">
            <a 
              href="/" 
              className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
            >
              Log In
            </a>
            <a 
              href="/" 
              className="px-4 py-2 bg-muted text-muted-foreground hover:bg-muted/90 rounded-md transition-colors"
            >
              Return Home
            </a>
          </div>
        </div>
      </div>
    );
  }
  
  // Check if user has the correct role
  if (profile && profile.user_role !== 'landlord') {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="text-center max-w-md w-full bg-card p-6 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-6">You need a landlord account to access this dashboard.</p>
          <div className="flex gap-4 justify-center">
            <a 
              href="/" 
              className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
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