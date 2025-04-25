'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Image from 'next/image';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      // Prevent the default browser install prompt
      e.preventDefault();
      // Store the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show our custom prompt
      setShowPrompt(true);
    };

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', handler);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // Handle install button click
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Show the browser's install prompt
    deferredPrompt.prompt();
    
    // Wait for user choice
    const choiceResult = await deferredPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setInstalled(true);
    }
    
    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  // Hide the prompt
  const dismissPrompt = () => {
    setShowPrompt(false);
  };

  // Don't show anything if already installed or no prompt available
  if (installed || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-black/90 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg p-4 animate-slideUp">
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <div className="bg-blue-500 rounded-full p-2 mr-3 flex items-center justify-center">
            <Image 
              src="/lakaz-hub.svg" 
              alt="LakazHub" 
              width={20} 
              height={20} 
              className="text-white" 
            />
          </div>
          <div>
            <h3 className="font-semibold text-white">Install LakazHub</h3>
            <p className="text-sm text-white/70">Add to your home screen for quick access</p>
          </div>
        </div>
        <button 
          onClick={dismissPrompt}
          className="text-white/70 hover:text-white"
          aria-label="Dismiss"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <div className="mt-4 flex gap-3 justify-end">
        <button
          onClick={dismissPrompt}
          className="px-4 py-2 text-sm text-white/70 hover:text-white"
        >
          Not now
        </button>
        <button
          onClick={handleInstall}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors"
        >
          Install App
        </button>
      </div>
    </div>
  );
}
