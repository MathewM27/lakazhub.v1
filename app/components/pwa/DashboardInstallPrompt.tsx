'use client';

import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface DashboardInstallPromptProps {
  userRole?: 'tenant' | 'landlord';
}

export default function DashboardInstallPrompt({ userRole }: DashboardInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    // Only show the prompt after a short delay in dashboard contexts
    const promptTimeoutId = setTimeout(() => {
      const handler = (e: Event) => {
        // Prevent the default browser install prompt
        e.preventDefault();
        // Store the event for later use
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        // Show our custom prompt
        setShowPrompt(true);
      };
      
      // Check if we've already prompted recently
      const lastPromptTime = localStorage.getItem('lakazhub_install_prompted');
      const now = Date.now();
      
      if (!lastPromptTime || now - parseInt(lastPromptTime) > 7 * 24 * 60 * 60 * 1000) { // 7 days
        window.addEventListener('beforeinstallprompt', handler);
        // Store the current time
        localStorage.setItem('lakazhub_install_prompted', now.toString());
      }
      
      // Cleanup
      return () => {
        window.removeEventListener('beforeinstallprompt', handler);
      };
    }, 5000); // Show after 5 seconds in the dashboard
    
    return () => clearTimeout(promptTimeoutId);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      setInstalled(true);
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
  };

  if (installed || !showPrompt) {
    return null;
  }

  const backgroundColor = userRole === 'landlord' ? 'bg-amber-500/90' : 'bg-blue-500/90';
  const buttonColor = userRole === 'landlord' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'; 

  return (
    <div className={`fixed top-20 right-4 z-50 ${backgroundColor} backdrop-blur-sm border border-white/20 rounded-lg shadow-lg p-4 max-w-xs animate-slideIn`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <div className="bg-white/20 rounded-full p-2 mr-3">
            <Download className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Install {userRole === 'landlord' ? 'Landlord' : 'Tenant'} App</h3>
            <p className="text-xs text-white/80">For quicker access to your dashboard</p>
          </div>
        </div>
        <button onClick={dismissPrompt} className="text-white/80 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex gap-2 justify-end">
        <button
          onClick={dismissPrompt}
          className="px-3 py-1 text-xs text-white/80 hover:text-white"
        >
          Later
        </button>
        <button
          onClick={handleInstall}
          className={`px-3 py-1 ${buttonColor} text-white text-xs font-medium rounded transition-colors`}
        >
          Install Now
        </button>
      </div>
    </div>
  );
}
