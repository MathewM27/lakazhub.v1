'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface DashboardInstallPromptProps {
  userRole: 'tenant' | 'landlord';
}

export default function DashboardInstallPrompt({ userRole }: DashboardInstallPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Improved detection for already installed PWA
    if (typeof window !== 'undefined') {
      // Method 1: Check display mode
      if (window.matchMedia('(display-mode: standalone)').matches ||
          window.matchMedia('(display-mode: fullscreen)').matches ||
          window.matchMedia('(display-mode: minimal-ui)').matches) {
        // Already installed as PWA
        localStorage.setItem('lakazHubInstalled', 'true');
        return;
      }
      
      // Method 2: Check localStorage flag
      const isInstalled = localStorage.getItem('lakazHubInstalled') === 'true';
      const lastDismissed = localStorage.getItem('lakazHubPromptDismissed');
      const dismissedTime = lastDismissed ? parseInt(lastDismissed) : 0;
      const isDismissedRecently = Date.now() - dismissedTime < 3 * 24 * 60 * 60 * 1000; // 3 days
      
      if (isInstalled || isDismissedRecently) return;
      
      const handleBeforeInstallPrompt = (e: Event) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later
        setDeferredPrompt(e);
        // Update UI to show install button
        setShowPrompt(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
      
      // Check if app was installed
      window.addEventListener('appinstalled', () => {
        localStorage.setItem('lakazHubInstalled', 'true');
        setShowPrompt(false);
        setDeferredPrompt(null);
      });
      
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
        window.removeEventListener('appinstalled', () => {});
      };
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We've used the prompt, now it can't be used again until page reload
    setDeferredPrompt(null);
    
    if (outcome === 'accepted') {
      console.log('User accepted the installation');
    } else {
      console.log('User dismissed the installation');
      localStorage.setItem('lakazHubPromptDismissed', Date.now().toString());
    }
    
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('lakazHubPromptDismissed', Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  const accentColor = userRole === 'landlord' ? 'amber' : 'blue';

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:bottom-8 md:right-8 z-50 bg-black/90 border border-white/20 rounded-xl shadow-xl p-4 backdrop-blur-lg max-w-md">
      <div className="flex items-center">
        <div className="w-16 h-16 relative mr-4 flex-shrink-0 rounded-xl overflow-hidden border border-white/10">
          <Image 
            src="/icon0.svg" 
            alt="LakazHub" 
            fill
            className="object-cover"
          />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white mb-1">Install LakazHub</h3>
          <p className="text-white/70 text-sm">
            Add to your home screen for quick access to your {userRole} dashboard
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-4">
        <button 
          onClick={handleDismiss}
          className="px-3 py-2 text-sm text-white/60 hover:text-white transition-colors"
        >
          Not now
        </button>
        <button 
          onClick={handleInstall}
          className={`px-4 py-2 bg-${accentColor}-500 text-black hover:bg-${accentColor}-400 transition-colors text-sm font-medium rounded-full`}
        >
          Install
        </button>
      </div>
    </div>
  );
}
