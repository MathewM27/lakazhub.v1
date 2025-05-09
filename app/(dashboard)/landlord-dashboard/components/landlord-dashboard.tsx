"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

import { useToast } from '../../tenant-dashboard/hooks/use-toast';
import Header from "../navigation/header";
import { DashboardContent } from './dashboard-content';
import { useAuth } from '../auth/AuthHandler';
import { Property } from "../types";
import LandlordVerificationSurvey from "./landlord-verification-survey";
// Import PWA components
import RegisterSW from '../../(landing)/components/pwa/RegisterSW';
import DashboardInstallPrompt from '@/components/pwa/DashboardInstallPrompt';
import HeroSection from '../layout/hero-section';
import { supabase } from "../lib/utils/supabase/client";

// Dynamically import modals to reduce initial JS bundle
const PropertyModal = dynamic(() => import('./modals/property-modal-details'), { ssr: false, loading: () => null });
const AvailabilityModal = dynamic(() => import('./modals/availability-modal'), { ssr: false, loading: () => null });
const NotificationModal = dynamic(() => import('./modals/notification-modal'), { ssr: false, loading: () => null });
const SuccessModal = dynamic(() => import('./modals/success-modal'), { ssr: false, loading: () => null });

export default function LandlordDashboard() {
  const { user, profile, isAuthenticating, isAuthenticated, hasCorrectRole, signOut } = useAuth();
  const [selectedProperty, setSelectedProperty] = useState<Property | undefined>(undefined);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successModalProps] = useState({
    title: "",
    message: "",
  });
  const refreshPropertiesRef = useRef<(() => Promise<Property[] | void>) | null>(null);
  // New state to track loading timeout
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // New survey status: "checking" | "show" | "hide"
  const [surveyStatus, setSurveyStatus] = useState<"checking" | "show" | "hide">("checking");

  useEffect(() => {
    // If still authenticating after 5 seconds, set loadingTimeout to true
    const timer = setTimeout(() => {
      if (isAuthenticating) {
        setLoadingTimeout(true);
        console.log("Authentication loading timed out");
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [isAuthenticating]);

  useEffect(() => {
    let cancelled = false;

    async function checkSurvey() {
      try {
        // Only check for landlords
        if (profile?.user_role !== "landlord" || !user || !user.id) {
          setSurveyStatus("hide");
          return;
        }
        setSurveyStatus("checking");
        const { data, error } = await supabase
          .from("landlord_verification_surveys")
          .select("id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          console.error("Survey check error:", error);
          setSurveyStatus("hide"); // Allow dashboard to load even if error
          return;
        }
        if (data && data.id) {
          setSurveyStatus("hide"); // Survey completed, proceed
        } else {
          setSurveyStatus("show"); // Survey not completed, show survey
        }
      } catch (err) {
        console.error("Survey check exception:", err);
        setSurveyStatus("hide"); // On exception, proceed to dashboard
      }
    }

    checkSurvey();

    return () => {
      cancelled = true;
    };
  }, [profile?.user_role, user]);

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
  
  // Handler for refreshing properties - store the refresh function
  const handleRefreshNeeded = useCallback((refreshFn: () => Promise<Property[] | void>) => {
    refreshPropertiesRef.current = refreshFn;
  }, []);

  // Function to refresh properties
  const refreshProperties = async () => {
    if (refreshPropertiesRef.current) {
      try {
        await refreshPropertiesRef.current();
      } catch {
        // Error handling logic can be added here if needed
      }
    }
  };
  
  // Function to render the welcome screen
  const renderWelcomeScreen = (message = "Your landlord dashboard is loading...") => {
    return <LoadingScreen message={message} timeout={loadingTimeout} onRetry={() => window.location.reload()} />;
  };
  
  // Show a friendly welcome screen while authentication or survey check is being done
  if (isAuthenticating || (surveyStatus === "checking" && !loadingTimeout)) {
    return renderWelcomeScreen();
  }

  // If we hit the loading timeout, provide a refresh option
  if (loadingTimeout && isAuthenticating) {
    return renderWelcomeScreen("Taking longer than expected. You may need to refresh.");
  }
  
  // Show login prompt if not authenticated
  if (!isAuthenticated || !user) {
    return <LoginPrompt />;
  }
  
  // If authenticated but role check is still pending or failed, show welcome screen first
  if (isAuthenticated && user && !hasCorrectRole) {
    // Check if we're still in the process of validating the role
    const isStillValidating = profile === null;
    
    if (isStillValidating) {
      return renderWelcomeScreen("Verifying your account permissions...");
    }
    
    // If we've completed validation and still don't have the correct role, show access denied
    return <AccessDenied onSignOut={signOut} />;
  }
  
  // Render dashboard for authenticated users
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <RegisterSW />
      <DashboardInstallPrompt userRole="landlord" />
      <Header />
      <HeroSection />

      <DashboardContent
        onPropertyDetailsAction={handlePropertyDetails}
        onAvailabilityAction={handleAvailability}
        onAddNewPropertyAction={handleAddNewProperty}
        onRefreshNeeded={handleRefreshNeeded}
        surveyStatus={surveyStatus} // Pass surveyStatus down
      />

      {/* Only render modals when needed */}
      {detailsModalOpen && (
        <PropertyModal
          open={detailsModalOpen}
          onOpenChangeAction={setDetailsModalOpen}
          property={selectedProperty}
          onSuccess={() => {
            const event = new CustomEvent("propertyChanged");
            window.dispatchEvent(event);
          }}
        />
      )}

      {availabilityModalOpen && (
        <AvailabilityModal
          open={availabilityModalOpen}
          onOpenChangeAction={setAvailabilityModalOpen}
          property={selectedProperty}
          onUpdate={refreshProperties}
        />
      )}

      {notificationsModalOpen && (
        <NotificationModal
          open={notificationsModalOpen}
          onOpenChangeAction={setNotificationsModalOpen}
          property={selectedProperty}
        />
      )}

      {successModalOpen && (
        <SuccessModal
          open={successModalOpen}
          onOpenChangeAction={setSuccessModalOpen}
          title={successModalProps.title}
          message={successModalProps.message}
          autoClose={true}
        />
      )}

      {surveyStatus === "show" && user && profile && (
        <LandlordVerificationSurvey
          userId={user.id}
          fullName={profile.full_name}
          email={profile.email_address}
          open={true}
          onCloseAction={() => setSurveyStatus("hide")}
        />
      )}
    </div>
  );
}

// Updated LoadingScreen component with retry button for timeout case
function LoadingScreen({ message = "Your landlord dashboard is loading...", timeout = false, onRetry }: { 
  message: string; 
  timeout?: boolean;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <div className="w-full py-6 px-8 border-b border-zinc-800">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-yellow-500">LakazHub</h1>
            <span className="ml-2 text-sm bg-yellow-500 text-black px-2 py-0.5 rounded">Landlord</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h2 className="text-3xl font-bold mb-6">Welcome to LakazHub</h2>
          <p className="text-lg mb-8">{message}</p>
          
          <div className="relative w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-8">
            <div className={`absolute top-0 left-0 h-full bg-yellow-500 ${timeout ? '' : 'animate-pulse'} rounded-full`} 
              style={{width: '100%'}}></div>
          </div>
          
          {timeout ? (
            <div className="flex flex-col items-center">
              <p className="text-zinc-400 mb-4">Connection seems slow. Please try refreshing.</p>
              <button
                onClick={onRetry}
                className="px-6 py-2 bg-yellow-500 text-black font-medium rounded-md hover:bg-yellow-400 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          ) : (
            <div>
              <div className="animate-spin mx-auto rounded-full h-12 w-12 border-2 border-b-2 border-yellow-500 mb-4"></div>
              <p className="text-zinc-400">Preparing your dashboard experience</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoginPrompt() {
  return (
    <div className="flex flex-col items-center justify-center h-screen p-4 bg-black text-white">
      <div className="text-center max-w-md w-full bg-zinc-900 p-8 rounded-lg shadow-lg border border-zinc-800">
        <h1 className="text-2xl font-bold mb-4 text-yellow-500">Login Required</h1>
        <p className="mb-6">Please log in to access your landlord dashboard.</p>
        <div className="flex gap-4 justify-center">
          <Link 
            href="/" 
            className="px-6 py-3 bg-yellow-500 text-black font-medium hover:bg-yellow-400 rounded-md transition-colors"
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

function AccessDenied({ onSignOut }: { onSignOut: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen p-4 bg-black text-white">
      <div className="text-center max-w-md w-full bg-zinc-900 p-8 rounded-lg shadow-lg border border-zinc-800">
        <h1 className="text-2xl font-bold mb-4 text-yellow-500">Access Denied</h1>
        <p className="mb-6">You need a landlord account to access this dashboard.</p>
        <div className="flex gap-4 justify-center">
          <button 
            onClick={onSignOut}
            className="px-6 py-3 bg-yellow-500 text-black font-medium hover:bg-yellow-400 rounded-md transition-colors"
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