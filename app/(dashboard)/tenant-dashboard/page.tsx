'use client';

import { useEffect } from 'react';
import { useAuth } from './components/auth/AuthHandler';
import Hero from "./components/layouts/hero-section";
import { PageWrapper } from "./components/layouts/PageWrapper";
import Parallax from "./components/layouts/Parallax";
import PropertiesSection from "./components/properties/PropertySelection";
import { Footer } from './components/navigation/Footer';
import Navigation from "./components/navigation/Navbar";

import PremiumFeatures from './components/layouts/Premium';

export default function Home() {
  const { isAuthenticated, user, profile, isAuthenticating } = useAuth();

  useEffect(() => {
    console.log('[TENANT_DASHBOARD] Home component mounted');
    console.log('[TENANT_DASHBOARD] Authentication state:', { 
      isAuthenticating, 
      isAuthenticated, 
      hasUser: !!user, 
      hasProfile: !!profile 
    });
    
    if (user) {
      console.log('[TENANT_DASHBOARD] User ID:', user.id);
      console.log('[TENANT_DASHBOARD] User email:', user.email);
      console.log('[TENANT_DASHBOARD] User metadata:', JSON.stringify(user.user_metadata));
    }
    
    if (profile) {
      console.log('[TENANT_DASHBOARD] Profile details:', {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email_address,
        role: profile.user_role
      });
    }
    
    // Log Supabase environment variables availability (not the actual values)
    console.log('[TENANT_DASHBOARD] Supabase URL defined:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('[TENANT_DASHBOARD] Supabase Anon Key defined:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }, [isAuthenticating, isAuthenticated, user, profile]);

  return (
    <PageWrapper>
      <Navigation />
      <Hero />
      <Parallax />
      <PropertiesSection />
      <PremiumFeatures />
      <Footer />
    </PageWrapper>
  );
}